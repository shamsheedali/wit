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
import { QueryClient } from "@tanstack/react-query";

export type ClubData = {
  _id: string;
  name: string;
  clubType: "public" | "private";
  admins: { _id: string; username: string }[];
  members: { _id: string; username: string }[];
};

export const clubColumns = (queryClient: QueryClient): ColumnDef<ClubData>[] => [
  {
    accessorKey: "_id",
    header: "Club ID",
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
        Club Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <span className="font-medium">{row.getValue("name")}</span>,
    sortingFn: "alphanumeric",
  },
  {
    accessorKey: "clubType",
    header: "Type",
    cell: ({ row }) => <span>{row.getValue("clubType")}</span>,
  },
  {
    accessorKey: "admins",
    header: "Admins",
    cell: ({ row }) => {
      const admins = row.getValue("admins") as { username: string }[];
      return <span>{admins.map((a) => a.username).join(", ")}</span>;
    },
  },
  {
    accessorKey: "members",
    header: "Member Count",
    cell: ({ row }) => {
      const members = row.getValue("members") as { username: string }[];
      return <span>{members.length}</span>;
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const club = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(club._id)} className="cursor-pointer">
              Copy Club ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">View Details</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];