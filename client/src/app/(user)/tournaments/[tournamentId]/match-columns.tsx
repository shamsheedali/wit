"use client";

import { useAuthStore } from "@/stores";
import { ColumnDef } from "@tanstack/react-table";

export type MatchData = {
  _id: string;
  player1Id: { _id: string; username: string };
  player2Id: { _id: string; username: string };
  result?: "1-0" | "0-1" | "0.5-0.5" | null;
};

export const matchColumns: ColumnDef<MatchData>[] = [
  {
    accessorKey: "opponent",
    header: "Opponent",
    cell: ({ row }) => {
      const { user } = useAuthStore();
      const match = row.original;
      return match.player1Id._id === user?._id
        ? match.player2Id.username
        : match.player1Id.username;
    },
  },
  {
    accessorKey: "result",
    header: "Result",
    cell: ({ row }) => {
      const { user } = useAuthStore();
      const match = row.original;
      if (!match.result) return "Pending";
      if (match.result === "0.5-0.5") return "Draw";
      if (
        (match.result === "1-0" && match.player1Id._id === user?._id) ||
        (match.result === "0-1" && match.player2Id._id === user?._id)
      ) {
        return "Win";
      }
      return "Loss";
    },
  },
];
