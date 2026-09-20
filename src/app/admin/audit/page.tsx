"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";

interface AuditLog {
  id: string;
  actorId: string;
  actorEmail: string;
  action: string;
  targetId: string | null;
  targetType: string | null;
  previousState: Record<string, unknown> | null;
  newState: Record<string, unknown> | null;
  createdAt: string;
}

const ACTION_COLORS: Record<string, string> = {
  ADMIN_APPROVED_WITHDRAWAL: "accent",
  ADMIN_REJECTED_WITHDRAWAL: "error",
  ADMIN_APPROVED_VERIFICATION: "accent",
  ADMIN_REJECTED_VERIFICATION: "error",
  ADMIN_SUSPENDED_USER: "error",
};

function formatAction(action: string) {
  return action
    .replace(/_/g, " ")
    .replace(/ADMIN /, "")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/audit")
      .then((r) => r.json())
      .then((data) => {
        setLogs(data.logs || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Audit Logs</h1>

      {loading ? (
        <div className="p-8 text-muted text-center">Loading...</div>
      ) : logs.length === 0 ? (
        <GlassCard className="p-6 text-center">
          <FileText className="h-8 w-8 text-muted mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">No audit logs yet.</p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <GlassCard key={log.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-semibold text-sm">{formatAction(log.action)}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Actor: {log.actorEmail}
                    {log.targetId && ` • Target: ${log.targetType || "unknown"}`}
                  </div>
                </div>
                <Badge variant={(ACTION_COLORS[log.action] as "muted" | "accent" | "error") || "muted"}>
                  {log.action.split("_").pop()}
                </Badge>
              </div>
              <div className="text-xs text-muted">
                {new Date(log.createdAt).toLocaleString()}
              </div>
              {log.newState && (
                <div className="mt-2 glass rounded-lg p-2 text-xs font-mono">
                  {JSON.stringify(log.newState)}
                </div>
              )}
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
