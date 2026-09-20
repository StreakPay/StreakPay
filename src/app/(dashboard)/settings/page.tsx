"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassInput } from "@/components/ui/glass-input";
import { GlassButton } from "@/components/ui/glass-button";
import { useAuth } from "@/hooks/use-auth";
import { User, Lock, Bell, Shield, LogOut } from "lucide-react";

export default function SettingsPage() {
  const { user, logout } = useAuth();
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
    <div className="min-h-screen p-4 md:p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Settings</h1>

      <GlassCard className="p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <User className="h-5 w-5 text-accent" />
          <h2 className="font-semibold">Profile</h2>
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
          <GlassButton onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </GlassButton>
        </div>
      </GlassCard>

      <GlassCard className="p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Lock className="h-5 w-5 text-gold" />
          <h2 className="font-semibold">Security</h2>
        </div>
        <GlassButton variant="secondary" className="w-full">
          Change Password
        </GlassButton>
      </GlassCard>

      <GlassCard className="p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="h-5 w-5 text-cyan" />
          <h2 className="font-semibold">Notifications</h2>
        </div>
        <div className="space-y-3">
          {["Daily Reminders", "Milestone Alerts", "Withdrawal Updates", "Security Alerts"].map((item) => (
            <label key={item} className="flex items-center justify-between">
              <span className="text-sm">{item}</span>
              <input type="checkbox" defaultChecked className="rounded border-white/10 bg-white/5" />
            </label>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="h-5 w-5 text-orange" />
          <h2 className="font-semibold">Privacy</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Your TikTok and Snapchat usernames are cosmetic badges only. They are not verified or linked.
        </p>
      </GlassCard>

      <GlassButton variant="danger" className="w-full" onClick={logout}>
        <LogOut className="h-4 w-4" />
        Sign Out
      </GlassButton>
    </div>
  );
}
