import { ClubsTabs } from "@/components/core/clubs-tabs";
import { GrGroup } from "react-icons/gr";

export default function ClubsPage() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Pattern */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,var(--accent)_0%,transparent_50%)] opacity-[0.03]" />
      </div>

      <main className="relative z-10 max-w-4xl mx-auto px-6 pt-32 pb-20">
        {/* Header */}
        <div className="mb-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="flex items-center gap-3 mb-2">
            <GrGroup className="w-8 h-8 text-accent" />
            <h1 className="font-serif text-4xl text-foreground font-bold tracking-tight">Clubs</h1>
          </div>
          <p className="text-muted-foreground ml-1">Join communities, participate in events, and play together</p>
        </div>

        <ClubsTabs />
      </main>
    </div>
  );
}