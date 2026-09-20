import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getNotifications, getUnreadCount, markAllNotificationsRead } from "@/services/notifications";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notifications = await getNotifications(session.user.id);
    const unreadCount = await getUnreadCount(session.user.id);

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error("Get notifications error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await markAllNotificationsRead(session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mark notifications read error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
