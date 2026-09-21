"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassInput } from "@/components/ui/glass-input";
import { GlassButton } from "@/components/ui/glass-button";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { User, Lock, Bell, Shield, LogOut } from "lucide-react";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [tiktok, setTiktok] = useState("");
  const [snapchat, setSnapchat] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          tiktokUsername: tiktok || null,
          snapchatUsername: snapchat || null,
        }),
      });
      if (res.ok) setSaved(true);
    } catch {}
    setSaving(false);
  };

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[700px] mx-auto">
      {/* Header */}
      <div className="mb-10">
        <p className="text-muted text-xs uppercase tracking-widest font-medium mb-1.5">Preferences</p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Settings</h1>
      </div>

      {/* Profile */}
      <GlassCard className="p-6 mb-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-8 w-8 rounded-lg bg-accent/8 flex items-center justify-center">
            <User className="h-4 w-4 text-accent" />
          </div>
          <h2 className="text-sm font-semibold">Profile</h2>
        </div>
        <div className="space-y-4">
          <GlassInput
            id="fullName"
            label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <GlassInput
            id="email"
            label="Email"
            value={user?.email || ""}
            disabled
          />
          <GlassInput
            id="tiktok"
            label="TikTok Username"
            placeholder="@username"
            value={tiktok}
            onChange={(e) => setTiktok(e.target.value)}
          />
          <GlassInput
            id="snapchat"
            label="Snapchat Username"
            placeholder="@username"
            value={snapchat}
            onChange={(e) => setSnapchat(e.target.value)}
          />
          {saved && <p className="text-sm text-accent">Profile saved!</p>}
          <GlassButton onClick={handleSave} disabled={saving} className="w-full">
            {saving ? "Saving..." : "Save Changes"}
          </GlassButton>
        </div>
      </GlassCard>

      {/* Security */}
      <GlassCard className="p-6 mb-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-8 w-8 rounded-lg bg-gold/8 flex items-center justify-center">
            <Lock className="h-4 w-4 text-gold" />
          </div>
          <h2 className="text-sm font-semibold">Security</h2>
        </div>
        <GlassButton variant="secondary" className="w-full">
          Change Password
        </GlassButton>
      </GlassCard>

      {/* Notifications */}
      <GlassCard className="p-6 mb-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-8 w-8 rounded-lg bg-cyan/8 flex items-center justify-center">
            <Bell className="h-4 w-4 text-cyan" />
          </div>
          <h2 className="text-sm font-semibold">Notifications</h2>
        </div>
        <div className="space-y-3">
          {["Daily Reminders", "Milestone Alerts", "Withdrawal Updates", "Security Alerts"].map((item) => (
            <label key={item} className="flex items-center justify-between py-1">
              <span className="text-sm">{item}</span>
              <input type="checkbox" defaultChecked className="rounded border-white/10 bg-white/5 accent-accent" />
            </label>
          ))}
        </div>
      </GlassCard>

      {/* Privacy */}
      <GlassCard className="p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-8 w-8 rounded-lg bg-orange/8 flex items-center justify-center">
            <Shield className="h-4 w-4 text-orange" />
          </div>
          <h2 className="text-sm font-semibold">Privacy</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Your TikTok and Snapchat usernames are cosmetic badges only. They are not verified or linked.
        </p>
      </GlassCard>

      <GlassButton variant="danger" className="w-full" onClick={async () => { await logout(); router.push("/login"); }}>
        <LogOut className="h-4 w-4" />
        Sign Out
      </GlassButton>
    </div>
  );
}
