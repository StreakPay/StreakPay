export default function PrivacyPage() {
  return (
    <div className="min-h-screen p-4 md:p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      <div className="space-y-6 text-sm text-muted-foreground">
        <p><strong>Last updated:</strong> September 2026</p>
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">1. Information We Collect</h2>
          <p>Name, email, profile information, payment proofs, and support communications.</p>
        </div>
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">2. How We Use Information</h2>
          <p>To provide services, verify accounts, process withdrawals, send notifications, and improve the platform.</p>
        </div>
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">3. Data Security</h2>
          <p>We use encryption, secure sessions, and access controls. No transmission method is 100% secure.</p>
        </div>
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">4. Data Sharing</h2>
          <p>We do not sell personal information. We may share data with service providers under confidentiality obligations.</p>
        </div>
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">5. Your Rights</h2>
          <p>Access, update, or delete your information through Settings. Account deletion may be subject to retention requirements.</p>
        </div>
      </div>
    </div>
  );
}
