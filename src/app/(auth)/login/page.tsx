"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassInput } from "@/components/ui/glass-input";
import { GlassButton } from "@/components/ui/glass-button";
import { useAuth } from "@/hooks/use-auth";

function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/home";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(email, password);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push(redirect);
    }
  };

  return (
    <GlassCard variant="elevated" className="p-8">
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-black font-bold">
            SP
          </div>
        </Link>
        <h1 className="text-2xl font-bold">Welcome Back</h1>
        <p className="text-sm text-muted-foreground mt-1">Sign in to your StreakPay account</p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <GlassInput
          id="email"
          label="Email"
          type="email"
          placeholder="you@example.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="relative">
          <GlassInput
            id="password"
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            className="absolute right-3 top-[38px] text-muted hover:text-foreground"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" className="rounded border-white/10 bg-white/5" />
            Remember me
          </label>
          <Link href="/reset-password" className="text-sm text-accent hover:underline">
            Forgot password?
          </Link>
        </div>

        <GlassButton type="submit" variant="primary" className="w-full" glow disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
        </GlassButton>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-accent hover:underline font-medium">
          Get Started
        </Link>
      </p>
    </GlassCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <GlassCard variant="elevated" className="p-8">
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-6 w-6 animate-spin text-muted" />
        </div>
      </GlassCard>
    }>
      <LoginForm />
    </Suspense>
  );
}
