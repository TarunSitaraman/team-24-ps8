import "server-only";
import { z } from "zod";
import { defineTool, type AgentTool } from "./defineTool";
import { getSupabase } from "../supabase";
import { isoDate } from "../schemas";
import { budgetStatus, listAccounts, listTransactions, spendSummary } from "../banking";
import {
  ALL_CATEGORIES,
  CURRENT_CUSTOMER_ID,
  SPEND_CATEGORIES,
  addDays,
  monthRange,
  todayIST,
} from "../paywise";

/*
 * PAYWISE AGENT TOOLS
 * Read tools (the agent's eyes): getMyAccounts, getTransactions, getSpendSummary, getBudgetStatus
 * Write tools (the agent's hands): transferFunds, setBudgetAlert
 * No tool takes a customer id: every tool works for CURRENT_CUSTOMER_ID only.
 */

const accountId = z
  .string()
  .regex(/^A\d{3}$/, "Use the account id from getMyAccounts, for example A101")
  .describe("Account id from getMyAccounts, for example A101. Never the masked account number.");

const getMyAccounts = defineTool({
  name: "getMyAccounts",
  description:
    "Use this when the customer asks about balances or accounts, or BEFORE any transfer to find the account ids. Returns each account (id, nickname, type, masked number, balance, frozen or not), the total balance, and the transfer limits with how much can still be transferred today.",
  schema: z.object({}),
  run: async () => listAccounts(),
});

const getTransactions = defineTool({
  name: "getTransactions",
  description:
    "Use this when the customer wants to see individual transactions, for example 'show my food spends', 'what did I pay on Amazon', 'my last 5 transactions'. Returns at most `limit` transactions, newest first.",
  schema: z.object({
    category: z.enum(ALL_CATEGORIES).optional().describe("Only this category"),
    account_id: accountId.optional(),
    direction: z.enum(["debit", "credit"]).optional().describe("debit = money out, credit = money in"),
    from_date: isoDate.optional().describe("First day to include, YYYY-MM-DD"),
    to_date: isoDate.optional().describe("Last day to include, YYYY-MM-DD"),
    search: z.string().trim().min(2).max(50).optional().describe("Word to find in the description, for example Swiggy"),
    limit: z.number().int().min(1).max(50).optional().describe("How many to return, default 20"),
  }),
  run: async (args) => listTransactions({ ...args, limit: args.limit ?? 20 }),
});

const getSpendSummary = defineTool({
  name: "getSpendSummary",
  description:
    "Use this when the customer asks how much they spent, where their money went, or for spending by category. Totals debits by category (transfers between own accounts and salary are not counted). Use period for a calendar month, or from_date/to_date for any other range.",
  schema: z.object({
    period: z
      .enum(["this_month", "last_month"])
      .optional()
      .describe("Calendar month to summarise. Default this_month. Ignored if from_date is given."),
    from_date: isoDate.optional().describe("Start date YYYY-MM-DD, for a custom range"),
    to_date: isoDate.optional().describe("End date YYYY-MM-DD (inclusive). Default today."),
    category: z.enum(SPEND_CATEGORIES).optional().describe("Only return this category"),
  }),
  run: async ({ period, from_date, to_date, category }) => {
    let from: string;
    let toExclusive: string;
    if (from_date) {
      const to = to_date ?? todayIST();
      if (to < from_date) throw new Error("to_date must be on or after from_date");
      from = from_date;
      toExclusive = addDays(to, 1);
    } else {
      ({ from, toExclusive } = monthRange(period ?? "this_month"));
    }
    const summary = await spendSummary(from, toExclusive);
    if (!category) return summary;
    const row = summary.by_category.find((c) => c.category === category);
    return { from: summary.from, to: summary.to, category, amount: row?.amount ?? 0, count: row?.count ?? 0 };
  },
});

const getBudgetStatus = defineTool({
  name: "getBudgetStatus",
  description:
    "Use this when the customer asks about their budgets or whether they are over budget. Returns each budget with the monthly limit, spent this month, amount left, percent used, alert level and status (ok, alert or over).",
  schema: z.object({
    category: z.enum(SPEND_CATEGORIES).optional().describe("Only this budget category"),
  }),
  run: async ({ category }) => {
    const budgets = await budgetStatus(category);
    if (category && budgets.length === 0) return { category, budget: null, note: `No budget set for ${category}` };
    return { budgets };
  },
});

const transferFunds = defineTool({
  name: "transferFunds",
  description:
    "Use this when the customer asks to move or transfer money between their OWN accounts. Call getMyAccounts first to get the account ids. The bank checks ownership, frozen accounts, balance and KYC limits, and returns an error if a rule fails.",
  writes: true,
  schema: z.object({
    from_account_id: accountId.describe("Account id to take money from, for example A101"),
    to_account_id: accountId.describe("Account id to put money into, for example A100"),
    amount: z
      .number()
      .positive()
      .max(10_000_000)
      .refine((n) => Math.round(n * 100) === n * 100, "At most 2 decimal places")
      .describe("Amount in rupees, a plain number, for example 20000"),
    note: z.string().trim().min(1).max(100).optional().describe("Optional short note for the transfer"),
  }),
  run: async ({ from_account_id, to_account_id, amount, note }) => {
    // All money rules live in the database function, so they run in one transaction.
    const { data, error } = await getSupabase().rpc("transfer_funds", {
      p_customer_id: CURRENT_CUSTOMER_ID,
      p_from_account: from_account_id,
      p_to_account: to_account_id,
      p_amount: amount,
      p_note: note ?? null,
    });
    if (error) throw new Error(error.message);
    return { transferred: data };
  },
});

const setBudgetAlert = defineTool({
  name: "setBudgetAlert",
  description:
    "Use this when the customer wants to set or change a monthly budget (spending limit) for a category, with an alert when spending reaches a percent of it. Creates the budget or updates the existing one for that category.",
  writes: true,
  schema: z.object({
    category: z.enum(SPEND_CATEGORIES).describe("Spending category for the budget"),
    monthly_limit: z.number().positive().max(10_000_000).describe("Monthly limit in rupees, for example 4000"),
    alert_at_pct: z
      .number()
      .int()
      .min(10)
      .max(100)
      .optional()
      .describe("Alert when spending reaches this percent of the limit, 10 to 100. Default 80."),
  }),
  run: async ({ category, monthly_limit, alert_at_pct }) => {
    const { error } = await getSupabase()
      .from("budgets")
      .upsert(
        { customer_id: CURRENT_CUSTOMER_ID, category, monthly_limit, alert_at_pct: alert_at_pct ?? 80 },
        { onConflict: "customer_id,category" }
      );
    if (error) throw new Error(error.message);
    const [budget] = await budgetStatus(category);
    return { saved: budget };
  },
});

/** Every tool in this list is given to Gemini. */
export const tools: AgentTool[] = [
  getMyAccounts,
  getTransactions,
  getSpendSummary,
  getBudgetStatus,
  transferFunds,
  setBudgetAlert,
];
