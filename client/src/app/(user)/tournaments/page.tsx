"use client";

import { useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getTournaments,
  getUserTournaments,
  createTournament,
} from "@/lib/api/tournament";
import { useAuthStore } from "@/stores";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { TimeDropdown } from "@/components/chess/time-dropdown";
import { getGameType } from "@/lib/utils";
import { toast } from "sonner";
import { Trophy, CirclePlus, ArrowRight, Users, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";

const LIMIT = 10;

export default function TournamentsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<"public" | "my">("public");
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
    placeholderData: keepPreviousData,
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

  const handlePageChange = (id: string) => {
    router.push(`/tournaments/${id}`);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Pattern */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,var(--accent)_0%,transparent_50%)] opacity-[0.03]" />
      </div>

      <main className="relative z-10 max-w-5xl mx-auto px-4 md:px-6 pt-32 pb-20">
        {/* Header */}
        <div className="mb-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-8 h-8 text-accent" />
            <h1 className="font-serif text-4xl text-foreground font-bold tracking-tight">Tournaments</h1>
          </div>
          <p className="text-muted-foreground ml-1">Compete in events, challenge others, and win prizes</p>
        </div>

        {/* Tabs & Create Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("public")}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                activeTab === "public"
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "bg-card text-foreground/70 hover:bg-secondary border border-border"
              }`}
            >
              Public Tournaments
            </button>
            <button
              onClick={() => setActiveTab("my")}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                activeTab === "my"
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "bg-card text-foreground/70 hover:bg-secondary border border-border"
              }`}
            >
              My Tournaments
            </button>
          </div>

          {user && (
            <button 
              onClick={() => setOpenCreateDialog(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shrink-0"
            >
              <CirclePlus className="w-4 h-4" />
              Create Tournament
            </button>
          )}
        </div>

        {/* Content */}
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-500 delay-200">
          {activeTab === "public" ? (
            <div>
              {publicLoading ? (
                <div className="text-center py-16 text-muted-foreground animate-pulse">Loading public tournaments...</div>
              ) : publicTournaments?.tournaments?.length === 0 ? (
                <div className="text-center py-16">
                  <ShieldAlert className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No public tournaments available right now.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {publicTournaments?.tournaments?.map((tournament: any) => (
                      <div
                        key={tournament._id}
                        onClick={() => handlePageChange(tournament._id)}
                        className="group bg-card rounded-2xl border border-border/50 p-5 hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between"
                      >
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-14 h-14 rounded-xl bg-secondary/50 flex items-center justify-center border border-border group-hover:bg-accent/10 transition-colors shrink-0">
                            <Trophy className="w-7 h-7 text-muted-foreground group-hover:text-accent transition-colors" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-foreground text-lg group-hover:text-accent transition-colors line-clamp-1">{tournament.name}</h3>
                            <div className="flex gap-2 text-sm text-foreground/60 mt-1 capitalize">
                              <span className="bg-secondary px-2 py-0.5 rounded-md">{tournament.timeControl}</span>
                              <span className={tournament.status === 'active' ? 'text-green-500' : ''}>{tournament.status}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="w-4 h-4" />
                            <span>{tournament.players?.length || 0} / {tournament.maxPlayers} Players</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm font-medium text-accent opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0">
                            View
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-center mt-8 gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(p - 1, 1))}
                      disabled={page === 1}
                      className="px-4 py-2 bg-card border border-border rounded-lg text-sm disabled:opacity-50 hover:bg-secondary transition-colors"
                    >
                      Previous
                    </button>
                    <span className="flex items-center px-4 font-medium text-sm">
                      Page {page} of {publicTournaments?.totalPages || 1}
                    </span>
                    <button
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= (publicTournaments?.totalPages || 1)}
                      className="px-4 py-2 bg-card border border-border rounded-lg text-sm disabled:opacity-50 hover:bg-secondary transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div>
              {userLoading ? (
                <div className="text-center py-16 text-muted-foreground animate-pulse">Loading your tournaments...</div>
              ) : userTournaments?.length === 0 ? (
                <div className="text-center py-16">
                  <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">You haven't joined any tournaments yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userTournaments?.map((tournament: any) => (
                    <div
                      key={tournament._id}
                      onClick={() => handlePageChange(tournament._id)}
                      className="group bg-card rounded-2xl border border-border/50 p-5 hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between"
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-14 h-14 rounded-xl bg-secondary/50 flex items-center justify-center border border-border group-hover:bg-accent/10 transition-colors shrink-0">
                          <Trophy className="w-7 h-7 text-muted-foreground group-hover:text-accent transition-colors" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-foreground text-lg group-hover:text-accent transition-colors line-clamp-1">{tournament.name}</h3>
                          <div className="flex gap-2 text-sm text-foreground/60 mt-1 capitalize">
                            <span className="bg-secondary px-2 py-0.5 rounded-md">{tournament.timeControl}</span>
                            <span className={tournament.status === 'active' ? 'text-green-500' : ''}>{tournament.status}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span>{tournament.players?.length || 0} / {tournament.maxPlayers} Players</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm font-medium text-accent opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0">
                          View
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Tournament</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
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
                  className="mt-2"
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
                  className="mt-2"
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
                  className="mt-2"
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
                  className="mt-2"
                />
                {!isPasswordValid && formData.password.length > 0 && (
                  <p className="text-red-500 text-sm mt-1">
                    Password must be exactly 6 characters
                  </p>
                )}
              </div>
            </div>
            <DialogFooter className="mt-6">
              <button
                onClick={() => setOpenCreateDialog(false)}
                className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTournament}
                disabled={!isFormValid}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                Create
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
