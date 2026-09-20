export default function ContactPage() {
  return (
    <div className="min-h-screen p-4 md:p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Contact Us</h1>
      <div className="glass rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-2">Support Center</h2>
        <p className="text-sm text-muted-foreground mb-4">
          For support requests, please use the in-app Support Center to create a ticket.
        </p>
      </div>
      <div className="glass rounded-xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-2">General Inquiries</h2>
        <p className="text-sm text-muted-foreground">
          For general inquiries, reach out through our support system. We respond within 24 hours.
        </p>
      </div>
    </div>
  );
}
