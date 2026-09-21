import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getConversations, getMessages, markAsRead } from "@/services/chat";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");

    if (conversationId) {
      const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
      const before = searchParams.get("before") || undefined;

      const messages = await getMessages(user.id, conversationId, limit, before);
      return NextResponse.json({ messages });
    }

    const conversations = await getConversations(user.id);
    return NextResponse.json({ conversations });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("Chat GET error:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, conversationId } = body;

    if (action === "markRead") {
      if (!conversationId) {
        return NextResponse.json({ error: "conversationId required" }, { status: 400 });
      }
      await markAsRead(user.id, conversationId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("Chat POST error:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
