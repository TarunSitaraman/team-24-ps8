import { NextResponse } from "next/server";
import { getAccounts, getCustomer } from "@/lib/bankingStore";

export const runtime = "nodejs";

export async function GET() {
  try {
    const customer = await getCustomer("B001");
    const accounts = await getAccounts("B001");
    const totalBalance = accounts
      .filter((a) => !a.is_frozen)
      .reduce((sum, a) => sum + a.balance, 0);

    return NextResponse.json({
      customer,
      accounts,
      totalBalance,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch accounts" }, { status: 500 });
  }
}

