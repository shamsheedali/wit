"use client";

import { useAuthStore } from "@/stores";
import { CircleUserRound, SquareAsterisk, Settings as SettingsIcon, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect, usePathname, useRouter } from "next/navigation";
import type React from "react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if(!isAuthenticated) {
      redirect('/login')
    }
  }, [isAuthenticated])

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Pattern */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,var(--accent)_0%,transparent_50%)] opacity-[0.03]" />
      </div>

      <main className="relative z-10 max-w-6xl mx-auto pt-32 pb-20 px-6">
        
        {/* Header */}
        <div className="mb-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <SettingsIcon className="w-10 h-10 text-accent" />
            <h1 className="font-serif text-4xl md:text-5xl font-bold tracking-tight">Settings</h1>
          </div>
          <p className="text-muted-foreground text-lg ml-1">Manage your account preferences</p>
        </div>

        <div className="flex flex-col md:flex-row gap-8 lg:gap-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150 fill-mode-both">
          
          {/* Sidebar */}
          <div className="w-full md:w-64 flex-shrink-0">
            <nav className="flex flex-col gap-2">
              <Link 
                href="/settings/profile"
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300",
                  pathname === "/settings/profile" 
                    ? "bg-primary text-primary-foreground shadow-md" 
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                )}
              >
                <CircleUserRound className="w-5 h-5" />
                <span className="font-medium">Profile</span>
              </Link>

              {!user?.googleId && (
                <Link 
                  href="/settings/password"
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300",
                    pathname === "/settings/password" 
                      ? "bg-primary text-primary-foreground shadow-md" 
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  )}
                >
                  <SquareAsterisk className="w-5 h-5" />
                  <span className="font-medium">Password</span>
                </Link>
              )}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
