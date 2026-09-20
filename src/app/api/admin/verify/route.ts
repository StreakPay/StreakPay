import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPendingVerifications } from "@/services/admin";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: admin } = await supabase
      .from("admin_users")
      .select("*")
      .eq("user_id", user.id)
      .eq("active", true)
      .single();

    if (!admin) return NextResponse.json({ error: "Not an admin" }, { status: 403 });

    const pending = await getPendingVerifications();
    return NextResponse.json({ pending });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
