"use client";

import Link from "next/link";
import { useApi } from "./useApi";
import { categoryLabel } from "./ui";
import { formatINR } from "@/lib/paywise";
import type { BudgetsResponse } from "@/lib/types";

/** Shows a warning when any budget has passed its alert level (or its limit). Hidden otherwise. */
export default function BudgetAlertBanner({ refreshKey = 0 }: { refreshKey?: number }) {
  const { data } = useApi<BudgetsResponse>("/api/budgets", refreshKey);
  const flagged = data?.budgets.filter((b) => b.status !== "ok") ?? [];
  if (flagged.length === 0) return null;

  const anyOver = flagged.some((b) => b.status === "over");
  return (
    <div
      role="alert"
      className={`rounded-2xl border px-4 py-3 text-sm ${
        anyOver ? "border-red-200 bg-red-50 text-red-900" : "border-amber-200 bg-amber-50 text-amber-900"
      }`}
    >
      <p className="font-bold">{anyOver ? "Budget exceeded" : "Budget alert"}</p>
      <ul className="mt-1 space-y-0.5">
        {flagged.map((b) => (
          <li key={b.category} className="money">
            {categoryLabel(b.category)}: {formatINR(b.spent_this_month)} of {formatINR(b.monthly_limit)} ({b.used_pct}%)
            {b.status === "over" ? " · over the limit" : ` · past your ${b.alert_at_pct}% alert`}
          </li>
        ))}
      </ul>
      <Link href="/budgets" className="mt-1 inline-block text-xs font-semibold underline underline-offset-2">
        See budgets
      </Link>
    </div>
  );
}
