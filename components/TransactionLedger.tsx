"use client";

import { useMemo, useState } from "react";
import { Search, Filter, ArrowDownLeft, ArrowUpRight, Calendar } from "lucide-react";
import type { Transaction } from "@/lib/bankingStore";

const CATEGORIES = [
  "all",
  "food",
  "groceries",
  "shopping",
  "travel",
  "bills",
  "rent",
  "entertainment",
  "health",
  "salary",
  "transfer",
];

interface TransactionLedgerProps {
  transactions: Transaction[];
}

export default function TransactionLedger({ transactions }: TransactionLedgerProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDirection, setSelectedDirection] = useState<"all" | "debit" | "credit">("all");

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const matchCat =
        selectedCategory === "all" ||
        t.category.toLowerCase() === selectedCategory.toLowerCase();

      const matchDir =
        selectedDirection === "all" || t.direction === selectedDirection;

      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.amount.toString().includes(q) ||
        (t.account_nickname && t.account_nickname.toLowerCase().includes(q));

      return matchCat && matchDir && matchSearch;
    });
  }, [transactions, selectedCategory, selectedDirection, search]);

  const stats = useMemo(() => {
    let inflow = 0;
    let outflow = 0;
    for (const t of filtered) {
      if (t.direction === "credit") inflow += t.amount;
      if (t.direction === "debit") outflow += t.amount;
    }
    return { inflow, outflow, net: inflow - outflow };
  }, [filtered]);

  return (
    <div className="space-y-5">
      {/* Top Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-neutral-900 tracking-tight">Transactions</h2>
          <p className="text-xs text-neutral-500">
            {filtered.length} of {transactions.length} records shown
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transactions..."
            className="w-full rounded-xl border border-neutral-200/90 bg-white pl-9 pr-3 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-900"
          />
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-3 gap-3 rounded-2xl border border-neutral-200/70 bg-white p-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block">Total Credits</span>
          <span className="text-sm font-semibold font-mono text-emerald-700">
            +₹{stats.inflow.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block">Total Debits</span>
          <span className="text-sm font-semibold font-mono text-neutral-800">
            -₹{stats.outflow.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block">Net Flow</span>
          <span
            className={`text-sm font-semibold font-mono ${
              stats.net >= 0 ? "text-emerald-700" : "text-amber-800"
            }`}
          >
            {stats.net >= 0 ? "+" : ""}₹{stats.net.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`rounded-full px-3 py-1 font-medium capitalize whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? "bg-neutral-900 text-white"
                : "border border-neutral-200/80 bg-white text-neutral-600 hover:border-neutral-400"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Transactions List */}
      <div className="rounded-2xl border border-neutral-200/90 bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-neutral-400">
            No transactions found matching your criteria.
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {filtered.map((item) => {
              const isCredit = item.direction === "credit";
              const dateFormatted = new Date(item.txn_date).toLocaleDateString("en-IN", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-4 py-3 sm:px-5 sm:py-3.5 hover:bg-neutral-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-xl shrink-0 ${
                        isCredit
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
                          : "bg-neutral-100 text-neutral-700"
                      }`}
                    >
                      {isCredit ? (
                        <ArrowDownLeft className="h-4 w-4" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-neutral-900 truncate leading-snug">
                        {item.description}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-neutral-400 flex-wrap">
                        <span className="font-mono">{dateFormatted}</span>
                        <span>•</span>
                        <span className="capitalize">{item.account_nickname || item.account_id}</span>
                        <span>•</span>
                        <span className="rounded bg-neutral-100 px-1.5 py-0.2 text-[10px] text-neutral-600 capitalize">
                          {item.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 pl-3">
                    <p
                      className={`font-mono text-xs sm:text-sm font-semibold ${
                        isCredit ? "text-emerald-700" : "text-neutral-900"
                      }`}
                    >
                      {isCredit ? "+" : "-"}₹{item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </p>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                      {item.direction}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

