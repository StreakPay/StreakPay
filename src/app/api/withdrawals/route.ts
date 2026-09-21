import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requestWithdrawal, getWithdrawalHistory } from "@/services/admin/withdrawals";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { amount, bankName, accountNumber, accountName } = body;

    if (!amount || !bankName || !accountNumber || !accountName) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const withdrawal = await requestWithdrawal(
      user.id,
      amount,
      bankName,
      accountNumber,
      accountName
    );

    return NextResponse.json({ success: true, withdrawal });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const withdrawals = await getWithdrawalHistory(user.id);
    return NextResponse.json({ withdrawals });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
