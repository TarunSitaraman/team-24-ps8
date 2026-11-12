import "server-only";
import { getSupabase } from "./supabase";

export interface Customer {
  id: string;
  name: string;
  email: string;
  city: string;
  kyc_level: "basic" | "full";
}

export interface Account {
  id: string;
  customer_id: string;
  account_type: "savings" | "salary" | "current";
  nickname: string;
  masked_number: string;
  balance: number;
  is_frozen: boolean;
}

export interface Transaction {
  id: number | string;
  account_id: string;
  account_nickname?: string;
  txn_date: string;
  description: string;
  category:
    | "food"
    | "groceries"
    | "shopping"
    | "travel"
    | "bills"
    | "rent"
    | "entertainment"
    | "health"
    | "education"
    | "salary"
    | "transfer"
    | "other";
  direction: "debit" | "credit";
  amount: number;
}

export interface Budget {
  id: number | string;
  customer_id: string;
  category: string;
  monthly_limit: number;
  alert_at_pct: number;
  created_at: string;
  spent?: number;
  pct_used?: number;
  is_alert?: boolean;
}

export interface TransferLimit {
  kyc_level: "basic" | "full";
  daily_limit: number;
  per_txn_limit: number;
}

/** Check if Supabase keys are configured in environment */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_URL?.trim() && process.env.SUPABASE_SECRET_KEY?.trim()
  );
}

// ---------------------------------------------------------------------------
// In-Memory Fallback State (initialized with exact PS8 seed data)
// ---------------------------------------------------------------------------
function getSeedDates() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();

  const makeDate = (dayOffset: number, hour: number, min: number) => {
    const d = new Date(year, month, Math.max(1, Math.min(28, dayOffset)), hour, min);
    return d.toISOString();
  };

  const makeLastMonthDate = (day: number) => {
    const d = new Date(year, month - 1, Math.max(1, Math.min(28, day)), 14, 0);
    return d.toISOString();
  };

  return { makeDate, makeLastMonthDate };
}

const { makeDate, makeLastMonthDate } = getSeedDates();

interface LocalStoreState {
  customers: Customer[];
  accounts: Account[];
  transferLimits: Record<string, TransferLimit>;
  transactions: Transaction[];
  budgets: Budget[];
}

const localStore: LocalStoreState = {
  customers: [
    {
      id: "B001",
      name: "Rohan Iyer",
      email: "rohan.iyer@paywise.example.com",
      city: "Chennai",
      kyc_level: "full",
    },
    {
      id: "B002",
      name: "Sneha Pillai",
      email: "sneha.pillai@paywise.example.com",
      city: "Bengaluru",
      kyc_level: "basic",
    },
  ],
  transferLimits: {
    basic: { kyc_level: "basic", daily_limit: 25000, per_txn_limit: 10000 },
    full: { kyc_level: "full", daily_limit: 100000, per_txn_limit: 50000 },
  },
  accounts: [
    {
      id: "A100",
      customer_id: "B001",
      account_type: "salary",
      nickname: "Salary account",
      masked_number: "XXXX 4821",
      balance: 48250.0,
      is_frozen: false,
    },
    {
      id: "A101",
      customer_id: "B001",
      account_type: "savings",
      nickname: "Savings",
      masked_number: "XXXX 7730",
      balance: 120500.0,
      is_frozen: false,
    },
    {
      id: "A102",
      customer_id: "B001",
      account_type: "savings",
      nickname: "Old savings",
      masked_number: "XXXX 1194",
      balance: 2300.0,
      is_frozen: true,
    },
    {
      id: "A200",
      customer_id: "B002",
      account_type: "savings",
      nickname: "Savings",
      masked_number: "XXXX 5502",
      balance: 15400.0,
      is_frozen: false,
    },
  ],
  transactions: [
    {
      id: 1,
      account_id: "A100",
      txn_date: makeDate(1, 9, 0),
      description: "Salary credit - Zentrix Software",
      category: "salary",
      direction: "credit",
      amount: 85000,
    },
    {
      id: 2,
      account_id: "A100",
      txn_date: makeDate(1, 10, 0),
      description: "House rent - Anna Nagar",
      category: "rent",
      direction: "debit",
      amount: 22000,
    },
    {
      id: 3,
      account_id: "A100",
      txn_date: makeDate(2, 19, 30),
      description: "Swiggy order",
      category: "food",
      direction: "debit",
      amount: 540,
    },
    {
      id: 4,
      account_id: "A100",
      txn_date: makeDate(3, 13, 10),
      description: "Zomato order",
      category: "food",
      direction: "debit",
      amount: 820,
    },
    {
      id: 5,
      account_id: "A100",
      txn_date: makeDate(3, 18, 0),
      description: "BigBasket groceries",
      category: "groceries",
      direction: "debit",
      amount: 2650,
    },
    {
      id: 6,
      account_id: "A100",
      txn_date: makeDate(4, 8, 45),
      description: "Metro card recharge",
      category: "travel",
      direction: "debit",
      amount: 500,
    },
    {
      id: 7,
      account_id: "A100",
      txn_date: makeDate(4, 21, 0),
      description: "Movie tickets",
      category: "entertainment",
      direction: "debit",
      amount: 760,
    },
    {
      id: 8,
      account_id: "A100",
      txn_date: makeDate(5, 12, 30),
      description: "Electricity bill",
      category: "bills",
      direction: "debit",
      amount: 1840,
    },
    {
      id: 9,
      account_id: "A100",
      txn_date: makeDate(5, 20, 15),
      description: "Restaurant dinner",
      category: "food",
      direction: "debit",
      amount: 2350,
    },
    {
      id: 10,
      account_id: "A100",
      txn_date: makeDate(6, 11, 0),
      description: "Amazon - headphones",
      category: "shopping",
      direction: "debit",
      amount: 3499,
    },
    {
      id: 11,
      account_id: "A100",
      txn_date: makeDate(6, 19, 40),
      description: "Swiggy order",
      category: "food",
      direction: "debit",
      amount: 610,
    },
    {
      id: 12,
      account_id: "A100",
      txn_date: makeDate(7, 9, 20),
      description: "Mobile recharge",
      category: "bills",
      direction: "debit",
      amount: 299,
    },
    {
      id: 13,
      account_id: "A100",
      txn_date: makeDate(7, 13, 0),
      description: "Cafe coffee",
      category: "food",
      direction: "debit",
      amount: 380,
    },
    {
      id: 14,
      account_id: "A100",
      txn_date: makeDate(8, 17, 30),
      description: "Pharmacy",
      category: "health",
      direction: "debit",
      amount: 920,
    },
    {
      id: 15,
      account_id: "A100",
      txn_date: makeDate(8, 20, 0),
      description: "Uber ride",
      category: "travel",
      direction: "debit",
      amount: 430,
    },
    {
      id: 16,
      account_id: "A100",
      txn_date: makeDate(9, 21, 10),
      description: "Zomato order",
      category: "food",
      direction: "debit",
      amount: 690,
    },
    {
      id: 17,
      account_id: "A101",
      txn_date: makeDate(1, 10, 30),
      description: "Interest credit",
      category: "other",
      direction: "credit",
      amount: 410,
    },
    // Last month transactions
    {
      id: 18,
      account_id: "A100",
      txn_date: makeLastMonthDate(5),
      description: "Swiggy order",
      category: "food",
      direction: "debit",
      amount: 720,
    },
    {
      id: 19,
      account_id: "A100",
      txn_date: makeLastMonthDate(10),
      description: "Restaurant dinner",
      category: "food",
      direction: "debit",
      amount: 1900,
    },
    {
      id: 20,
      account_id: "A100",
      txn_date: makeLastMonthDate(15),
      description: "BigBasket groceries",
      category: "groceries",
      direction: "debit",
      amount: 3100,
    },
    {
      id: 21,
      account_id: "A100",
      txn_date: makeLastMonthDate(20),
      description: "Flipkart - shoes",
      category: "shopping",
      direction: "debit",
      amount: 2799,
    },
  ],
  budgets: [
    {
      id: 1,
      customer_id: "B001",
      category: "food",
      monthly_limit: 6000,
      alert_at_pct: 80,
      created_at: new Date().toISOString(),
    },
  ],
};

let nextTxnId = 100;
let nextBudgetId = 10;

// ---------------------------------------------------------------------------
// Store Functions
// ---------------------------------------------------------------------------

export async function getCustomer(customerId = "B001"): Promise<Customer | null> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await getSupabase()
        .from("customers")
        .select("*")
        .eq("id", customerId)
        .maybeSingle();
      if (!error && data) return data as Customer;
    } catch {
      // Fallback
    }
  }
  return localStore.customers.find((c) => c.id === customerId) || null;
}

export async function getAccounts(customerId = "B001"): Promise<Account[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await getSupabase()
        .from("accounts")
        .select("*")
        .eq("customer_id", customerId)
        .order("id");
      if (!error && data) {
        return data.map((a: any) => ({
          ...a,
          balance: Number(a.balance),
        }));
      }
    } catch {
      // Fallback
    }
  }
  return localStore.accounts.filter((a) => a.customer_id === customerId);
}

export async function getTransactions(
  customerId = "B001",
  filter?: { category?: string; accountId?: string; limit?: number }
): Promise<Transaction[]> {
  const accounts = await getAccounts(customerId);
  const accountIds = accounts.map((a) => a.id);
  const accountMap = new Map(accounts.map((a) => [a.id, a.nickname]));

  if (isSupabaseConfigured()) {
    try {
      let query = getSupabase()
        .from("transactions")
        .select("*")
        .in("account_id", accountIds)
        .order("txn_date", { ascending: false });

      if (filter?.category && filter.category !== "all") {
        query = query.eq("category", filter.category);
      }
      if (filter?.accountId && filter.accountId !== "all") {
        query = query.eq("account_id", filter.accountId);
      }
      if (filter?.limit) {
        query = query.limit(filter.limit);
      } else {
        query = query.limit(50);
      }

      const { data, error } = await query;
      if (!error && data) {
        return data.map((t: any) => ({
          ...t,
          amount: Number(t.amount),
          account_nickname: accountMap.get(t.account_id) || t.account_id,
        }));
      }
    } catch {
      // Fallback
    }
  }

  // Local fallback
  let list = localStore.transactions.filter((t) => accountIds.includes(t.account_id));
  if (filter?.category && filter.category !== "all") {
    list = list.filter((t) => t.category.toLowerCase() === filter.category!.toLowerCase());
  }
  if (filter?.accountId && filter.accountId !== "all") {
    list = list.filter((t) => t.account_id === filter.accountId);
  }
  list = list
    .slice()
    .sort((a, b) => new Date(b.txn_date).getTime() - new Date(a.txn_date).getTime());
  if (filter?.limit) {
    list = list.slice(0, filter.limit);
  }
  return list.map((t) => ({
    ...t,
    account_nickname: accountMap.get(t.account_id) || t.account_id,
  }));
}

export async function getSpendSummary(customerId = "B001") {
  const txns = await getTransactions(customerId, { limit: 200 });
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
  const prevYear = prevMonthDate.getFullYear();
  const prevMonth = prevMonthDate.getMonth();

  const currentMonthSpends: Record<string, number> = {};
  const prevMonthSpends: Record<string, number> = {};

  let totalSpentThisMonth = 0;
  let totalIncomeThisMonth = 0;
  let totalSpentLastMonth = 0;

  for (const t of txns) {
    const d = new Date(t.txn_date);
    const y = d.getFullYear();
    const m = d.getMonth();

    if (y === currentYear && m === currentMonth) {
      if (t.direction === "debit" && t.category !== "transfer") {
        currentMonthSpends[t.category] = (currentMonthSpends[t.category] || 0) + t.amount;
        totalSpentThisMonth += t.amount;
      } else if (t.direction === "credit" && t.category !== "transfer") {
        totalIncomeThisMonth += t.amount;
      }
    } else if (y === prevYear && m === prevMonth) {
      if (t.direction === "debit" && t.category !== "transfer") {
        prevMonthSpends[t.category] = (prevMonthSpends[t.category] || 0) + t.amount;
        totalSpentLastMonth += t.amount;
      }
    }
  }

  const categoryBreakdown = Object.entries(currentMonthSpends).map(([category, amount]) => ({
    category,
    amount: Math.round(amount * 100) / 100,
    percentage:
      totalSpentThisMonth > 0
        ? Math.round((amount / totalSpentThisMonth) * 1000) / 10
        : 0,
    prevMonthAmount: Math.round((prevMonthSpends[category] || 0) * 100) / 100,
  }));

  // Sort descending by amount
  categoryBreakdown.sort((a, b) => b.amount - a.amount);

  return {
    currentMonth: now.toLocaleString("en-US", { month: "long", year: "numeric" }),
    totalSpentThisMonth: Math.round(totalSpentThisMonth * 100) / 100,
    totalIncomeThisMonth: Math.round(totalIncomeThisMonth * 100) / 100,
    totalSpentLastMonth: Math.round(totalSpentLastMonth * 100) / 100,
    categoryBreakdown,
  };
}

export async function getBudgets(customerId = "B001"): Promise<Budget[]> {
  let baseBudgets: Budget[] = [];

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await getSupabase()
        .from("budgets")
        .select("*")
        .eq("customer_id", customerId);
      if (!error && data) {
        baseBudgets = data.map((b: any) => ({
          ...b,
          monthly_limit: Number(b.monthly_limit),
          alert_at_pct: Number(b.alert_at_pct),
        }));
      }
    } catch {
      // Fallback
    }
  }

  if (baseBudgets.length === 0) {
    baseBudgets = localStore.budgets.filter((b) => b.customer_id === customerId);
  }

  // Calculate current month's spend for each budget
  const summary = await getSpendSummary(customerId);
  const spendMap = new Map(summary.categoryBreakdown.map((c) => [c.category, c.amount]));

  return baseBudgets.map((b) => {
    const spent = spendMap.get(b.category) || 0;
    const pct = b.monthly_limit > 0 ? Math.round((spent / b.monthly_limit) * 100) : 0;
    const isAlert = pct >= b.alert_at_pct;
    return {
      ...b,
      spent,
      pct_used: pct,
      is_alert: isAlert,
    };
  });
}

export async function setBudget(
  customerId = "B001",
  category: string,
  monthlyLimit: number,
  alertAtPct: number = 80
) {
  const cat = category.toLowerCase().trim();

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await getSupabase()
        .from("budgets")
        .upsert(
          {
            customer_id: customerId,
            category: cat,
            monthly_limit: monthlyLimit,
            alert_at_pct: alertAtPct,
          },
          { onConflict: "customer_id, category" }
        )
        .select()
        .single();
      if (!error && data) return data;
    } catch {
      // Fallback to local
    }
  }

  const existingIndex = localStore.budgets.findIndex(
    (b) => b.customer_id === customerId && b.category.toLowerCase() === cat
  );

  if (existingIndex >= 0) {
    localStore.budgets[existingIndex].monthly_limit = monthlyLimit;
    localStore.budgets[existingIndex].alert_at_pct = alertAtPct;
    return localStore.budgets[existingIndex];
  } else {
    const newBudget: Budget = {
      id: ++nextBudgetId,
      customer_id: customerId,
      category: cat,
      monthly_limit: monthlyLimit,
      alert_at_pct: alertAtPct,
      created_at: new Date().toISOString(),
    };
    localStore.budgets.push(newBudget);
    return newBudget;
  }
}

export async function transferFunds(
  customerId = "B001",
  fromAccountIdent: string,
  toAccountIdent: string,
  amount: number,
  note?: string
) {
  if (amount <= 0) {
    throw new Error("Amount must be greater than ₹0.");
  }

  // If Supabase is configured, call Postgres RPC function transfer_funds
  if (isSupabaseConfigured()) {
    try {
      // Resolve accounts to account IDs
      const accounts = await getAccounts(customerId);
      const resolveId = (ident: string) => {
        const lower = ident.toLowerCase().trim();
        const found = accounts.find(
          (a) =>
            a.id.toLowerCase() === lower ||
            a.nickname.toLowerCase() === lower ||
            a.account_type.toLowerCase() === lower ||
            a.masked_number.toLowerCase().includes(lower)
        );
        return found ? found.id : ident.toUpperCase();
      };

      const fromId = resolveId(fromAccountIdent);
      const toId = resolveId(toAccountIdent);

      const { data, error } = await getSupabase().rpc("transfer_funds", {
        p_customer_id: customerId,
        p_from_account: fromId,
        p_to_account: toId,
        p_amount: amount,
        p_note: note || null,
      });

      if (error) {
        throw new Error(error.message);
      }
      return data;
    } catch (err: any) {
      if (err.message && !err.message.includes("fetch failed")) {
        throw err;
      }
      // If network/connection failed, use robust local execution
    }
  }

  // Robust Local Execution (Enforcing ALL business rules from PS8)
  const customer = localStore.customers.find((c) => c.id === customerId);
  if (!customer) throw new Error(`Customer ${customerId} not found.`);

  const resolveAccount = (ident: string) => {
    const lower = ident.toLowerCase().trim();
    return localStore.accounts.find(
      (a) =>
        a.customer_id === customerId &&
        (a.id.toLowerCase() === lower ||
          a.nickname.toLowerCase().includes(lower) ||
          a.account_type.toLowerCase() === lower ||
          a.masked_number.toLowerCase().includes(lower))
    );
  };

  const aFrom = resolveAccount(fromAccountIdent);
  if (!aFrom) {
    throw new Error(`Account "${fromAccountIdent}" is not one of your accounts.`);
  }

  const aTo = resolveAccount(toAccountIdent);
  if (!aTo) {
    throw new Error(`Account "${toAccountIdent}" is not one of your accounts. Transfers only go between your own accounts.`);
  }

  if (aFrom.id === aTo.id) {
    throw new Error("From and To accounts must be different.");
  }

  if (aFrom.is_frozen || aTo.is_frozen) {
    const frozenAcc = aFrom.is_frozen ? aFrom.nickname : aTo.nickname;
    throw new Error(`A frozen account (${frozenAcc}) cannot send or receive money. Please visit the branch.`);
  }

  if (aFrom.balance < amount) {
    throw new Error(`Not enough balance. ${aFrom.nickname} has ₹${aFrom.balance.toLocaleString("en-IN")}, transfer is ₹${amount.toLocaleString("en-IN")}.`);
  }

  const lim = localStore.transferLimits[customer.kyc_level] || { daily_limit: 25000, per_txn_limit: 10000 };
  if (amount > lim.per_txn_limit) {
    throw new Error(`₹${amount.toLocaleString("en-IN")} is above your per-transfer limit of ₹${lim.per_txn_limit.toLocaleString("en-IN")}.`);
  }

  // Daily transfer limit check
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const sentToday = localStore.transactions
    .filter(
      (t) =>
        t.category === "transfer" &&
        t.direction === "debit" &&
        new Date(t.txn_date) >= todayStart
    )
    .reduce((sum, t) => sum + t.amount, 0);

  if (sentToday + amount > lim.daily_limit) {
    const remaining = Math.max(0, lim.daily_limit - sentToday);
    throw new Error(`Daily transfer limit is ₹${lim.daily_limit.toLocaleString("en-IN")}. You have ₹${remaining.toLocaleString("en-IN")} left today.`);
  }

  // Deduct & credit
  aFrom.balance -= amount;
  aTo.balance += amount;

  const nowIso = new Date().toISOString();
  localStore.transactions.unshift(
    {
      id: ++nextTxnId,
      account_id: aFrom.id,
      txn_date: nowIso,
      description: note || `Transfer to ${aTo.nickname}`,
      category: "transfer",
      direction: "debit",
      amount,
    },
    {
      id: ++nextTxnId,
      account_id: aTo.id,
      txn_date: nowIso,
      description: note || `Transfer from ${aFrom.nickname}`,
      category: "transfer",
      direction: "credit",
      amount,
    }
  );

  return {
    from: aFrom.nickname,
    to: aTo.nickname,
    amount,
    from_balance: aFrom.balance,
    to_balance: aTo.balance,
    daily_limit_left: lim.daily_limit - sentToday - amount,
  };
}

