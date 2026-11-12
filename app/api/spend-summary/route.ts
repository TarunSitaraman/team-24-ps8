import { NextResponse } from "next/server";
import { z } from "zod";
import { spendSummary } from "@/lib/banking";
import { apiError } from "@/lib/api";
import { monthRange } from "@/lib/paywise";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = z.object({
  period: z.enum(["this_month", "last_month"]).default("this_month"),
});

/** GET /api/spend-summary?period=this_month|last_month -> spending by category */
export async function GET(request: Request) {
  const period = new URL(request.url).searchParams.get("period") || undefined;
  const parsed = querySchema.safeParse({ period });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid period", details: parsed.error.issues }, { status: 400 });
  }
  try {
    const range = monthRange(parsed.data.period);
    const summary = await spendSummary(range.from, range.toExclusive);
    return NextResponse.json({ label: range.label, ...summary });
  } catch (err) {
    return apiError("spend-summary", err);
  }
}
