"use client";

import Link from "next/link";
import BudgetAlertBanner from "@/components/BudgetAlertBanner";
import SpendChart from "@/components/SpendChart";
import { useApi } from "@/components/useApi";
import { LoadState, PageShell, Panel, categoryLabel } from "@/components/ui";
import { formatINR } from "@/lib/paywise";
import type { Budget, BudgetsResponse } from "@/lib/types";

const STATUS_STYLE: Record<Budget["status"], { bar: string; badge: string; label: string }> = {
  ok: { bar: "bg-brand-500", badge: "bg-brand-100 text-brand-600", label: "On track" },
  alert: { bar: "bg-amber-500", badge: "bg-amber-100 text-amber-800", label: "Alert" },
  over: { bar: "bg-red-600", badge: "bg-red-100 text-red-800", label: "Over budget" },
};

function BudgetRow({ b }: { b: Budget }) {
  const style = STATUS_STYLE[b.status];
  return (
    <li className="px-4 py-4">
      <div className="flex items-center justify-between gap-2">
        <p className="font-bold text-ink-950">{categoryLabel(b.category)}</p>
        <span className={`rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${style.badge}`}>
          {style.label}
        </span>
      </div>
      <div
        className="relative mt-3 h-3 rounded-full bg-ink-100"
        role="progressbar"
        aria-valuenow={b.used_pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${categoryLabel(b.category)} budget used`}
      >
        <div className={`h-full rounded-full ${style.bar}`} style={{ width: `${Math.min(100, b.used_pct)}%` }} />
        <span
          aria-hidden
          title={`Alert at ${b.alert_at_pct}%`}
          className="absolute -top-1 h-5 w-0.5 rounded bg-ink-900"
          style={{ left: `${b.alert_at_pct}%` }}
        />
      </div>
      <p className="money mt-2 flex flex-wrap justify-between gap-x-3 text-xs text-ink-600">
        <span>
          {formatINR(b.spent_this_month)} of {formatINR(b.monthly_limit)} · {b.used_pct}%
        </span>
        <span className={b.left < 0 ? "font-semibold text-red-700" : ""}>
          {b.left < 0 ? `${formatINR(-b.left)} over` : `${formatINR(b.left)} left`} · alert at {b.alert_at_pct}%
        </span>
      </p>
    </li>
  );
}

export default function BudgetsPage() {
  const { data, error, loading } = useApi<BudgetsResponse>("/api/budgets");

  return (
    <PageShell title="My budgets" subtitle="Monthly spending limits. The marker shows where your alert starts.">
      <div className="mb-4">
        <BudgetAlertBanner />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Budgets this month">
          <LoadState
            loading={loading && !data}
            error={error}
            empty={data?.budgets.length === 0 && "No budgets yet. Ask the assistant to set one."}
          />
          {data && data.budgets.length > 0 && (
            <ul className="divide-y divide-ink-100">
              {data.budgets.map((b) => (
                <BudgetRow key={b.category} b={b} />
              ))}
            </ul>
          )}
          <p className="border-t border-ink-100 px-4 py-3 text-xs text-ink-400">
            To add or change a budget, ask the{" "}
            <Link href="/" className="font-semibold text-brand-600 underline underline-offset-2">
              assistant
            </Link>
            , for example: “Set a 4,000 rupee monthly budget for shopping and alert me at 75%.”
          </p>
        </Panel>
        <SpendChart />
      </div>
    </PageShell>
  );
}
