"use client";

import { ColumnDef } from "@tanstack/react-table";

export type MatchData = {
  _id: string;
  player1Id: { _id: string; username: string };
  player2Id: { _id: string; username: string };
  result?: "1-0" | "0-1" | "0.5-0.5" | null;
};

export const createMatchColumns = (currentUserId: string | undefined): ColumnDef<MatchData>[] => [
  {
    accessorKey: "opponent",
    header: "Opponent",
    cell: ({ row }) => {
      const match = row.original;
      return match.player1Id._id === currentUserId
        ? match.player2Id.username
        : match.player1Id.username;
    },
  },
  {
    accessorKey: "result",
    header: "Result",
    cell: ({ row }) => {
      const match = row.original;
      if (!match.result) return "Pending";
      if (match.result === "0.5-0.5") return "Draw";
      if (
        (match.result === "1-0" && match.player1Id._id === currentUserId) ||
        (match.result === "0-1" && match.player2Id._id === currentUserId)
      ) {
        return "Win";
      }
      return "Loss";
    },
  },
];