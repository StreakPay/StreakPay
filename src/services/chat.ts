import { createClient } from "@/lib/supabase/server";
import { v4 as uuidv4 } from "uuid";
import { safeNumber } from "@/lib/math";
import { creditCoins, getConfigValue } from "./coins";
import { getMultiplier, calculateReward } from "./multiplier";
import { checkRateLimit, checkDailyCap, getDiminishingReturnsFactor, recordRewardEvent } from "./anti-abuse";

export interface Conversation {
  id: string;
  friendshipId: string;
  lastMessageAt: string | null;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  status: "sent" | "delivered" | "read";
  createdAt: string;
}

export interface ChatUsage {
  freeMessagesUsed: number;
  freeMessagesLimit: number;
  coinsSpent: number;
  totalMessages: number;
  freeMessagesLeft: number;
}

export interface ConversationListItem {
  conversation: Conversation;
  friend: { id: string; fullName: string; profileImage: string | null };
  lastMessage: Message | null;
  unreadCount: number;
  usage: ChatUsage;
}

/**
 * Get or create chat usage for a user in a conversation.
 */
async function getOrCreateChatUsage(
  userId: string,
  conversationId: string
): Promise<ChatUsage> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("chat_usage")
    .select("free_messages_used, free_messages_limit, coins_spent, total_messages")
    .eq("user_id", userId)
    .eq("conversation_id", conversationId)
    .single();

  if (existing) {
    const freeLeft = Math.max(
      0,
      safeNumber(existing.free_messages_limit) - safeNumber(existing.free_messages_used)
    );
    return {
      freeMessagesUsed: safeNumber(existing.free_messages_used),
      freeMessagesLimit: safeNumber(existing.free_messages_limit),
      coinsSpent: safeNumber(existing.coins_spent),
      totalMessages: safeNumber(existing.total_messages),
      freeMessagesLeft: freeLeft,
    };
  }

  const limit = 3; // 3 free messages per new conversation

  await supabase.from("chat_usage").insert({
    user_id: userId,
    conversation_id: conversationId,
    free_messages_used: 0,
    free_messages_limit: limit,
    coins_spent: 0,
    total_messages: 0,
  });

  return {
    freeMessagesUsed: 0,
    freeMessagesLimit: limit,
    coinsSpent: 0,
    totalMessages: 0,
    freeMessagesLeft: limit,
  };
}

/**
 * Get conversation list for a user.
 */
export async function getConversations(
  userId: string
): Promise<ConversationListItem[]> {
  const supabase = await createClient();

  // Get all friendships with conversations
  const { data: friendships } = await supabase
    .from("friendships")
    .select("id, user_id_1, user_id_2")
    .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`);

  if (!friendships || friendships.length === 0) return [];

  const friendshipIds = friendships.map((f) => f.id);

  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, friendship_id, last_message_at, created_at")
    .in("friendship_id", friendshipIds)
    .order("last_message_at", { ascending: false, nullsFirst: false });

  if (!conversations || conversations.length === 0) return [];

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

  const friendshipMap = new Map(friendships.map((f) => [f.id, f]));

  // Get last messages and unread counts
  const convIds = conversations.map((c) => c.id);

  const [lastMessagesResult, unreadResult, usageResult] = await Promise.all([
    supabase
      .from("messages")
      .select("id, conversation_id, sender_id, content, status, created_at")
      .in("conversation_id", convIds)
      .order("created_at", { ascending: false })
      .limit(convIds.length * 5),
    supabase
      .from("messages")
      .select("conversation_id")
      .in("conversation_id", convIds)
      .neq("sender_id", userId)
      .eq("status", "sent"),
    supabase
      .from("chat_usage")
      .select("conversation_id, free_messages_used, free_messages_limit, coins_spent, total_messages")
      .eq("user_id", userId)
      .in("conversation_id", convIds),
  ]);

  // Build last message per conversation
  const lastMessageMap = new Map<string, Message>();
  for (const msg of lastMessagesResult.data || []) {
    if (!lastMessageMap.has(msg.conversation_id)) {
      lastMessageMap.set(msg.conversation_id, {
        id: msg.id,
        conversationId: msg.conversation_id,
        senderId: msg.sender_id,
        content: msg.content,
        status: msg.status as "sent",
        createdAt: msg.created_at,
      });
    }
  }

  // Build unread counts
  const unreadMap = new Map<string, number>();
  for (const msg of unreadResult.data || []) {
    unreadMap.set(msg.conversation_id, (unreadMap.get(msg.conversation_id) || 0) + 1);
  }

  // Build usage map
  const usageMap = new Map(
    (usageResult.data || []).map((u) => [
      u.conversation_id,
      {
        freeMessagesUsed: safeNumber(u.free_messages_used),
        freeMessagesLimit: safeNumber(u.free_messages_limit),
        coinsSpent: safeNumber(u.coins_spent),
        totalMessages: safeNumber(u.total_messages),
        freeMessagesLeft: Math.max(
          0,
          safeNumber(u.free_messages_limit) - safeNumber(u.free_messages_used)
        ),
      },
    ])
  );

  return conversations.map((conv) => {
    const friendship = friendshipMap.get(conv.friendship_id);
    const friendId = friendship
      ? friendship.user_id_1 === userId
        ? friendship.user_id_2
        : friendship.user_id_1
      : "";

    return {
      conversation: {
        id: conv.id,
        friendshipId: conv.friendship_id,
        lastMessageAt: conv.last_message_at,
        createdAt: conv.created_at,
      },
      friend: profileMap.get(friendId) || {
        id: friendId,
        fullName: "Unknown",
        profileImage: null,
      },
      lastMessage: lastMessageMap.get(conv.id) || null,
      unreadCount: unreadMap.get(conv.id) || 0,
      usage: usageMap.get(conv.id) || {
        freeMessagesUsed: 0,
        freeMessagesLimit: 3,
        coinsSpent: 0,
        totalMessages: 0,
        freeMessagesLeft: 3,
      },
    };
  });
}

/**
 * Get messages for a conversation.
 */
export async function getMessages(
  userId: string,
  conversationId: string,
  limit: number = 50,
  before?: string
): Promise<Message[]> {
  const supabase = await createClient();

  // Verify user has access
  const { data: conv } = await supabase
    .from("conversations")
    .select("id, friendship_id")
    .eq("id", conversationId)
    .single();

  if (!conv) throw new Error("Conversation not found");

  const { data: friendship } = await supabase
    .from("friendships")
    .select("user_id_1, user_id_2")
    .eq("id", conv.friendship_id)
    .single();

  if (
    !friendship ||
    (friendship.user_id_1 !== userId && friendship.user_id_2 !== userId)
  ) {
    throw new Error("Access denied");
  }

  let query = supabase
    .from("messages")
    .select("id, conversation_id, sender_id, content, status, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (before) {
    query = query.lt("created_at", before);
  }

  const { data: messages } = await query;

  return (messages || []).map((m) => ({
    id: m.id,
    conversationId: m.conversation_id,
    senderId: m.sender_id,
    content: m.content,
    status: m.status as "sent",
    createdAt: m.created_at,
  }));
}

/**
 * Mark messages as read.
 */
export async function markAsRead(
  userId: string,
  conversationId: string
): Promise<void> {
  const supabase = await createClient();

  await supabase
    .from("messages")
    .update({ status: "read" })
    .eq("conversation_id", conversationId)
    .neq("sender_id", userId)
    .eq("status", "sent");
}

/**
 * Send a message in a conversation.
 * Handles free message allowance and coin billing.
 */
export async function sendMessage(
  userId: string,
  conversationId: string,
  content: string
): Promise<{ message: Message; coinsCharged: number; freeMessagesLeft: number }> {
  if (!content || content.trim().length === 0) {
    throw new Error("Message cannot be empty");
  }

  if (content.length > 2000) {
    throw new Error("Message too long (max 2000 characters)");
  }

  const supabase = await createClient();

  // Verify access
  const { data: conv } = await supabase
    .from("conversations")
    .select("id, friendship_id")
    .eq("id", conversationId)
    .single();

  if (!conv) throw new Error("Conversation not found");

  const { data: friendship } = await supabase
    .from("friendships")
    .select("user_id_1, user_id_2")
    .eq("id", conv.friendship_id)
    .single();

  if (
    !friendship ||
    (friendship.user_id_1 !== userId && friendship.user_id_2 !== userId)
  ) {
    throw new Error("Access denied");
  }

  // Get or create chat usage
  const usage = await getOrCreateChatUsage(userId, conversationId);

  let coinsCharged = 0;

  if (usage.freeMessagesLeft > 0) {
    // Free message
    await supabase
      .from("chat_usage")
      .update({
        free_messages_used: usage.freeMessagesUsed + 1,
        total_messages: usage.totalMessages + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("conversation_id", conversationId);
  } else {
    // Paid message — charge 2 coins
    const costPerMessage = 2;

    // Check balance
    const { data: coinBalance } = await supabase
      .from("coin_balances")
      .select("balance")
      .eq("user_id", userId)
      .single();

    if (!coinBalance || safeNumber(coinBalance.balance) < costPerMessage) {
      throw new Error("NOT_ENOUGH_COINS");
    }

    // Debit coins
    const newBalance = safeNumber(coinBalance.balance) - costPerMessage;
    await supabase
      .from("coin_balances")
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq("user_id", userId);

    // Record transaction
    await supabase.from("coin_transactions").insert({
      user_id: userId,
      amount: -costPerMessage,
      balance_after: newBalance,
      type: "chat_spend",
      source: "chat_message",
      reference: `CHAT-SPEND-${Date.now()}-${uuidv4().slice(0, 6)}`,
      metadata: { conversationId, messageId: null },
    });

    // Update usage
    await supabase
      .from("chat_usage")
      .update({
        coins_spent: usage.coinsSpent + costPerMessage,
        total_messages: usage.totalMessages + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("conversation_id", conversationId);

    coinsCharged = costPerMessage;
  }

  // Insert message
  const { data: message } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: userId,
      content: content.trim(),
      status: "sent",
    })
    .select("id, conversation_id, sender_id, content, status, created_at")
    .single();

  // Update conversation last_message_at
  await supabase
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversationId);

  // Update message metadata in chat_usage
  if (coinsCharged > 0) {
    await supabase
      .from("coin_transactions")
      .update({
        metadata: { conversationId, messageId: message!.id },
      })
      .eq("reference", `CHAT-SPEND-${Date.now()}`);
  }

  // Award chat reward coins (meaningful chat activity)
  await awardChatReward(userId, conversationId);

  const updatedUsage = await getOrCreateChatUsage(userId, conversationId);

  return {
    message: {
      id: message!.id,
      conversationId: message!.conversation_id,
      senderId: message!.sender_id,
      content: message!.content,
      status: message!.status as "sent",
      createdAt: message!.created_at,
    },
    coinsCharged,
    freeMessagesLeft: updatedUsage.freeMessagesLeft,
  };
}

/**
 * Award chat reward coins for meaningful chat activity.
 * Uses Phase 4 multiplier + anti-abuse.
 */
async function awardChatReward(
  userId: string,
  _conversationId: string
): Promise<void> {
  try {
    const [rateLimit, dailyCap] = await Promise.all([
      checkRateLimit(userId),
      checkDailyCap(userId),
    ]);

    if (!rateLimit.allowed || !dailyCap.allowed) return;

    const [multiplier, dimFactor, baseReward] = await Promise.all([
      getMultiplier(userId),
      getDiminishingReturnsFactor(userId),
      getConfigValue("base_chat_reward"),
    ]);

    const effectiveBase = baseReward > 0 ? baseReward : 5;
    const finalReward = calculateReward(effectiveBase, multiplier.multiplier);
    const adjustedReward = Math.max(1, Math.floor(finalReward * dimFactor));

    if (adjustedReward > 0) {
      await creditCoins(
        userId,
        adjustedReward,
        "chat_reward",
        "chat_message",
        `CHAT-REWARD-${Date.now()}-${uuidv4().slice(0, 6)}`,
        { conversationId: _conversationId, multiplier: multiplier.multiplier }
      );
      await recordRewardEvent(userId, adjustedReward);
    }
  } catch {
    // Don't fail the message send if reward fails
  }
}

/**
 * Get conversation by friendship ID.
 */
export async function getConversationByFriendship(
  friendshipId: string
): Promise<Conversation | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("conversations")
    .select("id, friendship_id, last_message_at, created_at")
    .eq("friendship_id", friendshipId)
    .single();

  if (!data) return null;

  return {
    id: data.id,
    friendshipId: data.friendship_id,
    lastMessageAt: data.last_message_at,
    createdAt: data.created_at,
  };
}
