"use client"

import { useState, useEffect } from "react";
import dynamic from 'next/dynamic';

// Import type only
import type { AvailableBots } from "@/components/chess/bots";

// Dynamically import bot data
const DynamicPlayWithBot = dynamic(
  () => import("@/components/chess/play-with-bot"),
  { ssr: false }
);

export default function PlayComputer() {
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
    <div className="px-16 w-full h-screen overflow-hidden pt-[80px] font-clashDisplay">
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
  );
}