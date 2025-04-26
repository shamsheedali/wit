"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteGame } from "@/lib/api/admin";
import { QueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";

export type GameData = {
  _id: string;
  playerOne: string; 
  playerTwo: string; 
  result?: "whiteWin" | "blackWin" | "draw";
  gameType: "blitz" | "bullet" | "rapid";
  timeControl: string;
  moves: Array<any>;
  createdAt: string;
  gameStatus: "ongoing" | "completed" | "terminated";
};

export const gameColumns = (
  queryClient: QueryClient,
  playerNames: { [key: string]: string } // Add playerNames parameter
): ColumnDef<GameData>[] => [
  {
    accessorKey: "_id",
    header: "Game ID",
    cell: ({ row }) => <span>{row.getValue("_id")}</span>,
    enableSorting: false,
  },
  {
    accessorKey: "playerOne",
    header: "Player 1",
    cell: ({ row }) => {
      const playerId = row.getValue("playerOne") as string;
      return <span>{playerNames[playerId] || playerId}</span>;
    },
    enableSorting: false,
  },
  {
    accessorKey: "playerTwo",
    header: "Player 2",
    cell: ({ row }) => {
      const playerId = row.getValue("playerTwo") as string;
      return <span>{playerNames[playerId] || playerId}</span>;
    },
    enableSorting: false,
  },
  {
    accessorKey: "result",
    header: "Result",
    cell: ({ row }) => {
      const result = row.getValue("result") as string | undefined;
      const gameStatus = row.getValue("gameStatus") as string | undefined;
      return <span>{result ? (result === "whiteWin" ? "1-0" : result === "blackWin" ? "0-1" : "½-½") : gameStatus === 'terminated' ? '-' : 'Ongoing'}</span>;
    },
    enableSorting: false,
  },
  {
    accessorKey: "gameStatus",
    header: "Status",
    cell: ({ row }) => <span className="capitalize">{row.getValue("gameStatus")}</span>,
    enableSorting: false,
  },
  {
    accessorKey: "gameType",
    header: "Game Type",
    cell: ({ row }) => <span className="capitalize">{row.getValue("gameType")}</span>,
    enableSorting: true,
  },
  {
    accessorKey: "timeControl",
    header: "Time Control",
    cell: ({ row }) => <span>{row.getValue("timeControl")}</span>,
    enableSorting: false,
  },
  {
    accessorKey: "moves",
    header: "Moves",
    cell: ({ row }) => <span>{(row.getValue("moves") as any[]).length}</span>,
    enableSorting: true,
    sortingFn: "basic",
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="flex items-center"
      >
        Date
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <span>{format(parseISO(row.getValue("createdAt")), "MMM dd, yyyy")}</span>,
    sortingFn: "datetime",
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const game = row.original;

      const handleDeleteGame = async (gameId: string) => {
        await deleteGame(gameId);
        await queryClient.invalidateQueries({ queryKey: ["games"] });
      };

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(game._id)} className="cursor-pointer">
              Copy Game ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">View Game Details</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDeleteGame(game._id)} className="cursor-pointer text-red-600">
              Delete Game
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];