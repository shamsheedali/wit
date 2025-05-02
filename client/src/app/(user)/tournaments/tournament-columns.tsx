"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import Link from "next/link";

export type TournamentData = {
  _id: string;
  name: string;
  timeControl: string;
  status: string;
  players: {
    userId: { _id: string; username: string };
    points: number;
    gamesPlayed: number;
  }[];
  createdBy: { _id: string; username: string };
};

export const tournamentColumns: ColumnDef<TournamentData>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "timeControl",
    header: "Time Control",
  },
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "players",
    header: "Players",
    cell: ({ row }) => row.original.players.length,
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const tournament = row.original;

      return (
        <div className="flex gap-2">
          <Link href={`/tournaments/${tournament._id}`} passHref>
            <Button variant="outline">View</Button>
          </Link>
        </div>
      );
    },
  },
];