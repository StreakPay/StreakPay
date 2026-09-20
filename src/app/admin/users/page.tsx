"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Users, Search } from "lucide-react";

interface User {
  id: string;
  email: string;
  createdAt: string;
  profile: {
    fullName: string;
    verificationStatus: string;
  } | null;
  streak: {
    currentStreak: number;
  } | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => {
        setUsers(data.users || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      u.profile?.fullName?.toLowerCase().includes(q)
    );
  });

  const statusVariant = (status: string) => {
    switch (status) {
      case "verified": return "accent";
      case "rejected": case "suspended": return "error";
      default: return "muted";
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Users</h1>

      <div className="mb-6 relative">
        <Search className="h-4 w-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-accent/50"
        />
      </div>

      {loading ? (
        <div className="p-8 text-muted text-center">Loading...</div>
      ) : filtered.length === 0 ? (
        <GlassCard className="p-6 text-center">
          <Users className="h-8 w-8 text-muted mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">No users found.</p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {filtered.map((user) => (
            <GlassCard key={user.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{user.profile?.fullName || "No name"}</div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                  <div className="text-xs text-muted mt-1">
                    Joined {new Date(user.createdAt).toLocaleDateString()}
                    {user.streak ? ` • ${user.streak.currentStreak} day streak` : ""}
                  </div>
                </div>
                <Badge variant={statusVariant(user.profile?.verificationStatus || "unverified") as "muted" | "accent" | "error"}>
                  {user.profile?.verificationStatus?.replace(/_/g, " ") || "unverified"}
                </Badge>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
