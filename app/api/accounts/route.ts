import { NextResponse } from "next/server";
import { listAccounts } from "@/lib/banking";
import { apiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/accounts -> accounts, balances and transfer limits of the logged-in customer */
export async function GET() {
  try {
    return NextResponse.json(await listAccounts());
  } catch (err) {
    return apiError("accounts", err);
  }
}
