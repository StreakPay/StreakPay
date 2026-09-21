"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Bell, CheckCircle, AlertTriangle, Info, Gift, Shield } from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

function getNotificationIcon(type: string) {
  switch (type) {
    case "milestone_reached":
    case "reward_credited":
      return <Gift className="h-4 w-4 text-gold" />;
    case "streak_warning":
      return <AlertTriangle className="h-4 w-4 text-orange" />;
    case "verification_approved":
      return <CheckCircle className="h-4 w-4 text-accent" />;
    case "verification_rejected":
    case "security_alert":
      return <Shield className="h-4 w-4 text-error" />;
    default:
      return <Info className="h-4 w-4 text-cyan" />;
  }
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      });
  }, []);

  const handleMarkAllRead = async () => {
    await fetch("/api/notifications", { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[700px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <p className="text-muted text-xs uppercase tracking-widest font-medium mb-1.5">Activity</p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Notifications</h1>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs text-accent hover:underline font-medium"
          >
            Mark all read ({unreadCount})
          </button>
        )}
      </div>

      <div className="space-y-2">
        {notifications.length === 0 ? (
          <GlassCard className="p-10 text-center">
            <Bell className="h-8 w-8 text-muted mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No notifications yet.</p>
          </GlassCard>
        ) : (
          notifications.map((n) => (
            <GlassCard
              key={n.id}
              hover
              className={`p-4 ${!n.read ? "border-accent/15" : ""}`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{getNotificationIcon(n.type)}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-sm font-semibold">{n.title}</h3>
                    {!n.read && <div className="h-1.5 w-1.5 rounded-full bg-accent" />}
                  </div>
                  <p className="text-sm text-muted-foreground">{n.message}</p>
                  <p className="text-[10px] text-muted mt-1.5">{timeAgo(n.createdAt)}</p>
                </div>
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </div>
  );
}
