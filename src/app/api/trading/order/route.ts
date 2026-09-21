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

    if (!order) {
      return NextResponse.json(
        { error: "Failed to place order" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, order });
  } catch (error: unknown) {
    console.error("Place order error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    const isUserError = message.includes("Insufficient") || message.includes("Invalid") || message.includes("not found");
    return NextResponse.json(
      { error: message },
      { status: isUserError ? 400 : 500 }
    );
  }
}
