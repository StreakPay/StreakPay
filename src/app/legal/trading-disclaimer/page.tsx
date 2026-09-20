export default function TradingDisclaimerPage() {
  return (
    <div className="min-h-screen p-4 md:p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Simulated Trading Disclaimer</h1>
      <div className="space-y-6 text-sm text-muted-foreground">
        <div className="glass rounded-xl p-6 border border-gold/20">
          <h2 className="text-lg font-semibold text-gold mb-2">IMPORTANT DISCLAIMER</h2>
          <p className="text-foreground">SPK is a completely fictional simulated asset. It is NOT a cryptocurrency, security, or financial instrument. No real money is involved.</p>
        </div>
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">Simulated Nature</h2>
          <p>All trading is simulated. No real assets are bought or sold. Portfolio values are for entertainment only.</p>
        </div>
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">No Financial Advice</h2>
          <p>Nothing on StreakPay constitutes financial advice. The simulated environment does not reflect real market conditions.</p>
        </div>
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">No Real Returns</h2>
          <p>Simulated profits do not represent actual financial returns. Past performance does not indicate future results.</p>
        </div>
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">Risk Warning</h2>
          <p>Real trading involves significant risk. Do not use StreakPay as a basis for real investment decisions.</p>
        </div>
      </div>
    </div>
  );
}
