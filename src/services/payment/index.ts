import { createClient } from "@/lib/supabase/server";
import { v4 as uuidv4 } from "uuid";

interface PaymentInitiation {
  userId: string;
  amount: number;
  currency: string;
  reference: string;
  metadata?: Record<string, any>;
}

interface PaymentVerification {
  reference: string;
  status: "success" | "failed" | "pending";
  providerReference?: string;
  metadata?: Record<string, any>;
}

interface WebhookPayload {
  event: string;
  reference: string;
  amount?: number;
  status?: string;
  metadata?: Record<string, any>;
  signature?: string;
}

export class PaymentService {
  private provider: string;
  private publicKey: string;
  private secretKey: string;
  private webhookSecret: string;

  constructor() {
    this.provider = process.env.PAYMENT_PROVIDER || "manual";
    this.publicKey = process.env.PAYMENT_PUBLIC_KEY || "";
    this.secretKey = process.env.PAYMENT_SECRET_KEY || "";
    this.webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET || "";
  }

  async initiateVerification(data: PaymentInitiation): Promise<{ authorizationUrl?: string; reference: string }> {
    if (this.provider === "manual") {
      return { reference: data.reference };
    }

    const response = await fetch(`${this.getProviderBaseUrl()}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reference: data.reference,
        amount: data.amount * 100,
        currency: data.currency,
        metadata: {
          userId: data.userId,
          type: "verification",
          ...data.metadata,
        },
      }),
    });

    const result = await response.json();
    return {
      authorizationUrl: result.data?.authorization_url,
      reference: data.reference,
    };
  }

  async verifyPayment(reference: string): Promise<PaymentVerification> {
    if (this.provider === "manual") {
      return { reference, status: "pending" };
    }

    const response = await fetch(`${this.getProviderBaseUrl()}/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
      },
    });

    const result = await response.json();
    return {
      reference,
      status: result.data?.status === "success" ? "success" : "failed",
      providerReference: result.data?.reference,
      metadata: result.data?.metadata,
    };
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (this.provider === "manual") return true;

    const crypto = require("crypto");
    const hash = crypto
      .createHmac("sha512", this.webhookSecret)
      .update(payload)
      .digest("hex");

    return hash === signature;
  }

  verifyWebhookSignatureSafe(payload: string, signature: string): boolean {
    if (this.provider === "manual") return true;

    const crypto = require("crypto");
    const hash = crypto
      .createHmac("sha512", this.webhookSecret)
      .update(payload)
      .digest("hex");

    // Use timing-safe comparison to prevent timing attacks
    if (hash.length !== signature.length) return false;
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
  }

  async processWebhook(payload: WebhookPayload): Promise<void> {
    const supabase = await createClient();

    if (payload.event === "charge.success" && payload.reference) {
      const { data: transaction } = await supabase
        .from("payment_transactions")
        .select("*")
        .eq("provider_reference", payload.reference)
        .single();

      if (transaction && transaction.status === "pending") {
        await supabase
          .from("payment_transactions")
          .update({ status: "success" })
          .eq("id", transaction.id);

        await supabase
          .from("profiles")
          .update({ verification_status: "verified" })
          .eq("id", transaction.user_id);
      }
    }
  }

  private getProviderBaseUrl(): string {
    const providers: Record<string, string> = {
      paystack: "https://api.paystack.co",
      flutterwave: "https://api.flutterwave.com/v3",
    };
    return providers[this.provider] || "";
  }
}

export function generatePaymentReference(): string {
  return `SP-${Date.now()}-${uuidv4().slice(0, 8)}`;
}
