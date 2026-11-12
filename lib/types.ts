/** Shapes returned by the PayWise API routes. Shared by pages and components. */

export type Account = {
  id: string;
  nickname: string;
  account_type: string;
  masked_number: string;
  balance: number;
  is_frozen: boolean;
};

export type AccountsResponse = {
  customer_name: string;
  kyc_level: string;
  accounts: Account[];
  total_balance: number;
  transfer_limits: {
    per_transfer_limit: number;
    daily_limit: number;
    transferred_today: number;
    left_today: number;
  };
};

export type Transaction = {
  id: number;
  date: string;
  description: string;
  category: string;
  direction: "debit" | "credit";
  amount: number;
  account_id: string;
  account: string;
};

export type TransactionsResponse = { count: number; transactions: Transaction[] };

export type Budget = {
  category: string;
  monthly_limit: number;
  spent_this_month: number;
  left: number;
  used_pct: number;
  alert_at_pct: number;
  status: "ok" | "alert" | "over";
};

export type BudgetsResponse = { budgets: Budget[] };

export type SpendSummaryResponse = {
  label: string;
  from: string;
  to: string;
  total_spent: number;
  by_category: { category: string; amount: number; count: number }[];
};
