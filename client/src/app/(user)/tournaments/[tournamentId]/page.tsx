"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import {
  joinTournament,
  startTournament,
  pairMatch,
  getTournament,
  leaveTournament,
  deleteTournament,
} from "@/lib/api/tournament";
import { useAuthStore } from "@/stores";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { standingsColumns } from "./standings-columns";
import { createMatchColumns } from "./match-columns";
import { toast } from "sonner";
import { getSocket } from "@/lib/socket";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Trophy } from "lucide-react";
import { TournamentData, TournamentMatch, TournamentPlayer, TournamentPlayerUser } from "@/types/tournament";

export default function TournamentPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const tournamentId = params.tournamentId as string;

  const { data: tournament, isLoading } = useQuery({
    queryKey: ["tournament", tournamentId],
    queryFn: () => getTournament(tournamentId),
    enabled: !!tournamentId,
  });

  const columns = createMatchColumns(user?._id);

  const [isJoined, setIsJoined] = useState(false);
  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (tournament && user?._id) {
      const joined = tournament.players.some((p: TournamentPlayer) => {
        const playerId = typeof p.userId === "string" ? p.userId : p.userId._id;
        return playerId === user._id;
      });
      setIsJoined(joined);
    }
  }, [tournament, user]);

  useEffect(() => {
    const socketInstance = getSocket();
    if (socketInstance) {
      socketInstance.on(
        "tournamentUpdated",
        (updatedTournament: TournamentData) => {
          if (updatedTournament._id === tournamentId) {
            queryClient.setQueryData(
              ["tournament", tournamentId],
              updatedTournament
            );
            toast.info("Tournament updated");
          }
        }
      );

      return () => {
        socketInstance.off("tournamentUpdated");
      };
    }
  }, [tournamentId, queryClient]);

  const handleJoin = async () => {
    if (!user?._id) {
      toast.error("Please log in to join the tournament");
      return;
    }
    if (tournament?.players.length >= tournament?.maxPlayers) {
      toast.error("Tournament is full");
      return;
    }
    if (!tournament?.createdByAdmin && tournament?.password) {
      setIsPasswordDialogOpen(true);
    } else {
      await performJoin();
    }
  };

  const performJoin = async (inputPassword?: string) => {
    try {
      const result = await joinTournament(
        tournamentId,
        user!._id,
        inputPassword
      );
      if (result) {
        const socketInstance = getSocket();
        socketInstance?.emit("tournamentUpdate", result);
        queryClient.invalidateQueries({
          queryKey: ["tournament", tournamentId],
        });
        setIsPasswordDialogOpen(false);
        setPassword("");
      }
    } catch (error) {
      toast.error("Error joining tournament");
      console.error(error);
    }
  };

  const handlePasswordSubmit = async () => {
    if (!password) {
      toast.error("Please enter a password");
      return;
    }
    await performJoin(password);
  };

  const handleStart = async () => {
    if (!user?._id) {
      toast.error("Please log in to start the tournament");
      return;
    }
    try {
      const result = await startTournament(tournamentId, user._id);
      if (result) {
        const socketInstance = getSocket();
        socketInstance?.emit("tournamentUpdate", result);
        socketInstance?.emit("tournamentStarted", {
          tournamentId,
          tournamentName: tournament.name,
          players: tournament.players.map((p: TournamentPlayer) => 
            typeof p.userId === 'string' ? p.userId : p.userId._id
          ),
        });
        queryClient.invalidateQueries({
          queryKey: ["tournament", tournamentId],
        });
      }
    } catch (error) {
      toast.error("Error starting tournament");
      console.error(error);
    }
  };

  const handlePlay = async () => {
    if (!user?._id) {
      toast.error("Please log in to play");
      return;
    }
    try {
      const match = await pairMatch(tournamentId);
      if (match) {
        const socketInstance = getSocket();
        socketInstance?.emit("tournamentPlayRequest", {
          senderId: user._id,
          receiverId: match.opponentId,
          senderName: user.username,
          senderPfp: user.profileImageUrl || "",
          senderEloRating: user.eloRating,
          time: match.timeControl,
          tournamentId,
          matchId: match.matchId,
        });
        toast.info(`Play request sent to ${match.opponentUsername}`);
      } else {
        toast.info("No available opponents");
      }
    } catch (error) {
      toast.error("Error pairing match");
      console.error(error);
    }
  };

  const handlePlayoff = () => {
    if (!user?._id || !tournament?.playoffMatch) {
      toast.error("Unable to start playoff match");
      return;
    }
    router.push(`/tournaments/${tournamentId}/play/playoff`);
  };

  const handleExit = async () => {
    if (!user?._id) {
      toast.error("Please log in to exit the tournament");
      return;
    }
    try {
      const result = await leaveTournament(tournamentId, user._id);
      if (result) {
        const socketInstance = getSocket();
        socketInstance?.emit("tournamentUpdate", result);
        setIsExitDialogOpen(false);
        setIsJoined(false);
        queryClient.invalidateQueries({
          queryKey: ["tournament", tournamentId],
        });
      }
    } catch (error) {
      toast.error("Error leaving tournament");
      console.error(error);
    }
  };

  const handleDelete = async () => {
    if (!user?._id) {
      toast.error("Please log in to delete the tournament");
      return;
    }
    try {
      const result = await deleteTournament(tournamentId, user._id);
      if (result) {
        const socketInstance = getSocket();
        socketInstance?.emit("tournamentUpdate", result);
        setIsDeleteDialogOpen(false);
        router.push("/tournaments");
      }
    } catch (error) {
      toast.error("Error deleting tournament");
      console.error(error);
    }
  };

  if (isLoading || !tournament) return <div>Loading tournament...</div>;

  const userMatches = tournament.matches.filter((m: TournamentMatch) => {
    const getPlayerId = (player: string | TournamentPlayerUser): string | undefined => {
      return typeof player === 'string' ? player : player._id;
    };
  
    const player1Id = getPlayerId(m.player1Id);
    const player2Id = getPlayerId(m.player2Id);
    
    return player1Id === user?._id || player2Id === user?._id;
  });

  const isTournamentFull = tournament.players.length >= tournament.maxPlayers;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Pattern */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,var(--accent)_0%,transparent_50%)] opacity-[0.03]" />
      </div>

      <main className="relative z-10 max-w-5xl mx-auto px-4 md:px-6 pt-32 pb-20">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.push("/tournaments")} 
              className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary text-foreground hover:bg-secondary/80 transition-colors mr-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Trophy className="w-8 h-8 text-accent" />
            <h1 className="font-serif text-3xl md:text-4xl text-foreground font-bold tracking-tight line-clamp-1">{tournament.name}</h1>
          </div>
          
          <div className="flex flex-wrap gap-2 md:ml-0">
            {tournament.status === "pending" && !isJoined && (
              <button
                onClick={handleJoin}
                disabled={isTournamentFull}
                className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 shadow-sm ${
                  isTournamentFull ? "opacity-50 cursor-not-allowed bg-secondary text-muted-foreground" : "bg-accent text-accent-foreground hover:bg-accent/90"
                }`}
              >
                Join Tournament
              </button>
            )}
            {tournament.status === "pending" &&
              (user?._id === tournament.createdBy?._id ||
                (tournament.createdByAdmin)) && (
                <button
                  onClick={handleStart}
                  className="px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 shadow-sm bg-blue-600 text-white hover:bg-blue-700"
                >
                  Start Tournament
                </button>
              )}
            {tournament.status === "active" && isJoined && (
              <button
                onClick={handlePlay}
                className="px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 shadow-sm bg-accent text-accent-foreground hover:bg-accent/90"
              >
                Play Next Game
              </button>
            )}
            {(tournament.status === "pending" ||
              tournament.status === "active") &&
              isJoined && (
                <button
                  onClick={() => setIsExitDialogOpen(true)}
                  className="px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 shadow-sm border border-red-500/50 text-red-500 hover:bg-red-500/10"
                >
                  Exit Tournament
                </button>
              )}
            {(tournament.status === "pending" ||
              tournament.status === "cancelled") &&
              !tournament.createdByAdmin &&
              user?._id === tournament.createdBy?._id && (
                <button
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 shadow-sm border border-red-500/50 text-red-500 hover:bg-red-500/10"
                >
                  Delete Tournament
                </button>
              )}
            {tournament.status === "playoff" &&
              tournament.playoffMatch &&
              (tournament.playoffMatch.player1Id?._id === user?._id ||
                tournament.playoffMatch.player2Id?._id === user?._id) && (
                <button
                  onClick={handlePlayoff}
                  className="px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 shadow-sm bg-purple-600 text-white hover:bg-purple-700"
                >
                  Play Playoff
                </button>
              )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8 bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Time Control</p>
            <p className="font-medium text-foreground">{tournament.timeControl}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Status</p>
            <p className="font-medium text-foreground capitalize">{tournament.status}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Players</p>
            <p className="font-medium text-foreground">
              {tournament.players.length}/{tournament.maxPlayers}
              {isTournamentFull && (
                <span className="text-red-500 ml-2 text-sm">(Full)</span>
              )}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Max Games</p>
            <p className="font-medium text-foreground">{tournament.maxGames}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Created By</p>
            <p className="font-medium text-foreground">
              {tournament.createdByAdmin
                ? "Admin"
                : tournament.createdBy?.username || "Unknown"}
            </p>
          </div>
        </div>

        <h2 className="text-xl font-serif font-bold mb-4 text-foreground">Standings</h2>
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 overflow-hidden mb-8">
          <DataTable
            columns={standingsColumns}
            data={tournament.players}
          />
        </div>

        {userMatches.length > 0 && (
          <>
            <h2 className="text-xl font-serif font-bold mb-4 text-foreground">Your Matches</h2>
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 overflow-hidden mb-8">
              <DataTable columns={columns} data={userMatches} />
            </div>
          </>
        )}
      </main>

      <Dialog open={isExitDialogOpen} onOpenChange={setIsExitDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Exit Tournament</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Are you sure you want to exit the tournament? This action cannot
              be undone.
            </p>
          </div>
          <DialogFooter className="mt-6">
            <button
              onClick={() => setIsExitDialogOpen(false)}
              className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExit}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
            >
              Exit
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Tournament</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Are you sure you want to delete this tournament? This action
              cannot be undone.
            </p>
          </div>
          <DialogFooter className="mt-6">
            <button
              onClick={() => setIsDeleteDialogOpen(false)}
              className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isPasswordDialogOpen}
        onOpenChange={setIsPasswordDialogOpen}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Enter Tournament Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter 6-character password"
              className="mt-2"
            />
          </div>
          <DialogFooter className="mt-6">
            <button
              onClick={() => setIsPasswordDialogOpen(false)}
              className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handlePasswordSubmit}
              className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors"
            >
              Join
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
