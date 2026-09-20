"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassInput } from "@/components/ui/glass-input";
import { GlassButton } from "@/components/ui/glass-button";

export default function SupportPage() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("medium");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message, priority }),
      });
      if (res.ok) setSubmitted(true);
    } catch {}
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen p-4 md:p-8 max-w-2xl mx-auto">
        <GlassCard variant="elevated" className="p-8 text-center">
          <div className="text-4xl mb-4">✉️</div>
          <h1 className="text-2xl font-bold mb-2">Ticket Submitted</h1>
          <p className="text-muted-foreground">
            We&apos;ll get back to you within 24 hours. Check your notifications for updates.
          </p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Support Center</h1>

      <GlassCard variant="elevated" className="p-6 mb-6">
        <h2 className="font-semibold mb-4">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {[
            { q: "How do I reset my password?", a: "Go to Settings > Security > Change Password" },
            { q: "How long does verification take?", a: "Usually within 24 hours of proof submission" },
            { q: "What is the minimum withdrawal?", a: "₦500 for NGN withdrawals" },
          ].map((faq, i) => (
            <div key={i} className="glass rounded-lg p-3">
              <div className="text-sm font-medium">{faq.q}</div>
              <div className="text-xs text-muted-foreground mt-1">{faq.a}</div>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard variant="elevated" className="p-6">
        <h2 className="font-semibold mb-4">Create Support Ticket</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <GlassInput
            id="subject"
            label="Subject"
            placeholder="How can we help?"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Priority</label>
            <div className="flex gap-2">
              {["low", "medium", "high", "urgent"].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                    priority === p ? "bg-accent/10 text-accent border border-accent/20" : "glass hover:bg-white/[0.05]"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full h-32 px-3 rounded-xl glass text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
              placeholder="Describe your issue in detail..."
              required
            />
          </div>
          <GlassButton type="submit" variant="primary" className="w-full" glow disabled={loading}>
            {loading ? "Submitting..." : "Submit Ticket"}
          </GlassButton>
        </form>
      </GlassCard>
    </div>
  );
}
