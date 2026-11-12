"use client";

import { useState } from "react";
import { Plus, Sliders, AlertTriangle, CheckCircle, TrendingUp, ArrowRight } from "lucide-react";
import type { Budget } from "@/lib/bankingStore";

const AVAILABLE_CATEGORIES = [
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
];

interface BudgetManagerProps {
  budgets: Budget[];
  categoryBreakdown?: { category: string; amount: number; percentage: number; prevMonthAmount: number }[];
  totalSpentThisMonth?: number;
  onBudgetUpdated: () => void;
}

export default function BudgetManager({
  budgets,
  categoryBreakdown = [],
  totalSpentThisMonth = 0,
  onBudgetUpdated,
}: BudgetManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [category, setCategory] = useState("shopping");
  const [monthlyLimit, setMonthlyLimit] = useState("");
  const [alertPct, setAlertPct] = useState("80");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSaveBudget(e: React.FormEvent) {
    e.preventDefault();
    const limitNum = parseFloat(monthlyLimit);
    const alertNum = parseInt(alertPct, 10);

    if (isNaN(limitNum) || limitNum <= 0) {
      setError("Please enter a valid monthly limit in INR.");
      return;
    }
    if (isNaN(alertNum) || alertNum < 10 || alertNum > 100) {
      setError("Alert percentage must be between 10% and 100%.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          monthly_limit: limitNum,
          alert_at_pct: alertNum,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to set budget");

      setSuccess(`Budget for ${category} successfully saved!`);
      setMonthlyLimit("");
      setShowAddForm(false);
      onBudgetUpdated();
    } catch (err: any) {
      setError(err.message || "Failed to save budget");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-neutral-900 tracking-tight">Spending Budgets</h2>
          <p className="text-xs text-neutral-500">
            Set category limits and receive automated proactive warnings
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 self-start sm:self-auto rounded-lg border border-neutral-900 bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>{showAddForm ? "Close Form" : "Set New Budget"}</span>
        </button>
      </div>

      {/* Add / Edit Budget Inline Form */}
      {showAddForm && (
        <form
          onSubmit={handleSaveBudget}
          className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm space-y-4"
        >
          <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
            <Sliders className="h-4 w-4 text-neutral-700" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-700">
              Configure Monthly Budget
            </h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 block mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-900 outline-none focus:border-neutral-900 capitalize"
              >
                {AVAILABLE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 block mb-1">
                Monthly Limit (₹)
              </label>
              <input
                type="number"
                value={monthlyLimit}
                onChange={(e) => setMonthlyLimit(e.target.value)}
                placeholder="e.g. 4000"
                min="1"
                required
                className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-900 outline-none focus:border-neutral-900"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 block mb-1">
                Alert Threshold ({alertPct}%)
              </label>
              <input
                type="range"
                value={alertPct}
                onChange={(e) => setAlertPct(e.target.value)}
                min="10"
                max="100"
                step="5"
                className="w-full mt-2 accent-neutral-900"
              />
            </div>
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
          {success && <p className="text-xs text-emerald-600">{success}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-neutral-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Budget"}
            </button>
          </div>
        </form>
      )}

      {/* Budgets List with Progress Bars */}
      <div className="grid gap-4 sm:grid-cols-2">
        {budgets.map((b) => {
          const spent = b.spent || 0;
          const limit = b.monthly_limit;
          const pct = Math.min(100, b.pct_used || 0);
          const isOver = spent > limit;
          const isAlert = b.is_alert;
          const remaining = Math.max(0, limit - spent);

          let barColor = "bg-neutral-900";
          if (isOver) barColor = "bg-rose-600";
          else if (isAlert) barColor = "bg-amber-500";

          return (
            <div
              key={b.id}
              className={`rounded-2xl border p-5 bg-white transition-all ${
                isAlert
                  ? "border-amber-300 shadow-[0_1px_4px_rgba(245,158,11,0.06)]"
                  : "border-neutral-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-neutral-900 capitalize text-sm">{b.category}</span>
                  <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-mono text-neutral-500">
                    Monthly
                  </span>
                </div>

                {isOver ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200/60">
                    <AlertTriangle className="h-2.5 w-2.5" />
                    Over limit by ₹{(spent - limit).toLocaleString("en-IN")}
                  </span>
                ) : isAlert ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
                    <AlertTriangle className="h-2.5 w-2.5" />
                    Alert triggered ({b.pct_used}% ≥ {b.alert_at_pct}%)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                    <CheckCircle className="h-2.5 w-2.5" />
                    On track
                  </span>
                )}
              </div>

              {/* Progress Bar with Alert Marker */}
              <div className="relative my-4">
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {/* Alert threshold marker pin */}
                <div
                  className="absolute -top-1 bottom-0 w-0.5 bg-neutral-400/80 z-10"
                  style={{ left: `${b.alert_at_pct}%` }}
                  title={`Alert threshold: ${b.alert_at_pct}%`}
                >
                  <span className="absolute -top-4 -translate-x-1/2 text-[9px] font-mono text-neutral-400">
                    {b.alert_at_pct}%
                  </span>
                </div>
              </div>

              {/* Numbers Row */}
              <div className="flex items-center justify-between text-xs font-mono pt-1">
                <div>
                  <span className="text-[10px] uppercase text-neutral-400 block font-sans">Spent</span>
                  <span className="font-semibold text-neutral-900">
                    ₹{spent.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase text-neutral-400 block font-sans">Remaining</span>
                  <span className="font-semibold text-neutral-700">
                    ₹{remaining.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase text-neutral-400 block font-sans">Limit</span>
                  <span className="font-semibold text-neutral-500">
                    ₹{limit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Spend Distribution by Category (Stretch Feature) */}
      <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-neutral-700" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-800">
              Monthly Category Spend Distribution
            </h3>
          </div>
          <span className="text-xs font-mono text-neutral-500">
            Total Spend: ₹{totalSpentThisMonth.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
        </div>

        {categoryBreakdown.length === 0 ? (
          <p className="text-xs text-neutral-400 py-4 text-center">No spend data recorded this month.</p>
        ) : (
          <div className="space-y-3">
            {categoryBreakdown.map((item) => (
              <div key={item.category} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="capitalize font-medium text-neutral-800">{item.category}</span>
                  <div className="flex items-center gap-3 font-mono">
                    <span className="text-neutral-400 text-[11px]">{item.percentage}%</span>
                    <span className="font-semibold text-neutral-900">
                      ₹{item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
                <div className="h-1.5 w-full rounded-full bg-neutral-100 overflow-hidden">
                  <div
                    className="h-full bg-neutral-800 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, item.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

