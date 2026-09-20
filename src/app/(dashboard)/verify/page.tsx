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
    <div className="min-h-screen p-4 md:p-8 max-w-2xl mx-auto">
      <GlassCard variant="elevated" className="p-8 text-center mb-8">
        <div className={`inline-flex items-center justify-center h-16 w-16 rounded-2xl glass mb-4 ${config.color}`}>
          <Icon className="h-8 w-8" />
        </div>
        <Badge variant={config.badge} size="md" className="mb-4">
          {status.replace(/_/g, " ").toUpperCase()}
        </Badge>
        <h1 className="text-2xl font-bold mb-2">{config.title}</h1>
        <p className="text-muted-foreground">{config.description}</p>
      </GlassCard>

      {status === "unverified" && (
        <>
          <GlassCard className="p-6 mb-6">
            <h2 className="font-semibold mb-4">Verification Fee</h2>
            <div className="text-3xl font-bold text-gold mb-2">₦2,000</div>
            <p className="text-sm text-muted-foreground mb-4">
              One-time verification fee to activate your account.
            </p>
          </GlassCard>

          <GlassCard className="p-6 mb-6">
            <h2 className="font-semibold mb-4">Payment Instructions</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <span className="text-accent font-bold">1.</span>
                <div>
                  <p className="font-medium">Bank Transfer</p>
                  <p className="text-muted-foreground">Transfer ₦2,000 to the account below</p>
                </div>
              </div>
              <div className="glass rounded-xl p-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-xs text-muted-foreground">Bank</div>
                    <div className="font-medium">[Bank Name]</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Account Number</div>
                    <div className="font-medium font-mono">[Account Number]</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Account Name</div>
                    <div className="font-medium">[Account Name]</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Amount</div>
                    <div className="font-bold text-gold">₦2,000</div>
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
            <h2 className="font-semibold mb-4">Upload Payment Proof</h2>
            {uploadError && (
              <div className="bg-error/10 border border-error/20 rounded-lg p-3 mb-4 text-sm text-error">
                {uploadError}
              </div>
            )}
            {uploadSuccess ? (
              <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 text-center">
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
                  className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-accent/30 transition-colors cursor-pointer"
                >
                  <Upload className="h-8 w-8 text-muted mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted mt-1">
                    PNG, JPG up to 5MB
                  </p>
                </div>
                <GlassButton
                  variant="primary"
                  className="w-full mt-4"
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
          <h2 className="font-semibold mb-4">Submitted Proof</h2>
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
        <GlassCard className="p-6 text-center">
          <CheckCircle className="h-12 w-12 text-accent mx-auto mb-4" />
          <h2 className="font-semibold mb-2">Account Verified!</h2>
          <p className="text-sm text-muted-foreground">
            Your account is fully verified. You can now access all features including streaks, rewards, and trading.
          </p>
        </GlassCard>
      )}

      {(status === "rejected" || status === "suspended") && (
        <GlassCard className="p-6">
          <h2 className="font-semibold mb-4">Need Help?</h2>
          <p className="text-sm text-muted-foreground mb-4">
            If you believe this is an error, please contact our support team for assistance.
          </p>
          <GlassButton variant="primary" onClick={() => router.push("/support")}>
            Contact Support
          </GlassButton>
        </GlassCard>
      )}
    </div>
  );
}
