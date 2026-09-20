import Link from "next/link";
import {
  Flame,
  Trophy,
  Music,
  TrendingUp,
  Bot,
  Shield,
  Zap,
  CheckCircle,
  ChevronRight,
  ArrowRight,
  Star,
  Lock,
  Brain,
  Target,
  Gift,
  Smartphone,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { LandingNav } from "@/components/layout/landing-nav";
import { LandingFooter } from "@/components/layout/landing-footer";

function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-transparent" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan/10 rounded-full blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-8">
          <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
          <span className="text-xs text-muted-foreground">The Future of Rewards</span>
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6">
          <span className="text-gradient">STREAK</span>
          <span className="text-foreground">PAY</span>
        </h1>

        <p className="text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto mb-4">
          Build your streak. Unlock your rewards.
        </p>
        <p className="text-base text-muted max-w-xl mx-auto mb-10">
          Complete daily activities, build consistency, explore virtual markets, 
          and manage your rewards in one futuristic platform.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link href="/register">
            <GlassButton variant="primary" size="lg" glow>
              Get Started
              <ArrowRight className="h-4 w-4" />
            </GlassButton>
          </Link>
          <a href="#how-it-works">
            <GlassButton variant="secondary" size="lg">
              Explore StreakPay
            </GlassButton>
          </a>
        </div>

        <div className="relative mx-auto max-w-2xl">
          <div className="glass rounded-2xl p-6 sm:p-8 glow-accent">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl mb-1">🔥</div>
                <div className="text-2xl font-bold tabular-nums">24</div>
                <div className="text-xs text-muted">Day Streak</div>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-1">💰</div>
                <div className="text-2xl font-bold text-gold tabular-nums">₦12,540</div>
                <div className="text-xs text-muted">Reward Balance</div>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-1">📈</div>
                <div className="text-2xl font-bold text-accent tabular-nums">$5,380</div>
                <div className="text-xs text-muted">Virtual Portfolio</div>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-1">✦</div>
                <div className="text-2xl font-bold text-cyan">AI</div>
                <div className="text-xs text-muted">STREAK AI</div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-white/[0.06]">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Today&apos;s Mission</span>
                <span className="text-accent">Daily Quiz ✓</span>
              </div>
              <div className="mt-2 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full w-3/4 bg-gradient-to-r from-accent to-cyan rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      icon: Target,
      title: "Complete Daily Tasks",
      description: "Every day, a new activity awaits. Engage, check in, take quizzes, or refer friends.",
      color: "text-accent",
    },
    {
      icon: Flame,
      title: "Build Your Streak",
      description: "Consistency is rewarded. The longer your streak, the bigger the rewards.",
      color: "text-orange",
    },
    {
      icon: Gift,
      title: "Unlock Milestones",
      description: "Hit 20, 50, or 100-day milestones and claim real rewards to your wallet.",
      color: "text-gold",
    },
    {
      icon: TrendingUp,
      title: "Trade & Grow",
      description: "Explore virtual trading with SPK. Build your simulated portfolio.",
      color: "text-cyan",
    },
  ];

  return (
    <section id="how-it-works" className="py-24 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Four simple steps to start earning rewards and building your streak.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <GlassCard key={i} hover className="p-6 relative group">
              <div className="absolute top-4 right-4 text-xs text-muted font-mono">
                0{i + 1}
              </div>
              <step.icon className={`h-10 w-10 ${step.color} mb-4`} />
              <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: Flame,
      title: "Daily Streaks",
      description: "Complete daily activities and build your streak. Each day brings a new challenge to keep you engaged.",
      gradient: "from-orange/20 to-transparent",
    },
    {
      icon: Trophy,
      title: "Reward Milestones",
      description: "Hit milestone goals and earn real rewards. 20 days, 50 days, 100 days — each milestone unlocks bigger rewards.",
      gradient: "from-gold/20 to-transparent",
    },
    {
      icon: Music,
      title: "Music Hub",
      description: "Discover artists, complete music challenges, and earn rewards through our licensed music platform.",
      gradient: "from-cyan/20 to-transparent",
    },
    {
      icon: Bot,
      title: "STREAK AI",
      description: "Your personal AI assistant that understands your streak, rewards, and portfolio. Ask anything.",
      gradient: "from-accent/20 to-transparent",
    },
  ];

  return (
    <section id="features" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/5 to-transparent" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Everything You Need</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            A complete platform for earning, trading, and managing your rewards.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature, i) => (
            <GlassCard key={i} hover variant="elevated" className="p-8 relative overflow-hidden group">
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              <div className="relative">
                <feature.icon className="h-12 w-12 text-accent mb-4" />
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}

function TradingSection() {
  return (
    <section id="trading" className="py-24 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-6">
            <span className="text-xs text-muted">SIMULATED MARKET — NO REAL MONEY</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            SPK <span className="text-gradient">Virtual Trading</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Trade the simulated SPK asset in a risk-free environment. 
            Build your virtual portfolio and climb the leaderboard.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <GlassCard variant="elevated" className="lg:col-span-2 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-sm text-muted-foreground">SPK / USD</div>
                <div className="text-3xl font-bold tabular-nums">$1.2847</div>
                <div className="text-sm text-accent">+4.23%</div>
              </div>
              <div className="flex gap-2">
                {["1m", "5m", "15m", "1h"].map((tf) => (
                  <button
                    key={tf}
                    className="px-3 py-1 text-xs rounded-lg glass hover:bg-white/[0.05] transition-colors"
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-48 flex items-end gap-1">
              {[40, 55, 45, 60, 50, 65, 70, 60, 75, 80, 72, 85, 78, 88, 82, 90, 85, 92, 88, 95].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t"
                  style={{
                    height: `${h}%`,
                    background: i < 10
                      ? "rgba(239, 68, 68, 0.5)"
                      : "rgba(34, 197, 94, 0.5)",
                  }}
                />
              ))}
            </div>
          </GlassCard>

          <GlassCard variant="elevated" className="p-6">
            <h3 className="text-lg font-semibold mb-4">Your Portfolio</h3>
            <div className="space-y-4">
              <div>
                <div className="text-xs text-muted-foreground">Portfolio Value</div>
                <div className="text-xl font-bold tabular-nums">$5,380.24</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Available Cash</div>
                <div className="text-lg font-semibold tabular-nums">$4,120.50</div>
              </div>
              <div className="pt-4 border-t border-white/[0.06]">
                <div className="text-xs text-muted-foreground">Unrealized P&L</div>
                <div className="text-lg font-semibold text-accent tabular-nums">+$380.24</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Today&apos;s P&L</div>
                <div className="text-lg font-semibold text-accent tabular-nums">+$74.21</div>
              </div>
              <GlassButton variant="primary" className="w-full mt-4" glow>
                Start Trading
              </GlassButton>
            </div>
          </GlassCard>
        </div>
      </div>
    </section>
  );
}

function AISection() {
  return (
    <section id="ai" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-cyan/5 via-transparent to-transparent" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Meet <span className="text-gradient">STREAK AI</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Your personal AI assistant, built into StreakPay. Ask about your streak, 
            rewards, portfolio, or anything else.
          </p>
        </div>

        <div className="max-w-lg mx-auto">
          <GlassCard variant="elevated" className="p-6 glow-cyan">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-cyan/10 flex items-center justify-center">
                <Bot className="h-5 w-5 text-cyan" />
              </div>
              <div>
                <div className="text-sm font-semibold">✦ STREAK AI</div>
                <div className="text-xs text-muted">Your StreakPay assistant</div>
              </div>
            </div>
            <div className="glass rounded-xl p-4 mb-4">
              <div className="flex gap-3">
                <div className="h-6 w-6 rounded-full bg-cyan/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="h-3 w-3 text-cyan" />
                </div>
                <div className="text-sm text-muted-foreground">
                  You&apos;re on a <span className="text-foreground font-semibold">24-day streak</span>! 
                  Today&apos;s task is complete. You&apos;re <span className="text-gold font-semibold">6 days</span> from 
                  your next milestone. Your simulated portfolio is <span className="text-accent font-semibold">$5,380.24</span>.
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {["My streak", "My rewards", "My trading", "My account"].map((q) => (
                <button
                  key={q}
                  className="px-3 py-1.5 text-xs rounded-lg glass hover:bg-white/[0.05] transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
            <div className="glass rounded-xl px-4 py-3 flex items-center gap-2">
              <span className="text-sm text-muted">Ask anything...</span>
            </div>
          </GlassCard>
        </div>
      </div>
    </section>
  );
}

function SecuritySection() {
  const items = [
    { icon: Lock, title: "Encrypted Data", description: "All data encrypted at rest and in transit" },
    { icon: Shield, title: "Server-Authoritative", description: "Financial logic validated server-side" },
    { icon: Brain, title: "Fraud Detection", description: "AI-powered anomaly detection" },
    { icon: Zap, title: "Secure Sessions", description: "Brute-force protection & rate limiting" },
  ];

  return (
    <section className="py-24 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Built Secure</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Security is not an afterthought. Every financial operation is validated server-side.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item, i) => (
            <GlassCard key={i} hover className="p-6 text-center">
              <item.icon className="h-8 w-8 text-accent mx-auto mb-3" />
              <h3 className="text-sm font-semibold mb-1">{item.title}</h3>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  const faqs = [
    {
      q: "Is SPK a real cryptocurrency?",
      a: "No. SPK (StreakPay Koin) is a completely fictional simulated asset. It is not a cryptocurrency and involves no real money.",
    },
    {
      q: "How do rewards work?",
      a: "Complete daily streaks to earn milestone rewards. Each milestone (20, 50, 100 days) unlocks a specific reward amount.",
    },
    {
      q: "Is my money safe?",
      a: "StreakPay uses server-authoritative financial logic, encrypted data, and immutable ledger entries. All financial operations are validated server-side.",
    },
    {
      q: "Can I withdraw my rewards?",
      a: "Yes. Once your account is verified, you can request withdrawals to your bank account. Withdrawals go through an approval process.",
    },
    {
      q: "What is STREAK AI?",
      a: "STREAK AI is a contextual AI assistant built into StreakPay. It can answer questions about your streak, rewards, portfolio, and account.",
    },
  ];

  return (
    <section id="faq" className="py-24 relative">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">FAQ</h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <GlassCard key={i} className="p-6">
              <h3 className="font-semibold mb-2">{faq.q}</h3>
              <p className="text-sm text-muted-foreground">{faq.a}</p>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/5 to-transparent" />
      <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold mb-4">
          Ready to Start Your Streak?
        </h2>
        <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
          Join StreakPay and start building your streak today. 
          Complete activities, earn rewards, and explore virtual markets.
        </p>
        <Link href="/register">
          <GlassButton variant="primary" size="lg" glow>
            Create Free Account
            <ArrowRight className="h-4 w-4" />
          </GlassButton>
        </Link>
      </div>
    </section>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      <main>
        <HeroSection />
        <HowItWorksSection />
        <FeaturesSection />
        <TradingSection />
        <AISection />
        <SecuritySection />
        <FAQSection />
        <CTASection />
      </main>
      <LandingFooter />
    </div>
  );
}
