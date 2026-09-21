import { DashboardNav } from "@/components/layout/dashboard-nav";
import { StreakAI } from "@/components/ai/streak-ai";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <main className="md:ml-[220px] pb-24 md:pb-0 min-h-screen">
        {children}
      </main>
      <DashboardNav />
      <StreakAI />
    </div>
  );
}
