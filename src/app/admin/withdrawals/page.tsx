"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, CheckCircle, XCircle } from "lucide-react";

interface Withdrawal {
  id: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
  reference: string;
  status: string;
  createdAt: string;
  user: {
    id: string;
    email: string;
    profile: { fullName: string } | null;
  };
}

const STATUS_COLORS: Record<string, string> = {
  requested: "warning",
  under_review: "gold",
  approved: "cyan",
  rejected: "error",
};

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchWithdrawals = () => {
    fetch("/api/admin/withdrawals")
      .then((r) => r.json())
      .then((data) => {
        setWithdrawals(data.pending || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const handleAction = async (withdrawalId: string, action: "approve" | "reject") => {
    setActionLoading(withdrawalId);
    try {
      await fetch("/api/admin/withdrawals/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ withdrawalId, action }),
      });
      fetchWithdrawals();
    } catch {}
    setActionLoading(null);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Withdrawal Reviews</h1>

      {loading ? (
        <div className="p-8 text-muted text-center">Loading...</div>
      ) : withdrawals.length === 0 ? (
        <GlassCard className="p-6 text-center">
          <CreditCard className="h-8 w-8 text-muted mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">No pending withdrawals.</p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {withdrawals.map((w) => (
            <GlassCard key={w.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="font-semibold text-xl tabular-nums">₦{Number(w.amount).toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">
                    {w.user.profile?.fullName || w.user.email}
                  </div>
                  <div className="text-xs text-muted mt-1">
                    {w.bankName} ••••{w.accountNumber.slice(-4)} • {w.accountName}
                  </div>
                </div>
                <Badge variant={(STATUS_COLORS[w.status] as "warning" | "gold" | "cyan" | "accent" | "error") || "muted"}>
                  {w.status.replace(/_/g, " ")}
                </Badge>
              </div>

              <div className="glass rounded-xl p-3 mb-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reference</span>
                  <span className="font-mono">{w.reference}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-muted-foreground">Requested</span>
                  <span>{new Date(w.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <GlassButton
                  variant="primary"
                  onClick={() => handleAction(w.id, "approve")}
                  disabled={actionLoading === w.id}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {actionLoading === w.id ? "Processing..." : "Approve"}
                </GlassButton>
                <GlassButton
                  variant="danger"
                  onClick={() => handleAction(w.id, "reject")}
                  disabled={actionLoading === w.id}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {actionLoading === w.id ? "Processing..." : "Reject"}
                </GlassButton>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
