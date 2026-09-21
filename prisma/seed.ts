import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");
  const passwordHash = await bcrypt.hash("Password1", 12);

  const userA = await prisma.user.create({
    data: {
      id: uuidv4(),
      email: "alice@streakpay.dev",
      passwordHash,
      profile: {
        create: { id: uuidv4(), fullName: "Alice Johnson", verificationStatus: "verified", tiktokUsername: "@alicej", snapchatUsername: "@alice_snap" },
      },
      streak: {
        create: { id: uuidv4(), currentStreak: 23, longestStreak: 31, lastCompletionDate: new Date() },
      },
      wallets: {
        create: [
          { id: uuidv4(), currency: "NGN", balance: 12540 },
          { id: uuidv4(), currency: "USD", balance: 0 },
        ],
      },
      tradingAccount: {
        create: {
          id: uuidv4(), cashBalance: 4120.5, totalPnL: 380.24,
          positions: { create: { id: uuidv4(), symbol: "SPK", quantity: 1000, averagePrice: 1.15 } },
        },
      },
    },
  });

  const userB = await prisma.user.create({
    data: {
      id: uuidv4(),
      email: "bob@streakpay.dev",
      passwordHash,
      profile: { create: { id: uuidv4(), fullName: "Bob Smith", verificationStatus: "verified" } },
      streak: { create: { id: uuidv4(), currentStreak: 17, longestStreak: 25, lastCompletionDate: new Date() } },
      wallets: { create: [{ id: uuidv4(), currency: "NGN", balance: 5000 }] },
      tradingAccount: {
        create: {
          id: uuidv4(), cashBalance: 3200, totalPnL: -80,
          positions: { create: { id: uuidv4(), symbol: "SPK", quantity: 1500, averagePrice: 1.18 } },
        },
      },
    },
  });

  const userC = await prisma.user.create({
    data: {
      id: uuidv4(),
      email: "charlie@streakpay.dev",
      passwordHash,
      profile: { create: { id: uuidv4(), fullName: "Charlie Brown", verificationStatus: "payment_pending" } },
      streak: { create: { id: uuidv4(), currentStreak: 0, longestStreak: 0 } },
      wallets: { create: [{ id: uuidv4(), currency: "NGN", balance: 0 }] },
    },
  });

  await prisma.milestone.create({ data: { id: uuidv4(), requiredStreak: 20, rewardAmount: 5000, currency: "NGN", active: true } });
  await prisma.milestone.create({ data: { id: uuidv4(), requiredStreak: 50, rewardAmount: 40000, currency: "NGN", active: true } });
  await prisma.milestone.create({ data: { id: uuidv4(), requiredStreak: 100, rewardAmount: 110000, currency: "NGN", active: true } });

  await prisma.streakTask.create({ data: { id: uuidv4(), activityType: "daily_engagement", dayNumber: 1, title: "Daily Engagement", description: "Complete today's engagement activity" } });
  await prisma.streakTask.create({ data: { id: uuidv4(), activityType: "daily_checkin", dayNumber: 2, title: "Daily Check-in", description: "Check in to maintain your streak" } });
  await prisma.streakTask.create({ data: { id: uuidv4(), activityType: "daily_quiz", dayNumber: 3, title: "Daily Quiz", description: "Answer today's quiz question" } });
  await prisma.streakTask.create({ data: { id: uuidv4(), activityType: "share_referral", dayNumber: 4, title: "Share & Refer", description: "Share StreakPay with a friend" } });

  await prisma.quizQuestion.create({ data: { id: uuidv4(), question: "What does SPK stand for?", options: JSON.stringify(["Streak Pay Koin", "StreakPay Koin", "Super Pay Koin", "Smart Pay Koin"]), answer: "StreakPay Koin", category: "general" } });
  await prisma.quizQuestion.create({ data: { id: uuidv4(), question: "What is the minimum withdrawal amount?", options: JSON.stringify(["100", "500", "1000", "5000"]), answer: "500", category: "rewards" } });

  await prisma.notification.create({ data: { id: uuidv4(), userId: userA.id, type: "milestone_reached", title: "Milestone Reached!", message: "You've reached a 20-day streak!", read: true } });
  await prisma.notification.create({ data: { id: uuidv4(), userId: userA.id, type: "reward_credited", title: "Reward Credited", message: "5000 has been credited to your wallet.", read: true } });
  await prisma.notification.create({ data: { id: uuidv4(), userId: userA.id, type: "system_announcement", title: "Welcome to StreakPay", message: "Start your streak journey today!", read: false } });

  await prisma.ledgerEntry.create({ data: { id: uuidv4(), userId: userA.id, amount: 5000, currency: "NGN", direction: "credit", type: "reward_credit", reference: "milestone-20-day", source: "streak_milestone", status: "completed" } });

  await prisma.marketState.create({ data: { id: uuidv4(), symbol: "SPK", basePrice: 1.0, currentPrice: 1.2847, volatility: 0.02, sentiment: 0.001 } });

  let price = 1.0;
  const now = new Date();
  for (let i = 50; i >= 0; i--) {
    const change = (Math.random() - 0.48) * 0.02 * price;
    const open = price;
    const close = Math.max(0.01, open + change);
    const high = Math.max(open, close) + Math.random() * 0.01;
    const low = Math.min(open, close) - Math.random() * 0.01;
    const volume = Math.floor(Math.random() * 10000) + 1000;
    const timestamp = new Date(now.getTime() - i * 60000);
    await prisma.sPKCandle.create({ data: { id: uuidv4(), timestamp, open, high, low, close, volume, timeframe: "1m" } });
    price = close;
  }

  console.log("Seed completed!");
  console.log(`Users: Alice (${userA.id}), Bob (${userB.id}), Charlie (${userC.id})`);
}

main().then(() => prisma.$disconnect()).catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
