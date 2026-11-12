import "server-only";
import { z } from "zod";
import { defineTool, type AgentTool } from "./defineTool";
import {
  getAccounts,
  getTransactions,
  getSpendSummary,
  getBudgets,
  transferFunds,
  setBudget,
} from "../bankingStore";

const CUSTOMER_ID = "B001";

const getMyAccounts = defineTool({
  name: "getMyAccounts",
  description:
    "Use this when the customer asks to view or check their accounts, balances, masked account numbers, or account status. Returns all accounts for customer Rohan Iyer.",
  schema: z.object({}),
  run: async () => {
    const accounts = await getAccounts(CUSTOMER_ID);
    const totalActiveBalance = accounts
      .filter((a) => !a.is_frozen)
      .reduce((sum, a) => sum + a.balance, 0);

    return {
      customer: "Rohan Iyer (B001)",
      total_active_balance: totalActiveBalance,
      accounts: accounts.map((a) => ({
        id: a.id,
        nickname: a.nickname,
        type: a.account_type,
        masked_number: a.masked_number,
        balance: a.balance,
        status: a.is_frozen ? "FROZEN" : "ACTIVE",
      })),
    };
  },
});

const getTransactionsTool = defineTool({
  name: "getTransactions",
  description:
    "Use this when the customer asks to see their recent transactions, statement, or payments. Can filter by category (e.g. food, shopping, bills), account, or limit.",
  schema: z.object({
    category: z
      .string()
      .optional()
      .describe(
        "Expense or income category: food, groceries, shopping, travel, bills, rent, entertainment, health, education, salary, transfer, other"
      ),
    account_id: z.string().optional().describe("Optional account ID (e.g. A100 or A101)"),
    limit: z.number().int().min(1).max(50).optional().default(15).describe("Number of transactions to return"),
  }),
  run: async ({ category, account_id, limit }) => {
    const txns = await getTransactions(CUSTOMER_ID, {
      category,
      accountId: account_id,
      limit: limit ?? 15,
    });
    return {
      count: txns.length,
      transactions: txns.map((t) => ({
        id: t.id,
        date: t.txn_date.split("T")[0],
        description: t.description,
        category: t.category,
        direction: t.direction,
        amount: t.amount,
        account: t.account_nickname || t.account_id,
      })),
    };
  },
});

const getSpendSummaryTool = defineTool({
  name: "getSpendSummary",
  description:
    "Use this when the user asks how much they spent this month, where their money went, asks for a spend breakdown by category, or compares with last month.",
  schema: z.object({
    category: z
      .string()
      .optional()
      .describe("Optional category to check, like 'food', 'shopping', 'groceries', etc."),
  }),
  run: async ({ category }) => {
    const summary = await getSpendSummary(CUSTOMER_ID);
    if (category) {
      const match = summary.categoryBreakdown.find(
        (c) => c.category.toLowerCase() === category.toLowerCase()
      );
      return {
        month: summary.currentMonth,
        requested_category: category,
        spent_in_category: match ? match.amount : 0,
        percentage_of_total_spends: match ? match.percentage : 0,
        last_month_spend: match ? match.prevMonthAmount : 0,
        total_monthly_spending: summary.totalSpentThisMonth,
      };
    }
    return summary;
  },
});

const getBudgetStatusTool = defineTool({
  name: "getBudgetStatus",
  description:
    "Use this to check the customer's budget limits, current monthly spend against each budget, percentage utilized, and whether any spending alert has been triggered.",
  schema: z.object({
    category: z
      .string()
      .optional()
      .describe("Optional category to inspect, e.g. 'food', 'shopping'"),
  }),
  run: async ({ category }) => {
    const budgets = await getBudgets(CUSTOMER_ID);
    if (category) {
      const match = budgets.find((b) => b.category.toLowerCase() === category.toLowerCase());
      if (!match) {
        return {
          message: `No active budget found for "${category}".`,
          all_active_budgets: budgets,
        };
      }
      return {
        category: match.category,
        monthly_limit: match.monthly_limit,
        spent_so_far: match.spent,
        remaining_budget: Math.max(0, match.monthly_limit - (match.spent || 0)),
        percentage_used: `${match.pct_used}%`,
        alert_threshold: `${match.alert_at_pct}%`,
        is_alert_triggered: match.is_alert,
        is_over_budget: (match.spent || 0) > match.monthly_limit,
      };
    }
    return {
      budgets: budgets.map((b) => ({
        category: b.category,
        monthly_limit: b.monthly_limit,
        spent: b.spent,
        remaining: Math.max(0, b.monthly_limit - (b.spent || 0)),
        pct_used: `${b.pct_used}%`,
        alert_at_pct: `${b.alert_at_pct}%`,
        is_alert: b.is_alert,
        is_over_limit: (b.spent || 0) > b.monthly_limit,
      })),
    };
  },
});

const transferFundsTool = defineTool({
  name: "transferFunds",
  description:
    "Use this when the customer asks to transfer or move money between their own accounts (e.g. from savings to salary, or salary to savings). Enforces daily and per-transaction limits and checks for frozen accounts.",
  writes: true,
  schema: z.object({
    from_account: z
      .string()
      .describe("Source account name or ID (e.g. 'savings', 'salary', 'A100', 'A101')"),
    to_account: z
      .string()
      .describe("Destination account name or ID (e.g. 'salary', 'savings', 'A100', 'A101')"),
    amount: z.number().positive().describe("Amount in INR to transfer"),
    note: z.string().optional().describe("Optional transfer note/remark"),
  }),
  run: async ({ from_account, to_account, amount, note }) => {
    const result = await transferFunds(CUSTOMER_ID, from_account, to_account, amount, note);
    return {
      status: "SUCCESS",
      transferred_amount: amount,
      from_account: result.from,
      to_account: result.to,
      from_new_balance: result.from_balance,
      to_new_balance: result.to_balance,
      daily_transfer_limit_remaining: result.daily_limit_left,
    };
  },
});

const setBudgetAlertTool = defineTool({
  name: "setBudgetAlert",
  description:
    "Use this when the user asks to set or adjust a monthly spending budget or alert limit for a category (e.g. 'Set a 4,000 rupee monthly budget for shopping and alert me at 75%').",
  writes: true,
  schema: z.object({
    category: z
      .string()
      .describe(
        "Expense category: food, groceries, shopping, travel, bills, rent, entertainment, health, education, other"
      ),
    monthly_limit: z.number().positive().describe("Monthly budget limit in INR"),
    alert_at_pct: z
      .number()
      .int()
      .min(10)
      .max(100)
      .default(80)
      .describe("Alert percentage threshold (e.g. 75 or 80)"),
  }),
  run: async ({ category, monthly_limit, alert_at_pct }) => {
    const saved = await setBudget(CUSTOMER_ID, category, monthly_limit, alert_at_pct);
    const summary = await getSpendSummary(CUSTOMER_ID);
    const spentObj = summary.categoryBreakdown.find(
      (c) => c.category.toLowerCase() === category.toLowerCase()
    );
    const spentSoFar = spentObj ? spentObj.amount : 0;
    const pctUsed = monthly_limit > 0 ? Math.round((spentSoFar / monthly_limit) * 100) : 0;

    return {
      status: "BUDGET_SET",
      category: saved.category,
      monthly_limit: saved.monthly_limit,
      alert_at_pct: `${saved.alert_at_pct}%`,
      spent_this_month: spentSoFar,
      pct_used: `${pctUsed}%`,
      alert_already_triggered: pctUsed >= saved.alert_at_pct,
    };
  },
});

export const tools: AgentTool[] = [
  getMyAccounts,
  getTransactionsTool,
  getSpendSummaryTool,
  getBudgetStatusTool,
  transferFundsTool,
  setBudgetAlertTool,
];
