"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export type PlayerData = {
  userId: { _id: string; username: string };
  points: number;
  gamesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
};

export const standingsColumns: ColumnDef<PlayerData>[] = [
  {
    accessorKey: "userId.username",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Player
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "points",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Points
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "wins",
    header: "Wins",
  },
  {
    accessorKey: "draws",
    header: "Draws",
  },
  {
    accessorKey: "losses",
    header: "Losses",
  },
  {
    accessorKey: "gamesPlayed",
    header: "Games Played",
  },
];
