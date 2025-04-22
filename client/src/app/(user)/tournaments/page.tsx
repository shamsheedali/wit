"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getTournaments,
  getUserTournaments,
  createTournament,
} from "@/lib/api/tournament";
import { useAuthStore } from "@/stores";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { DataTable } from "@/components/data-table";
import { tournamentColumns } from "./tournament-columns";
import { TimeDropdown } from "@/components/chess/time-dropdown";
import { getGameType } from "@/lib/utils";
import { toast } from "sonner";

const LIMIT = 10;

export default function TournamentsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    maxGames: "10",
    maxPlayers: "10",
    password: "",
  });
  const [selectedTime, setSelectedTime] = useState<string>("10min");

  const { data: publicTournaments, isLoading: publicLoading } = useQuery({
    queryKey: ["tournaments", page],
    queryFn: () => getTournaments(page, LIMIT),
    keepPreviousData: true,
  });

  const { data: userTournaments, isLoading: userLoading } = useQuery({
    queryKey: ["userTournaments", user?._id],
    queryFn: () => getUserTournaments(user?._id || ""),
    enabled: !!user?._id,
  });

  const isNameValid = formData.name.trim().length > 0;
  const isMaxGamesValid = parseInt(formData.maxGames) > 0;
  const isMaxPlayersValid =
    parseInt(formData.maxPlayers) >= 2 && parseInt(formData.maxPlayers) <= 20;
  const isPasswordValid =
    formData.password.length === 0 || formData.password.length === 6;
  const isFormValid =
    isNameValid &&
    isMaxGamesValid &&
    isMaxPlayersValid &&
    isPasswordValid &&
    selectedTime;

  const handleCreateTournament = async () => {
    if (!user?._id) {
      toast.error("Please log in to create a tournament");
      return;
    }
    try {
      const tournament = await createTournament({
        name: formData.name,
        gameType: getGameType(selectedTime),
        timeControl: selectedTime,
        maxGames: parseInt(formData.maxGames),
        maxPlayers: parseInt(formData.maxPlayers),
        password: formData.password || undefined,
        createdBy: user._id,
      });
      if (tournament) {
        queryClient.invalidateQueries({ queryKey: ["tournaments"] });
        queryClient.invalidateQueries({ queryKey: ["userTournaments"] });
        setOpenCreateDialog(false);
        setFormData({
          name: "",
          maxGames: "10",
          maxPlayers: "10",
          password: "",
        });
        setSelectedTime("10min");
        toast.success("Tournament created successfully");
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

  if (publicLoading || userLoading) return <div>Loading tournaments...</div>;

  return (
    <div className="lg:px-56 w-full h-screen pt-[80px] font-clashDisplay text-[#f0f0f0db] bg-[#1a1a1a]">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Tournaments</h1>
          {user && (
            <Button
              onClick={() => setOpenCreateDialog(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              Create Tournament
            </Button>
          )}
        </div>

        <Tabs defaultValue="public" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 bg-gray-800">
            <TabsTrigger value="public">Public Tournaments</TabsTrigger>
            <TabsTrigger value="my">My Tournaments</TabsTrigger>
          </TabsList>
          <TabsContent value="public">
            <DataTable
              columns={tournamentColumns}
              data={publicTournaments?.tournaments || []}
            />
            <div className="flex justify-end mt-4 gap-2">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="bg-gray-700 text-white hover:bg-gray-600"
              >
                Previous
              </Button>
              <span className="flex items-center px-4">
                Page {page} of {publicTournaments?.totalPages || 1}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= (publicTournaments?.totalPages || 1)}
                className="bg-gray-700 text-white hover:bg-gray-600"
              >
                Next
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="my">
            <DataTable
              columns={tournamentColumns}
              data={userTournaments || []}
            />
          </TabsContent>
        </Tabs>

        <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
          <DialogContent className="bg-[#262522] text-white">
            <DialogHeader>
              <DialogTitle>Create New Tournament</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-sm">
                  Tournament Name
                </Label>
                <Input
                  id="name"
                  placeholder="Enter tournament name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="bg-gray-800 text-white border-gray-700 mt-2"
                />
                {!isNameValid && formData.name.length > 0 && (
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
                  placeholder="Enter max games"
                  value={formData.maxGames}
                  onChange={(e) =>
                    setFormData({ ...formData, maxGames: e.target.value })
                  }
                  className="bg-gray-800 text-white border-gray-700 mt-2"
                />
                {!isMaxGamesValid && formData.maxGames.length > 0 && (
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
                  placeholder="Enter max players"
                  value={formData.maxPlayers}
                  onChange={(e) =>
                    setFormData({ ...formData, maxPlayers: e.target.value })
                  }
                  className="bg-gray-800 text-white border-gray-700 mt-2"
                />
                {!isMaxPlayersValid && formData.maxPlayers.length > 0 && (
                  <p className="text-red-500 text-sm mt-1">
                    Max players must be between 2 and 20
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="password" className="text-sm">
                  Password (Optional, 6 characters)
                </Label>
                <Input
                  id="password"
                  type="text"
                  placeholder="Enter password (optional)"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="bg-gray-800 text-white border-gray-700 mt-2"
                />
                {!isPasswordValid && formData.password.length > 0 && (
                  <p className="text-red-500 text-sm mt-1">
                    Password must be exactly 6 characters
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setOpenCreateDialog(false)}
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
      </div>
    </div>
  );
}
