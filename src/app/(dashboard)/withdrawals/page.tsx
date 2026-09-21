"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassInput } from "@/components/ui/glass-input";
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
    <div className="p-5 md:p-8 lg:p-10 max-w-[700px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <p className="text-muted text-xs uppercase tracking-widest font-medium mb-1.5">Wallet</p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Withdrawals</h1>
        </div>
        <GlassButton variant="primary" glow onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "New Withdrawal"}
        </GlassButton>
      </div>

      {/* Balance */}
      <GlassCard variant="elevated" className="p-6 mb-8">
        <div className="text-xs text-muted uppercase tracking-widest font-medium mb-2">Available Balance</div>
        <div className="text-3xl font-bold text-gold tabular-nums tracking-tight">\u20A6{balance.toLocaleString()}</div>
        <p className="text-xs text-muted mt-1">Minimum withdrawal: \u20A6500</p>
      </GlassCard>

      {showForm && (
        <GlassCard className="p-6 mb-8">
          <h2 className="text-sm font-semibold mb-5">New Withdrawal Request</h2>
          {error && (
            <div className="bg-error/8 border border-error/15 rounded-xl p-3 mb-5 text-sm text-error">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <GlassInput
              id="amount"
              label="Amount (\u20A6)"
              type="number"
              min="500"
              required
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="Enter amount"
            />
            <GlassInput
              id="bankName"
              label="Bank Name"
              required
              value={formData.bankName}
              onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
              placeholder="e.g. GTBank"
            />
            <GlassInput
              id="accountNumber"
              label="Account Number"
              required
              maxLength={10}
              pattern="\d{10}"
              value={formData.accountNumber}
              onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
              placeholder="10-digit account number"
            />
            <GlassInput
              id="accountName"
              label="Account Name"
              required
              value={formData.accountName}
              onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
              placeholder="Account holder name"
            />
            <GlassButton type="submit" variant="primary" className="w-full" glow disabled={loading}>
              {loading ? "Processing..." : "Submit Withdrawal Request"}
            </GlassButton>
          </form>
        </GlassCard>
      )}

      {/* History */}
      <h2 className="text-xs text-muted uppercase tracking-widest font-medium mb-5">History</h2>
      <div className="space-y-3">
        {withdrawals.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <p className="text-muted-foreground text-sm">No withdrawal history yet.</p>
          </GlassCard>
        ) : (
          withdrawals.map((w) => (
            <GlassCard key={w.id} className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-semibold tabular-nums">\u20A6{Number(w.amount).toLocaleString()}</div>
                  <div className="text-xs text-muted mt-0.5">{w.bankName} \u2022\u2022\u2022\u2022{w.accountNumber.slice(-4)}</div>
                </div>
                <Badge variant={(STATUS_COLORS[w.status] as "warning" | "gold" | "cyan" | "accent" | "error") || "muted"}>
                  {w.status.replace(/_/g, " ")}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs text-muted mt-2 pt-2 border-t border-white/[0.03]">
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
