"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSocket } from "@/lib/socket";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { getGameReports } from "@/lib/api/admin";
import { ChessMove } from "@/types/game";

interface GameReport {
  _id: string;
  gameId: { _id: string; fen: string; moves: ChessMove[] };
  reportingUserId: { _id: string; username: string };
  reportedUserId: { _id: string; username: string };
  reason: string;
  details: string;
  timestamp: string;
  status: "pending" | "reviewed" | "resolved";
}

export default function GameMessagesPage() {
  const queryClient = useQueryClient();

  const { data: reports = [] } = useQuery({
    queryKey: ["gameReports"],
    queryFn: getGameReports,
  });

  useEffect(() => {
    const socket = getSocket();
    if (socket) {
      const handleGameReportReceived = (data: GameReport) => {
        console.log("Received game report:", data); // Debug log
        queryClient.setQueryData(
          ["gameReports"],
          (old: GameReport[] | undefined) => {
            if (old?.some((report) => report._id === data._id)) {
              return old;
            }
            return old ? [data, ...old] : [data];
          }
        );
      };

      socket.on("gameReportReceived", handleGameReportReceived);

      return () => {
        socket.off("gameReportReceived", handleGameReportReceived);
      };
    }
  }, [queryClient]);

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1>Game Reports</h1>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="space-y-4">
          {reports.length === 0 ? (
            <p className="text-gray-400">No game reports available.</p>
          ) : (
            reports.map((report: GameReport) => (
              <Card key={report._id} className="bg-[#262522] border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg">
                    Report #{report._id.slice(-6)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p>
                    <strong>Game ID:</strong> {report?.gameId?._id}
                  </p>
                  <p>
                    <strong>Reporting User:</strong>{" "}
                    {report?.reportingUserId?.username}
                  </p>
                  <p>
                    <strong>Reported User:</strong>{" "}
                    {report?.reportedUserId?.username}
                  </p>
                  <p>
                    <strong>Reason:</strong>{" "}
                    {report?.reason === "cheating"
                      ? "Cheating"
                      : report.reason === "inappropriate_behavior"
                      ? "Inappropriate Behavior"
                      : "Other"}
                  </p>
                  <p>
                    <strong>Details:</strong> {report?.details || "None"}
                  </p>
                  <p>
                    <strong>Timestamp:</strong>{" "}
                    {format(new Date(report?.timestamp), "MMM d, yyyy HH:mm")}
                  </p>
                  <p>
                    <strong>Status:</strong> {report.status}
                  </p>
                  <Button
                    variant="outline"
                    className="mt-2 bg-gray-700 text-white hover:bg-gray-600"
                    onClick={() => {
                      // TODO: Implement review/resolution logic
                      alert("Review functionality to be implemented");
                    }}
                  >
                    Review Report
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </>
  );
}
