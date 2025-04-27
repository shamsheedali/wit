"use client";

import { DataTable } from "@/components/data-table";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { userColumns } from "./user-colums";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { getUsers } from "@/lib/api/admin";
import { Button } from "@/components/ui/button";

const LIMIT = 7;

export default function UserManagementPage() {
  const [page, setPage] = useState(1);

  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["users", page],
    queryFn: () => getUsers(page, LIMIT),
    keepPreviousData: true, 
  });

  if (isLoading) return <div>Loading users...</div>;
  if (isError) return <div>Error loading users</div>;

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1>All Users</h1>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <DataTable columns={userColumns(queryClient)} data={data?.users || []} />

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
