"use client";

import { FeatureCard } from "@/components/core/feature-card";
import { Globe, Users, Bot } from "lucide-react";

const playModes = [
  {
    title: "Play Online",
    description: "Match up with players worldwide",
    icon: Globe,
    href: "/play/online",
    color: "from-accent/20 to-accent/5",
  },
  {
    title: "Play a Friend",
    description: "Send an invite and duel instantly",
    icon: Users,
    href: "/play/friend",
    color: "from-chart-2/20 to-chart-2/5",
  },
  {
    title: "Play Bots",
    description: "Practice against AI engines",
    icon: Bot,
    href: "/play/computer",
    color: "from-chart-3/20 to-chart-3/5",
  },
];

export default function Play() {
  return (
    <div className="min-h-screen bg-background overflow-hidden relative">
      {/* Background Pattern */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,var(--accent)_0%,transparent_50%)] opacity-[0.03]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,var(--chart-2)_0%,transparent_50%)] opacity-[0.03]" />
      </div>

      <main className="relative z-10 pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-20 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground mb-4">
              Select Your Arena
            </p>
            <h1 className="font-serif text-5xl md:text-7xl font-bold tracking-tight text-balance">
              Choose your
              <br />
              <span className="text-accent">Battle</span>
            </h1>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300 fill-mode-both">
            {playModes.map((mode) => (
              <FeatureCard key={mode.title} {...mode} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
