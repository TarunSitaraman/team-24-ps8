"use client";

import { useState } from "react";
import { useApi } from "@/components/useApi";
import { LoadState, PageShell, Panel, categoryLabel } from "@/components/ui";
import { ALL_CATEGORIES, formatINR } from "@/lib/paywise";
import type { AccountsResponse, TransactionsResponse } from "@/lib/types";

const dateFormat = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
});

export default function TransactionsPage() {
  const [category, setCategory] = useState("");
  const [accountId, setAccountId] = useState("");
  const params = new URLSearchParams({ category, account_id: accountId, limit: "50" });
  const { data, error, loading } = useApi<TransactionsResponse>(`/api/transactions?${params}`);
  const { data: accounts } = useApi<AccountsResponse>("/api/accounts");

  return (
    <PageShell title="Transactions" subtitle="Your latest 50 transactions across all accounts.">
      <div className="mb-4 space-y-3">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Filter by category">
          {["", ...ALL_CATEGORIES].map((c) => (
            <button
              key={c || "all"}
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
              className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-sm transition ${
                category === c
                  ? "border-ink-900 bg-ink-900 font-semibold text-white"
                  : "border-ink-200 bg-white text-ink-600 hover:border-ink-400"
              }`}
            >
              {c ? categoryLabel(c) : "All"}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-ink-600">
          Account
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="rounded-lg border border-ink-200 bg-white px-2 py-1.5 text-sm text-ink-900"
          >
            <option value="">All accounts</option>
            {accounts?.accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nickname} ({a.masked_number})
              </option>
            ))}
          </select>
        </label>
      </div>

      <Panel>
        <LoadState loading={loading && !data} error={error} empty={data?.count === 0 && "No transactions match this filter."} />
        {data && data.count > 0 && (
          <ul className="divide-y divide-ink-100">
            {data.transactions.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink-950">{t.description}</p>
                  <p className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-ink-400">
                    <span>{dateFormat.format(new Date(t.date))}</span>
                    <span>·</span>
                    <span>{t.account}</span>
                    <span className="rounded bg-ink-100 px-1.5 text-ink-600">{categoryLabel(t.category)}</span>
                  </p>
                </div>
                <p
                  className={`money whitespace-nowrap text-sm font-bold ${
                    t.direction === "credit" ? "text-emerald-700" : "text-ink-900"
                  }`}
                >
                  {t.direction === "credit" ? "+" : "−"} {formatINR(t.amount)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </PageShell>
  );
}
