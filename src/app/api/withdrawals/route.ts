import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { requestWithdrawal, getWithdrawalHistory } from "@/services/admin/withdrawals";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { amount, bankName, accountNumber, accountName } = body;

    if (!amount || !bankName || !accountNumber || !accountName) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const withdrawal = await requestWithdrawal(
      session.user.id,
      amount,
      bankName,
      accountNumber,
      accountName
    );

    return NextResponse.json({ success: true, withdrawal });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const withdrawals = await getWithdrawalHistory(session.user.id);
    return NextResponse.json({ withdrawals });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
