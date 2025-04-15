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

const LIMIT = 10;

export default function TournamentsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    timeControl: "5|0",
    maxGames: "10",
  });

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

  const handleCreateTournament = async () => {
    if (!user?._id) return;
    const tournament = await createTournament({
      ...formData,
      maxGames: parseInt(formData.maxGames),
      createdBy: user._id,
    });
    if (tournament) {
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
      queryClient.invalidateQueries({ queryKey: ["userTournaments"] });
      setOpenCreateDialog(false);
      setFormData({ name: "", timeControl: "5|0", maxGames: "10" });
    }
  };

  if (publicLoading || userLoading) return <div>Loading tournaments...</div>;

  return (
    <div className="lg:px-56 w-full h-screen pt-[80px] font-clashDisplay text-[#f0f0f0db]">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Tournaments</h1>
          {user && (
            <Button onClick={() => setOpenCreateDialog(true)}>
              Create Tournament
            </Button>
          )}
        </div>

        <Tabs defaultValue="public" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
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
              >
                Previous
              </Button>
              <span>
                Page {page} of {publicTournaments?.totalPages || 1}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= (publicTournaments?.totalPages || 1)}
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Tournament</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Tournament Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
              <Input
                placeholder="Time Control (e.g., 5|0)"
                value={formData.timeControl}
                onChange={(e) =>
                  setFormData({ ...formData, timeControl: e.target.value })
                }
              />
              <Input
                placeholder="Max Games (e.g., 10)"
                type="number"
                value={formData.maxGames}
                onChange={(e) =>
                  setFormData({ ...formData, maxGames: e.target.value })
                }
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setOpenCreateDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateTournament}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
