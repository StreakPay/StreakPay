import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { aiService } from "@/services/ai";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { message, conversationId } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const response = await aiService.chat(
      [{ role: "user", content: message }],
      { userId: session.user.id, conversationId }
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
