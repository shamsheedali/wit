"use client";

import { DataTable } from "@/components/data-table";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { gameColumns } from "./game-history-colums";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { getAllGames, getUsers } from "@/lib/api/admin";
import { Button } from "@/components/ui/button";
import { GamesResponse, UsersResponse } from "@/types/api";

const LIMIT = 7;

export default function GameManagementPage() {
  const [page, setPage] = useState(1);
  const [playerNames, setPlayerNames] = useState<{ [key: string]: string }>({});

  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery<GamesResponse>({
    queryKey: ["games", page],
    queryFn: () => getAllGames(page, LIMIT),
    placeholderData: keepPreviousData,
  });

  // Fetch all usernames
  useEffect(() => {
    const fetchUserNames = async () => {
      try {
        const limit = 100;
        let page = 1;
        let allUsers: { _id: string; username: string }[] = [];
        let hasMore = true;

        while (hasMore) {
          const response = await getUsers(page, limit) as UsersResponse;
          if (response?.users?.length > 0) {
            allUsers = [...allUsers, ...response.users];
            page += 1;
            hasMore = response.users.length === limit;
          } else {
            hasMore = false;
          }
        }

        const namesMap: { [key: string]: string } = {};
        allUsers.forEach((u) => {
          namesMap[u._id] = u.username;
        });
        setPlayerNames(namesMap);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
    };

    fetchUserNames();
  }, []);

  if (isLoading) return <div>Loading games...</div>;
  if (isError) return <div>Error loading games</div>;

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1>All Games</h1>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <DataTable
          columns={gameColumns(queryClient, playerNames)}
          data={data?.games || []}
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
    </>
  );
}