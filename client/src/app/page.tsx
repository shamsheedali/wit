"use client";

import { useEffect } from "react";
import Cookies from "js-cookie";
import { useAuthStore } from "@/stores";
import { FeatureCard } from "@/components/core/feature-card";
import { Swords, Trophy, Crown, History } from "lucide-react";

const features = [
  {
    title: "New Game",
    description: "Challenge players worldwide",
    icon: Swords,
    href: "/play",
    color: "from-accent/20 to-accent/5",
  },
  {
    title: "Tournaments",
    description: "Compete for glory",
    icon: Trophy,
    href: "/tournaments",
    color: "from-chart-2/20 to-chart-2/5",
  },
  {
    title: "Leaderboard",
    description: "Rise through the ranks",
    icon: Crown,
    href: "/leaderboard",
    color: "from-chart-3/20 to-chart-3/5",
  },
  {
    title: "History",
    description: "Review past battles",
    icon: History,
    href: "/history",
    color: "from-chart-4/20 to-chart-4/5",
  },
];

export default function Home() {
  const { setUser } = useAuthStore();
  
  useEffect(() => {
    //Saving google user token from server cookie
    // Check if there's a Google auth token cookie
    const googleToken = Cookies.get("google_auth_token");
    if (googleToken) {
      // Transfer from cookie to localStorage
      localStorage.setItem("userToken", googleToken);

      // Remove the cookie after transferring
      Cookies.remove("google_auth_token");
    }
    const googleUserData = Cookies.get("google_user_data");
    if (googleUserData) {
      try {
        const parsedUserData = JSON.parse(googleUserData);
        setUser(parsedUserData);
        Cookies.remove("google_user_data");
      } catch (error) {
        console.error("Failed to parse google_user_data:", error);
      }
    }
  }, [setUser]);

  return (
    <div className="min-h-screen bg-background overflow-hidden relative">
      {/* Background Pattern */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,var(--accent)_0%,transparent_50%)] opacity-[0.03]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,var(--chart-2)_0%,transparent_50%)] opacity-[0.03]" />
      </div>

      <main className="relative z-10 pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-20 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground mb-4">
              Strategic Excellence
            </p>
            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-balance">
              Master the Art
              <br />
              <span className="text-muted-foreground/60">of Chess</span>
            </h1>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300 fill-mode-both">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>

          {/* Bottom Brand */}
          <div className="mt-32 flex justify-end animate-in fade-in duration-1000 delay-700 fill-mode-both">
            <h2 className="font-serif text-[12vw] md:text-[8vw] font-bold leading-none text-foreground/5 select-none">
              Wit
            </h2>
          </div>
        </div>
      </main>
    </div>
  );
}
