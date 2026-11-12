"use client";

import { useState } from "react";
import { ArrowLeftRight, LogOut, ShieldCheck, Wallet } from "lucide-react";

interface NavbarProps {
  activeTab: "overview" | "accounts" | "transactions" | "budgets";
  onTabChange: (tab: "overview" | "accounts" | "transactions" | "budgets") => void;
  totalBalance: number;
  onOpenTransfer: () => void;
}

export default function Navbar({
  activeTab,
  onTabChange,
  totalBalance,
  onOpenTransfer,
}: NavbarProps) {
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-200/80 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand & User identity */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 text-white font-mono text-sm font-semibold tracking-wider">
              PW
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-neutral-900 tracking-tight text-base">PayWise</span>
                <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-mono text-neutral-500 uppercase">
                  v2.5
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">Minimalist Banking</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 rounded-lg border border-neutral-200/70 bg-neutral-50/70 p-1">
            <button
              onClick={() => onTabChange("overview")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                activeTab === "overview"
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              Overview & Agent
            </button>
            <button
              onClick={() => onTabChange("accounts")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                activeTab === "accounts"
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              Accounts
            </button>
            <button
              onClick={() => onTabChange("transactions")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                activeTab === "transactions"
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              Transactions
            </button>
            <button
              onClick={() => onTabChange("budgets")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                activeTab === "budgets"
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              Budgets
            </button>
          </nav>
        </div>

        {/* Right Actions & Balance */}
        <div className="flex items-center gap-3">
          {/* Total Balance Pill */}
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-neutral-200/80 bg-neutral-50/80 px-3 py-1.5">
            <Wallet className="h-3.5 w-3.5 text-neutral-400" />
            <div className="text-left">
              <span className="text-[10px] uppercase tracking-wider text-neutral-400 block leading-none">
                Active Balance
              </span>
              <span className="font-mono text-xs font-semibold text-neutral-900 leading-none">
                ₹{totalBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Quick Transfer Button */}
          <button
            onClick={onOpenTransfer}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-900 bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-neutral-800"
          >
            <ArrowLeftRight className="h-3.5 w-3.5" />
            <span>Transfer</span>
          </button>

          {/* User Profile Pill */}
          <div className="hidden lg:flex items-center gap-2 border-l border-neutral-200 pl-3">
            <div className="text-right">
              <p className="text-xs font-medium text-neutral-900 leading-none">Rohan Iyer</p>
              <div className="flex items-center justify-end gap-1 text-[10px] text-emerald-600 mt-0.5">
                <ShieldCheck className="h-3 w-3" />
                <span>KYC Full</span>
              </div>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            title="Log out"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 hover:border-neutral-300 hover:text-neutral-800 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Mobile Sub-navigation */}
      <div className="flex md:hidden border-t border-neutral-100 px-4 py-2 bg-neutral-50/50 justify-between overflow-x-auto text-xs">
        <button
          onClick={() => onTabChange("overview")}
          className={`px-2 py-1 font-medium ${
            activeTab === "overview" ? "text-neutral-900 underline underline-offset-4" : "text-neutral-500"
          }`}
        >
          Agent
        </button>
        <button
          onClick={() => onTabChange("accounts")}
          className={`px-2 py-1 font-medium ${
            activeTab === "accounts" ? "text-neutral-900 underline underline-offset-4" : "text-neutral-500"
          }`}
        >
          Accounts
        </button>
        <button
          onClick={() => onTabChange("transactions")}
          className={`px-2 py-1 font-medium ${
            activeTab === "transactions" ? "text-neutral-900 underline underline-offset-4" : "text-neutral-500"
          }`}
        >
          Transactions
        </button>
        <button
          onClick={() => onTabChange("budgets")}
          className={`px-2 py-1 font-medium ${
            activeTab === "budgets" ? "text-neutral-900 underline underline-offset-4" : "text-neutral-500"
          }`}
        >
          Budgets
        </button>
      </div>
    </header>
  );
}

