"use client";

import { useState } from "react";
import AgentChat from "@/components/AgentChat";
import AccountsSummary from "@/components/AccountsSummary";
import BudgetAlertBanner from "@/components/BudgetAlertBanner";

/*
 * HOME: the banking chat on the left; live balances and budget alerts on the right.
 * Both side panels reload whenever the agent changes data (a transfer or a budget).
 */
export default function HomePage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <main className="mx-auto max-w-6xl px-4 py-5 md:py-8">
      <div className="grid gap-4 lg:grid-cols-5">
        <section className="lg:col-span-3">
          <AgentChat onDataChanged={() => setRefreshKey((k) => k + 1)} />
        </section>
        <aside className="space-y-4 lg:col-span-2">
          <BudgetAlertBanner refreshKey={refreshKey} />
          <AccountsSummary refreshKey={refreshKey} />
          <p className="px-1 text-xs leading-relaxed text-ink-400">
            Transfers only move money between your own accounts, within your KYC limits. Frozen accounts
            cannot send or receive money.
          </p>
        </aside>
      </div>
    </main>
  );
}
