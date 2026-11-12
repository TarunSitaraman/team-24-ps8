import { NextResponse } from "next/server";
import { z } from "zod";
import { listTransactions } from "@/lib/banking";
import { apiError } from "@/lib/api";
import { ALL_CATEGORIES } from "@/lib/paywise";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = z.object({
  category: z.enum(ALL_CATEGORIES).optional(),
  account_id: z.string().regex(/^A\d{3}$/).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

/** GET /api/transactions?category=food&account_id=A100&limit=50 */
export async function GET(request: Request) {
  const params = Object.fromEntries(
    [...new URL(request.url).searchParams.entries()].filter(([, v]) => v !== "")
  );
  const parsed = querySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid filter", details: parsed.error.issues }, { status: 400 });
  }
  try {
    return NextResponse.json(await listTransactions({ ...parsed.data, limit: parsed.data.limit ?? 50 }));
  } catch (err) {
    return apiError("transactions", err);
  }
}
