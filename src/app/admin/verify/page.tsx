"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, XCircle } from "lucide-react";

interface Verification {
  id: string;
  fileUrl: string;
  fileName: string;
  status: string;
  createdAt: string;
  user: {
    id: string;
    email: string;
    profile: {
      fullName: string;
      verificationStatus: string;
    } | null;
  };
}

export default function AdminVerifyPage() {
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchVerifications = () => {
    fetch("/api/admin/verify")
      .then((r) => r.json())
      .then((data) => {
        setVerifications(data.pending || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchVerifications();
  }, []);

  const handleAction = async (userId: string, approved: boolean) => {
    setActionLoading(userId);
    try {
      await fetch("/api/admin/verify/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, approved }),
      });
      fetchVerifications();
    } catch {}
    setActionLoading(null);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Verification Reviews</h1>

      {loading ? (
        <div className="p-8 text-muted text-center">Loading...</div>
      ) : verifications.length === 0 ? (
        <GlassCard className="p-6 text-center">
          <Shield className="h-8 w-8 text-muted mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">No pending verifications.</p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {verifications.map((v) => (
            <GlassCard key={v.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="font-semibold">{v.user.profile?.fullName || "No name"}</div>
                  <div className="text-sm text-muted-foreground">{v.user.email}</div>
                  <div className="text-xs text-muted mt-1">
                    Submitted {new Date(v.createdAt).toLocaleString()}
                  </div>
                </div>
                <Badge variant="gold">Pending Review</Badge>
              </div>

              <div className="glass rounded-xl p-4 mb-4">
                <div className="text-sm">
                  <span className="text-muted-foreground">File: </span>
                  <span className="font-medium">{v.fileName}</span>
                </div>
                <div className="text-sm mt-1">
                  <span className="text-muted-foreground">Status: </span>
                  <span>{v.user.profile?.verificationStatus?.replace(/_/g, " ")}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <GlassButton
                  variant="primary"
                  onClick={() => handleAction(v.user.id, true)}
                  disabled={actionLoading === v.user.id}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {actionLoading === v.user.id ? "Processing..." : "Approve"}
                </GlassButton>
                <GlassButton
                  variant="danger"
                  onClick={() => handleAction(v.user.id, false)}
                  disabled={actionLoading === v.user.id}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {actionLoading === v.user.id ? "Processing..." : "Reject"}
                </GlassButton>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
