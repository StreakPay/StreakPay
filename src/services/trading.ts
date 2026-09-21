import { createClient } from "@/lib/supabase/server";
import { v4 as uuidv4 } from "uuid";
import { safeNumber } from "@/lib/math";

interface TradingPosition {
  id: string;
  trading_account_id: string;
  symbol: string;
  quantity: number;
  average_price: number;
  [key: string]: unknown;
}

const BASE_PRICE = parseFloat(process.env.SPK_BASE_PRICE || "1.0");
const VOLATILITY = parseFloat(process.env.SPK_VOLATILITY || "0.02");
const SENTIMENT = parseFloat(process.env.SPK_SENTIMENT || "0.001");

function generateCandle(
  previousClose: number,
  timestamp: Date,
  timeframe: string
) {
  const change = (Math.random() - 0.48) * VOLATILITY * previousClose;
  const sentimentBias = SENTIMENT * previousClose;
  const open = previousClose;
  const close = Math.max(0.01, open + change + sentimentBias);
  const high =
    Math.max(open, close) + Math.random() * VOLATILITY * previousClose * 0.5;
  const low =
    Math.min(open, close) - Math.random() * VOLATILITY * previousClose * 0.5;
  const volume = Math.floor(Math.random() * 10000) + 1000;

  return {
    id: uuidv4(),
    timestamp: timestamp.toISOString(),
    open: Math.max(0.01, open),
    high: Math.max(0.01, high),
    low: Math.max(0.01, low),
    close: Math.max(0.01, close),
    volume,
    timeframe,
  };
}

export async function getCurrentPrice(): Promise<number> {
  const supabase = await createClient();

  const { data: marketState } = await supabase
    .from("market_state")
    .select("current_price")
    .eq("symbol", "SPK")
    .single();

  if (!marketState) {
    await supabase.from("market_state").insert({
      id: uuidv4(),
      symbol: "SPK",
      base_price: BASE_PRICE,
      current_price: BASE_PRICE,
      volatility: VOLATILITY,
      sentiment: 0,
    });
    return BASE_PRICE;
  }

  const price = Number(marketState.current_price);
  if (!Number.isFinite(price) || price <= 0) return BASE_PRICE;
  return price;
}

export async function generateNewCandle(timeframe: string = "1m") {
  const supabase = await createClient();

  const currentPrice = await getCurrentPrice();
  const now = new Date();

  const candle = generateCandle(currentPrice, now, timeframe);

  await supabase.from("spk_candles").upsert(candle, {
    onConflict: "timestamp,timeframe",
  });

  await supabase
    .from("market_state")
    .update({
      current_price: candle.close,
      last_updated: now.toISOString(),
    })
    .eq("symbol", "SPK");

  return candle;
}

export async function getCandles(timeframe: string = "1m", limit: number = 50) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("spk_candles")
    .select("*")
    .eq("timeframe", timeframe)
    .order("timestamp", { ascending: false })
    .limit(Math.min(limit, 200));

  return data || [];
}

/**
 * Place a buy or sell order. All validation is server-side.
 */
export async function placeOrder(
  userId: string,
  side: "buy" | "sell",
  quantity: number,
  price?: number
) {
  const supabase = await createClient();

  // ---- Server-side input validation ----
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error("Invalid quantity");
  }

  // Round to 4 decimal places
  const qty = Math.round(quantity * 10000) / 10000;

  const currentPrice = await getCurrentPrice();
  const executionPrice =
    price && Number.isFinite(price) && price > 0
      ? Math.round(price * 10000) / 10000
      : currentPrice;

  if (!Number.isFinite(executionPrice) || executionPrice <= 0) {
    throw new Error("Invalid price");
  }

  const totalCost = qty * executionPrice;
  if (!Number.isFinite(totalCost) || totalCost <= 0) {
    throw new Error("Invalid order total");
  }

  // ---- Fetch account ----
  const { data: account, error: accountError } = await supabase
    .from("trading_accounts")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (accountError || !account) throw new Error("Trading account not found");

  const cashBalance = safeNumber(account.cash_balance);
  const totalPnl = safeNumber(account.total_pnl);
  const realizedPnl = safeNumber(account.realized_pnl);

  if (side === "buy") {
    // ---- BUY validation ----
    if (cashBalance < totalCost) {
      throw new Error("Insufficient balance");
    }

    const newCashBalance = Math.round((cashBalance - totalCost) * 100) / 100;
    if (newCashBalance < 0) {
      throw new Error("Insufficient balance");
    }

    await supabase
      .from("trading_accounts")
      .update({
        cash_balance: newCashBalance,
        updated_at: new Date().toISOString(),
      })
      .eq("id", account.id);

    const { data: existingPosition } = await supabase
      .from("trading_positions")
      .select("*")
      .eq("trading_account_id", account.id)
      .eq("symbol", "SPK")
      .single();

    if (existingPosition) {
      const prevQty = safeNumber(existingPosition.quantity);
      const prevAvg = safeNumber(existingPosition.average_price);
      const totalQuantity = prevQty + qty;
      const avgPrice =
        totalQuantity > 0
          ? (prevAvg * prevQty + executionPrice * qty) / totalQuantity
          : executionPrice;

      await supabase
        .from("trading_positions")
        .update({
          quantity: Math.round(totalQuantity * 10000) / 10000,
          average_price: Math.round(avgPrice * 10000) / 10000,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingPosition.id);
    } else {
      await supabase.from("trading_positions").insert({
        id: uuidv4(),
        trading_account_id: account.id,
        symbol: "SPK",
        quantity: qty,
        average_price: executionPrice,
      });
    }
  } else {
    // ---- SELL validation ----
    const { data: position } = await supabase
      .from("trading_positions")
      .select("*")
      .eq("trading_account_id", account.id)
      .eq("symbol", "SPK")
      .single();

    const positionQty = position ? safeNumber(position.quantity) : 0;

    if (positionQty < qty) {
      throw new Error("Insufficient position");
    }

    const avgPrice = position ? safeNumber(position.average_price) : 0;
    const pnl = (executionPrice - avgPrice) * qty;
    const newQuantity = Math.round((positionQty - qty) * 10000) / 10000;

    if (newQuantity === 0) {
      await supabase.from("trading_positions").delete().eq("id", position!.id);
    } else {
      await supabase
        .from("trading_positions")
        .update({
          quantity: newQuantity,
          updated_at: new Date().toISOString(),
        })
        .eq("id", position!.id);
    }

    const proceeds = Math.round(totalCost * 100) / 100;
    const newCash = Math.round((cashBalance + proceeds) * 100) / 100;
    const roundedPnl = Math.round(pnl * 100) / 100;

    await supabase
      .from("trading_accounts")
      .update({
        cash_balance: newCash,
        realized_pnl: Math.round((realizedPnl + roundedPnl) * 100) / 100,
        total_pnl: Math.round((totalPnl + roundedPnl) * 100) / 100,
        updated_at: new Date().toISOString(),
      })
      .eq("id", account.id);
  }

  const { data: order } = await supabase
    .from("trading_orders")
    .insert({
      id: uuidv4(),
      trading_account_id: account.id,
      side,
      symbol: "SPK",
      quantity: qty,
      price: executionPrice,
      status: "filled",
      executed_at: new Date().toISOString(),
    })
    .select()
    .single();

  return order;
}

/**
 * Get user's trading account with enriched positions and stats.
 */
export async function getTradingAccount(userId: string) {
  const supabase = await createClient();

  const { data: account } = await supabase
    .from("trading_accounts")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!account) return null;

  const { data: positions } = await supabase
    .from("trading_positions")
    .select("*")
    .eq("trading_account_id", account.id);

  const { data: orders } = await supabase
    .from("trading_orders")
    .select("*")
    .eq("trading_account_id", account.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const currentPrice = await getCurrentPrice();

  const enrichedPositions = (positions as TradingPosition[] || []).map((p) => {
    const qty = safeNumber(p.quantity);
    const avgPrice = safeNumber(p.average_price);
    const unrealized = (currentPrice - avgPrice) * qty;
    return {
      id: p.id,
      symbol: p.symbol,
      quantity: qty,
      averagePrice: avgPrice,
      currentPrice,
      unrealizedPnl: Math.round(unrealized * 100) / 100,
      marketValue: Math.round(qty * currentPrice * 100) / 100,
    };
  });

  const cashBalance = safeNumber(account.cash_balance);
  const positionValue = enrichedPositions.reduce(
    (sum, p) => sum + p.quantity * currentPrice,
    0
  );
  const portfolioValue = cashBalance + positionValue;
  const realizedPnl = safeNumber(account.realized_pnl);
  const unrealizedPnl = enrichedPositions.reduce(
    (sum, p) => sum + p.unrealizedPnl,
    0
  );

  return {
    id: account.id,
    cashBalance: Math.round(cashBalance * 100) / 100,
    portfolioValue: Math.round(portfolioValue * 100) / 100,
    positionValue: Math.round(positionValue * 100) / 100,
    realizedPnl: Math.round(realizedPnl * 100) / 100,
    unrealizedPnl: Math.round(unrealizedPnl * 100) / 100,
    positions: enrichedPositions,
    orders: orders || [],
  };
}
