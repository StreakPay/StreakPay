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
          "fixed z-50 h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-300",
          "bg-gradient-to-br from-cyan to-accent shadow-lg",
          "hover:scale-105 hover:shadow-lg hover:shadow-accent/20",
          isOpen ? "bottom-6 right-6 md:bottom-8 md:right-8" : "bottom-24 right-5 md:bottom-8 md:right-8",
          "md:bottom-8 md:right-8"
        )}
        aria-label="Toggle STREAK AI"
      >
        {isOpen ? (
          <X className="h-5 w-5 text-black" />
        ) : (
          <Sparkles className="h-5 w-5 text-black" />
        )}
      </button>

      {isOpen && (
        <div className="fixed bottom-20 right-5 md:bottom-24 md:right-8 z-50 w-[calc(100vw-2.5rem)] max-w-[380px]">
          <GlassCard variant="elevated" className="flex flex-col h-[480px] overflow-hidden rounded-3xl">
            <div className="p-4 border-b border-white/[0.04]">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan to-accent flex items-center justify-center">
                  <Bot className="h-4 w-4 text-black" />
                </div>
                <div>
                  <div className="text-sm font-semibold">STREAK AI</div>
                  <div className="text-[10px] text-muted">Your StreakPay assistant</div>
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
                    <div className="h-6 w-6 rounded-lg bg-cyan/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="h-3 w-3 text-cyan" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm",
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
                  <div className="h-6 w-6 rounded-lg bg-cyan/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="h-3 w-3 text-cyan" />
                  </div>
                  <div className="glass rounded-2xl px-3.5 py-2.5 text-sm">
                    <span className="animate-pulse">Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {messages.length === 1 && (
              <div className="px-4 pb-3 flex flex-wrap gap-1.5">
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
                    className="px-3 py-1.5 text-[10px] rounded-lg glass hover:bg-white/[0.04] transition-colors font-medium"
                  >
                    {action}
                  </button>
                ))}
              </div>
            )}

            <div className="p-3 border-t border-white/[0.04]">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Ask anything..."
                  className="flex-1 h-10 px-3.5 rounded-xl glass text-sm focus:outline-none focus:ring-1 focus:ring-accent/20"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                  className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center text-black disabled:opacity-40 transition-opacity"
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
