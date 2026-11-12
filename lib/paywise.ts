/**
 * PayWise constants and small helpers. Safe to import from both server and browser code
 * (no keys, no database access here).
 */

/** The logged-in customer for the demo. Tools never take a customer id from Gemini. */
export const CURRENT_CUSTOMER_ID = "B001";

/** Every category in the transactions table (see seed/ps8_smart_banking.sql). */
export const ALL_CATEGORIES = [
  "food",
  "groceries",
  "shopping",
  "travel",
  "bills",
  "rent",
  "entertainment",
  "health",
  "education",
  "salary",
  "transfer",
  "other",
] as const;

/** Categories that count as spending. Salary is income and transfers move money between own accounts. */
export const SPEND_CATEGORIES = [
  "food",
  "groceries",
  "shopping",
  "travel",
  "bills",
  "rent",
  "entertainment",
  "health",
  "education",
  "other",
] as const;

export type Category = (typeof ALL_CATEGORIES)[number];
export type SpendCategory = (typeof SPEND_CATEGORIES)[number];

/** 20000 -> "Rs 20,000", 540.5 -> "Rs 540.50" */
export function formatINR(amount: number): string {
  const hasPaise = Math.round(amount * 100) % 100 !== 0;
  return `Rs ${amount.toLocaleString("en-IN", {
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

export function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/** Today's date in India as YYYY-MM-DD. */
export function todayIST(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}

/** Adds days to a YYYY-MM-DD date. */
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Start of a day in India time, as a timestamp Postgres understands. */
export function istStart(date: string): string {
  return `${date}T00:00:00+05:30`;
}

export type MonthPeriod = "this_month" | "last_month";

/** Date range for a calendar month in India time. `toExclusive` is the first day of the next month. */
export function monthRange(period: MonthPeriod): { from: string; toExclusive: string; label: string } {
  const [y, m] = todayIST().split("-").map(Number);
  const offset = period === "this_month" ? 0 : -1;
  const start = new Date(Date.UTC(y, m - 1 + offset, 1));
  const next = new Date(Date.UTC(y, m + offset, 1));
  return {
    from: start.toISOString().slice(0, 10),
    toExclusive: next.toISOString().slice(0, 10),
    label: start.toLocaleString("en-IN", { month: "long", year: "numeric", timeZone: "UTC" }),
  };
}
