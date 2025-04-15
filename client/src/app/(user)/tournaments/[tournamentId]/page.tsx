"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { io } from "socket.io-client";
import {
  joinTournament,
  startTournament,
  submitResult,
  submitPlayoffResult,
  pairMatch,
  getTournament,
} from "@/lib/api/tournament";
import { useAuthStore } from "@/stores";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { standingsColumns } from "./standings-columns";
import { matchColumns } from "./match-columns";
import { toast } from "sonner";

const socket = io(
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"
);

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

  useEffect(() => {
    if (tournament && user?._id) {
      setIsJoined(
        tournament.players.some((p: any) => p.userId._id === user._id)
      );
    }
  }, [tournament, user]);

  useEffect(() => {
    socket.on("tournamentUpdated", (updatedTournament: any) => {
      if (updatedTournament._id === tournamentId) {
        queryClient.setQueryData(
          ["tournament", tournamentId],
          updatedTournament
        );
      }
    });

    return () => {
      socket.off("tournamentUpdated");
    };
  }, [queryClient, tournamentId]);

  const handleJoin = async () => {
    if (!user?._id) {
      toast.error("Please log in to join the tournament");
      return;
    }
    const result = await joinTournament(tournamentId, user._id);
    if (result) {
      socket.emit("tournamentUpdate", result);
      queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId] });
    }
  };

  const handleStart = async () => {
    if (!user?._id) {
      toast.error("Please log in to start the tournament");
      return;
    }
    const result = await startTournament(tournamentId, user._id);
    if (result) {
      socket.emit("tournamentUpdate", result);
      queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId] });
    }
  };

  const handlePlay = async () => {
    if (!user?._id) {
      toast.error("Please log in to play");
      return;
    }
    const match = await pairMatch(tournamentId);
    if (match) {
      router.push(`/tournaments/${tournamentId}/play/${match.matchId}`);
    } else {
      toast.info("No available opponents");
    }
  };

  const handlePlayoff = () => {
    if (!user?._id || !tournament?.playoffMatch) {
      toast.error("Unable to start playoff match");
      return;
    }
    router.push(`/tournaments/${tournamentId}/play/playoff`);
  };

  if (isLoading || !tournament) return <div>Loading tournament...</div>;

  const userMatches = tournament.matches.filter(
    (m: any) => m.player1Id._id === user?._id || m.player2Id._id === user?._id
  );

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
            <p className="font-medium">{tournament.players.length}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Max Games</p>
            <p className="font-medium">{tournament.maxGames}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Created By</p>
            <p className="font-medium">{tournament.createdBy.username}</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          {tournament.status === "pending" && !isJoined && (
            <Button onClick={handleJoin}>Join Tournament</Button>
          )}
          {tournament.status === "pending" &&
            user?._id === tournament.createdBy._id && (
              <Button onClick={handleStart}>Start Tournament</Button>
            )}
          {tournament.status === "active" && isJoined && (
            <Button onClick={handlePlay}>Play Next Game</Button>
          )}
          {tournament.status === "playoff" &&
            tournament.playoffMatch &&
            (tournament.playoffMatch.player1Id._id === user?._id ||
              tournament.playoffMatch.player2Id._id === user?._id) && (
              <Button onClick={handlePlayoff}>Play Playoff</Button>
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
    </div>
  );
}
