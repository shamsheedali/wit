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
import { deleteTournament } from "@/lib/api/admin";
import { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// Define the shape of TournamentData
export type TournamentData = {
  _id: string;
  name: string;
  timeControl: string;
  maxGames: number;
  status: "pending" | "active" | "playoff" | "completed";
  createdBy: { username: string };
  startDate?: number;
};

export const tournamentColumns = (
  queryClient: QueryClient
): ColumnDef<TournamentData>[] => [
  {
    accessorKey: "_id",
    header: "Tournament ID",
    cell: ({ row }) => <span>{row.getValue("_id")}</span>,
    enableSorting: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="flex items-center"
      >
        Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("name")}</span>
    ),
    sortingFn: "alphanumeric",
  },
  {
    accessorKey: "timeControl",
    header: "Time Control",
    cell: ({ row }) => <span>{row.getValue("timeControl")}</span>,
  },
  {
    accessorKey: "maxGames",
    header: "Max Games",
    cell: ({ row }) => <span>{row.getValue("maxGames")}</span>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <span>{row.getValue("status")}</span>,
  },
  {
    id: "createdByUsername",
    accessorFn: (row) => row.createdBy?.username || "-",
    header: "Created By",
    cell: ({ row }) => <span>{row.getValue("createdByUsername")}</span>,
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const tournament = row.original;

      const handleDeleteTournament = async (tournamentId: string) => {
        try {
          const response = await deleteTournament(tournamentId);
          if (response?.success) {
            toast.success("Tournament deleted successfully");
            await queryClient.invalidateQueries({ queryKey: ["tournaments"] });
          } else {
            toast.error("Failed to delete tournament");
          }
        } catch (error) {
          toast.error("Error deleting tournament");
          console.error(error);
        }
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
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(tournament._id)}
              className="cursor-pointer"
            >
              Copy Tournament ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleDeleteTournament(tournament._id)}
              className="cursor-pointer text-red-600"
            >
              Delete Tournament
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
