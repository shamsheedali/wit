"use client";

import { useAuthStore } from "@/stores";
import { CircleUserRound, SquareAsterisk } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import type React from "react";
import { useEffect } from "react";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if(!isAuthenticated) {
      redirect('/login')
    }
  }, [])

  return (
    <div className="lg:px-44 w-full py-[120px] font-clashDisplay flex">
      <div className="flex flex-col px-10 text-lg gap-5">
        <h1 className="font-bold mb-3 text-xl">Settings</h1>
        <div className="flex gap-2">
          <CircleUserRound />
          <Link href={"/settings/profile"}>Profile</Link>
        </div>
        {!user?.googleId && (
          <div className="flex gap-2">
            <SquareAsterisk />
            <Link href={"/settings/password"}>Password</Link>
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
