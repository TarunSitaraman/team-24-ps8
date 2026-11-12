"use client";

import { useEffect, useState, useCallback } from "react";
import Navbar from "@/components/Navbar";
import AlertBanner from "@/components/AlertBanner";
import AgentChat from "@/components/AgentChat";
import OverviewPanel from "@/components/OverviewPanel";
import AccountCards from "@/components/AccountCards";
import TransactionLedger from "@/components/TransactionLedger";
import BudgetManager from "@/components/BudgetManager";
import TransferModal from "@/components/TransferModal";
import type { Account, Budget, Transaction } from "@/lib/bankingStore";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"overview" | "accounts" | "transactions" | "budgets">(
    "overview"
  );
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [spendSummary, setSpendSummary] = useState<any>(null);
  const [totalBalance, setTotalBalance] = useState<number>(0);

  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedTransferAccount, setSelectedTransferAccount] = useState<Account | null>(null);

  const [loading, setLoading] = useState(true);

  // Load all banking data
  const fetchData = useCallback(async () => {
    try {
      const [accRes, txnRes, budRes, spRes] = await Promise.all([
        fetch("/api/accounts").then((r) => r.json()),
        fetch("/api/transactions?limit=100").then((r) => r.json()),
        fetch("/api/budgets").then((r) => r.json()),
        fetch("/api/spend-summary").then((r) => r.json()),
      ]);

      if (accRes.accounts) {
        setAccounts(accRes.accounts);
        setTotalBalance(accRes.totalBalance || 0);
      }
      if (txnRes.transactions) {
        setTransactions(txnRes.transactions);
      }
      if (budRes.budgets) {
        setBudgets(budRes.budgets);
      }
      if (spRes) {
        setSpendSummary(spRes);
      }
    } catch (err) {
      console.error("Failed to load banking data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleOpenTransfer(acc?: Account) {
    setSelectedTransferAccount(acc || null);
    setTransferModalOpen(true);
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa]">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        totalBalance={totalBalance}
        onOpenTransfer={() => handleOpenTransfer()}
      />

      {/* Proactive Budget Alert Notification */}
      <AlertBanner budgets={budgets} onViewBudgets={() => setActiveTab("budgets")} />

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        {loading ? (
          <div className="flex h-64 items-center justify-center font-mono text-xs text-neutral-400">
            <span className="animate-pulse">Loading banking portfolio...</span>
          </div>
        ) : (
          <>
            {/* TAB 1: OVERVIEW & AI AGENT */}
            {activeTab === "overview" && (
              <div className="grid gap-6 lg:grid-cols-12 items-start">
                {/* Agent Chat Column */}
                <div className="lg:col-span-7 xl:col-span-8">
                  <AgentChat onDataChanged={fetchData} />
                </div>

                {/* Live Banking Snapshot Column */}
                <div className="lg:col-span-5 xl:col-span-4">
                  <OverviewPanel
                    accounts={accounts}
                    budgets={budgets}
                    recentTransactions={transactions}
                    totalBalance={totalBalance}
                    spendSummary={spendSummary}
                    onOpenTransfer={() => handleOpenTransfer()}
                    onNavigateTab={setActiveTab}
                  />
                </div>
              </div>
            )}

            {/* TAB 2: ACCOUNTS */}
            {activeTab === "accounts" && (
              <AccountCards
                accounts={accounts}
                onTransferClick={(acc) => handleOpenTransfer(acc)}
              />
            )}

            {/* TAB 3: TRANSACTIONS */}
            {activeTab === "transactions" && (
              <TransactionLedger transactions={transactions} />
            )}

            {/* TAB 4: BUDGETS */}
            {activeTab === "budgets" && (
              <BudgetManager
                budgets={budgets}
                categoryBreakdown={spendSummary?.categoryBreakdown}
                totalSpentThisMonth={spendSummary?.totalSpentThisMonth}
                onBudgetUpdated={fetchData}
              />
            )}
          </>
        )}
      </main>

      {/* Transfer Modal / Drawer */}
      <TransferModal
        isOpen={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        accounts={accounts}
        initialFromAccount={selectedTransferAccount}
        onTransferSuccess={fetchData}
      />
    </div>
  );
}
