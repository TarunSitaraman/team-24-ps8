import { NextResponse } from "next/server";
import { getBudgets, setBudget } from "@/lib/bankingStore";
import { budgetRequestSchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function GET() {
  try {
    const budgets = await getBudgets("B001");
    return NextResponse.json({ budgets });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch budgets" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = budgetRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { category, monthly_limit, alert_at_pct } = parsed.data;
    const result = await setBudget("B001", category, monthly_limit, alert_at_pct);
    const budgets = await getBudgets("B001");

    return NextResponse.json({ ok: true, budget: result, budgets });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to set budget" }, { status: 500 });
  }
}

