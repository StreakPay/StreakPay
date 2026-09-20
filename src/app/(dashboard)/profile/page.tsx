"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";

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

export default function ProfilePage() {
  const { user: authUser, logout } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<ProfileData | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) return <div className="p-8 text-muted">Loading...</div>;

  const fullName = data.profile?.fullName || authUser?.fullName || "User";
  const initials = fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  const status = data.profile?.verificationStatus || "unverified";
  const statusBadge = STATUS_BADGES[status] || STATUS_BADGES.unverified;

  const handleSignOut = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Profile</h1>

      <GlassCard variant="elevated" className="p-8 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center text-2xl font-bold text-accent">
            {initials}
          </div>
          <div>
            <h2 className="text-xl font-semibold">{fullName}</h2>
            <p className="text-sm text-muted-foreground">{data.user.email}</p>
            <div className="flex gap-2 mt-1">
              <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
              {data.streak && (
                <Badge variant="muted">{data.streak.currentStreak}🔥 streak</Badge>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-muted-foreground">Account Created</div>
            <div className="text-sm">{new Date(data.user.createdAt).toLocaleDateString()}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Verification</div>
            <div className="text-sm text-accent">{statusBadge.label}</div>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-6 mb-4">
        <h3 className="font-semibold mb-3">Social Links</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-muted-foreground mb-1">TikTok</div>
            <div className="text-sm">{data.profile?.tiktokUsername ? `@${data.profile.tiktokUsername}` : "Not linked"}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Snapchat</div>
            <div className="text-sm">{data.profile?.snapchatUsername ? `@${data.profile.snapchatUsername}` : "Not linked"}</div>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-6 mb-4">
        <h3 className="font-semibold mb-3">Settings</h3>
        <div className="space-y-3">
          {[
            { label: "Edit Profile", href: "/settings" },
            { label: "Notifications", href: "/notifications" },
            { label: "Verification", href: "/verify" },
            { label: "Support", href: "/support" },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => router.push(item.href)}
              className="w-full flex items-center justify-between py-2 text-sm hover:text-accent transition-colors"
            >
              {item.label}
              <span className="text-muted">→</span>
            </button>
          ))}
        </div>
      </GlassCard>

      <GlassButton variant="danger" className="w-full" onClick={handleSignOut}>
        Sign Out
      </GlassButton>
    </div>
  );
}
