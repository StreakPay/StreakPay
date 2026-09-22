"use client";

import { useEffect, useState, useRef } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { Badge } from "@/components/ui/badge";
import { Shield, CreditCard, Upload, Clock, CheckCircle, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

const STATUS_CONFIG: Record<string, {
  icon: typeof Shield;
  title: string;
  description: string;
  color: string;
  badge: "muted" | "gold" | "cyan" | "accent" | "error";
}> = {
  unverified: {
    icon: Shield,
    title: "Verify Your Account",
    description: "Complete verification to unlock all features and start earning rewards.",
    color: "text-muted",
    badge: "muted",
  },
  payment_pending: {
    icon: CreditCard,
    title: "Complete Payment",
    description: "Make the verification payment to activate your account.",
    color: "text-gold",
    badge: "gold",
  },
  proof_submitted: {
    icon: Upload,
    title: "Proof Under Review",
    description: "Your payment proof has been submitted. We'll review it shortly.",
    color: "text-cyan",
    badge: "cyan",
  },
  under_review: {
    icon: Clock,
    title: "Under Review",
    description: "Your verification is being reviewed by our team.",
    color: "text-gold",
    badge: "gold",
  },
  verified: {
    icon: CheckCircle,
    title: "Verified",
    description: "Your account is fully verified. You have access to all features.",
    color: "text-accent",
    badge: "accent",
  },
  rejected: {
    icon: XCircle,
    title: "Verification Rejected",
    description: "Your verification was rejected. Please contact support.",
    color: "text-error",
    badge: "error",
  },
  suspended: {
    icon: XCircle,
    title: "Account Suspended",
    description: "Your account has been suspended. Please contact support.",
    color: "text-error",
    badge: "error",
  },
};

export default function VerifyPage() {
  const router = useRouter();
  const [status, setStatus] = useState("unverified");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        setStatus(data.profile?.verificationStatus || "unverified");
      });
  }, []);

  const config = STATUS_CONFIG[status] || STATUS_CONFIG.unverified;
  const Icon = config.icon;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError("");
    setUploadSuccess(false);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setUploadError(data.error || "Upload failed");
      } else {
        setUploadSuccess(true);
        setStatus("proof_submitted");
      }
    } catch {
      setUploadError("Network error");
    }
    setUploading(false);
  };

  return (
    <div className="p-5 md:p-8 lg:p-10 max-w-[600px] mx-auto">
      {/* Header */}
      <div className="mb-10">
        <p className="text-muted text-xs uppercase tracking-widest font-medium mb-1.5">Security</p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Verification</h1>
      </div>

      {/* Status Card */}
      <GlassCard variant="elevated" className="p-8 text-center mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-accent/[0.03] rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className={`inline-flex items-center justify-center h-14 w-14 rounded-2xl glass mb-4 ${config.color}`}>
            <Icon className="h-7 w-7" />
          </div>
          <Badge variant={config.badge} size="md" className="mb-4">
            {status.replace(/_/g, " ").toUpperCase()}
          </Badge>
          <h2 className="text-xl font-bold mb-2">{config.title}</h2>
          <p className="text-sm text-muted-foreground">{config.description}</p>
        </div>
      </GlassCard>

      {status === "unverified" && (
        <>
          <GlassCard className="p-6 mb-5">
            <h2 className="text-sm font-semibold mb-4">Verification Fee</h2>
            <div className="text-3xl font-bold text-gold mb-2 tracking-tight">₦2,000</div>
            <p className="text-sm text-muted-foreground">
              One-time verification fee to activate your account.
            </p>
          </GlassCard>

          <GlassCard className="p-6 mb-5">
            <h2 className="text-sm font-semibold mb-4">Payment Instructions</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <span className="text-accent font-bold">1.</span>
                <div>
                  <p className="font-medium">Bank Transfer</p>
                  <p className="text-muted-foreground">Transfer ₦2,000 to the account below</p>
                </div>
              </div>
              <div className="glass rounded-xl p-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[10px] text-muted uppercase tracking-widest">Bank</div>
                    <div className="font-medium text-sm">[Bank Name]</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted uppercase tracking-widest">Account Number</div>
                    <div className="font-medium text-sm font-mono">[Account Number]</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted uppercase tracking-widest">Account Name</div>
                    <div className="font-medium text-sm">[Account Name]</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted uppercase tracking-widest">Amount</div>
                    <div className="font-bold text-gold text-sm">₦2,000</div>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-accent font-bold">2.</span>
                <div>
                  <p className="font-medium">Upload Proof</p>
                  <p className="text-muted-foreground">Upload a screenshot of your transfer receipt</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-accent font-bold">3.</span>
                <div>
                  <p className="font-medium">Wait for Review</p>
                  <p className="text-muted-foreground">We&apos;ll verify your payment within 24 hours</p>
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="text-sm font-semibold mb-4">Upload Payment Proof</h2>
            {uploadError && (
              <div className="bg-error/8 border border-error/15 rounded-xl p-3 mb-4 text-sm text-error">
                {uploadError}
              </div>
            )}
            {uploadSuccess ? (
              <div className="bg-accent/8 border border-accent/15 rounded-xl p-6 text-center">
                <CheckCircle className="h-8 w-8 text-accent mx-auto mb-2" />
                <p className="text-sm font-medium">Proof uploaded successfully!</p>
                <p className="text-xs text-muted-foreground mt-1">We&apos;ll review it shortly.</p>
              </div>
            ) : (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-white/[0.06] rounded-2xl p-10 text-center hover:border-accent/25 transition-colors cursor-pointer"
                >
                  <Upload className="h-8 w-8 text-muted mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted mt-1">
                    PNG, JPG up to 5MB
                  </p>
                </div>
                <GlassButton
                  variant="primary"
                  className="w-full mt-5"
                  glow
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? "Uploading..." : "Select File"}
                </GlassButton>
              </>
            )}
          </GlassCard>
        </>
      )}

      {(status === "proof_submitted" || status === "under_review") && (
        <GlassCard className="p-6">
          <h2 className="text-sm font-semibold mb-4">Submitted Proof</h2>
          <div className="glass rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Payment Proof</p>
                <p className="text-xs text-muted">Submitted</p>
              </div>
              <Badge variant="cyan">Under Review</Badge>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Our team will review your proof within 24 hours. You&apos;ll receive a notification once verified.
          </p>
        </GlassCard>
      )}

      {status === "verified" && (
        <GlassCard className="p-8 text-center">
          <CheckCircle className="h-12 w-12 text-accent mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Account Verified!</h2>
          <p className="text-sm text-muted-foreground">
            Your account is fully verified. You can now access all features including streaks, rewards, and trading.
          </p>
        </GlassCard>
      )}

      {(status === "rejected" || status === "suspended") && (
        <GlassCard className="p-6">
          <h2 className="text-sm font-semibold mb-3">Need Help?</h2>
          <p className="text-sm text-muted-foreground mb-5">
            If you believe this is an error, please contact our support team for assistance.
          </p>
          <GlassButton variant="primary" onClick={() => router.push("/support")} className="w-full">
            Contact Support
          </GlassButton>
        </GlassCard>
      )}
    </div>
  );
}
