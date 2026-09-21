"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassInput } from "@/components/ui/glass-input";
import { safeNumber, safeDivide } from "@/lib/math";

interface Candle {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface Position {
  symbol: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  unrealizedPnl: number;
  marketValue: number;
}

interface Order {
  id: string;
  side: string;
  symbol: string;
  quantity: number;
  price: number;
  status: string;
  executed_at: string;
  created_at: string;
}

interface Account {
  cashBalance: number;
  portfolioValue: number;
  positionValue: number;
  realizedPnl: number;
  unrealizedPnl: number;
  positions: Position[];
  orders: Order[];
}

type TradeTab = "chart" | "history";

export default function TradePage() {
  const [price, setPrice] = useState(1.0);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [account, setAccount] = useState<Account | null>(null);
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [timeframe, setTimeframe] = useState("1m");
  const [error, setError] = useState("");
  const [tradeTab, setTradeTab] = useState<TradeTab>("chart");
  const [history, setHistory] = useState<Order[]>([]);

  const fetchPrice = async () => {
    try {
      const res = await fetch("/api/trading/price");
      const data = await res.json();
      setPrice(data.price);
    } catch {}
  };

  const fetchData = async () => {
    try {
      const [priceRes, candlesRes, accountRes] = await Promise.all([
        fetch("/api/trading/price"),
        fetch(`/api/trading/candles?timeframe=${timeframe}&limit=30`),
        fetch("/api/trading/account"),
      ]);
      const priceData = await priceRes.json();
      const candlesData = await candlesRes.json();
      const accountData = await accountRes.json();
      setPrice(priceData.price);
      setCandles(candlesData.candles);
      setAccount(accountData.account);
    } catch {}
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/trading/history?limit=50");
      const data = await res.json();
      setHistory(data.history || []);
    } catch {}
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchPrice, 5000);
    return () => clearInterval(interval);
  }, []);

  const executeOrder = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    setLoading(true);
    setError("");
    try {
      const spendAmount = parseFloat(amount);
      const qty = safeDivide(spendAmount, price);

      if (side === "sell" && account) {
        const totalQty = account.positions.reduce(
          (sum, p) => sum + p.quantity,
          0
        );
        if (qty > totalQty) {
          setError("Insufficient SPK holdings");
          setLoading(false);
          return;
        }
      }

      const res = await fetch("/api/trading/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ side, quantity: qty }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Order failed");
      } else {
        setAmount("");
        fetchData();
      }
    } catch {
      setError("Network error");
    }
    setLoading(false);
  };

  const handleTabChange = (tab: TradeTab) => {
    setTradeTab(tab);
    if (tab === "history" && history.length === 0) {
      fetchHistory();
    }
  };

  const priceChange =
    candles.length >= 2
      ? safeDivide(
          candles[candles.length - 1].close - candles[0].open,
          candles[0].open
        ) * 100
      : 0;

  const totalQty = account
    ? account.positions.reduce((sum, p) => sum + p.quantity, 0)
    : 0;

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Trading Terminal</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] px-2 py-0.5 rounded bg-accent/10 text-accent font-medium">
              SPK — SIMULATED ASSET
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-gold/10 text-gold font-medium">
              VIRTUAL MONEY ONLY
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/10 text-red-400 font-medium">
              NO REAL MONEY
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold tabular-nums">
            ${price.toFixed(4)}
          </div>
          <div
            className={`text-sm ${priceChange >= 0 ? "text-accent" : "text-error"}`}
          >
            {priceChange >= 0 ? "+" : ""}
            {priceChange.toFixed(2)}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart / History */}
        <GlassCard variant="elevated" className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-1">
              <button
                onClick={() => handleTabChange("chart")}
                className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                  tradeTab === "chart"
                    ? "bg-accent/10 text-accent"
                    : "hover:bg-white/[0.05] text-muted"
                }`}
              >
                Chart
              </button>
              <button
                onClick={() => handleTabChange("history")}
                className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                  tradeTab === "history"
                    ? "bg-accent/10 text-accent"
                    : "hover:bg-white/[0.05] text-muted"
                }`}
              >
                Trade History
              </button>
            </div>
            {tradeTab === "chart" && (
              <div className="flex gap-1">
                {["1m", "5m", "15m", "1h"].map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                      tf === timeframe
                        ? "bg-accent/10 text-accent"
                        : "hover:bg-white/[0.05] text-muted"
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            )}
          </div>

          {tradeTab === "chart" ? (
            <>
              <div className="h-64 flex items-end gap-px">
                {candles.map((c, i) => {
                  const h = Math.max(
                    10,
                    safeDivide(c.high - c.low, c.high) * 100
                  );
                  const green = c.close >= c.open;
                  return (
                    <div
                      key={i}
                      className="flex-1 rounded-t transition-all duration-300"
                      style={{
                        height: `${h}%`,
                        background: green
                          ? "rgba(34, 197, 94, 0.5)"
                          : "rgba(239, 68, 68, 0.5)",
                      }}
                      title={`O:${c.open.toFixed(4)} H:${c.high.toFixed(4)} L:${c.low.toFixed(4)} C:${c.close.toFixed(4)}`}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between text-xs text-muted mt-2">
                <span>
                  Vol:{" "}
                  {safeNumber(
                    candles[candles.length - 1]?.volume
                  ).toLocaleString()}
                </span>
                <span>
                  Last: ${safeNumber(candles[candles.length - 1]?.close).toFixed(4)}
                </span>
              </div>
            </>
          ) : (
            <div className="max-h-72 overflow-y-auto">
              {history.length === 0 ? (
                <div className="text-center py-8 text-muted text-sm">
                  No trades yet
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-muted-foreground text-xs">
                      <th className="text-left pb-2">Side</th>
                      <th className="text-right pb-2">Qty</th>
                      <th className="text-right pb-2">Price</th>
                      <th className="text-right pb-2">Total</th>
                      <th className="text-right pb-2">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((o) => (
                      <tr key={o.id} className="border-t border-white/[0.06]">
                        <td
                          className={`py-1.5 font-medium ${
                            o.side === "buy" ? "text-accent" : "text-error"
                          }`}
                        >
                          {o.side.toUpperCase()}
                        </td>
                        <td className="text-right py-1.5 tabular-nums">
                          {safeNumber(o.quantity).toFixed(2)}
                        </td>
                        <td className="text-right py-1.5 tabular-nums">
                          ${safeNumber(o.price).toFixed(4)}
                        </td>
                        <td className="text-right py-1.5 tabular-nums">
                          ${(safeNumber(o.quantity) * safeNumber(o.price)).toFixed(2)}
                        </td>
                        <td className="text-right py-1.5 text-muted">
                          {new Date(o.executed_at || o.created_at).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </GlassCard>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Portfolio */}
          <GlassCard variant="elevated" className="p-6">
            <h3 className="font-semibold mb-4">Your Portfolio</h3>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-muted-foreground">
                  Portfolio Value
                </div>
                <div className="text-xl font-bold tabular-nums">
                  ${safeNumber(account?.portfolioValue).toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">
                  Available Cash
                </div>
                <div className="text-lg tabular-nums">
                  ${safeNumber(account?.cashBalance).toFixed(2)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-muted-foreground">
                    Realized P&L
                  </div>
                  <div
                    className={`text-sm font-semibold tabular-nums ${
                      safeNumber(account?.realizedPnl) >= 0
                        ? "text-accent"
                        : "text-error"
                    }`}
                  >
                    {safeNumber(account?.realizedPnl) >= 0 ? "+" : ""}$
                    {safeNumber(account?.realizedPnl).toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">
                    Unrealized P&L
                  </div>
                  <div
                    className={`text-sm font-semibold tabular-nums ${
                      safeNumber(account?.unrealizedPnl) >= 0
                        ? "text-accent"
                        : "text-error"
                    }`}
                  >
                    {safeNumber(account?.unrealizedPnl) >= 0 ? "+" : ""}$
                    {safeNumber(account?.unrealizedPnl).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
            {account?.positions && account.positions.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/[0.06]">
                <div className="text-xs text-muted-foreground mb-2">
                  SPK Holdings
                </div>
                {account.positions.map((p, i) => (
                  <div key={i} className="flex justify-between text-sm mb-1">
                    <span className="tabular-nums">
                      {safeNumber(p.quantity).toFixed(2)} SPK
                    </span>
                    <span className="text-muted tabular-nums">
                      @${safeNumber(p.averagePrice).toFixed(4)}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between text-xs text-muted mt-1 pt-1 border-t border-white/[0.06]">
                  <span>Total</span>
                  <span className="tabular-nums">
                    {totalQty.toFixed(2)} SPK
                  </span>
                </div>
              </div>
            )}
          </GlassCard>

          {/* Order Form */}
          <GlassCard variant="elevated" className="p-6">
            <h3 className="font-semibold mb-4">Place Order</h3>
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setSide("buy")}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  side === "buy"
                    ? "bg-accent text-black"
                    : "glass hover:bg-white/[0.05]"
                }`}
              >
                Buy
              </button>
              <button
                onClick={() => setSide("sell")}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  side === "sell"
                    ? "bg-error text-white"
                    : "glass hover:bg-white/[0.05]"
                }`}
              >
                Sell
              </button>
            </div>
            <GlassInput
              id="amount"
              label="Amount (USD)"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            {amount && (
              <div className="text-xs text-muted mt-2">
                ≈ {safeDivide(parseFloat(amount), price).toFixed(4)} SPK @ $
                {price.toFixed(4)}
              </div>
            )}
            {side === "buy" && amount && (
              <div className="text-xs text-muted mt-1">
                Remaining after order: $
                {(
                  safeNumber(account?.cashBalance) - parseFloat(amount || "0")
                ).toFixed(2)}
              </div>
            )}
            {side === "sell" && amount && (
              <div className="text-xs text-muted mt-1">
                Selling{" "}
                {safeDivide(parseFloat(amount), price).toFixed(4)} of{" "}
                {totalQty.toFixed(2)} SPK
              </div>
            )}
            {error && <div className="text-xs text-error mt-2">{error}</div>}
            <GlassButton
              variant={side === "buy" ? "primary" : "danger"}
              className="w-full mt-4"
              onClick={executeOrder}
              disabled={loading || !amount}
              glow
            >
              {loading
                ? "Executing..."
                : `${side === "buy" ? "Buy" : "Sell"} SPK`}
            </GlassButton>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
