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
import { matchColumns } from "./match-columns";
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

  const [isJoined, setIsJoined] = useState(false);
  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (tournament && user?._id) {
      const joined = tournament.players.some(
        (p: any) => p.userId?._id === user._id || p.userId === user._id
      );
      setIsJoined(joined);
    }
  }, [tournament, user]);

  useEffect(() => {
    const socketInstance = getSocket();
    if (socketInstance) {
      socketInstance.on("tournamentUpdated", (updatedTournament: any) => {
        if (updatedTournament._id === tournamentId) {
          queryClient.setQueryData(
            ["tournament", tournamentId],
            updatedTournament
          );
          toast.info("Tournament updated");
        }
      });

      return () => {
        socketInstance.off("tournamentUpdated");
      };
    }
  }, [queryClient, tournamentId]);

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
          players: tournament.players.map(
            (p: any) => p.userId?._id || p.userId
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
        toast.success("You have left the tournament");
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
        toast.success("Tournament deleted");
      }
    } catch (error) {
      toast.error("Error deleting tournament");
      console.error(error);
    }
  };

  if (isLoading || !tournament) return <div>Loading tournament...</div>;

  const userMatches = tournament.matches.filter(
    (m: any) => m.player1Id?._id === user?._id || m.player2Id?._id === user?._id
  );

  const isTournamentFull = tournament.players.length >= tournament.maxPlayers;

  return (
    <div className="lg:px-56 w-full h-screen pt-[80px] font-clashDisplay text-[#f0f0f0db]">
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">{tournament.name}</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <p className="text-sm text-muted-foreground">Time Control</p>
            <p className="font-medium">{tournament.timeControl}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <p className="font-medium">{tournament.status}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Players</p>
            <p className="font-medium">
              {tournament.players.length}/{tournament.maxPlayers}
              {isTournamentFull && (
                <span className="text-red-500 ml-2">(Full)</span>
              )}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Max Games</p>
            <p className="font-medium">{tournament.maxGames}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Created By</p>
            <p className="font-medium">
              {tournament.createdByAdmin
                ? "Admin"
                : tournament.createdBy?.username || "Unknown"}
            </p>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          {tournament.status === "pending" && !isJoined && (
            <Button
              onClick={handleJoin}
              disabled={isTournamentFull}
              className={
                isTournamentFull
                  ? "bg-gray-600"
                  : "bg-green-600 hover:bg-green-700"
              }
            >
              Join Tournament
            </Button>
          )}
          {tournament.status === "pending" &&
            (user?._id === tournament.createdBy?._id ||
              (tournament.createdByAdmin && user?.isAdmin)) && (
              <Button
                onClick={handleStart}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Start Tournament
              </Button>
            )}
          {tournament.status === "active" && isJoined && (
            <Button
              onClick={handlePlay}
              className="bg-green-600 hover:bg-green-700"
            >
              Play Next Game
            </Button>
          )}
          {(tournament.status === "pending" ||
            tournament.status === "active") &&
            isJoined && (
              <Button
                variant="destructive"
                onClick={() => setIsExitDialogOpen(true)}
                className="bg-red-600 hover:bg-red-700"
              >
                Exit Tournament
              </Button>
            )}
          {(tournament.status === "pending" ||
            tournament.status === "cancelled") &&
            !tournament.createdByAdmin &&
            user?._id === tournament.createdBy?._id && (
              <Button
                variant="destructive"
                onClick={() => setIsDeleteDialogOpen(true)}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete Tournament
              </Button>
            )}
          {tournament.status === "playoff" &&
            tournament.playoffMatch &&
            (tournament.playoffMatch.player1Id?._id === user?._id ||
              tournament.playoffMatch.player2Id?._id === user?._id) && (
              <Button
                onClick={handlePlayoff}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Play Playoff
              </Button>
            )}
        </div>

        <h2 className="text-xl font-bold mb-4">Standings</h2>
        <DataTable
          columns={standingsColumns}
          data={tournament.players}
          className="mb-8"
        />

        {user && (
          <>
            <h2 className="text-xl font-bold mb-4">Your Matches</h2>
            <DataTable columns={matchColumns} data={userMatches} />
          </>
        )}
      </div>

      <Dialog open={isExitDialogOpen} onOpenChange={setIsExitDialogOpen}>
        <DialogContent className="bg-[#262522] text-white max-w-sm">
          <DialogHeader>
            <DialogTitle>Exit Tournament</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-300">
              Are you sure you want to exit the tournament? This action cannot
              be undone.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsExitDialogOpen(false)}
              className="bg-gray-700 text-white hover:bg-gray-600"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleExit}
              className="bg-red-600 hover:bg-red-700"
            >
              Exit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-[#262522] text-white max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Tournament</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-300">
              Are you sure you want to delete this tournament? This action
              cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="bg-gray-700 text-white hover:bg-gray-600"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isPasswordDialogOpen}
        onOpenChange={setIsPasswordDialogOpen}
      >
        <DialogContent className="bg-[#262522] text-white max-w-sm">
          <DialogHeader>
            <DialogTitle>Enter Tournament Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter 6-character password"
              className="bg-gray-800 text-white border-gray-700"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPasswordDialogOpen(false)}
              className="bg-gray-700 text-white hover:bg-gray-600"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePasswordSubmit}
              className="bg-green-600 hover:bg-green-700"
            >
              Join
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
