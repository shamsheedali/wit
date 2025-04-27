"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { getTournament } from "@/lib/api/tournament";
import { getUsers } from "@/lib/api/admin";
import { useAuthStore } from "@/stores";
import { DataTable } from "@/components/data-table";
import { standingsColumns } from "../standings-columns";
import { matchColumns } from "../match-columns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AdminTournamentDetailsPage() {
  const params = useParams();
  const tournamentId = params.tournamentId as string;
  const { admin } = useAuthStore();
  const [userNamesMap, setUserNamesMap] = useState<{ [key: string]: string }>(
    {}
  );

  // Fetch tournament
  const {
    data: tournament,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["tournament", tournamentId],
    queryFn: () => getTournament(tournamentId),
    enabled: !!tournamentId,
  });

  // Fetch users for createdBy and player usernames
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersLimit = 100;
        let page = 1;
        let allUsers: { _id: string; username: string }[] = [];
        let hasMore = true;

        while (hasMore) {
          const response = await getUsers(page, usersLimit);
          if (response?.users?.length > 0) {
            allUsers = [...allUsers, ...response.users];
            page += 1;
            hasMore = response.users.length === usersLimit;
          } else {
            hasMore = false;
          }
        }

        const namesMap: { [key: string]: string } = {};
        allUsers.forEach((u) => {
          namesMap[u._id] = u.username;
        });
        setUserNamesMap(namesMap);
      } catch (error) {
        console.error("Failed to fetch users:", error);
        toast.error("Error loading user data");
      }
    };
    fetchUsers();
  }, []);

  if (isLoading || !tournament) return <div>Loading tournament...</div>;
  if (isError) return <div>Error loading tournament</div>;

  const isTournamentFull = tournament.players.length >= tournament.maxPlayers;

  return (
    <div className="lg:px-56 w-full min-h-screen pt-[80px] font-clashDisplay text-[#f0f0f0db] bg-[#09090b]">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">{tournament.name}</h1>
          <Link href="/dashboard/tournament-management">
            <Button
              variant="outline"
              className="bg-gray-700 text-white hover:bg-gray-600"
            >
              Back to Tournaments
            </Button>
          </Link>
        </div>
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
              {tournament.createdByAdmin ||
              (typeof tournament.createdBy === "string" &&
                tournament.createdBy === admin?._id)
                ? "Wit Official Admin"
                : typeof tournament.createdBy === "string"
                ? userNamesMap[tournament.createdBy] || "Unknown"
                : tournament.createdBy?.username || "Unknown"}
            </p>
          </div>
        </div>

        <h2 className="text-xl font-bold mb-4">Standings</h2>
        <DataTable
          columns={standingsColumns(userNamesMap)}
          data={tournament.players}
          className="mb-8 bg-[#27272a]"
        />

        <h2 className="text-xl font-bold mb-4">Matches</h2>
        <DataTable
          columns={matchColumns(userNamesMap)}
          data={tournament.matches}
          className="bg-[#27272a]"
        />
      </div>
    </div>
  );
}
