import { NextResponse } from "next/server";
import { placeOrder } from "@/services/trading";
import { createClient } from "@/lib/supabase/server";
import { tradeOrderSchema } from "@/validators";
import { getZodErrorMessage } from "@/lib/errors";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = tradeOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: getZodErrorMessage(parsed.error) },
        { status: 400 }
      );
    }

    const { side, quantity, price } = parsed.data;
    const order = await placeOrder(user.id, side, quantity, price);

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    console.error("Place order error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 400 }
    );
  }
}
