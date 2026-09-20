export default function ResponsibleUsePage() {
  return (
    <div className="min-h-screen p-4 md:p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Responsible Use</h1>
      <div className="space-y-6 text-sm text-muted-foreground">
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">Healthy Habits</h2>
          <p>StreakPay is designed to build positive daily habits. Take breaks when needed. Your streak can always be restarted.</p>
        </div>
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">Simulated Trading</h2>
          <p>SPK trading is for entertainment only. Do not treat it as financial training or investment practice. Real trading carries real risks.</p>
        </div>
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">Spending</h2>
          <p>Only spend what you can afford. The verification fee is a one-time cost. Never spend beyond your means to earn rewards.</p>
        </div>
      </div>
    </div>
  );
}
