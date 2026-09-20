"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassInput } from "@/components/ui/glass-input";

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
  unrealizedPnL: number;
}

interface Account {
  cashBalance: number;
  portfolioValue: number;
  totalPnL: number;
  positions: Position[];
  orders: any[];
}

export default function TradePage() {
  const [price, setPrice] = useState(1.0);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [account, setAccount] = useState<Account | null>(null);
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [timeframe, setTimeframe] = useState("1m");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchPrice, 5000);
    return () => clearInterval(interval);
  }, []);

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

  const fetchPrice = async () => {
    try {
      const res = await fetch("/api/trading/price");
      const data = await res.json();
      setPrice(data.price);
    } catch {}
  };

  const executeOrder = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/trading/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          side,
          quantity: parseFloat(amount) / price,
        }),
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

  const priceChange = candles.length >= 2
    ? ((candles[candles.length - 1].close - candles[0].open) / candles[0].open) * 100
    : 0;

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Trading Terminal</h1>
          <p className="text-xs text-muted mt-1">SIMULATED MARKET — NO REAL MONEY</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold tabular-nums">${price.toFixed(4)}</div>
          <div className={`text-sm ${priceChange >= 0 ? "text-accent" : "text-error"}`}>
            {priceChange >= 0 ? "+" : ""}{priceChange.toFixed(2)}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GlassCard variant="elevated" className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">SPK / USD</h2>
            <div className="flex gap-1">
              {["1m", "5m", "15m", "1h"].map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                    tf === timeframe ? "bg-accent/10 text-accent" : "hover:bg-white/[0.05] text-muted"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64 flex items-end gap-px">
            {candles.map((c, i) => {
              const h = Math.max(10, ((c.high - c.low) / (c.high || 1)) * 100);
              const green = c.close >= c.open;
              return (
                <div
                  key={i}
                  className="flex-1 rounded-t transition-all duration-300"
                  style={{
                    height: `${h}%`,
                    background: green ? "rgba(34, 197, 94, 0.5)" : "rgba(239, 68, 68, 0.5)",
                  }}
                  title={`O:${c.open.toFixed(4)} H:${c.high.toFixed(4)} L:${c.low.toFixed(4)} C:${c.close.toFixed(4)}`}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-muted mt-2">
            <span>Vol: {candles[candles.length - 1]?.volume?.toLocaleString() || 0}</span>
            <span>Last: ${candles[candles.length - 1]?.close?.toFixed(4) || "0.0000"}</span>
          </div>
        </GlassCard>

        <div className="space-y-4">
          <GlassCard variant="elevated" className="p-6">
            <h3 className="font-semibold mb-4">Your Portfolio</h3>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-muted-foreground">Portfolio Value</div>
                <div className="text-xl font-bold tabular-nums">
                  ${(account?.portfolioValue || 0).toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Available Cash</div>
                <div className="text-lg tabular-nums">
                  ${(account?.cashBalance || 0).toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Unrealized P&L</div>
                <div className={`text-lg font-semibold tabular-nums ${
                  (account?.totalPnL || 0) >= 0 ? "text-accent" : "text-error"
                }`}>
                  {(account?.totalPnL || 0) >= 0 ? "+" : ""}${(account?.totalPnL || 0).toFixed(2)}
                </div>
              </div>
            </div>
            {account?.positions && account.positions.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/[0.06]">
                <div className="text-xs text-muted-foreground mb-2">Positions</div>
                {account.positions.map((p, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>{p.quantity.toFixed(2)} SPK</span>
                    <span className="text-muted">@${p.averagePrice.toFixed(4)}</span>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          <GlassCard variant="elevated" className="p-6">
            <h3 className="font-semibold mb-4">Place Order</h3>
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setSide("buy")}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  side === "buy" ? "bg-accent text-black" : "glass hover:bg-white/[0.05]"
                }`}
              >
                Buy
              </button>
              <button
                onClick={() => setSide("sell")}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  side === "sell" ? "bg-error text-white" : "glass hover:bg-white/[0.05]"
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
                ≈ {(parseFloat(amount) / price).toFixed(4)} SPK @ ${price.toFixed(4)}
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
              {loading ? "Executing..." : `${side === "buy" ? "Buy" : "Sell"} SPK`}
            </GlassButton>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
