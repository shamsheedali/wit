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
import { toggleBan } from "@/lib/api/admin";
import { QueryClient } from "@tanstack/react-query";
import { getSocket } from "@/lib/socket";
import { getOngoingGame } from "@/lib/api/game";

// Define the shape of UserData
export type UserData = {
  _id: string;
  userId: string;
  username: string;
  rating?: number; 
  isBanned: boolean;
};

export const userColumns = (queryClient: QueryClient): ColumnDef<UserData>[] => [
  {
    accessorKey: "_id",
    header: "User ID",
    cell: ({ row }) => <span>{row.getValue("_id")}</span>,
    enableSorting: false, 
  },
  {
    accessorKey: "username",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="flex items-center"
      >
        Username
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <span className="font-medium">{row.getValue("username")}</span>,
    sortingFn: "alphanumeric", // Enables sorting
  },
  {
    accessorKey: "eloRating",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="flex items-center"
      >
        Elo Rating
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const rating = row.getValue("eloRating");
      return <span className="text-right">{rating !== undefined ? rating : "-"}</span>;
    },
    sortingFn: "basic", // Enables sorting
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const user = row.original;

      const handleBanUser = async (userId: string) => {
        const response = await toggleBan(userId);
        if (response && response.success && response.user.isBanned) {

          const socket = getSocket();
          if (socket) {
            socket.emit("userBanned", { userId });

            // if user is in an ongoing game
            try {
              const ongoingGameResponse = await getOngoingGame(userId);
              console.log("ongoing game response", ongoingGameResponse)
              const ongoingGame = ongoingGameResponse;
              if (ongoingGame) {
                const opponentId = ongoingGame.playerOne === userId ? ongoingGame.playerTwo : ongoingGame.playerOne;
                socket.emit("opponentBanned", {
                  gameId: ongoingGame._id,
                  bannedUserId: userId,
                  opponentId,
                });
              }
            } catch (error) {
              console.error("No ongoing game found or error fetching:", error);
            }
          } else {
            console.error("Socket not initialized");
          }
        }
        await queryClient.invalidateQueries({ queryKey: ["users"] });
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
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user._id)} className="cursor-pointer">
              Copy User ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">View Profile</DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">Send Message</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleBanUser(user._id)} className="cursor-pointer">{user?.isBanned ? 'Unban User' : 'Ban User'}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
