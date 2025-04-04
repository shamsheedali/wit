"use client";

import { useState, useEffect } from "react";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserGrowthChart } from "@/components/user-growth-chart";
import { getTotalGames } from "@/lib/api/game";
import { getTotalUsers } from "@/lib/api/admin";

export default function Overview() {
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalGames, setTotalGames] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const users = await getTotalUsers();
      const games = await getTotalGames();
      setTotalUsers(users);
      setTotalGames(games);
    };
    fetchData();
  }, []);

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1>Overview</h1>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          <div className="aspect-video rounded-xl bg-muted/50 p-10">
            <h1 className="font-bold text-2xl">Total Users</h1>
            <h1 className="font-bold text-4xl">{totalUsers}</h1>
            <div className="flex items-center gap-2">
              {/* <TrendingUp /> */}
              {/* <h1>80 Users currently online</h1>  */}
            </div>
          </div>
          <div className="aspect-video rounded-xl bg-muted/50 p-10">
            <h1 className="font-bold text-2xl">Total Games</h1>
            <h1 className="font-bold text-4xl">{totalGames}</h1>
            <div className="flex items-center gap-2">
              {/* <TrendingUp /> */}
              {/* <h1>80 Ongoing games</h1>  */}
            </div>
          </div>
          <div className="aspect-video rounded-xl bg-muted/50 p-10">
            <h1 className="font-bold text-2xl">New Users</h1>
            <h1 className="font-bold text-4xl">2</h1>
            <div className="flex items-center gap-2">
              {/* <TrendingUp /> */}
              {/* <h1>8.5% From last 7 days</h1>  */}
            </div>
          </div>
        </div>
        <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min">
          <UserGrowthChart />
        </div>
      </div>
    </>
  );
}