"use client";

import { DataTable } from "@/components/data-table";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getClubs } from "@/lib/api/club";
import { clubColumns } from "./club-colums";

const LIMIT = 7;

export default function ClubManagementPage() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["clubs", page],
    queryFn: () => getClubs(page, LIMIT),
    keepPreviousData: true,
  });

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
        <DataTable
          columns={clubColumns(queryClient)}
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
    </>
  );
}
