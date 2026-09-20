export default function TermsPage() {
  return (
    <div className="min-h-screen p-4 md:p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
      <div className="space-y-6 text-sm text-muted-foreground">
        <p><strong>Last updated:</strong> September 2026</p>
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">1. Acceptance of Terms</h2>
          <p>By accessing or using StreakPay, you agree to be bound by these Terms of Service. If you do not agree, do not use the service.</p>
        </div>
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">2. Description of Service</h2>
          <p>StreakPay is a platform combining daily streak activities, reward milestones, virtual trading, and an AI assistant. SPK (StreakPay Koin) is a completely fictional simulated asset.</p>
        </div>
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">3. SPK Disclaimer</h2>
          <p><strong>SPK is NOT a cryptocurrency.</strong> SPK is a fictional simulated asset with no real-world value. No real money is involved in SPK trading.</p>
        </div>
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">4. Account Verification</h2>
          <p>Access to certain features requires account verification with a one-time fee. This fee is non-refundable once verification is completed.</p>
        </div>
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">5. Rewards & Withdrawals</h2>
          <p>Rewards are earned through streak milestones. Withdrawals are subject to minimum thresholds and approval. Processed within 5-7 business days.</p>
        </div>
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">6. Prohibited Activities</h2>
          <p>Users may not: create multiple accounts, manipulate streaks, abuse rewards, engage in fraud, or violate applicable laws.</p>
        </div>
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">7. Termination & Liability</h2>
          <p>StreakPay may suspend accounts that violate terms. StreakPay shall not be liable for indirect or consequential damages.</p>
        </div>
      </div>
    </div>
  );
}
