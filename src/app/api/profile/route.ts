import { NextResponse } from "next/server";
import { updateProfileSchema } from "@/validators/auth";
import { createClient } from "@/lib/supabase/server";
import { getZodErrorMessage } from "@/lib/errors";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    const { data: streak } = await supabase
      .from("streaks")
      .select("current_streak, longest_streak")
      .eq("user_id", user.id)
      .single();

    const { data: wallet } = await supabase
      .from("wallets")
      .select("balance, currency")
      .eq("user_id", user.id)
      .eq("currency", "NGN")
      .single();

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.created_at,
      },
      profile: profile || null,
      streak: streak || null,
      wallet: wallet ? { balance: Number(wallet.balance), currency: wallet.currency } : null,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: getZodErrorMessage(parsed.error) },
        { status: 400 }
      );
    }

    const { full_name, tiktok_username, snapchat_username } = parsed.data as Record<string, string>;
    const updateData: Record<string, string> = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (tiktok_username !== undefined) updateData.tiktok_username = tiktok_username;
    if (snapchat_username !== undefined) updateData.snapchat_username = snapchat_username;

    const { data: updatedProfile, error: updateError } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", user.id)
      .select("full_name, tiktok_username, snapchat_username")
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
