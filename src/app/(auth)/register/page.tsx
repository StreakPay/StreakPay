"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassInput } from "@/components/ui/glass-input";
import { GlassButton } from "@/components/ui/glass-button";
import { useAuth } from "@/hooks/use-auth";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.fullName.length < 2) {
      newErrors.fullName = "Name must be at least 2 characters";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email address";
    }
    if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = "Password must contain an uppercase letter";
    } else if (!/[a-z]/.test(formData.password)) {
      newErrors.password = "Password must contain a lowercase letter";
    } else if (!/[0-9]/.test(formData.password)) {
      newErrors.password = "Password must contain a number";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");

    if (!validateForm()) return;

    setLoading(true);
    const result = await register(formData);

    if (result.error) {
      setServerError(result.error);
      setLoading(false);
    } else {
      router.push("/home");
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
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
        <h1 className="text-2xl font-bold">Create Account</h1>
        <p className="text-sm text-muted-foreground mt-1">Start building your streak today</p>
      </div>

      {serverError && (
        <div className="mb-4 p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <GlassInput
            id="fullName"
            label="Full Name"
            type="text"
            placeholder="John Doe"
            required
            value={formData.fullName}
            onChange={(e) => updateField("fullName", e.target.value)}
          />
          {errors.fullName && <p className="text-xs text-error mt-1">{errors.fullName}</p>}
        </div>

        <div>
          <GlassInput
            id="email"
            label="Email"
            type="email"
            placeholder="you@example.com"
            required
            value={formData.email}
            onChange={(e) => updateField("email", e.target.value)}
          />
          {errors.email && <p className="text-xs text-error mt-1">{errors.email}</p>}
        </div>

        <div className="relative">
          <GlassInput
            id="password"
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder="Create a strong password"
            required
            value={formData.password}
            onChange={(e) => updateField("password", e.target.value)}
          />
          <button
            type="button"
            className="absolute right-3 top-[38px] text-muted hover:text-foreground"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          {errors.password && <p className="text-xs text-error mt-1">{errors.password}</p>}
        </div>

        <div>
          <GlassInput
            id="confirmPassword"
            label="Confirm Password"
            type="password"
            placeholder="Confirm your password"
            required
            value={formData.confirmPassword}
            onChange={(e) => updateField("confirmPassword", e.target.value)}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-error mt-1">{errors.confirmPassword}</p>
          )}
        </div>

        <GlassButton type="submit" variant="primary" className="w-full" glow disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"}
        </GlassButton>
      </form>

      <p className="text-center text-xs text-muted mt-4">
        By creating an account, you agree to our{" "}
        <Link href="/legal/terms" className="text-foreground hover:underline">Terms</Link>
        {" "}and{" "}
        <Link href="/legal/privacy" className="text-foreground hover:underline">Privacy Policy</Link>
      </p>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-accent hover:underline font-medium">
          Sign In
        </Link>
      </p>
    </GlassCard>
  );
}
