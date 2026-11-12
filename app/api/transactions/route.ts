import { NextResponse, type NextRequest } from "next/server";
import { getTransactions } from "@/lib/bankingStore";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || undefined;
    const accountId = searchParams.get("accountId") || undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 50;

    const transactions = await getTransactions("B001", {
      category,
      accountId,
      limit,
    });

    return NextResponse.json({ transactions });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

