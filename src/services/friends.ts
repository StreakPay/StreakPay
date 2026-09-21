import { createClient } from "@/lib/supabase/server";

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

export interface Friendship {
  id: string;
  userId1: string;
  userId2: string;
  createdAt: string;
}

export interface FriendProfile {
  id: string;
  fullName: string;
  profileImage: string | null;
}

export interface FriendWithProfile extends Friendship {
  friend: FriendProfile;
}

/**
 * Search users by name (for adding friends).
 * Excludes the current user and existing friends/requests.
 */
export async function searchUsers(
  userId: string,
  query: string,
  limit: number = 20
): Promise<FriendProfile[]> {
  const supabase = await createClient();

  if (!query || query.trim().length < 2) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, profile_image")
    .ilike("full_name", `%${query.trim()}%`)
    .neq("id", userId)
    .limit(limit);

  if (!profiles) return [];

  // Exclude users with existing requests or friendships
  const ids = profiles.map((p) => p.id);

  const [existingRequests, existingFriendships] = await Promise.all([
    supabase
      .from("friend_requests")
      .select("sender_id, receiver_id")
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .or(`sender_id.in.(${ids.join(",")}),receiver_id.in.(${ids.join(",")})`),
    supabase
      .from("friendships")
      .select("user_id_1, user_id_2")
      .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`),
  ]);

  const excludedIds = new Set<string>();

  for (const req of existingRequests.data || []) {
    excludedIds.add(req.sender_id === userId ? req.receiver_id : req.sender_id);
  }
  for (const f of existingFriendships.data || []) {
    excludedIds.add(f.user_id_1 === userId ? f.user_id_2 : f.user_id_1);
  }

  return profiles
    .filter((p) => !excludedIds.has(p.id))
    .map((p) => ({
      id: p.id,
      fullName: p.full_name,
      profileImage: p.profile_image,
    }));
}

/**
 * Send a friend request.
 */
export async function sendFriendRequest(
  senderId: string,
  receiverId: string
): Promise<FriendRequest> {
  if (senderId === receiverId) {
    throw new Error("Cannot send friend request to yourself");
  }

  const supabase = await createClient();

  // Check for existing request in either direction
  const { data: existing } = await supabase
    .from("friend_requests")
    .select("id, status")
    .or(
      `and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`
    )
    .limit(1)
    .single();

  if (existing) {
    if (existing.status === "pending") {
      throw new Error("Friend request already pending");
    }
    if (existing.status === "accepted") {
      throw new Error("Already friends");
    }
    // If rejected, allow re-request by updating
    const { data: updated } = await supabase
      .from("friend_requests")
      .update({ status: "pending", updated_at: new Date().toISOString() })
      .eq("id", existing.id)
      .select("id, sender_id, receiver_id, status, created_at")
      .single();

    return {
      id: updated!.id,
      senderId: updated!.sender_id,
      receiverId: updated!.receiver_id,
      status: updated!.status as "pending",
      createdAt: updated!.created_at,
    };
  }

  // Check existing friendship
  const { data: friendship } = await supabase
    .from("friendships")
    .select("id")
    .or(
      `and(user_id_1.eq.${senderId},user_id_2.eq.${receiverId}),and(user_id_1.eq.${receiverId},user_id_2.eq.${senderId})`
    )
    .limit(1)
    .single();

  if (friendship) {
    throw new Error("Already friends");
  }

  const { data: request } = await supabase
    .from("friend_requests")
    .insert({ sender_id: senderId, receiver_id: receiverId, status: "pending" })
    .select("id, sender_id, receiver_id, status, created_at")
    .single();

  return {
    id: request!.id,
    senderId: request!.sender_id,
    receiverId: request!.receiver_id,
    status: request!.status as "pending",
    createdAt: request!.created_at,
  };
}

/**
 * Accept a friend request. Creates friendship + conversation.
 */
export async function acceptFriendRequest(
  userId: string,
  requestId: string
): Promise<Friendship> {
  const supabase = await createClient();

  const { data: request } = await supabase
    .from("friend_requests")
    .select("id, sender_id, receiver_id, status")
    .eq("id", requestId)
    .eq("receiver_id", userId)
    .eq("status", "pending")
    .single();

  if (!request) throw new Error("Friend request not found or already processed");

  // Update request status
  await supabase
    .from("friend_requests")
    .update({ status: "accepted", updated_at: new Date().toISOString() })
    .eq("id", requestId);

  // Create friendship with canonical ordering (user_id_1 < user_id_2)
  const [id1, id2] = [request.sender_id, request.receiver_id].sort();

  const { data: friendship } = await supabase
    .from("friendships")
    .insert({ user_id_1: id1, user_id_2: id2 })
    .select("id, user_id_1, user_id_2, created_at")
    .single();

  // Create conversation
  await supabase.from("conversations").insert({
    friendship_id: friendship!.id,
  });

  return {
    id: friendship!.id,
    userId1: friendship!.user_id_1,
    userId2: friendship!.user_id_2,
    createdAt: friendship!.created_at,
  };
}

/**
 * Reject a friend request.
 */
export async function rejectFriendRequest(
  userId: string,
  requestId: string
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("friend_requests")
    .update({ status: "rejected", updated_at: new Date().toISOString() })
    .eq("id", requestId)
    .eq("receiver_id", userId)
    .eq("status", "pending");

  if (error) throw new Error("Failed to reject request");
}

/**
 * Cancel a pending friend request (by the sender).
 */
export async function cancelFriendRequest(
  userId: string,
  requestId: string
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("friend_requests")
    .delete()
    .eq("id", requestId)
    .eq("sender_id", userId)
    .eq("status", "pending");

  if (error) throw new Error("Failed to cancel request");
}

/**
 * Remove an existing friendship.
 */
export async function removeFriendship(
  userId: string,
  friendshipId: string
): Promise<void> {
  const supabase = await createClient();

  // Verify user is part of this friendship
  const { data: friendship } = await supabase
    .from("friendships")
    .select("id, user_id_1, user_id_2")
    .eq("id", friendshipId)
    .single();

  if (!friendship) throw new Error("Friendship not found");
  if (friendship.user_id_1 !== userId && friendship.user_id_2 !== userId) {
    throw new Error("Not your friendship");
  }

  // Delete friendship (cascades to conversations and messages)
  await supabase.from("friendships").delete().eq("id", friendshipId);

  // Also mark any related requests as rejected
  const friendId =
    friendship.user_id_1 === userId ? friendship.user_id_2 : friendship.user_id_1;
  await supabase
    .from("friend_requests")
    .update({ status: "rejected", updated_at: new Date().toISOString() })
    .or(
      `and(sender_id.eq.${userId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${userId})`
    );
}

/**
 * Get all friends for a user.
 */
export async function getFriends(userId: string): Promise<FriendWithProfile[]> {
  const supabase = await createClient();

  const { data: friendships } = await supabase
    .from("friendships")
    .select("id, user_id_1, user_id_2, created_at")
    .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (!friendships || friendships.length === 0) return [];

  // Get friend profiles
  const friendIds = friendships.map((f) =>
    f.user_id_1 === userId ? f.user_id_2 : f.user_id_1
  );

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, profile_image")
    .in("id", friendIds);

  const profileMap = new Map(
    (profiles || []).map((p) => [
      p.id,
      { id: p.id, fullName: p.full_name, profileImage: p.profile_image },
    ])
  );

  return friendships.map((f) => {
    const friendId = f.user_id_1 === userId ? f.user_id_2 : f.user_id_1;
    return {
      id: f.id,
      userId1: f.user_id_1,
      userId2: f.user_id_2,
      createdAt: f.created_at,
      friend: profileMap.get(friendId) || {
        id: friendId,
        fullName: "Unknown",
        profileImage: null,
      },
    };
  });
}

/**
 * Get pending friend requests (received).
 */
export async function getPendingRequests(
  userId: string
): Promise<(FriendRequest & { sender: FriendProfile })[]> {
  const supabase = await createClient();

  const { data: requests } = await supabase
    .from("friend_requests")
    .select("id, sender_id, receiver_id, status, created_at")
    .eq("receiver_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (!requests || requests.length === 0) return [];

  const senderIds = requests.map((r) => r.sender_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, profile_image")
    .in("id", senderIds);

  const profileMap = new Map(
    (profiles || []).map((p) => [
      p.id,
      { id: p.id, fullName: p.full_name, profileImage: p.profile_image },
    ])
  );

  return requests.map((r) => ({
    id: r.id,
    senderId: r.sender_id,
    receiverId: r.receiver_id,
    status: r.status as "pending",
    createdAt: r.created_at,
    sender: profileMap.get(r.sender_id) || {
      id: r.sender_id,
      fullName: "Unknown",
      profileImage: null,
    },
  }));
}

/**
 * Get sent pending requests.
 */
export async function getSentRequests(
  userId: string
): Promise<(FriendRequest & { receiver: FriendProfile })[]> {
  const supabase = await createClient();

  const { data: requests } = await supabase
    .from("friend_requests")
    .select("id, sender_id, receiver_id, status, created_at")
    .eq("sender_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (!requests || requests.length === 0) return [];

  const receiverIds = requests.map((r) => r.receiver_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, profile_image")
    .in("id", receiverIds);

  const profileMap = new Map(
    (profiles || []).map((p) => [
      p.id,
      { id: p.id, fullName: p.full_name, profileImage: p.profile_image },
    ])
  );

  return requests.map((r) => ({
    id: r.id,
    senderId: r.sender_id,
    receiverId: r.receiver_id,
    status: r.status as "pending",
    createdAt: r.created_at,
    receiver: profileMap.get(r.receiver_id) || {
      id: r.receiver_id,
      fullName: "Unknown",
      profileImage: null,
    },
  }));
}

/**
 * Check if two users are friends.
 */
export async function areFriends(
  userId1: string,
  userId2: string
): Promise<boolean> {
  const supabase = await createClient();

  const [id1, id2] = [userId1, userId2].sort();

  const { data } = await supabase
    .from("friendships")
    .select("id")
    .eq("user_id_1", id1)
    .eq("user_id_2", id2)
    .single();

  return !!data;
}

/**
 * Get the friendship between two users.
 */
export async function getFriendship(
  userId1: string,
  userId2: string
): Promise<Friendship | null> {
  const supabase = await createClient();

  const [id1, id2] = [userId1, userId2].sort();

  const { data } = await supabase
    .from("friendships")
    .select("id, user_id_1, user_id_2, created_at")
    .eq("user_id_1", id1)
    .eq("user_id_2", id2)
    .single();

  if (!data) return null;

  return {
    id: data.id,
    userId1: data.user_id_1,
    userId2: data.user_id_2,
    createdAt: data.created_at,
  };
}
