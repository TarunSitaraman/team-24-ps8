"use client";

import { CreditCard, Lock, ShieldCheck, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import type { Account } from "@/lib/bankingStore";

interface AccountCardsProps {
  accounts: Account[];
  onTransferClick: (account?: Account) => void;
}

export default function AccountCards({ accounts, onTransferClick }: AccountCardsProps) {
  const activeAccounts = accounts.filter((a) => !a.is_frozen);
  const frozenAccounts = accounts.filter((a) => a.is_frozen);

  return (
    <div className="space-y-6">
      {/* Portfolio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-neutral-900 tracking-tight">Your Accounts</h2>
          <p className="text-xs text-neutral-500">
            {activeAccounts.length} active account{activeAccounts.length === 1 ? "" : "s"} • {frozenAccounts.length} restricted
          </p>
        </div>

        {/* KYC & Limits pill */}
        <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-500 bg-neutral-100/70 border border-neutral-200/60 rounded-lg px-3 py-1.5 self-start sm:self-auto">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>KYC Full: ₹50k/txn • ₹100k daily</span>
        </div>
      </div>

      {/* Grid of Accounts */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map((acc) => {
          const isFrozen = acc.is_frozen;

          return (
            <div
              key={acc.id}
              className={`relative flex flex-col justify-between rounded-2xl border p-5 transition-all ${
                isFrozen
                  ? "border-neutral-200 bg-neutral-100/40 opacity-80"
                  : "border-neutral-200/90 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-neutral-300"
              }`}
            >
              <div>
                {/* Top row: Type & Status */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                        isFrozen ? "bg-neutral-200 text-neutral-500" : "bg-neutral-900 text-white"
                      }`}
                    >
                      {isFrozen ? <Lock className="h-3.5 w-3.5" /> : <CreditCard className="h-3.5 w-3.5" />}
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-neutral-900 leading-tight">
                        {acc.nickname}
                      </h3>
                      <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-400">
                        {acc.account_type}
                      </span>
                    </div>
                  </div>

                  {isFrozen ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
                      Frozen
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                      Active
                    </span>
                  )}
                </div>

                {/* Masked Account Number */}
                <div className="mb-4">
                  <span className="text-[11px] font-mono tracking-widest text-neutral-500">
                    {acc.masked_number}
                  </span>
                </div>

                {/* Account Balance */}
                <div className="mt-2">
                  <span className="text-[10px] uppercase tracking-wider text-neutral-400 block font-mono">
                    Available Balance
                  </span>
                  <p className="text-xl sm:text-2xl font-semibold tracking-tight text-neutral-900 font-mono mt-0.5">
                    ₹{acc.balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* Bottom Card Action */}
              <div className="mt-5 pt-3 border-t border-neutral-100 flex items-center justify-between">
                <span className="text-[10px] text-neutral-400 font-mono">ID: {acc.id}</span>
                {isFrozen ? (
                  <span className="text-[11px] text-neutral-400 italic">Branch assistance needed</span>
                ) : (
                  <button
                    onClick={() => onTransferClick(acc)}
                    className="flex items-center gap-1 text-xs font-medium text-neutral-900 hover:text-neutral-600 transition-colors"
                  >
                    <span>Transfer funds</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Security & KYC Info Card */}
      <div className="rounded-2xl border border-neutral-200/70 bg-neutral-50/50 p-4 sm:p-5 text-xs text-neutral-600">
        <h4 className="font-semibold text-neutral-900 mb-1 flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          Banking Protection & Limits
        </h4>
        <p className="text-neutral-500 leading-relaxed">
          Fund transfers are restricted strictly between your own verified accounts. Transfers cannot be made
          from or to frozen accounts. For security, full account numbers and authentication credentials are
          never requested or stored.
        </p>
      </div>
    </div>
  );
}

