"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Bot, Sparkles } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function StreakAI() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "I'm STREAK AI, your StreakPay assistant. I can help with your streak, rewards, trading, and account questions. What would you like to know?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.content || "I couldn't process that request." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I encountered an error. Please try again." },
      ]);
    }
    setLoading(false);
  };

  const quickActions = [
    "My streak",
    "My rewards",
    "My trading",
    "My account",
  ];

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed z-50 h-14 w-14 rounded-full flex items-center justify-center",
          "bg-gradient-to-br from-cyan to-accent shadow-lg transition-all duration-300",
          "hover:scale-110 hover:shadow-cyan/30 hover:shadow-xl",
          isOpen ? "bottom-6 right-6 md:bottom-8 md:right-8" : "bottom-20 right-4 md:bottom-8 md:right-8",
          "md:bottom-8 md:right-8"
        )}
        aria-label="Toggle STREAK AI"
      >
        {isOpen ? (
          <X className="h-6 w-6 text-black" />
        ) : (
          <Sparkles className="h-6 w-6 text-black" />
        )}
      </button>

      {isOpen && (
        <div className="fixed bottom-36 right-4 md:bottom-28 md:right-8 z-50 w-[calc(100vw-2rem)] max-w-sm">
          <GlassCard variant="elevated" className="flex flex-col h-[500px] overflow-hidden">
            <div className="p-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan to-accent flex items-center justify-center">
                  <Bot className="h-5 w-5 text-black" />
                </div>
                <div>
                  <div className="text-sm font-semibold">STREAK AI</div>
                  <div className="text-xs text-muted">Your StreakPay assistant</div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex gap-2",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {msg.role === "assistant" && (
                    <div className="h-6 w-6 rounded-full bg-cyan/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="h-3 w-3 text-cyan" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[80%] rounded-xl px-3 py-2 text-sm",
                      msg.role === "user"
                        ? "bg-accent/10 text-foreground"
                        : "glass"
                    )}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-2">
                  <div className="h-6 w-6 rounded-full bg-cyan/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="h-3 w-3 text-cyan" />
                  </div>
                  <div className="glass rounded-xl px-3 py-2 text-sm">
                    <span className="animate-pulse">Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {messages.length === 1 && (
              <div className="px-4 pb-2 flex flex-wrap gap-2">
                {quickActions.map((action) => (
                  <button
                    key={action}
                    onClick={() => {
                      setInput(action);
                      setTimeout(() => {
                        setMessages((prev) => [...prev, { role: "user", content: action }]);
                        setLoading(true);
                        fetch("/api/ai/chat", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ message: action }),
                        })
                          .then((r) => r.json())
                          .then((data) => {
                            setMessages((prev) => [
                              ...prev,
                              { role: "assistant", content: data.content },
                            ]);
                            setLoading(false);
                          });
                        setInput("");
                      }, 0);
                    }}
                    className="px-3 py-1.5 text-xs rounded-lg glass hover:bg-white/[0.05] transition-colors"
                  >
                    {action}
                  </button>
                ))}
              </div>
            )}

            <div className="p-3 border-t border-white/[0.06]">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Ask anything..."
                  className="flex-1 h-9 px-3 rounded-lg glass text-sm focus:outline-none focus:ring-1 focus:ring-accent/30"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                  className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center text-black disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </>
  );
}
