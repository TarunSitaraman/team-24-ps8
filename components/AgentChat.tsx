"use client";

import { useEffect, useRef, useState } from "react";
import {
  Send,
  Sparkles,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  Database,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import type { AgentResult, AgentStep } from "@/lib/agent/types";

type Message = { role: "user" | "model"; text: string; steps?: AgentStep[] };

const DEMO_PROMPTS = [
  {
    label: "Check food budget",
    prompt: "How much did I spend on food this month, and am I over my budget?",
  },
  {
    label: "Transfer ₹20k",
    prompt: "Move 20,000 from savings to my salary account.",
  },
  {
    label: "Set shopping budget",
    prompt: "Set a 4,000 rupee monthly budget for shopping and alert me at 75%.",
  },
  {
    label: "Account balances",
    prompt: "Show my accounts and balances.",
  },
];

export default function AgentChat({ onDataChanged }: { onDataChanged?: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const next: Message[] = [...messages, { role: "user", text: trimmed }];
    setMessages(next);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.slice(-20).map(({ role, text }) => ({ role, text })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Agent request failed");
      const result = data as AgentResult;

      setMessages([...next, { role: "model", text: result.reply, steps: result.steps }]);

      // If any tool performed a write action, notify parent component to refresh views
      if (result.steps && result.steps.some((s) => s.writes && s.ok)) {
        onDataChanged?.();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  return (
    <div className="flex h-[78vh] flex-col rounded-2xl border border-neutral-200/90 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
      {/* Chat Header */}
      <div className="flex items-center justify-between border-b border-neutral-200/80 px-5 py-3.5 bg-neutral-50/50">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-900 text-white">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-neutral-900 leading-tight">PayWise Assistant</h2>
            <p className="text-[11px] text-neutral-400">Gemini Function Calling • Natural Language Banking</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-mono text-neutral-500">Live Agent</span>
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              title="Reset conversation"
              className="ml-2 rounded p-1 text-neutral-400 hover:text-neutral-700"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
        {messages.length === 0 && (
          <div className="flex h-full flex-col justify-center items-center text-center px-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-800 mb-3">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-semibold text-neutral-900">How can I assist your finances today?</h3>
            <p className="mt-1 max-w-sm text-xs text-neutral-400">
              Ask in plain English. I can inspect balances, trace category spends, move money between your accounts,
              and manage budget limits.
            </p>

            <div className="mt-6 w-full max-w-md space-y-2">
              <p className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 text-left">
                Suggested Prompts
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {DEMO_PROMPTS.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => send(item.prompt)}
                    className="flex flex-col items-start rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-2.5 text-left text-xs transition-all hover:border-neutral-400 hover:bg-white"
                  >
                    <span className="font-semibold text-neutral-800">{item.label}</span>
                    <span className="mt-0.5 text-[11px] text-neutral-500 line-clamp-1">{item.prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((m, idx) => (
          <div key={idx} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div className={m.role === "user" ? "max-w-[85%]" : "max-w-[90%] space-y-2 w-full"}>
              {/* Tool Execution Steps Pill (if any) */}
              {m.steps && m.steps.length > 0 && <ToolStepsTrace steps={m.steps} />}

              {/* Message Content Bubble */}
              <div
                className={`rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-neutral-900 text-white font-medium shadow-sm"
                    : "border border-neutral-200/80 bg-white text-neutral-800 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
                }`}
              >
                <div className="whitespace-pre-wrap">{m.text}</div>
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono py-2">
            <span className="h-1.5 w-1.5 rounded-full bg-neutral-400 animate-pulse"></span>
            <span className="h-1.5 w-1.5 rounded-full bg-neutral-400 animate-pulse delay-75"></span>
            <span className="h-1.5 w-1.5 rounded-full bg-neutral-400 animate-pulse delay-150"></span>
            <span>Agent analyzing and executing tools...</span>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50/60 p-3 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input Form */}
      <div className="border-t border-neutral-200/80 bg-neutral-50/50 p-3 sm:p-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            placeholder="Ask anything (e.g. 'How much did I spend on food this month?')"
            className="flex-1 rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-900 transition-colors"
          />
          <button
            onClick={() => send(input)}
            disabled={loading || !input.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 text-white disabled:opacity-30 hover:bg-neutral-800 transition-all shrink-0"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/** Component for rendering Tool executions cleanly with expandable JSON inspection */
function ToolStepsTrace({ steps }: { steps: AgentStep[] }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/60 p-2.5 text-xs text-neutral-700">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between font-mono text-[11px] text-neutral-600 hover:text-neutral-900"
      >
        <div className="flex items-center gap-1.5 flex-wrap">
          <Database className="h-3 w-3 text-neutral-500" />
          <span className="font-semibold text-neutral-700">Tool Calls ({steps.length}):</span>
          {steps.map((s, idx) => (
            <span
              key={idx}
              className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] ${
                s.ok
                  ? s.writes
                    ? "bg-emerald-100 text-emerald-800 font-medium"
                    : "bg-neutral-200/70 text-neutral-700"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {s.ok ? <CheckCircle2 className="h-2.5 w-2.5" /> : <AlertCircle className="h-2.5 w-2.5" />}
              {s.tool}
              {s.writes && <span className="text-[9px] uppercase tracking-wider text-emerald-700">• write</span>}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-1 text-neutral-400">
          <span>{expanded ? "Hide" : "Inspect"}</span>
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </div>
      </button>

      {expanded && (
        <div className="mt-2.5 space-y-2 border-t border-neutral-200/60 pt-2 font-mono text-[11px]">
          {steps.map((step, i) => (
            <div key={i} className="rounded-lg bg-white p-2 border border-neutral-200/60">
              <div className="flex items-center justify-between text-neutral-800 font-semibold mb-1">
                <span>{step.tool}</span>
                <span className={step.ok ? "text-emerald-600" : "text-red-600"}>
                  {step.ok ? "SUCCESS" : "ERROR"}
                </span>
              </div>
              <div className="text-[10px] text-neutral-500">
                <strong>Arguments:</strong> {JSON.stringify(step.args)}
              </div>
              {step.ok ? (
                <div className="mt-1 text-[10px] text-neutral-600 overflow-x-auto max-h-24">
                  <strong>Output:</strong> {JSON.stringify(step.result)}
                </div>
              ) : (
                <div className="mt-1 text-[10px] text-red-600">
                  <strong>Error:</strong> {step.error}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
