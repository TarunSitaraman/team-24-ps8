"use client";

import { useState } from "react";
import { AlertCircle, X } from "lucide-react";
import type { Budget } from "@/lib/bankingStore";

interface AlertBannerProps {
  budgets: Budget[];
  onViewBudgets: () => void;
}

export default function AlertBanner({ budgets, onViewBudgets }: AlertBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  const triggeredBudgets = budgets.filter((b) => b.is_alert);

  if (dismissed || triggeredBudgets.length === 0) return null;

  const topAlert = triggeredBudgets[0];

  return (
    <div className="border-b border-amber-200/80 bg-amber-50/70 px-4 py-2.5 sm:px-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between text-xs text-amber-950">
        <div className="flex items-center gap-2.5">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
          <p>
            <span className="font-semibold uppercase tracking-wider text-[11px] text-amber-800 mr-1.5">
              Budget Alert:
            </span>
            <span>
              Your <strong>{topAlert.category}</strong> spending has reached{" "}
              <strong>{topAlert.pct_used}%</strong> of your ₹
              {topAlert.monthly_limit.toLocaleString("en-IN")} monthly limit (threshold:{" "}
              {topAlert.alert_at_pct}%).
            </span>
            {triggeredBudgets.length > 1 && (
              <span className="ml-1 text-amber-700">
                (+{triggeredBudgets.length - 1} more alert)
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onViewBudgets}
            className="text-amber-900 underline font-medium hover:text-amber-950 text-xs"
          >
            Review Budgets
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="rounded p-0.5 text-amber-700 hover:text-amber-950"
            title="Dismiss alert"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

