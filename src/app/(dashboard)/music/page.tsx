import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";

export default function MusicPage() {
  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Music Hub</h1>

      <GlassCard variant="elevated" className="p-8 mb-8">
        <h2 className="text-lg font-semibold mb-2">Featured Campaign</h2>
        <p className="text-muted-foreground text-sm mb-4">
          Complete music challenges to earn rewards. Discover new artists and earn through our licensed music platform.
        </p>
        <GlassButton variant="primary" glow>Explore Campaigns</GlassButton>
      </GlassCard>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { title: "Music Quizzes", desc: "Test your music knowledge", icon: "🎵" },
          { title: "Artist Discovery", desc: "Discover new artists", icon: "🎤" },
          { title: "Challenges", desc: "Complete music challenges", icon: "🏆" },
        ].map((item, i) => (
          <GlassCard key={i} hover className="p-6">
            <div className="text-3xl mb-3">{item.icon}</div>
            <h3 className="font-semibold mb-1">{item.title}</h3>
            <p className="text-sm text-muted-foreground">{item.desc}</p>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="p-6">
        <h3 className="font-semibold mb-4">Your Music Activity</h3>
        <p className="text-sm text-muted-foreground">
          No music activities completed yet. Start exploring to earn rewards!
        </p>
      </GlassCard>
    </div>
  );
}
