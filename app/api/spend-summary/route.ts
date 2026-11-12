import { NextResponse } from "next/server";
import { getSpendSummary } from "@/lib/bankingStore";

export const runtime = "nodejs";

export async function GET() {
  try {
    const summary = await getSpendSummary("B001");
    return NextResponse.json(summary);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch spend summary" },
      { status: 500 }
    );
  }
}

