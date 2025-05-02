"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export type PlayerData = {
  userId: string | { _id: string; username: string };
  points: number;
  gamesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
};

export const standingsColumns = (
  userNamesMap: { [key: string]: string } = {}
): ColumnDef<PlayerData>[] => [
  {
    accessorKey: "userId",
    header: "Player",
    cell: ({ row }) => {
      const userId = row.getValue<string | { _id: string; username: string }>(
        "userId"
      );

      const username =
        typeof userId === "string"
          ? userNamesMap[userId] ?? "Unknown"
          : userId.username ?? "Unknown";

      return <span>{username}</span>;
    },
  },
  {
    accessorKey: "points",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="flex items-center"
      >
        Points
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <span>{row.getValue("points")}</span>,
    sortingFn: "basic",
  },
  {
    accessorKey: "gamesPlayed",
    header: "Games Played",
    cell: ({ row }) => <span>{row.getValue("gamesPlayed")}</span>,
  },
  {
    accessorKey: "wins",
    header: "Wins",
    cell: ({ row }) => <span>{row.getValue("wins")}</span>,
  },
  {
    accessorKey: "draws",
    header: "Draws",
    cell: ({ row }) => <span>{row.getValue("draws")}</span>,
  },
  {
    accessorKey: "losses",
    header: "Losses",
    cell: ({ row }) => <span>{row.getValue("losses")}</span>,
  },
];
