"use client";

import { DataTable } from "@/components/data-table";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { tournamentColumns } from "./tournament-columns";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { getTournaments } from "@/lib/api/admin";
import { Button } from "@/components/ui/button";
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
import { createTournament } from "@/lib/api/admin";
import { useAuthStore } from "@/stores";
import { getGameType } from "@/lib/utils";
import { TimeDropdown } from "@/components/chess/time-dropdown";

const LIMIT = 7;

export default function TournamentManagementPage() {
  const [page, setPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [tournamentName, setTournamentName] = useState("");
  const [maxGames, setMaxGames] = useState("5");
  const [maxPlayers, setMaxPlayers] = useState("10");
  const [selectedTime, setSelectedTime] = useState<string>("10min");

  const queryClient = useQueryClient();
  const { admin } = useAuthStore();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["tournaments", page],
    queryFn: () => getTournaments(page, LIMIT),
    keepPreviousData: true,
  });

  const isNameValid = tournamentName.trim().length > 0;
  const isMaxGamesValid = parseInt(maxGames) > 0;
  const isMaxPlayersValid =
    parseInt(maxPlayers) >= 2 && parseInt(maxPlayers) <= 20;
  const isFormValid =
    isNameValid && isMaxGamesValid && isMaxPlayersValid && selectedTime;

  const handleCreateTournament = async () => {
    if (!admin?._id) {
      toast.error("Please log in to create a tournament");
      return;
    }
    try {
      const response = await createTournament({
        name: tournamentName,
        gameType: getGameType(selectedTime),
        timeControl: selectedTime,
        maxGames: parseInt(maxGames),
        maxPlayers: parseInt(maxPlayers),
        createdBy: admin._id,
        createdByAdmin: true,
      });
      if (response?.success) {
        toast.success("Tournament created successfully");
        setIsCreateDialogOpen(false);
        setTournamentName("");
        setMaxGames("5");
        setMaxPlayers("10");
        setSelectedTime("10min");
        await queryClient.invalidateQueries({ queryKey: ["tournaments"] });
      } else {
        toast.error("Failed to create tournament");
      }
    } catch (error) {
      toast.error("Error creating tournament");
      console.error(error);
    }
  };

  const handleTimeChange = (value: string) => {
    setSelectedTime(value);
  };

  if (isLoading) return <div>Loading tournaments...</div>;
  if (isError) return <div>Error loading tournaments</div>;

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1>All Tournaments</h1>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex justify-end">
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            Create Tournament
          </Button>
        </div>
        <DataTable
          columns={tournamentColumns(queryClient)}
          data={data?.tournaments || []}
        />

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

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="bg-[#262522] text-white">
          <DialogHeader>
            <DialogTitle>Create Tournament</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-sm">
                Tournament Name
              </Label>
              <Input
                id="name"
                value={tournamentName}
                onChange={(e) => setTournamentName(e.target.value)}
                placeholder="Enter tournament name"
                className="bg-gray-800 text-white border-gray-700 mt-2"
              />
              {!isNameValid && tournamentName.length > 0 && (
                <p className="text-red-500 text-sm mt-1">
                  Tournament name is required
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="timeControl" className="text-sm">
                Time Control
              </Label>
              <TimeDropdown onValueChange={handleTimeChange} />
              {!selectedTime && (
                <p className="text-red-500 text-sm mt-1">
                  Time control is required
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="maxGames" className="text-sm">
                Max Games per Player
              </Label>
              <Input
                id="maxGames"
                type="number"
                value={maxGames}
                onChange={(e) => setMaxGames(e.target.value)}
                placeholder="Enter max games"
                className="bg-gray-800 text-white border-gray-700 mt-2"
              />
              {!isMaxGamesValid && maxGames.length > 0 && (
                <p className="text-red-500 text-sm mt-1">
                  Max games must be greater than 0
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="maxPlayers" className="text-sm">
                Max Players (2-20)
              </Label>
              <Input
                id="maxPlayers"
                type="number"
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(e.target.value)}
                placeholder="Enter max players"
                className="bg-gray-800 text-white border-gray-700 mt-2"
              />
              {!isMaxPlayersValid && maxPlayers.length > 0 && (
                <p className="text-red-500 text-sm mt-1">
                  Max players must be between 2 and 20
                </p>
              )}
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
              onClick={handleCreateTournament}
              disabled={!isFormValid}
              className="bg-green-600 hover:bg-green-700"
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
