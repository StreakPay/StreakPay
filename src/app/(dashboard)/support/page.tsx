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
      <div className="p-5 md:p-8 lg:p-10 max-w-[600px] mx-auto">
        <GlassCard variant="elevated" className="p-10 text-center">
          <div className="text-4xl mb-4">{"\u2709}\u{FE0F}"}</div>
          <h1 className="text-2xl font-bold mb-2">Ticket Submitted</h1>
          <p className="text-muted-foreground text-sm">
            We&apos;ll get back to you within 24 hours. Check your notifications for updates.
          </p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[600px] mx-auto">
      {/* Header */}
      <div className="mb-10">
        <p className="text-muted text-xs uppercase tracking-widest font-medium mb-1.5">Help</p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Support Center</h1>
      </div>

      {/* FAQ */}
      <GlassCard className="p-6 mb-5">
        <h2 className="text-sm font-semibold mb-5">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {[
            { q: "How do I reset my password?", a: "Go to Settings > Security > Change Password" },
            { q: "How long does verification take?", a: "Usually within 24 hours of proof submission" },
            { q: "What is the minimum withdrawal?", a: "₦500 for NGN withdrawals" },
          ].map((faq, i) => (
            <div key={i} className="glass rounded-xl p-4">
              <div className="text-sm font-medium">{faq.q}</div>
              <div className="text-xs text-muted-foreground mt-1">{faq.a}</div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Ticket Form */}
      <GlassCard className="p-6">
        <h2 className="text-sm font-semibold mb-5">Create Support Ticket</h2>
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
            <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Priority</label>
            <div className="flex gap-2">
              {["low", "medium", "high", "urgent"].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`px-3 py-1.5 text-xs rounded-xl transition-all duration-200 font-medium ${
                    priority === p ? "bg-accent/15 text-accent border border-accent/25" : "glass hover:bg-white/[0.04] text-muted"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full h-32 px-4 rounded-xl glass text-sm focus:outline-none focus:ring-1 focus:ring-accent/20 focus:border-accent/40 transition-all duration-200"
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
