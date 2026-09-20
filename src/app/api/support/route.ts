import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!db) return NextResponse.json({ error: "Database not available" }, { status: 503 });

    const body = await request.json();
    const { subject, message, priority } = body;

    if (!subject || !message) {
      return NextResponse.json({ error: "Subject and message are required" }, { status: 400 });
    }

    const ticket = await db.supportTicket.create({
      data: {
        id: uuidv4(),
        userId: session.user.id,
        subject,
        priority: priority || "medium",
        messages: {
          create: {
            id: uuidv4(),
            senderId: session.user.id,
            content: message,
          },
        },
      },
    });

    return NextResponse.json({ success: true, ticket: { id: ticket.id } });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!db) return NextResponse.json({ error: "Database not available" }, { status: 503 });

    const tickets = await db.supportTicket.findMany({
      where: { userId: session.user.id },
      include: { messages: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ tickets });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
