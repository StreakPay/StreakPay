"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { GlassButton } from "@/components/ui/glass-button";
import { StreakPayLoader } from "@/components/ui/streakpay-loader";

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  status: string;
  createdAt: string;
}

interface Friend {
  id: string;
  fullName: string;
  profileImage: string | null;
}

interface Usage {
  freeMessagesLeft: number;
  coinsSpent: number;
}

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [friend, setFriend] = useState<Friend | null>(null);
  const [usage, setUsage] = useState<Usage>({ freeMessagesLeft: 3, coinsSpent: 0 });
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [chatRes, msgRes] = await Promise.all([
          fetch("/api/chat").then((r) => r.json()),
          fetch(`/api/chat?conversationId=${conversationId}`).then((r) => r.json()),
        ]);
        if (cancelled) return;

        const conv = chatRes.conversations?.find(
          (c: { conversation: { id: string } }) => c.conversation.id === conversationId
        );

        if (conv) {
          setFriend(conv.friend);
          setUsage(conv.usage);
        }

        const msgs: Message[] = msgRes.messages || [];
        setMessages(msgs);

        if (conv?.friend?.id && msgs.length > 0) {
          const ownMsg = msgs.find((m) => m.senderId !== conv.friend.id);
          if (ownMsg) setUserId(ownMsg.senderId);
        }
      } catch {}
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mark messages as read
  useEffect(() => {
    if (conversationId && userId) {
      fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markRead", conversationId }),
      });
    }
  }, [conversationId, userId]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          content: newMessage.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === "NOT_ENOUGH_COINS") {
          alert("Not enough coins to send this message.");
        } else {
          alert(data.error || "Failed to send message");
        }
        setSending(false);
        return;
      }

      setMessages((prev) => [...prev, data.message]);
      setUsage({
        freeMessagesLeft: data.freeMessagesLeft,
        coinsSpent: usage.coinsSpent + data.coinsCharged,
      });
      setNewMessage("");
    } catch {
      alert("Failed to send message");
    }
    setSending(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatMsgTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <StreakPayLoader fullPage={false} />
      </div>
    );
  }

  if (!friend) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Conversation not found</p>
          <GlassButton variant="primary" onClick={() => router.push("/chat")}>
            Back to Chat
          </GlassButton>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-h-[100dvh]">
      {/* Header */}
      <div className="shrink-0 p-4 glass-strong border-b border-white/[0.04] flex items-center gap-3 safe-area-pt">
        <GlassButton
          variant="ghost"
          className="px-2 py-1 text-xs"
          onClick={() => router.push("/chat")}
        >
          ← Back
        </GlassButton>
        <div className="h-9 w-9 rounded-xl bg-accent/10 flex items-center justify-center text-accent font-semibold text-sm shrink-0">
          {friend.fullName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="font-medium text-sm">{friend.fullName}</div>
          <div className="text-[10px] text-muted">
            {usage.freeMessagesLeft > 0
              ? `${usage.freeMessagesLeft} FREE MESSAGES LEFT`
              : "2 COINS / MESSAGE"}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="text-center py-8 text-muted text-sm">
            Send the first message to start the conversation!
          </div>
        )}
        {messages.map((msg) => {
          const isOwn = msg.senderId !== friend.id;
          return (
            <div
              key={msg.id}
              className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  isOwn
                    ? "bg-accent/20 text-foreground rounded-br-sm"
                    : "glass rounded-bl-sm"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                <div className="flex items-center justify-end gap-1 mt-1">
                  <span className="text-[10px] text-muted">
                    {formatMsgTime(msg.createdAt)}
                  </span>
                  {isOwn && (
                    <span className="text-[10px] text-muted">
                      {msg.status === "read" ? "✓✓✓" : msg.status === "delivered" ? "✓✓" : "✓"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 p-4 glass-strong border-t border-white/[0.04] safe-area-pb">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 bg-white/[0.03] border border-white/[0.05] rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-accent/20 focus:border-accent/40 max-h-32 min-h-[44px] transition-all duration-200"
            style={{ height: "auto" }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = Math.min(target.scrollHeight, 128) + "px";
            }}
          />
          <GlassButton
            variant="primary"
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="shrink-0 px-4 py-3"
          >
            {sending ? "..." : "Send"}
          </GlassButton>
        </div>
        {usage.freeMessagesLeft > 0 && (
          <div className="text-[10px] text-accent mt-1.5 font-medium">
            {usage.freeMessagesLeft} free message{usage.freeMessagesLeft !== 1 ? "s" : ""} remaining
          </div>
        )}
      </div>
    </div>
  );
}
