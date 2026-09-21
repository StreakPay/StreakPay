"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassInput } from "@/components/ui/glass-input";
import { StreakPayLoader } from "@/components/ui/streakpay-loader";

interface Friend {
  id: string;
  fullName: string;
  profileImage: string | null;
}

interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: string;
  createdAt: string;
  sender?: Friend;
  receiver?: Friend;
}

interface ConversationItem {
  conversation: { id: string; lastMessageAt: string | null };
  friend: Friend;
  lastMessage: { content: string; senderId: string; createdAt: string } | null;
  unreadCount: number;
  usage: { freeMessagesLeft: number };
}

type Tab = "chats" | "friends" | "requests" | "find";

export default function ChatPage() {
  const [tab, setTab] = useState<Tab>("chats");
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [friends, setFriends] = useState<(Friend & { friendshipId: string })[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [convRes, friendsRes, pendingRes, sentRes] = await Promise.all([
        fetch("/api/chat").then((r) => r.json()),
        fetch("/api/friends/list").then((r) => r.json()),
        fetch("/api/friends?action=pending").then((r) => r.json()),
        fetch("/api/friends?action=sent").then((r) => r.json()),
      ]);
      setConversations(convRes.conversations || []);
      setFriends(
        (friendsRes.friends || []).map((f: { id: string; friend: Friend }) => ({
          id: f.friend.id,
          fullName: f.friend.fullName,
          profileImage: f.friend.profileImage,
          friendshipId: f.id,
        }))
      );
      setPendingRequests(pendingRes.requests || []);
      setSentRequests(sentRes.requests || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [convRes, friendsRes, pendingRes, sentRes] = await Promise.all([
          fetch("/api/chat").then((r) => r.json()),
          fetch("/api/friends/list").then((r) => r.json()),
          fetch("/api/friends?action=pending").then((r) => r.json()),
          fetch("/api/friends?action=sent").then((r) => r.json()),
        ]);
        if (cancelled) return;
        setConversations(convRes.conversations || []);
        setFriends(
          (friendsRes.friends || []).map((f: { id: string; friend: Friend }) => ({
            id: f.friend.id,
            fullName: f.friend.fullName,
            profileImage: f.friend.profileImage,
            friendshipId: f.id,
          }))
        );
        setPendingRequests(pendingRes.requests || []);
        setSentRequests(sentRes.requests || []);
      } catch {}
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const handleSearch = async () => {
    if (searchQuery.trim().length < 2) return;
    try {
      const res = await fetch(
        `/api/friends?action=search&q=${encodeURIComponent(searchQuery)}`
      );
      const data = await res.json();
      setSearchResults(data.users || []);
    } catch {}
  };

  const handleSendRequest = async (receiverId: string) => {
    try {
      await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", receiverId }),
      });
      setSearchResults((prev) => prev.filter((u) => u.id !== receiverId));
      fetchAll();
    } catch {}
  };

  const handleAccept = async (requestId: string) => {
    try {
      await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept", requestId }),
      });
      fetchAll();
    } catch {}
  };

  const handleReject = async (requestId: string) => {
    try {
      await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", requestId }),
      });
      fetchAll();
    } catch {}
  };

  const handleCancel = async (requestId: string) => {
    try {
      await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", requestId }),
      });
      fetchAll();
    } catch {}
  };

  const handleRemove = async (friendshipId: string) => {
    try {
      await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove", friendshipId }),
      });
      fetchAll();
    } catch {}
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${diffMins}m`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h`;
    const diffDays = Math.floor(diffHrs / 24);
    return `${diffDays}d`;
  };

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "chats", label: "Chats" },
    { key: "friends", label: "Friends", count: friends.length },
    {
      key: "requests",
      label: "Requests",
      count: pendingRequests.length || undefined,
    },
    { key: "find", label: "Find" },
  ];

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[700px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <p className="text-muted text-xs uppercase tracking-widest font-medium mb-1.5">Messages</p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Chat</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 p-1 glass rounded-2xl overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 min-w-0 px-4 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 whitespace-nowrap ${
              tab === t.key
                ? "bg-accent/15 text-accent"
                : "text-muted hover:text-foreground"
            }`}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className="ml-1 text-[10px] bg-accent/25 px-1.5 py-0.5 rounded-full">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 min-h-[200px]">
          <StreakPayLoader fullPage={false} />
        </div>
      ) : (
        <>
          {tab === "chats" && (
            <div className="space-y-2">
              {conversations.length === 0 ? (
                <GlassCard className="p-10 text-center">
                  <p className="text-muted-foreground mb-5">
                    No conversations yet. Add friends to start chatting!
                  </p>
                  <GlassButton variant="primary" onClick={() => setTab("find")} glow>
                    Find Friends
                  </GlassButton>
                </GlassCard>
              ) : (
                conversations.map((item) => (
                  <Link key={item.conversation.id} href={`/chat/${item.conversation.id}`}>
                    <GlassCard hover className="p-4 flex items-center gap-3 cursor-pointer">
                      <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent font-semibold text-sm shrink-0">
                        {item.friend.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm truncate">
                            {item.friend.fullName}
                          </span>
                          <span className="text-[10px] text-muted ml-2 shrink-0">
                            {formatTime(item.lastMessage?.createdAt || null)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="text-xs text-muted-foreground truncate">
                            {item.lastMessage
                              ? item.lastMessage.content
                              : "Start chatting..."}
                          </span>
                          {item.unreadCount > 0 && (
                            <span className="ml-2 h-5 w-5 rounded-full bg-accent text-black text-[10px] font-bold flex items-center justify-center shrink-0">
                              {item.unreadCount}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-muted mt-1.5 font-medium">
                          {item.usage.freeMessagesLeft > 0
                            ? `${item.usage.freeMessagesLeft} FREE MESSAGES LEFT`
                            : "2 COINS / MESSAGE"}
                        </div>
                      </div>
                    </GlassCard>
                  </Link>
                ))
              )}
            </div>
          )}

          {tab === "friends" && (
            <div className="space-y-2">
              {friends.length === 0 ? (
                <GlassCard className="p-10 text-center">
                  <p className="text-muted-foreground">No friends yet.</p>
                </GlassCard>
              ) : (
                friends.map((f) => (
                  <GlassCard key={f.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent font-semibold text-sm">
                        {f.fullName.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-sm">{f.fullName}</span>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/chat/${conversations.find((c) => c.friend.id === f.id)?.conversation.id || ""}`}>
                        <GlassButton variant="secondary" className="text-xs px-3 py-1">
                          Message
                        </GlassButton>
                      </Link>
                      <GlassButton
                        variant="secondary"
                        className="text-xs px-3 py-1 text-red-400"
                        onClick={() => handleRemove(f.friendshipId)}
                      >
                        Remove
                      </GlassButton>
                    </div>
                  </GlassCard>
                ))
              )}
            </div>
          )}

          {tab === "requests" && (
            <div className="space-y-6">
              {pendingRequests.length > 0 && (
                <div>
                  <h3 className="text-[10px] text-muted uppercase tracking-widest font-medium mb-3">
                    Received ({pendingRequests.length})
                  </h3>
                  {pendingRequests.map((req) => (
                    <GlassCard key={req.id} className="p-4 flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent font-semibold text-sm">
                          {req.sender?.fullName?.charAt(0).toUpperCase() || "?"}
                        </div>
                        <span className="font-medium text-sm">
                          {req.sender?.fullName || "Unknown"}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <GlassButton
                          variant="primary"
                          className="text-xs px-3 py-1"
                          onClick={() => handleAccept(req.id)}
                        >
                          Accept
                        </GlassButton>
                        <GlassButton
                          variant="secondary"
                          className="text-xs px-3 py-1"
                          onClick={() => handleReject(req.id)}
                        >
                          Reject
                        </GlassButton>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              )}

              {sentRequests.length > 0 && (
                <div>
                  <h3 className="text-[10px] text-muted uppercase tracking-widest font-medium mb-3">
                    Sent ({sentRequests.length})
                  </h3>
                  {sentRequests.map((req) => (
                    <GlassCard key={req.id} className="p-4 flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent font-semibold text-sm">
                          {req.receiver?.fullName?.charAt(0).toUpperCase() || "?"}
                        </div>
                        <span className="font-medium text-sm">
                          {req.receiver?.fullName || "Unknown"}
                        </span>
                        <span className="text-[10px] text-muted">Pending</span>
                      </div>
                      <GlassButton
                        variant="secondary"
                        className="text-xs px-3 py-1"
                        onClick={() => handleCancel(req.id)}
                      >
                        Cancel
                      </GlassButton>
                    </GlassCard>
                  ))}
                </div>
              )}

              {pendingRequests.length === 0 && sentRequests.length === 0 && (
                <GlassCard className="p-10 text-center">
                  <p className="text-muted-foreground">No pending requests.</p>
                </GlassCard>
              )}
            </div>
          )}

          {tab === "find" && (
            <div>
              <div className="flex gap-2 mb-6">
                <div className="flex-1">
                  <GlassInput
                    id="search-users"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
                <GlassButton variant="primary" onClick={handleSearch} className="self-end mb-1">
                  Search
                </GlassButton>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-2">
                  {searchResults.map((user) => (
                    <GlassCard key={user.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent font-semibold text-sm">
                          {user.fullName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-sm">{user.fullName}</span>
                      </div>
                      <GlassButton
                        variant="primary"
                        className="text-xs px-3 py-1"
                        onClick={() => handleSendRequest(user.id)}
                      >
                        Add Friend
                      </GlassButton>
                    </GlassCard>
                  ))}
                </div>
              )}

              {searchQuery.length >= 2 &&
                searchResults.length === 0 && (
                  <GlassCard className="p-10 text-center">
                    <p className="text-muted-foreground">No users found.</p>
                  </GlassCard>
                )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
