"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { Badge } from "@/components/ui/badge";

interface Withdrawal {
  id: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
  reference: string;
  status: string;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  requested: "warning",
  under_review: "gold",
  approved: "cyan",
  processing: "cyan",
  paid: "accent",
  rejected: "error",
};

export default function WithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [balance, setBalance] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    bankName: "",
    accountNumber: "",
    accountName: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/withdrawals").then((r) => r.json()).then((d) => setWithdrawals(d.withdrawals || []));
    fetch("/api/wallet").then((r) => r.json()).then((d) => setBalance(d.balance || 0));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(formData.amount),
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          accountName: formData.accountName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create withdrawal");
      } else {
        setShowForm(false);
        setFormData({ amount: "", bankName: "", accountNumber: "", accountName: "" });
        const updated = await fetch("/api/withdrawals").then((r) => r.json());
        setWithdrawals(updated.withdrawals || []);
        const walletUpdated = await fetch("/api/wallet").then((r) => r.json());
        setBalance(walletUpdated.balance || 0);
      }
    } catch {
      setError("Network error");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Withdrawals</h1>
        <GlassButton variant="primary" glow onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "New Withdrawal"}
        </GlassButton>
      </div>

      <GlassCard variant="elevated" className="p-6 mb-8">
        <h2 className="font-semibold mb-2">Available Balance</h2>
        <div className="text-3xl font-bold text-gold tabular-nums">₦{balance.toLocaleString()}</div>
        <p className="text-sm text-muted-foreground mt-1">Minimum withdrawal: ₦500</p>
      </GlassCard>

      {showForm && (
        <GlassCard className="p-6 mb-8">
          <h2 className="font-semibold mb-4">New Withdrawal Request</h2>
          {error && (
            <div className="bg-error/10 border border-error/20 rounded-lg p-3 mb-4 text-sm text-error">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Amount (₦)</label>
              <input
                type="number"
                min="500"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent/50"
                placeholder="Enter amount"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Bank Name</label>
              <input
                type="text"
                required
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent/50"
                placeholder="e.g. GTBank"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Account Number</label>
              <input
                type="text"
                required
                maxLength={10}
                pattern="\d{10}"
                value={formData.accountNumber}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent/50"
                placeholder="10-digit account number"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Account Name</label>
              <input
                type="text"
                required
                value={formData.accountName}
                onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent/50"
                placeholder="Account holder name"
              />
            </div>
            <GlassButton type="submit" variant="primary" className="w-full" glow disabled={loading}>
              {loading ? "Processing..." : "Submit Withdrawal Request"}
            </GlassButton>
          </form>
        </GlassCard>
      )}

      <h2 className="font-semibold mb-4">Withdrawal History</h2>
      <div className="space-y-3">
        {withdrawals.length === 0 ? (
          <GlassCard className="p-6 text-center">
            <p className="text-muted-foreground text-sm">No withdrawal history yet.</p>
          </GlassCard>
        ) : (
          withdrawals.map((w) => (
            <GlassCard key={w.id} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-semibold tabular-nums">₦{Number(w.amount).toLocaleString()}</div>
                  <div className="text-xs text-muted">{w.bankName} ••••{w.accountNumber.slice(-4)}</div>
                </div>
                <Badge variant={(STATUS_COLORS[w.status] as "warning" | "gold" | "cyan" | "accent" | "error") || "muted"}>
                  {w.status.replace(/_/g, " ")}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs text-muted">
                <span>{w.reference}</span>
                <span>{new Date(w.createdAt).toLocaleDateString()}</span>
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </div>
  );
}
