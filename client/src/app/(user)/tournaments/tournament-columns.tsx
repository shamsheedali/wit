"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { joinTournament } from "@/lib/api/tournament";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores";

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
      const router = useRouter();
      const queryClient = useQueryClient();
      const { user } = useAuthStore();
      const tournament = row.original;

      const handleJoin = async () => {
        if (!user?._id) return;
        const result = await joinTournament(tournament._id, user._id);
        if (result) {
          queryClient.invalidateQueries({ queryKey: ["tournaments"] });
          queryClient.invalidateQueries({ queryKey: ["userTournaments"] });
        }
      };

      return (
        <div className="flex gap-2">
          {/* {tournament.status === "pending" &&
            !tournament.players.some((p) => p.userId._id === user?._id) && (
              <Button variant="outline" onClick={handleJoin}>
                Join
              </Button>
            )} */}
          <Button
            variant="outline"
            onClick={() => router.push(`/tournaments/${tournament._id}`)}
          >
            View
          </Button>
        </div>
      );
    },
  },
];
