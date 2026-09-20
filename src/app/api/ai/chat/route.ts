import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { aiService } from "@/services/ai";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { message, conversationId } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const response = await aiService.chat(
      [{ role: "user", content: message }],
      { userId: user.id, conversationId }
    );

    return NextResponse.json({
      content: response.content,
      toolCalls: response.toolCalls,
    });
  } catch (error) {
    console.error("AI chat error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
