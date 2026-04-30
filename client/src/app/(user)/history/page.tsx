"use client";

import GameHistoryTable from "@/components/core/game-history-table";
import { useAuthStore } from "@/stores";

export default function HistoryPage() {
  const { user } = useAuthStore();
  
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Pattern */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,var(--accent)_0%,transparent_50%)] opacity-[0.03]" />
      </div>

      <main className="relative z-10 pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <h1 className="font-serif text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Your <span className="text-accent">Battles</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Review your past matches, analyze your performance, and track your rating progress over time.
            </p>
          </div>

          {/* Table Container */}
          {user && (
            <div className="bg-card rounded-3xl border border-border/50 overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200 fill-mode-both">
              <div className="px-8 py-6 border-b border-border/50 bg-secondary/10">
                <h2 className="font-serif text-2xl font-semibold">Match History</h2>
                <p className="text-sm text-muted-foreground mt-1">A complete log of your recent games</p>
              </div>
              <div className="p-0 overflow-hidden">
                <GameHistoryTable user={user} />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
