import { createClient } from "@/lib/supabase/server";
import { v4 as uuidv4 } from "uuid";

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
  const high = Math.max(open, close) + Math.random() * VOLATILITY * previousClose * 0.5;
  const low = Math.min(open, close) - Math.random() * VOLATILITY * previousClose * 0.5;
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

export async function getCurrentPrice() {
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

  return Number(marketState.current_price);
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
    .limit(limit);

  return data || [];
}

export async function placeOrder(
  userId: string,
  side: "buy" | "sell",
  quantity: number,
  price?: number
) {
  const supabase = await createClient();

  const currentPrice = await getCurrentPrice();
  const executionPrice = price || currentPrice;
  const totalCost = quantity * executionPrice;

  const { data: account, error: accountError } = await supabase
    .from("trading_accounts")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (accountError || !account) throw new Error("Trading account not found");

  if (side === "buy") {
    if (Number(account.cash_balance) < totalCost) {
      throw new Error("Insufficient balance");
    }

    await supabase
      .from("trading_accounts")
      .update({ cash_balance: Number(account.cash_balance) - totalCost })
      .eq("id", account.id);

    const { data: existingPosition } = await supabase
      .from("trading_positions")
      .select("*")
      .eq("trading_account_id", account.id)
      .eq("symbol", "SPK")
      .single();

    if (existingPosition) {
      const totalQuantity = Number(existingPosition.quantity) + quantity;
      const avgPrice =
        (Number(existingPosition.average_price) * Number(existingPosition.quantity) +
          executionPrice * quantity) /
        totalQuantity;

      await supabase
        .from("trading_positions")
        .update({ quantity: totalQuantity, average_price: avgPrice })
        .eq("id", existingPosition.id);
    } else {
      await supabase.from("trading_positions").insert({
        id: uuidv4(),
        trading_account_id: account.id,
        symbol: "SPK",
        quantity,
        average_price: executionPrice,
      });
    }
  } else {
    const { data: position } = await supabase
      .from("trading_positions")
      .select("*")
      .eq("trading_account_id", account.id)
      .eq("symbol", "SPK")
      .single();

    if (!position || Number(position.quantity) < quantity) {
      throw new Error("Insufficient position");
    }

    const newQuantity = Number(position.quantity) - quantity;
    const pnl = (executionPrice - Number(position.average_price)) * quantity;

    if (newQuantity === 0) {
      await supabase.from("trading_positions").delete().eq("id", position.id);
    } else {
      await supabase
        .from("trading_positions")
        .update({ quantity: newQuantity })
        .eq("id", position.id);
    }

    await supabase
      .from("trading_accounts")
      .update({
        cash_balance: Number(account.cash_balance) + totalCost,
        total_pnl: Number(account.total_pnl) + pnl,
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
      quantity,
      price: executionPrice,
      status: "filled",
      executed_at: new Date().toISOString(),
    })
    .select()
    .single();

  return order;
}

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
    .limit(20);

  const currentPrice = await getCurrentPrice();

  const enrichedPositions = (positions as TradingPosition[] || []).map((p) => ({
    ...p,
    current_price: currentPrice,
    unrealized_pnl: (currentPrice - Number(p.average_price)) * Number(p.quantity),
  }));

  const portfolioValue =
    Number(account.cash_balance) +
    enrichedPositions.reduce(
      (sum, p) => sum + Number(p.quantity) * currentPrice,
      0
    );

  return {
    ...account,
    positions: enrichedPositions,
    orders: orders || [],
    portfolio_value: portfolioValue,
    total_pnl: Number(account.total_pnl),
  };
}
