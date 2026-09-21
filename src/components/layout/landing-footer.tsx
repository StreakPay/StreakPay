import Link from "next/link";

const footerSections = [
  {
    title: "Product",
    links: [
      { label: "Streaks", href: "#features" },
      { label: "Rewards", href: "#features" },
      { label: "Chat", href: "#features" },
      { label: "Trading", href: "#trading" },
      { label: "STREAK AI", href: "#ai" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Press", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of Service", href: "/legal/terms" },
      { label: "Privacy Policy", href: "/legal/privacy" },
      { label: "Reward Terms", href: "/legal/rewards" },
      { label: "Trading Disclaimer", href: "/legal/trading-disclaimer" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", href: "/support" },
      { label: "Contact", href: "/support/contact" },
      { label: "FAQ", href: "#faq" },
      { label: "Status", href: "#" },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-white/[0.06] bg-black/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-black font-bold text-sm">
                SP
              </div>
              <span className="text-lg font-bold tracking-tight">STREAKPAY</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              Build your streak. Unlock your rewards. Explore virtual markets.
            </p>
          </div>

          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-foreground mb-3">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-white/[0.06] flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted">
            &copy; {new Date().getFullYear()} StreakPay. All rights reserved.
          </p>
          <p className="text-xs text-muted max-w-md text-center md:text-right">
            SPK trading is completely simulated. No real money is involved. 
            StreakPay is not a bank or financial institution.
          </p>
        </div>
      </div>
    </footer>
  );
}
