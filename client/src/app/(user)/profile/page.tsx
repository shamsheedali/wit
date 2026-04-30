"use client";

import UserProfile from "@/components/core/user-profile";
import { useAuthStore } from "@/stores";

export default function UserProfilePage() {
  const { user } = useAuthStore();
  return (
    <div className="min-h-screen bg-background">
      {/* Background Pattern */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,var(--accent)_0%,transparent_50%)] opacity-[0.03]" />
      </div>

      <main className="relative z-10 pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000">
          {user && <UserProfile user={user} />}
        </div>
      </main>
    </div>
  );
}
