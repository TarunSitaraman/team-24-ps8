import { NextResponse } from "next/server";
import { transferFunds, getAccounts } from "@/lib/bankingStore";
import { transferRequestSchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = transferRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid transfer details", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { from_account, to_account, amount, note } = parsed.data;
    const result = await transferFunds("B001", from_account, to_account, amount, note);
    const accounts = await getAccounts("B001");

    return NextResponse.json({ ok: true, result, accounts });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Transfer failed" },
      { status: 400 }
    );
  }
}

