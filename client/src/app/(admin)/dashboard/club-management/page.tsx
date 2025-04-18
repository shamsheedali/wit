"use client";

import { DataTable } from "@/components/data-table";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getClubs, createAdminClub } from "@/lib/api/club";
import { clubColumns } from "./club-columns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuthStore } from "@/stores";

const LIMIT = 7;

export type ClubData = {
  _id: string;
  name: string;
  clubType: "public" | "private";
  admins: { _id: string; username: string }[];
  members: { _id: string; username: string }[];
};

export default function ClubManagementPage() {
  const [page, setPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [clubName, setClubName] = useState("");
  const [description, setDescription] = useState("");
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedClub, setSelectedClub] = useState<ClubData | null>(null);

  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["clubs", page],
    queryFn: () => getClubs(page, LIMIT),
    keepPreviousData: true,
  });

  const handleCreateClub = async () => {
    if (!user?._id) {
      toast.error("Please log in to create a club");
      return;
    }
    try {
      const response = await createAdminClub({
        name: clubName,
        description,
        userId: user._id,
      });
      if (response?.success) {
        toast.success("Club created successfully");
        setIsCreateDialogOpen(false);
        setClubName("");
        setDescription("");
        await queryClient.invalidateQueries({ queryKey: ["clubs"] });
      } else {
        toast.error("Failed to create club");
      }
    } catch (error) {
      toast.error("Error creating club");
      console.error(error);
    }
  };

  const handleViewDetails = (club: ClubData) => {
    setSelectedClub(club);
    setIsDetailsDialogOpen(true);
  };

  if (isLoading) return <div>Loading clubs...</div>;
  if (isError) return <div>Error loading clubs</div>;

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1>All Clubs</h1>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex justify-end">
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            Create Club
          </Button>
        </div>
        <DataTable
          columns={clubColumns(queryClient, handleViewDetails)}
          data={data?.clubs || []}
        />

        {/* Pagination Controls */}
        <div className="flex justify-end mt-4 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1}
          >
            Previous
          </Button>

          <span className="flex items-center px-4">
            Page {page} of {data?.totalPages || 1}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((prev) => prev + 1)}
            disabled={page >= (data?.totalPages || 1)}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Create Club Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="bg-[#262522] text-white">
          <DialogHeader>
            <DialogTitle>Create Public Club</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-sm">
                Club Name
              </Label>
              <Input
                id="name"
                value={clubName}
                onChange={(e) => setClubName(e.target.value)}
                placeholder="Enter club name"
                className="bg-gray-800 text-white border-gray-700 mt-2"
              />
            </div>
            <div>
              <Label htmlFor="description" className="text-sm">
                Description (Optional)
              </Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter club description"
                className="bg-gray-800 text-white border-gray-700 mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              className="bg-gray-700 text-white hover:bg-gray-600"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateClub}
              className="bg-green-600 hover:bg-green-700"
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog
        open={isDetailsDialogOpen}
        onOpenChange={(open) => {
          setIsDetailsDialogOpen(open);
          if (!open) setSelectedClub(null); // Clear selected club when closing
        }}
      >
        <DialogContent className="bg-[#262522] text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Club Members - {selectedClub?.name || "Club"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedClub?.members.length > 0 ? (
              <ul className="space-y-2">
                {selectedClub.members.map((member) => (
                  <li
                    key={member._id}
                    className="flex justify-between border-b border-gray-700 py-2"
                  >
                    <span>{member.username}</span>
                    <span className="text-gray-400">{member._id}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400">No members in this club.</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDetailsDialogOpen(false)}
              className="bg-gray-700 text-white hover:bg-gray-600"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
