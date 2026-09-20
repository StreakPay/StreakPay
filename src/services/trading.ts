import { db } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

const BASE_PRICE = 1.0;
const VOLATILITY = 0.02;
const SENTIMENT = 0.001;

function generateCandle(
  previousClose: number,
  timestamp: Date,
  timeframe: string
) {
  const change = (Math.random() - 0.48) * VOLATILITY * previousClose;
  const sentimentBias = SENTIMENT * previousClose;
  const open = previousClose;
  const close = Math.max(0.01, open + change + sentimentBias);
  const high = Math.max(open, close) + Math.random() * VOLATILITY * previousClose * 0.5;
  const low = Math.min(open, close) - Math.random() * VOLATILITY * previousClose * 0.5;
  const volume = Math.floor(Math.random() * 10000) + 1000;

  return {
    id: uuidv4(),
    timestamp,
    open: Math.max(0.01, open),
    high: Math.max(0.01, high),
    low: Math.max(0.01, low),
    close: Math.max(0.01, close),
    volume,
    timeframe,
  };
}

export async function getCurrentPrice() {
  if (!db) return BASE_PRICE;

  const marketState = await db.marketState.findUnique({
    where: { symbol: "SPK" },
  });

  if (!marketState) {
    await db.marketState.create({
      data: {
        id: uuidv4(),
        symbol: "SPK",
        basePrice: BASE_PRICE,
        currentPrice: BASE_PRICE,
        volatility: VOLATILITY,
        sentiment: 0,
      },
    });
    return BASE_PRICE;
  }

  return Number(marketState.currentPrice);
}

export async function generateNewCandle(timeframe: string = "1m") {
  if (!db) return null;

  const currentPrice = await getCurrentPrice();
  const now = new Date();

  const candle = generateCandle(currentPrice, now, timeframe);

  await db.$transaction([
    db.sPKCandle.upsert({
      where: { timestamp_timeframe: { timestamp: now, timeframe } },
      update: candle,
      create: candle,
    }),
    db.marketState.update({
      where: { symbol: "SPK" },
      data: {
        currentPrice: candle.close,
        lastUpdated: now,
      },
    }),
  ]);

  return candle;
}

export async function getCandles(timeframe: string = "1m", limit: number = 50) {
  if (!db) return [];

  return db.sPKCandle.findMany({
    where: { timeframe },
    orderBy: { timestamp: "desc" },
    take: limit,
  });
}

export async function placeOrder(
  userId: string,
  side: "buy" | "sell",
  quantity: number,
  price?: number
) {
  if (!db) throw new Error("Database not available");

  const currentPrice = await getCurrentPrice();
  const executionPrice = price || currentPrice;
  const totalCost = quantity * executionPrice;

  return db.$transaction(async (tx: any) => {
    const account = await tx.tradingAccount.findUnique({
      where: { userId },
    });

    if (!account) throw new Error("Trading account not found");

    if (side === "buy") {
      if (Number(account.cashBalance) < totalCost) {
        throw new Error("Insufficient balance");
      }

      await tx.tradingAccount.update({
        where: { id: account.id },
        data: { cashBalance: Number(account.cashBalance) - totalCost },
      });

      const existingPosition = await tx.tradingPosition.findUnique({
        where: { tradingAccountId_symbol: { tradingAccountId: account.id, symbol: "SPK" } },
      });

      if (existingPosition) {
        const totalQuantity = Number(existingPosition.quantity) + quantity;
        const avgPrice =
          (Number(existingPosition.averagePrice) * Number(existingPosition.quantity) +
            executionPrice * quantity) /
          totalQuantity;

        await tx.tradingPosition.update({
          where: { id: existingPosition.id },
          data: { quantity: totalQuantity, averagePrice: avgPrice },
        });
      } else {
        await tx.tradingPosition.create({
          data: {
            id: uuidv4(),
            tradingAccountId: account.id,
            symbol: "SPK",
            quantity,
            averagePrice: executionPrice,
          },
        });
      }
    } else {
      const position = await tx.tradingPosition.findUnique({
        where: { tradingAccountId_symbol: { tradingAccountId: account.id, symbol: "SPK" } },
      });

      if (!position || Number(position.quantity) < quantity) {
        throw new Error("Insufficient position");
      }

      const newQuantity = Number(position.quantity) - quantity;
      const pnl = (executionPrice - Number(position.averagePrice)) * quantity;

      if (newQuantity === 0) {
        await tx.tradingPosition.delete({ where: { id: position.id } });
      } else {
        await tx.tradingPosition.update({
          where: { id: position.id },
          data: { quantity: newQuantity },
        });
      }

      await tx.tradingAccount.update({
        where: { id: account.id },
        data: {
          cashBalance: Number(account.cashBalance) + totalCost,
          totalPnL: Number(account.totalPnL) + pnl,
        },
      });
    }

    const order = await tx.tradingOrder.create({
      data: {
        id: uuidv4(),
        tradingAccountId: account.id,
        side,
        symbol: "SPK",
        quantity,
        price: executionPrice,
        status: "filled",
        executedAt: new Date(),
      },
    });

    return order;
  });
}

export async function getTradingAccount(userId: string) {
  if (!db) return null;

  const account = await db.tradingAccount.findUnique({
    where: { userId },
    include: {
      positions: true,
      orders: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });

  if (!account) return null;

  const currentPrice = await getCurrentPrice();

  const positions = account.positions.map((p: any) => ({
    ...p,
    currentPrice,
    unrealizedPnL: (currentPrice - Number(p.averagePrice)) * Number(p.quantity),
  }));

  const portfolioValue =
    Number(account.cashBalance) +
    positions.reduce(
      (sum: number, p: any) => sum + Number(p.quantity) * currentPrice,
      0
    );

  return {
    ...account,
    positions,
    portfolioValue,
    totalPnL: Number(account.totalPnL),
  };
}
