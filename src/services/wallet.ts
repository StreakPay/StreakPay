import { db } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export async function getOrCreateWallet(userId: string, currency: string = "NGN") {
  if (!db) throw new Error("Database not available");

  let wallet = await db.wallet.findUnique({
    where: { userId_currency: { userId, currency } },
  });

  if (!wallet) {
    wallet = await db.wallet.create({
      data: {
        id: uuidv4(),
        userId,
        currency,
        balance: 0,
      },
    });
  }

  return wallet;
}

export async function creditWallet(
  userId: string,
  amount: number,
  currency: string,
  type: string,
  source: string,
  reference?: string,
  metadata?: Record<string, any>
) {
  if (!db) throw new Error("Database not available");

  const ref = reference || `ref_${uuidv4().slice(0, 8)}`;

  return db.$transaction(async (tx: any) => {
    const wallet = await tx.wallet.findUnique({
      where: { userId_currency: { userId, currency } },
    });

    if (!wallet) {
      throw new Error("Wallet not found");
    }

    const newBalance = Number(wallet.balance) + amount;

    await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: newBalance },
    });

    const ledgerEntry = await tx.ledgerEntry.create({
      data: {
        id: uuidv4(),
        userId,
        amount,
        currency,
        direction: "credit",
        type,
        reference: ref,
        source,
        status: "completed",
        metadata,
      },
    });

    return { wallet: { ...wallet, balance: newBalance }, ledgerEntry };
  });
}

export async function debitWallet(
  userId: string,
  amount: number,
  currency: string,
  type: string,
  source: string,
  reference?: string,
  metadata?: Record<string, any>
) {
  if (!db) throw new Error("Database not available");

  const ref = reference || `ref_${uuidv4().slice(0, 8)}`;

  return db.$transaction(async (tx: any) => {
    const wallet = await tx.wallet.findUnique({
      where: { userId_currency: { userId, currency } },
    });

    if (!wallet) {
      throw new Error("Wallet not found");
    }

    if (Number(wallet.balance) < amount) {
      throw new Error("Insufficient balance");
    }

    const newBalance = Number(wallet.balance) - amount;

    await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: newBalance },
    });

    const ledgerEntry = await tx.ledgerEntry.create({
      data: {
        id: uuidv4(),
        userId,
        amount,
        currency,
        direction: "debit",
        type,
        reference: ref,
        source,
        status: "completed",
        metadata,
      },
    });

    return { wallet: { ...wallet, balance: newBalance }, ledgerEntry };
  });
}

export async function getWalletBalance(userId: string, currency: string = "NGN") {
  if (!db) return 0;

  const wallet = await db.wallet.findUnique({
    where: { userId_currency: { userId, currency } },
  });

  return wallet ? Number(wallet.balance) : 0;
}

export async function getLedgerEntries(
  userId: string,
  options?: { limit?: number; offset?: number; type?: string }
) {
  if (!db) return [];

  const where: any = { userId };
  if (options?.type) where.type = options.type;

  return db.ledgerEntry.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: options?.limit || 50,
    skip: options?.offset || 0,
  });
}
