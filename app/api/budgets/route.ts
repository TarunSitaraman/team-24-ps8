import { NextResponse } from "next/server";
import { budgetStatus } from "@/lib/banking";
import { apiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/budgets -> each budget with this month's spend and status (ok, alert, over) */
export async function GET() {
  try {
    return NextResponse.json({ budgets: await budgetStatus() });
  } catch (err) {
    return apiError("budgets", err);
  }
}
