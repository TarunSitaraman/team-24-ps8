"use client";

import { useState } from "react";
import { X, ArrowRight, ShieldAlert, CheckCircle2, AlertCircle } from "lucide-react";
import type { Account } from "@/lib/bankingStore";

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  initialFromAccount?: Account | null;
  onTransferSuccess: () => void;
}

export default function TransferModal({
  isOpen,
  onClose,
  accounts,
  initialFromAccount,
  onTransferSuccess,
}: TransferModalProps) {
  const activeAccounts = accounts.filter((a) => !a.is_frozen);

  const defaultFrom =
    initialFromAccount && !initialFromAccount.is_frozen
      ? initialFromAccount.id
      : activeAccounts[0]?.id || "";

  const defaultTo =
    activeAccounts.find((a) => a.id !== defaultFrom)?.id || "";

  const [fromId, setFromId] = useState(defaultFrom);
  const [toId, setToId] = useState(defaultTo);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedFromAccount = accounts.find((a) => a.id === fromId);
  const selectedToAccount = accounts.find((a) => a.id === toId);

  async function handleTransfer(e: React.FormEvent) {
    e.preventDefault();
    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid amount in INR.");
      return;
    }

    if (fromId === toId) {
      setError("Source and destination accounts must be different.");
      return;
    }

    if (selectedFromAccount && numAmount > selectedFromAccount.balance) {
      setError(`Insufficient balance. ${selectedFromAccount.nickname} only has ₹${selectedFromAccount.balance.toLocaleString("en-IN")}.`);
      return;
    }

    if (numAmount > 50000) {
      setError("₹50,000 is your maximum per-transfer limit for KYC Full.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(null);

    try {
      const res = await fetch("/api/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from_account: fromId,
          to_account: toId,
          amount: numAmount,
          note: note.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Transfer failed");

      setSuccess(`Transferred ₹${numAmount.toLocaleString("en-IN")} from ${data.result.from} to ${data.result.to}!`);
      setAmount("");
      setNote("");
      onTransferSuccess();

      setTimeout(() => {
        setSuccess(null);
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Transfer failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">Transfer Funds</h3>
            <p className="text-[11px] text-neutral-400">Between your verified PayWise accounts</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {success ? (
          <div className="py-6 text-center space-y-2">
            <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
            <h4 className="text-sm font-semibold text-neutral-900">Transfer Successful</h4>
            <p className="text-xs text-neutral-500">{success}</p>
          </div>
        ) : (
          <form onSubmit={handleTransfer} className="space-y-4">
            {/* From Account */}
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 block mb-1">
                From Account
              </label>
              <select
                value={fromId}
                onChange={(e) => setFromId(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-900 outline-none focus:border-neutral-900"
              >
                {activeAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nickname} ({a.masked_number}) — ₹{a.balance.toLocaleString("en-IN")}
                  </option>
                ))}
              </select>
              {selectedFromAccount && (
                <span className="text-[11px] text-neutral-500 font-mono mt-1 block">
                  Available: ₹{selectedFromAccount.balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              )}
            </div>

            {/* To Account */}
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 block mb-1">
                To Account
              </label>
              <select
                value={toId}
                onChange={(e) => setToId(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-900 outline-none focus:border-neutral-900"
              >
                {activeAccounts
                  .filter((a) => a.id !== fromId)
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nickname} ({a.masked_number}) — ₹{a.balance.toLocaleString("en-IN")}
                    </option>
                  ))}
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 block mb-1">
                Amount (INR)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-neutral-400">
                  ₹
                </span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  min="1"
                  max="50000"
                  step="any"
                  required
                  className="w-full rounded-xl border border-neutral-200 bg-white pl-7 pr-3 py-2 text-xs text-neutral-900 outline-none focus:border-neutral-900 font-mono"
                />
              </div>
              <span className="text-[10px] text-neutral-400 font-mono mt-0.5 block">
                Max ₹50,000 per transfer
              </span>
            </div>

            {/* Note / Purpose */}
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 block mb-1">
                Note / Description (Optional)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Savings allocation"
                maxLength={80}
                className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-900 outline-none focus:border-neutral-900"
              />
            </div>

            {error && (
              <div className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50/60 p-2.5 text-xs text-red-700">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-neutral-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 disabled:opacity-50 transition-colors"
              >
                {loading ? "Processing..." : "Transfer Now"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

