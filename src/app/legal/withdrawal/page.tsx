export default function WithdrawalPolicyPage() {
  return (
    <div className="min-h-screen p-4 md:p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Withdrawal Policy</h1>
      <div className="space-y-6 text-sm text-muted-foreground">
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">1. Eligibility</h2>
          <p>Only verified users with a minimum ₦500 balance may request withdrawals.</p>
        </div>
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">2. Processing</h2>
          <p>Withdrawals go through review and approval. Processing takes 5-7 business days after approval.</p>
        </div>
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">3. Limits</h2>
          <p>One pending withdrawal at a time. Maximum single withdrawal may apply based on account tier.</p>
        </div>
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">4. Rejection</h2>
          <p>Withdrawals may be rejected for suspicious activity, insufficient balance, or policy violations. Funds are returned to your wallet.</p>
        </div>
      </div>
    </div>
  );
}
