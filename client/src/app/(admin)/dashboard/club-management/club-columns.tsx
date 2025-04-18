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
import { deleteAdminClub } from "@/lib/api/club";
import { toast } from "sonner";
import { ClubData } from "./ClubManagementPage";

export const clubColumns = (
  queryClient: QueryClient,
  handleViewDetails: (club: ClubData) => void
): ColumnDef<ClubData>[] => [
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
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("name")}</span>
    ),
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

      const handleDeleteClub = async (clubId: string) => {
        try {
          const response = await deleteAdminClub(clubId);
          if (response?.success) {
            toast.success("Club deleted successfully");
            await queryClient.invalidateQueries({ queryKey: ["clubs"] });
          } else {
            toast.error("Failed to delete club");
          }
        } catch (error) {
          toast.error("Error deleting club");
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
              onClick={() => navigator.clipboard.writeText(club._id)}
              className="cursor-pointer"
            >
              Copy Club ID
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleViewDetails(club)}
              className="cursor-pointer"
            >
              View Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleDeleteClub(club._id)}
              className="cursor-pointer text-red-600"
            >
              Delete Club
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
