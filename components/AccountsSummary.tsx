"use client";

import { useApi } from "./useApi";
import { LoadState } from "./ui";
import { formatINR } from "@/lib/paywise";
import type { AccountsResponse } from "@/lib/types";

/** Total balance plus one row per account. */
export default function AccountsSummary({ refreshKey = 0 }: { refreshKey?: number }) {
  const { data, error, loading } = useApi<AccountsResponse>("/api/accounts", refreshKey);

  return (
    <section className="overflow-hidden rounded-2xl bg-ink-950 text-white shadow-lg shadow-ink-950/10">
      <div className="px-5 pb-4 pt-5">
        <p className="text-xs uppercase tracking-widest text-ink-400">
          {data ? `${data.customer_name} · total balance` : "Total balance"}
        </p>
        <p className="money mt-1 text-3xl font-extrabold">{data ? formatINR(data.total_balance) : "—"}</p>
      </div>
      {!data && <LoadState loading={loading} error={error} />}
      {data && (
        <ul className="divide-y divide-ink-800 border-t border-ink-800 bg-ink-900">
          {data.accounts.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 px-5 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {a.nickname}
                  {a.is_frozen && (
                    <span className="ml-2 rounded bg-sky-400/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-300">
                      Frozen
                    </span>
                  )}
                </p>
                <p className="text-xs text-ink-400">
                  {a.masked_number} · {a.account_type} · {a.id}
                </p>
              </div>
              <p className={`money text-sm font-bold ${a.is_frozen ? "text-ink-400" : ""}`}>{formatINR(a.balance)}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
