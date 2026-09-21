import { DashboardNav } from "@/components/layout/dashboard-nav";
import { StreakAI } from "@/components/ai/streak-ai";
import { RouteTransition } from "@/components/layout/route-transition";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <RouteTransition>
        <main className="md:ml-[220px] pb-24 md:pb-0 min-h-screen">
          {children}
        </main>
      </RouteTransition>
      <DashboardNav />
      <StreakAI />
    </div>
  );
}
