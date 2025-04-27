"use client";

import { ColumnDef } from "@tanstack/react-table";

export type MatchData = {
  _id: string;
  player1Id: string | { _id: string; username: string };
  player2Id: string | { _id: string; username: string };
  result?: "1-0" | "0-1" | "0.5-0.5" | null;
};

export const matchColumns = (
  userNamesMap: { [key: string]: string } = {}
): ColumnDef<MatchData>[] => [
  {
    accessorKey: "player1Id",
    header: "Player 1",
    cell: ({ row }) => {
      const player1Id = row.getValue("player1Id");
      const username =
        typeof player1Id === "string"
          ? userNamesMap[player1Id] || "Unknown"
          : player1Id.username || "Unknown";
      return <span>{username}</span>;
    },
  },
  {
    accessorKey: "player2Id",
    header: "Player 2",
    cell: ({ row }) => {
      const player2Id = row.getValue("player2Id");
      const username =
        typeof player2Id === "string"
          ? userNamesMap[player2Id] || "Unknown"
          : player2Id.username || "Unknown";
      return <span>{username}</span>;
    },
  },
  {
    accessorKey: "result",
    header: "Result",
    cell: ({ row }) => {
      const result = row.getValue("result");
      if (!result) return "Pending";
      if (result === "0.5-0.5") return "Draw";
      return result === "1-0" ? "Player 1 Wins" : "Player 2 Wins";
    },
  },
];
