import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

    const { data: users, error: usersError } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (usersError) throw usersError;

    return NextResponse.json({ users, adminRole: admin.role });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
