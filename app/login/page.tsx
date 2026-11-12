"use client";

import { useState } from "react";
import { Sparkles, ArrowRight, ShieldCheck, Lock } from "lucide-react";

export default function LoginPage() {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e?: React.FormEvent, customPass?: string) {
    if (e) e.preventDefault();
    const passToSubmit = customPass || passcode;
    if (!passToSubmit) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: passToSubmit }),
      });

      if (res.ok) {
        window.location.href = "/";
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Invalid passcode");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleQuickDemoLogin() {
    setPasscode("paywise2026");
    handleSubmit(undefined, "paywise2026");
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4 bg-[#fafafa]">
      <div className="w-full max-w-sm rounded-3xl border border-neutral-200/90 bg-white p-7 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-6">
        {/* Brand */}
        <div className="space-y-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 text-white font-mono text-sm font-semibold mb-3">
            PW
          </div>
          <h1 className="text-lg font-semibold text-neutral-900 tracking-tight">PayWise Banking</h1>
          <p className="text-xs text-neutral-500">Autonomous Banking Assistant & Budget Controller</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 block mb-1.5">
              Enter Passcode
            </label>
            <div className="relative">
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Team passcode"
                autoFocus
                className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-xs text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-900 font-mono transition-colors"
              />
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
            </div>
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading || !passcode}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-neutral-900 py-2.5 text-xs font-medium text-white hover:bg-neutral-800 disabled:opacity-40 transition-colors"
          >
            <span>{loading ? "Authenticating..." : "Access Dashboard"}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </form>

        {/* Demo Fast Login */}
        <div className="border-t border-neutral-100 pt-4 text-center">
          <button
            type="button"
            onClick={handleQuickDemoLogin}
            disabled={loading}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            <Sparkles className="h-3 w-3 text-amber-500" />
            <span>One-click Demo Access (paywise2026)</span>
          </button>
        </div>
      </div>
    </main>
  );
}
