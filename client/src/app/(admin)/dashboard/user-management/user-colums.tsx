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

// Define the shape of UserData
export type UserData = {
  userId: string;
  username: string;
  rating?: number; // Optional to handle missing values
};

export const userColumns: ColumnDef<UserData>[] = [
  {
    accessorKey: "userId",
    header: "User ID",
    cell: ({ row }) => <span>{row.getValue("userId")}</span>,
    enableSorting: false, // No sorting for user IDs
  },
  {
    accessorKey: "username",
    header: () => (
      <Button variant="ghost" className="flex items-center">
        Username
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <span className="font-medium">{row.getValue("username")}</span>,
    sortingFn: "alphanumeric", // Enables sorting
  },
  {
    accessorKey: "rating",
    header: () => (
      <Button variant="ghost" className="flex items-center">
        Elo Rating
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const rating = row.getValue("rating");
      return <span className="text-right">{rating !== undefined ? rating : "-"}</span>;
    },
    sortingFn: "basic", // Enables sorting
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const user = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.userId)}>
              Copy User ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View Profile</DropdownMenuItem>
            <DropdownMenuItem>Send Message</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
