"use client";

import { useState } from "react";
import { useApi } from "./useApi";
import { LoadState, Panel, categoryLabel } from "./ui";
import { formatINR } from "@/lib/paywise";
import type { SpendSummaryResponse } from "@/lib/types";

type Period = "this_month" | "last_month";

/** Monthly spend by category as horizontal bars, largest first. */
export default function SpendChart() {
  const [period, setPeriod] = useState<Period>("this_month");
  const { data, error, loading } = useApi<SpendSummaryResponse>(`/api/spend-summary?period=${period}`);
  const max = Math.max(1, ...(data?.by_category.map((c) => c.amount) ?? []));

  return (
    <Panel title="Spend by category" note={data ? `${data.label} · total ${formatINR(data.total_spent)}` : undefined}>
      <div className="flex gap-1 px-4 pt-3" role="group" aria-label="Month">
        {(["this_month", "last_month"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            aria-pressed={period === p}
            className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
              period === p ? "bg-ink-900 text-white" : "text-ink-600 hover:bg-ink-100"
            }`}
          >
            {p === "this_month" ? "This month" : "Last month"}
          </button>
        ))}
      </div>
      <LoadState loading={loading && !data} error={error} empty={data?.by_category.length === 0 && "No spending yet."} />
      {data && data.by_category.length > 0 && (
        <ul className="space-y-2.5 p-4">
          {data.by_category.map((c) => (
            <li key={c.category} className="grid grid-cols-[6rem_1fr_auto] items-center gap-3 text-sm">
              <span className="truncate text-ink-600">{categoryLabel(c.category)}</span>
              <span className="h-3 overflow-hidden rounded-full bg-ink-100">
                <span
                  className="block h-full rounded-full bg-brand-500"
                  style={{ width: `${Math.max(2, (c.amount / max) * 100)}%` }}
                />
              </span>
              <span className="money text-right font-semibold">{formatINR(c.amount)}</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
