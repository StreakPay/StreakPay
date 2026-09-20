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
      return <Gift className="h-5 w-5 text-gold" />;
    case "streak_warning":
      return <AlertTriangle className="h-5 w-5 text-orange" />;
    case "verification_approved":
      return <CheckCircle className="h-5 w-5 text-accent" />;
    case "verification_rejected":
    case "security_alert":
      return <Shield className="h-5 w-5 text-error" />;
    default:
      return <Info className="h-5 w-5 text-cyan" />;
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
    <div className="min-h-screen p-4 md:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <span className="bg-accent/20 text-accent text-xs px-2 py-0.5 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-sm text-accent hover:underline"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <GlassCard className="p-6 text-center">
            <Bell className="h-8 w-8 text-muted mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">No notifications yet.</p>
          </GlassCard>
        ) : (
          notifications.map((n) => (
            <GlassCard
              key={n.id}
              hover
              className={`p-4 ${!n.read ? "border-accent/20" : ""}`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{getNotificationIcon(n.type)}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold">{n.title}</h3>
                    {!n.read && <div className="h-2 w-2 rounded-full bg-accent" />}
                  </div>
                  <p className="text-sm text-muted-foreground">{n.message}</p>
                  <p className="text-xs text-muted mt-1">{timeAgo(n.createdAt)}</p>
                </div>
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </div>
  );
}
