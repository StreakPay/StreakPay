export default function RewardTermsPage() {
  return (
    <div className="min-h-screen p-4 md:p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Reward Terms</h1>
      <div className="space-y-6 text-sm text-muted-foreground">
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">1. Earning Rewards</h2>
          <p>Rewards are earned by completing daily streak activities and reaching milestone thresholds (20, 50, 100 days).</p>
        </div>
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">2. Reward Amounts</h2>
          <p>Current milestone rewards: 20 days = ₦5,000 | 50 days = ₦40,000 | 100 days = ₦110,000. Amounts may change with notice.</p>
        </div>
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">3. Claiming Rewards</h2>
          <p>Rewards must be claimed when a milestone is reached. Claiming a milestone does not reset your streak. Duplicate claims are prevented server-side.</p>
        </div>
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">4. Withdrawal</h2>
          <p>Minimum withdrawal: ₦500. Withdrawals require a verified account and are subject to approval. Processing takes 5-7 business days.</p>
        </div>
      </div>
    </div>
  );
}
