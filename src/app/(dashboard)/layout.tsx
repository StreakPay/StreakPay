import { DashboardNav } from "@/components/layout/dashboard-nav";
import { StreakAI } from "@/components/ai/streak-ai";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <main className="pb-20 md:pb-0">
        {children}
      </main>
      <DashboardNav />
      <StreakAI />
    </div>
  );
}
