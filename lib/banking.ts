import "server-only";
import { getSupabase } from "./supabase";
import {
  CURRENT_CUSTOMER_ID,
  addDays,
  istStart,
  monthRange,
  roundMoney,
  type Category,
} from "./paywise";
import type { Account, Budget } from "./types";

/*
 * PayWise data layer. Agent tools AND API routes use these functions, so the
 * rules live in one place. Every query is scoped to CURRENT_CUSTOMER_ID.
 * Transfers are NOT here: they go only through the transfer_funds() database function.
 */

async function ownAccounts(): Promise<Account[]> {
  const { data, error } = await getSupabase()
    .from("accounts")
    .select("id, nickname, account_type, masked_number, balance, is_frozen")
    .eq("customer_id", CURRENT_CUSTOMER_ID)
    .order("id");
  if (error) throw new Error(error.message);
  return data.map((a) => ({ ...a, balance: Number(a.balance) }));
}

/** Accounts with balances, plus the customer's transfer limits and how much is left today. */
export async function listAccounts() {
  const db = getSupabase();
  const accounts = await ownAccounts();

  const { data: customer, error: cErr } = await db
    .from("customers")
    .select("name, kyc_level")
    .eq("id", CURRENT_CUSTOMER_ID)
    .single();
  if (cErr) throw new Error(cErr.message);

  const { data: limits, error: lErr } = await db
    .from("transfer_limits")
    .select("daily_limit, per_txn_limit")
    .eq("kyc_level", customer.kyc_level)
    .single();
  if (lErr) throw new Error(lErr.message);

  // Same window the transfer_funds() function uses: the database's current date (UTC).
  const todayUtc = new Date().toISOString().slice(0, 10);
  const { data: sent, error: sErr } = await db
    .from("transactions")
    .select("amount")
    .in("account_id", accounts.map((a) => a.id))
    .eq("category", "transfer")
    .eq("direction", "debit")
    .gte("txn_date", `${todayUtc}T00:00:00Z`);
  if (sErr) throw new Error(sErr.message);

  const sentToday = roundMoney(sent.reduce((sum, t) => sum + Number(t.amount), 0));
  const dailyLimit = Number(limits.daily_limit);

  return {
    customer_name: customer.name,
    kyc_level: customer.kyc_level as string,
    accounts,
    total_balance: roundMoney(accounts.reduce((sum, a) => sum + a.balance, 0)),
    transfer_limits: {
      per_transfer_limit: Number(limits.per_txn_limit),
      daily_limit: dailyLimit,
      transferred_today: sentToday,
      left_today: roundMoney(Math.max(0, dailyLimit - sentToday)),
    },
  };
}

export type TransactionFilter = {
  category?: Category;
  account_id?: string;
  direction?: "debit" | "credit";
  from_date?: string;
  to_date?: string;
  search?: string;
  limit?: number;
};

/** The customer's transactions, newest first. Dates are YYYY-MM-DD in India time, both inclusive. */
export async function listTransactions(filter: TransactionFilter = {}) {
  const accounts = await ownAccounts();
  const nickname = new Map(accounts.map((a) => [a.id, a.nickname]));

  if (filter.account_id && !nickname.has(filter.account_id)) {
    throw new Error(`Account ${filter.account_id} is not one of your accounts`);
  }

  let query = getSupabase()
    .from("transactions")
    .select("id, account_id, txn_date, description, category, direction, amount")
    .in("account_id", filter.account_id ? [filter.account_id] : [...nickname.keys()])
    .order("txn_date", { ascending: false })
    .limit(filter.limit ?? 30);
  if (filter.category) query = query.eq("category", filter.category);
  if (filter.direction) query = query.eq("direction", filter.direction);
  if (filter.from_date) query = query.gte("txn_date", istStart(filter.from_date));
  if (filter.to_date) query = query.lt("txn_date", istStart(addDays(filter.to_date, 1)));
  if (filter.search) query = query.ilike("description", `%${filter.search.replace(/[%_]/g, "")}%`);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const transactions = data.map((t) => ({
    id: t.id,
    date: t.txn_date,
    description: t.description,
    category: t.category,
    direction: t.direction,
    amount: Number(t.amount),
    account_id: t.account_id,
    account: nickname.get(t.account_id) ?? t.account_id,
  }));
  return { count: transactions.length, transactions };
}

/**
 * Spending by category between two dates (from inclusive, toExclusive exclusive, YYYY-MM-DD, India time).
 * Only debits count, and transfers between own accounts are not spending.
 */
export async function spendSummary(from: string, toExclusive: string) {
  const accounts = await ownAccounts();
  const { data, error } = await getSupabase()
    .from("transactions")
    .select("category, amount")
    .in("account_id", accounts.map((a) => a.id))
    .eq("direction", "debit")
    .neq("category", "transfer")
    .gte("txn_date", istStart(from))
    .lt("txn_date", istStart(toExclusive));
  if (error) throw new Error(error.message);

  const totals = new Map<string, { amount: number; count: number }>();
  for (const t of data) {
    const cur = totals.get(t.category) ?? { amount: 0, count: 0 };
    totals.set(t.category, { amount: cur.amount + Number(t.amount), count: cur.count + 1 });
  }
  const by_category = [...totals.entries()]
    .map(([category, v]) => ({ category, amount: roundMoney(v.amount), count: v.count }))
    .sort((a, b) => b.amount - a.amount);

  return {
    from,
    to: addDays(toExclusive, -1),
    total_spent: roundMoney(by_category.reduce((sum, c) => sum + c.amount, 0)),
    by_category,
  };
}

/** Each budget with this month's spend and whether it has passed its alert level. */
export async function budgetStatus(category?: string): Promise<Budget[]> {
  let query = getSupabase()
    .from("budgets")
    .select("category, monthly_limit, alert_at_pct")
    .eq("customer_id", CURRENT_CUSTOMER_ID)
    .order("category");
  if (category) query = query.eq("category", category);
  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const month = monthRange("this_month");
  const spend = await spendSummary(month.from, month.toExclusive);
  const spent = new Map(spend.by_category.map((c) => [c.category, c.amount]));

  return data.map((b) => {
    const limit = Number(b.monthly_limit);
    const used = spent.get(b.category) ?? 0;
    const pct = Math.round((used / limit) * 100);
    return {
      category: b.category,
      monthly_limit: limit,
      spent_this_month: used,
      left: roundMoney(limit - used),
      used_pct: pct,
      alert_at_pct: b.alert_at_pct,
      status: pct >= 100 ? "over" : pct >= b.alert_at_pct ? "alert" : "ok",
    };
  });
}
