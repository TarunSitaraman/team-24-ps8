"use client";

import { useApi } from "@/components/useApi";
import { LoadState, PageShell, Panel } from "@/components/ui";
import { formatINR } from "@/lib/paywise";
import type { AccountsResponse } from "@/lib/types";

export default function AccountsPage() {
  const { data, error, loading } = useApi<AccountsResponse>("/api/accounts");
  const limits = data?.transfer_limits;
  const usedPct = limits ? Math.min(100, Math.round((limits.transferred_today / limits.daily_limit) * 100)) : 0;

  return (
    <PageShell title="My accounts" subtitle={data ? `${data.customer_name} · KYC: ${data.kyc_level}` : undefined}>
      {!data && <LoadState loading={loading} error={error} />}
      {data && limits && (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
            {data.accounts.map((a) => (
              <article
                key={a.id}
                className={`relative overflow-hidden rounded-2xl p-5 ${
                  a.is_frozen ? "border border-dashed border-ink-200 bg-ink-100 text-ink-600" : "bg-ink-950 text-white"
                }`}
              >
                {!a.is_frozen && (
                  <span aria-hidden className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand-500/20" />
                )}
                <div className="relative flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold">{a.nickname}</p>
                    <p className={`text-xs capitalize ${a.is_frozen ? "text-ink-400" : "text-ink-400"}`}>
                      {a.account_type} account · {a.id}
                    </p>
                  </div>
                  {a.is_frozen && (
                    <span className="rounded bg-sky-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-sky-800">
                      Frozen
                    </span>
                  )}
                </div>
                <p className="money relative mt-6 text-3xl font-extrabold">{formatINR(a.balance)}</p>
                <p className="relative mt-1 font-mono text-xs tracking-widest text-ink-400">{a.masked_number}</p>
                {a.is_frozen && <p className="mt-3 text-xs">Cannot send or receive money. Please visit the branch.</p>}
              </article>
            ))}
          </div>

          <Panel title="Transfer limits" note={`For ${data.kyc_level} KYC customers`}>
            <dl className="money space-y-3 p-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-600">Per transfer</dt>
                <dd className="font-bold">{formatINR(limits.per_transfer_limit)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-600">Daily limit</dt>
                <dd className="font-bold">{formatINR(limits.daily_limit)}</dd>
              </div>
              <div>
                <div className="flex justify-between">
                  <dt className="text-ink-600">Used today</dt>
                  <dd className="font-bold">{formatINR(limits.transferred_today)}</dd>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink-100">
                  <div className="h-full rounded-full bg-brand-500" style={{ width: `${usedPct}%` }} />
                </div>
                <p className="mt-1 text-xs text-ink-400">{formatINR(limits.left_today)} left to transfer today</p>
              </div>
              <div className="flex justify-between border-t border-ink-100 pt-3">
                <dt className="text-ink-600">Total balance</dt>
                <dd className="text-base font-extrabold">{formatINR(data.total_balance)}</dd>
              </div>
            </dl>
          </Panel>
        </div>
      )}
    </PageShell>
  );
}
