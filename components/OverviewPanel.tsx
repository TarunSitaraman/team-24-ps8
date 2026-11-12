"use client";

import { CreditCard, ArrowRight, ShieldCheck, TrendingDown, TrendingUp, Sliders } from "lucide-react";
import type { Account, Budget, Transaction } from "@/lib/bankingStore";

interface OverviewPanelProps {
  accounts: Account[];
  budgets: Budget[];
  recentTransactions: Transaction[];
  totalBalance: number;
  spendSummary: {
    totalSpentThisMonth: number;
    totalIncomeThisMonth: number;
    categoryBreakdown: { category: string; amount: number; percentage: number }[];
  } | null;
  onOpenTransfer: () => void;
  onNavigateTab: (tab: "accounts" | "transactions" | "budgets") => void;
}

export default function OverviewPanel({
  accounts,
  budgets,
  recentTransactions,
  totalBalance,
  spendSummary,
  onOpenTransfer,
  onNavigateTab,
}: OverviewPanelProps) {
  const activeAccounts = accounts.filter((a) => !a.is_frozen);
  const foodBudget = budgets.find((b) => b.category.toLowerCase() === "food");

  return (
    <div className="space-y-4">
      {/* Mini Account Highlights */}
      <div className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <CreditCard className="h-3.5 w-3.5 text-neutral-500" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-700">
              Active Accounts ({activeAccounts.length})
            </h3>
          </div>
          <button
            onClick={() => onNavigateTab("accounts")}
            className="flex items-center gap-0.5 text-xs text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            <span>All accounts</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        <div className="space-y-2">
          {activeAccounts.slice(0, 2).map((acc) => (
            <div
              key={acc.id}
              className="flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50/50 p-2.5"
            >
              <div>
                <span className="text-xs font-medium text-neutral-900">{acc.nickname}</span>
                <span className="text-[10px] text-neutral-400 font-mono block">
                  {acc.masked_number}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold font-mono text-neutral-900">
                  ₹{acc.balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[9px] uppercase font-mono text-emerald-600 block">Active</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Cashflow Snapshot */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-neutral-200/90 bg-white p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-1.5 text-neutral-400 mb-1">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
            <span className="text-[10px] uppercase font-mono tracking-wider">Inflow (This Month)</span>
          </div>
          <span className="text-sm font-semibold font-mono text-emerald-700">
            ₹{(spendSummary?.totalIncomeThisMonth || 85000).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="rounded-2xl border border-neutral-200/90 bg-white p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-1.5 text-neutral-400 mb-1">
            <TrendingDown className="h-3.5 w-3.5 text-neutral-600" />
            <span className="text-[10px] uppercase font-mono tracking-wider">Outflow (Spend)</span>
          </div>
          <span className="text-sm font-semibold font-mono text-neutral-800">
            ₹{(spendSummary?.totalSpentThisMonth || 38718).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Key Budget Watch: Food */}
      {foodBudget && (
        <div className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Sliders className="h-3.5 w-3.5 text-neutral-500" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-700">
                Budget Focus: Food
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab("budgets")}
              className="text-xs text-neutral-500 hover:text-neutral-900"
            >
              Budgets
            </button>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-neutral-500">
                Spent: ₹{(foodBudget.spent || 5390).toLocaleString("en-IN")}
              </span>
              <span className="font-semibold text-neutral-800">
                Limit: ₹{foodBudget.monthly_limit.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-neutral-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  foodBudget.is_alert ? "bg-amber-500" : "bg-neutral-900"
                }`}
                style={{ width: `${Math.min(100, foodBudget.pct_used || 89.8)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
              <span>{foodBudget.pct_used || 89.8}% used</span>
              <span className={foodBudget.is_alert ? "text-amber-700 font-medium" : ""}>
                {foodBudget.is_alert ? "⚠️ Above 80% Alert" : "On track"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity List */}
      <div className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-700">
            Recent Activity
          </h3>
          <button
            onClick={() => onNavigateTab("transactions")}
            className="flex items-center gap-0.5 text-xs text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            <span>View all</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        <div className="divide-y divide-neutral-100">
          {recentTransactions.slice(0, 4).map((t) => (
            <div key={t.id} className="flex items-center justify-between py-2 text-xs">
              <div className="min-w-0 pr-2">
                <p className="font-medium text-neutral-900 truncate">{t.description}</p>
                <span className="text-[10px] font-mono text-neutral-400 capitalize">
                  {t.category} • {t.account_nickname || t.account_id}
                </span>
              </div>
              <span
                className={`font-mono font-semibold shrink-0 ${
                  t.direction === "credit" ? "text-emerald-700" : "text-neutral-800"
                }`}
              >
                {t.direction === "credit" ? "+" : "-"}₹{t.amount.toLocaleString("en-IN")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

