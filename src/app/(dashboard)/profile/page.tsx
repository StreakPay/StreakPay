"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { Badge } from "@/components/ui/badge";
import { StreakPayLoader } from "@/components/ui/streakpay-loader";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { Settings, Bell, Shield, MessageCircle, LogOut, ChevronRight } from "lucide-react";

interface ProfileData {
  user: { id: string; email: string; createdAt: string };
  profile: {
    fullName: string;
    profileImage: string | null;
    tiktokUsername: string | null;
    snapchatUsername: string | null;
    verificationStatus: string;
  } | null;
  streak: { currentStreak: number; longestStreak: number } | null;
  wallet: { balance: number; currency: string } | null;
}

const STATUS_BADGES: Record<string, { variant: "muted" | "accent" | "gold" | "cyan" | "error"; label: string }> = {
  unverified: { variant: "muted", label: "Unverified" },
  verified: { variant: "accent", label: "Verified" },
  payment_pending: { variant: "gold", label: "Payment Pending" },
  proof_submitted: { variant: "cyan", label: "Proof Submitted" },
  under_review: { variant: "gold", label: "Under Review" },
  rejected: { variant: "error", label: "Rejected" },
  suspended: { variant: "error", label: "Suspended" },
};

const menuItems = [
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Verification", href: "/verify", icon: Shield },
  { label: "Support", href: "/support", icon: MessageCircle },
];

export default function ProfilePage() {
  const { user: authUser, logout } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<ProfileData | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <StreakPayLoader />
      </div>
    );
  }

  const fullName = data.profile?.fullName || authUser?.fullName || "User";
  const initials = fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  const status = data.profile?.verificationStatus || "unverified";
  const statusBadge = STATUS_BADGES[status] || STATUS_BADGES.unverified;

  const handleSignOut = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[700px] mx-auto">
      {/* Header */}
      <div className="mb-10">
        <p className="text-muted text-xs uppercase tracking-widest font-medium mb-1.5">Account</p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Profile</h1>
      </div>

      {/* Profile Card */}
      <GlassCard variant="elevated" className="p-8 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-accent/[0.03] rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center gap-5 mb-6">
            <div className="h-16 w-16 rounded-2xl bg-accent/10 flex items-center justify-center text-2xl font-bold text-accent">
              {initials}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{fullName}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">{data.user.email}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                {data.streak && (
                  <Badge variant="muted">{data.streak.currentStreak}🔥 streak</Badge>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] text-muted uppercase tracking-widest">Joined</div>
              <div className="text-sm mt-0.5">{new Date(data.user.createdAt).toLocaleDateString()}</div>
            </div>
            <div>
              <div className="text-[10px] text-muted uppercase tracking-widest">Verification</div>
              <div className="text-sm text-accent mt-0.5">{statusBadge.label}</div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Social Links */}
      <GlassCard className="p-6 mb-4">
        <h3 className="text-xs text-muted uppercase tracking-widest font-medium mb-4">Social Links</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-[10px] text-muted uppercase tracking-widest mb-1">TikTok</div>
            <div className="text-sm">{data.profile?.tiktokUsername ? `@${data.profile.tiktokUsername}` : "Not linked"}</div>
          </div>
          <div>
            <div className="text-[10px] text-muted uppercase tracking-widest mb-1">Snapchat</div>
            <div className="text-sm">{data.profile?.snapchatUsername ? `@${data.profile.snapchatUsername}` : "Not linked"}</div>
          </div>
        </div>
      </GlassCard>

      {/* Menu */}
      <GlassCard className="p-3 mb-6">
        {menuItems.map((item, i) => (
          <button
            key={item.label}
            onClick={() => router.push(item.href)}
            className={`w-full flex items-center justify-between px-4 py-3.5 text-sm hover:text-foreground transition-colors rounded-xl hover:bg-white/[0.02] ${
              i !== menuItems.length - 1 ? "border-b border-white/[0.03]" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <item.icon className="h-4 w-4 text-muted" />
              {item.label}
            </div>
            <ChevronRight className="h-4 w-4 text-muted" />
          </button>
        ))}
      </GlassCard>

      <GlassButton variant="danger" className="w-full" onClick={handleSignOut}>
        <LogOut className="h-4 w-4" />
        Sign Out
      </GlassButton>
    </div>
  );
}
