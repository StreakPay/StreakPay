export type VerificationStatus =
  | "unverified"
  | "payment_pending"
  | "proof_submitted"
  | "under_review"
  | "verified"
  | "rejected"
  | "suspended";

export type WithdrawalStatus =
  | "available"
  | "requested"
  | "under_review"
  | "approved"
  | "processing"
  | "paid"
  | "rejected"
  | "cancelled"
  | "failed";

export type AdminRole =
  | "super_admin"
  | "finance_admin"
  | "support_admin"
  | "content_admin"
  | "moderator";

export type ActivityType =
  | "daily_engagement"
  | "daily_checkin"
  | "daily_quiz"
  | "share_referral";

export type NotificationType =
  | "verification_approved"
  | "verification_rejected"
  | "milestone_reached"
  | "reward_credited"
  | "withdrawal_submitted"
  | "withdrawal_approved"
  | "withdrawal_paid"
  | "withdrawal_rejected"
  | "daily_reminder"
  | "streak_warning"
  | "security_alert"
  | "system_announcement"
  | "ai_insight";

export type OrderSide = "buy" | "sell";
export type OrderStatus = "pending" | "filled" | "cancelled" | "rejected";

export interface User {
  id: string;
  email: string;
  fullName: string;
  profileImage?: string;
  tiktokUsername?: string;
  snapchatUsername?: string;
  verificationStatus: VerificationStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Streak {
  id: string;
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastCompletionDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: string;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LedgerEntry {
  id: string;
  userId: string;
  amount: string;
  currency: string;
  direction: "credit" | "debit";
  type: string;
  reference: string;
  source: string;
  status: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface Milestone {
  id: string;
  requiredStreak: number;
  rewardAmount: string;
  currency: string;
  active: boolean;
  createdAt: Date;
}

export interface TradingAccount {
  id: string;
  userId: string;
  cashBalance: string;
  portfolioValue: string;
  totalPnL: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TradingPosition {
  id: string;
  tradingAccountId: string;
  symbol: string;
  quantity: string;
  averagePrice: string;
  currentPrice: string;
  unrealizedPnL: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SPKCandle {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  createdAt: Date;
  updatedAt: Date;
}
