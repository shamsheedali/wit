"use client"

import { useState, useEffect } from "react";
import dynamic from 'next/dynamic';
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import type { AvailableBots } from "@/components/chess/bots";

// Dynamically import bot data
const DynamicPlayWithBot = dynamic(
  () => import("@/components/chess/play-with-bot"),
  { ssr: false }
);

export default function PlayComputer() {
  const router = useRouter();
  const [bots, setBots] = useState<AvailableBots | null>(null);

  useEffect(() => {
    // Import bots only on the client side
    const loadBots = async () => {
      const botModule = await import("@/components/chess/bots");
      setBots(botModule.default);
    };
    
    loadBots();
  }, []);

  if (!bots) return <p>Loading chess engines...</p>;

  return (
    <div className="px-16 w-full h-screen overflow-hidden pt-[80px] font-clashDisplay bg-background relative">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,var(--accent)_0%,transparent_50%)] opacity-[0.03]" />
      </div>

      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="absolute top-8 left-8 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 backdrop-blur-md border border-border/50 text-muted-foreground hover:text-foreground transition-all group"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        <span className="text-sm font-medium">Back</span>
      </button>

      <div className="relative z-10 w-full h-full">
        <DynamicPlayWithBot
          bots={bots}
          onGameCompleted={(winner) => {
            window.alert(
              `${
                winner === "b" ? "Black" : winner === "w" ? "White" : "No one"
              } is the winner!`
            );
          }}
        />
      </div>
    </div>
  );
}