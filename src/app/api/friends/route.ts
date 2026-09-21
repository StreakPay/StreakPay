import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { searchUsers, sendFriendRequest, getPendingRequests, getSentRequests } from "@/services/friends";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "search") {
      const query = searchParams.get("q") || "";
      const results = await searchUsers(user.id, query);
      return NextResponse.json({ users: results });
    }

    if (action === "pending") {
      const requests = await getPendingRequests(user.id);
      return NextResponse.json({ requests });
    }

    if (action === "sent") {
      const requests = await getSentRequests(user.id);
      return NextResponse.json({ requests });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Friends GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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
    const { action, receiverId, requestId } = body;

    if (action === "send") {
      if (!receiverId) {
        return NextResponse.json({ error: "receiverId required" }, { status: 400 });
      }
      const request_ = await sendFriendRequest(user.id, receiverId);
      return NextResponse.json({ request: request_ });
    }

    if (action === "accept") {
      if (!requestId) {
        return NextResponse.json({ error: "requestId required" }, { status: 400 });
      }
      const { acceptFriendRequest } = await import("@/services/friends");
      const friendship = await acceptFriendRequest(user.id, requestId);
      return NextResponse.json({ friendship });
    }

    if (action === "reject") {
      if (!requestId) {
        return NextResponse.json({ error: "requestId required" }, { status: 400 });
      }
      const { rejectFriendRequest } = await import("@/services/friends");
      await rejectFriendRequest(user.id, requestId);
      return NextResponse.json({ success: true });
    }

    if (action === "cancel") {
      if (!requestId) {
        return NextResponse.json({ error: "requestId required" }, { status: 400 });
      }
      const { cancelFriendRequest } = await import("@/services/friends");
      await cancelFriendRequest(user.id, requestId);
      return NextResponse.json({ success: true });
    }

    if (action === "remove") {
      const { friendshipId } = body;
      if (!friendshipId) {
        return NextResponse.json({ error: "friendshipId required" }, { status: 400 });
      }
      const { removeFriendship } = await import("@/services/friends");
      await removeFriendship(user.id, friendshipId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("Friends POST error:", error);
    const isUserError = message.includes("already") || message.includes("not found") || message.includes("required") || message.includes("yourself");
    return NextResponse.json({ error: message }, { status: isUserError ? 400 : 500 });
  }
}
