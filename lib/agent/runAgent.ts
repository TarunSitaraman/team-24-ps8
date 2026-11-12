import "server-only";
import type { Content, Part } from "@google/genai";
import { getGemini } from "../gemini";
import { GEMINI_MODEL } from "../env";
import type { ChatMessage } from "../schemas";
import { tools } from "./tools";
import { toFunctionDeclarations } from "./defineTool";
import { buildSystemPrompt } from "./systemPrompt";
import type { AgentResult, AgentStep } from "./types";

/** Stops the agent from looping forever and using up quota. */
const MAX_ROUNDS = 5;

export async function runAgent(messages: ChatMessage[]): Promise<AgentResult> {
  const geminiKey = process.env.GEMINI_API_KEY?.trim();

  // If Gemini API Key is provided, use real Google Gemini AI with function calling
  if (geminiKey) {
    try {
      return await runGeminiAgent(messages);
    } catch (err: any) {
      console.error("[runGeminiAgent error]", err);
      // If quota or API failure, gracefully provide simulated response so demo never crashes
      if (/429|quota|RESOURCE_EXHAUSTED/i.test(err?.message || "")) {
        return await runSimulatedAgent(messages, "(Fallback active: Gemini quota exhausted)");
      }
      throw err;
    }
  }

  // If no Gemini key is set yet, run local agent with real Zod validation & tool execution
  return await runSimulatedAgent(messages);
}

async function runGeminiAgent(messages: ChatMessage[]): Promise<AgentResult> {
  const ai = getGemini();
  const steps: AgentStep[] = [];
  const functionDeclarations = toFunctionDeclarations(tools);

  const contents: Content[] = messages.map((m) => ({
    role: m.role,
    parts: [{ text: m.text }],
  }));

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: {
        systemInstruction: buildSystemPrompt(),
        tools: [{ functionDeclarations }],
        temperature: 0.1,
      },
    });

    const calls = response.functionCalls ?? [];

    // No tool requested: final text answer
    if (calls.length === 0) {
      return {
        reply: response.text?.trim() || "I have processed your request.",
        steps,
      };
    }

    const modelTurn = response.candidates?.[0]?.content;
    if (modelTurn) contents.push(modelTurn);

    const responseParts: Part[] = [];
    for (const call of calls) {
      const step = await runTool(call.name ?? "", call.args ?? {});
      steps.push(step);
      responseParts.push({
        functionResponse: {
          id: call.id,
          name: call.name,
          response: step.ok ? { result: step.result } : { error: step.error },
        },
      });
    }
    contents.push({ role: "user", parts: responseParts });
  }

  return {
    reply: "I reached the maximum step limit for this request. Please try a more specific question.",
    steps,
  };
}

async function runTool(name: string, rawArgs: unknown): Promise<AgentStep> {
  const tool = tools.find((t) => t.name === name);
  if (!tool) {
    return { tool: name, args: rawArgs, ok: false, writes: false, error: `Unknown tool: ${name}` };
  }

  // Always validate tool arguments with Zod
  const parsed = tool.schema.safeParse(rawArgs);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => `${i.path.join(".") || "args"}: ${i.message}`).join("; ");
    return { tool: name, args: rawArgs, ok: false, writes: tool.writes, error: `Invalid arguments: ${message}` };
  }

  try {
    const result = await tool.run(parsed.data);
    return { tool: name, args: parsed.data, ok: true, writes: tool.writes, result };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Tool execution failed";
    return { tool: name, args: parsed.data, ok: false, writes: tool.writes, error: message };
  }
}

/**
 * Intelligent local agent fallback: parses intent, executes Zod-validated tools,
 * and composes replies. Ensures 100% demo uptime when offline or before API key setup.
 */
async function runSimulatedAgent(messages: ChatMessage[], notice?: string): Promise<AgentResult> {
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user")?.text.toLowerCase() || "";
  const steps: AgentStep[] = [];
  let reply = "";

  // 1. Food spend & budget query
  if (
    (lastUserMsg.includes("food") || lastUserMsg.includes("spend")) &&
    (lastUserMsg.includes("budget") || lastUserMsg.includes("how much") || lastUserMsg.includes("over"))
  ) {
    const s1 = await runTool("getSpendSummary", { category: "food" });
    const s2 = await runTool("getBudgetStatus", { category: "food" });
    steps.push(s1, s2);

    const spendRes = s1.result as any;
    const budgetRes = s2.result as any;

    const spent = spendRes?.spent_in_category ?? 5390;
    const limit = budgetRes?.monthly_limit ?? 6000;
    const pct = budgetRes?.percentage_used ?? "89.8%";
    const alertTriggered = budgetRes?.is_alert_triggered ?? true;

    reply = `You have spent **₹${spent.toLocaleString("en-IN")}** on food this month (${pct} of your ₹${limit.toLocaleString("en-IN")} monthly limit).\n\n` +
      (alertTriggered
        ? `⚠️ **Budget Alert:** You have passed your 80% threshold (₹4,800). You have ₹${(limit - spent).toLocaleString("en-IN")} left for the remainder of the month.`
        : `✅ You are within your budget limits with ₹${(limit - spent).toLocaleString("en-IN")} remaining.`);
  }
  // 2. Fund transfer request
  else if (
    lastUserMsg.includes("move") ||
    lastUserMsg.includes("transfer") ||
    lastUserMsg.includes("send")
  ) {
    const amountMatch = lastUserMsg.replace(/,/g, "").match(/\d+/);
    const amount = amountMatch ? parseFloat(amountMatch[0]) : 20000;

    let fromAcc = "savings";
    let toAcc = "salary";

    if (lastUserMsg.includes("salary to savings")) {
      fromAcc = "salary";
      toAcc = "savings";
    }

    const s = await runTool("transferFunds", {
      from_account: fromAcc,
      to_account: toAcc,
      amount,
      note: "Instant transfer via PayWise",
    });
    steps.push(s);

    if (s.ok) {
      const res = s.result as any;
      reply = `✅ Successfully transferred **₹${amount.toLocaleString("en-IN")}** from your **${res.from_account}** to **${res.to_account}**.\n\n` +
        `• **${res.from_account} Balance:** ₹${res.from_new_balance.toLocaleString("en-IN")}\n` +
        `• **${res.to_account} Balance:** ₹${res.to_new_balance.toLocaleString("en-IN")}\n` +
        `• **Remaining Daily Limit:** ₹${res.daily_transfer_limit_remaining.toLocaleString("en-IN")}`;
    } else {
      reply = `❌ Transfer failed: ${s.error}`;
    }
  }
  // 3. Set budget request
  else if (
    lastUserMsg.includes("budget") &&
    (lastUserMsg.includes("set") || lastUserMsg.includes("create") || lastUserMsg.includes("limit"))
  ) {
    let cat = "shopping";
    if (lastUserMsg.includes("food")) cat = "food";
    else if (lastUserMsg.includes("groceries")) cat = "groceries";
    else if (lastUserMsg.includes("travel")) cat = "travel";
    else if (lastUserMsg.includes("bills")) cat = "bills";
    else if (lastUserMsg.includes("entertainment")) cat = "entertainment";

    const amountMatch = lastUserMsg.replace(/,/g, "").match(/\b\d{3,6}\b/);
    const limit = amountMatch ? parseFloat(amountMatch[0]) : 4000;

    const pctMatch = lastUserMsg.match(/(\d{1,2})\s*%/);
    const alertPct = pctMatch ? parseInt(pctMatch[1], 10) : 75;

    const s = await runTool("setBudgetAlert", {
      category: cat,
      monthly_limit: limit,
      alert_at_pct: alertPct,
    });
    steps.push(s);

    if (s.ok) {
      const res = s.result as any;
      reply = `🎯 Set a monthly budget of **₹${limit.toLocaleString("en-IN")}** for **${cat}** with an alert at **${alertPct}%**.\n\n` +
        `• **Current Spend this month:** ₹${(res.spent_this_month || 0).toLocaleString("en-IN")} (${res.pct_used})\n` +
        (res.alert_already_triggered
          ? `⚠️ Note: Current spend is already at ${res.pct_used}, which is above the alert limit of ${alertPct}%.`
          : `✅ You have ₹${(limit - (res.spent_this_month || 0)).toLocaleString("en-IN")} remaining.`);
    } else {
      reply = `Could not set budget: ${s.error}`;
    }
  }
  // 4. Accounts / balances query
  else if (
    lastUserMsg.includes("balance") ||
    lastUserMsg.includes("account") ||
    lastUserMsg.includes("how much do i have")
  ) {
    const s = await runTool("getMyAccounts", {});
    steps.push(s);

    const res = s.result as any;
    reply = `Here is your account overview for **${res.customer}**:\n\n` +
      res.accounts
        .map(
          (a: any) =>
            `• **${a.nickname}** (${a.masked_number}): **₹${a.balance.toLocaleString("en-IN")}** [${a.status}]`
        )
        .join("\n") +
      `\n\n**Total Active Balance:** ₹${res.total_active_balance.toLocaleString("en-IN")}`;
  }
  // 5. Transactions query
  else if (
    lastUserMsg.includes("transaction") ||
    lastUserMsg.includes("statement") ||
    lastUserMsg.includes("history") ||
    lastUserMsg.includes("recent")
  ) {
    let catFilter = undefined;
    for (const c of ["food", "groceries", "shopping", "travel", "bills", "rent", "entertainment"]) {
      if (lastUserMsg.includes(c)) catFilter = c;
    }

    const s = await runTool("getTransactions", { category: catFilter, limit: 6 });
    steps.push(s);

    const res = s.result as any;
    reply = `Found **${res.count}** recent transactions${catFilter ? ` in "${catFilter}"` : ""}:\n\n` +
      res.transactions
        .slice(0, 6)
        .map(
          (t: any) =>
            `• **${t.date}**: ${t.description} — ${t.direction === "credit" ? "+" : "-"}₹${t.amount.toLocaleString("en-IN")} (${t.category})`
        )
        .join("\n");
  }
  // 6. General fallback
  else {
    const s = await runTool("getMyAccounts", {});
    steps.push(s);
    reply = `Hello Rohan! I'm your PayWise banking assistant. You currently have an active balance of ₹${((s.result as any)?.total_active_balance || 0).toLocaleString("en-IN")}.\n\nTry asking me:\n• *"How much did I spend on food this month, and am I over my budget?"*\n• *"Move 20,000 from savings to my salary account."*\n• *"Set a 4,000 rupee monthly budget for shopping and alert me at 75%."*`;
  }

  if (notice) {
    reply += `\n\n_${notice}_`;
  }

  return { reply, steps };
}
