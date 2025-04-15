"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { io } from "socket.io-client";
import { ChessBoard } from "@/components/chess/chessBoard";
import { useAuthStore } from "@/stores";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getSocket } from "@/lib/socket";
import { getTournament, submitResult } from "@/lib/api/tournament";
import { Chess, Move } from "chess.js";
import { CircleArrowLeft, Hand, Flag } from "lucide-react";

const socket = io(
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"
);

export default function PlayPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const tournamentId = params.tournamentId as string;
  const matchId = params.matchId as string;

  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [playerColor, setPlayerColor] = useState<"w" | "b">("w");
  const [opponentId, setOpponentId] = useState<string | undefined>(undefined);
  const [whiteTime, setWhiteTime] = useState<number>(300); // Default 5min
  const [blackTime, setBlackTime] = useState<number>(300);
  const [activePlayer, setActivePlayer] = useState<"w" | "b">("w");
  const [moves, setMoves] = useState<Move[]>([]);
  const [chess, setChess] = useState<Chess>(new Chess());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch match details (mocked, replace with real API if needed)
  const { data: match, isLoading } = useQuery({
    queryKey: ["match", matchId],
    queryFn: async () => {
      // Assuming tournament data includes match details
      const tournament = await getTournament(tournamentId);
      const match = tournament?.matches.find((m: any) => m._id === matchId);
      return match;
    },
    enabled: !!tournamentId && !!matchId,
  });

  useEffect(() => {
    if (match && user?._id) {
      setGameStarted(true);
      setPlayerColor(match.player1Id._id === user._id ? "w" : "b");
      setOpponentId(
        match.player1Id._id === user._id
          ? match.player2Id._id
          : match.player1Id._id
      );
      // Set time based on tournament.timeControl (e.g., "5|0" -> 300 seconds)
      const timeControl = match.timeControl || "5|0";
      const initialTime = parseInt(timeControl.split("|")[0]) * 60;
      setWhiteTime(initialTime);
      setBlackTime(initialTime);
    }
  }, [match, user]);

  useEffect(() => {
    const socketInstance = getSocket();
    if (socketInstance && matchId && user?._id) {
      socketInstance.emit("joinMatch", { matchId, userId: user._id });

      socketInstance.on(
        "moveMade",
        (data: {
          matchId: string;
          move: Move;
          playerId: string;
          fen: string;
        }) => {
          if (data.matchId === matchId && data.playerId !== user._id) {
            setMoves((prev) => {
              if (
                prev.some(
                  (m) => m.san === data.move.san && m.color === data.move.color
                )
              ) {
                return prev;
              }
              return [...prev, data.move];
            });
            const newChess = new Chess(data.fen);
            setChess(newChess);
            setActivePlayer(data.move.color === "w" ? "b" : "w");
          }
        }
      );

      socketInstance.on(
        "gameEnded",
        (data: { matchId: string; result: "1-0" | "0-1" | "0.5-0.5" }) => {
          if (data.matchId === matchId) {
            toast.info(`Game ended: ${data.result}`);
            setGameStarted(false);
            router.push(`/tournaments/${tournamentId}`);
          }
        }
      );

      return () => {
        socketInstance.off("moveMade");
        socketInstance.off("gameEnded");
      };
    }
  }, [matchId, user, tournamentId, router]);

  useEffect(() => {
    if (gameStarted) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        if (activePlayer === "w") {
          setWhiteTime((prev) => {
            if (prev <= 0) {
              clearInterval(timerRef.current!);
              handleSubmitResult("0-1");
              return 0;
            }
            return prev - 1;
          });
        } else {
          setBlackTime((prev) => {
            if (prev <= 0) {
              clearInterval(timerRef.current!);
              handleSubmitResult("1-0");
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [gameStarted, activePlayer]);

  const handleMoveUpdate = async (move: Move | undefined, fen: string) => {
    if (!move || !user?._id) return;
    setMoves((prev) => [...prev, move]);
    setChess(new Chess(fen));
    setActivePlayer(move.color === "w" ? "b" : "w");
    const socketInstance = getSocket();
    if (socketInstance) {
      socketInstance.emit("moveMade", {
        matchId,
        move,
        playerId: user._id,
        fen,
      });
    }
    // Check for game end
    if (chess.isCheckmate()) {
      const result = playerColor === "w" ? "1-0" : "0-1";
      await handleSubmitResult(result);
    } else if (chess.isDraw()) {
      await handleSubmitResult("0.5-0.5");
    }
  };

  const handleSubmitResult = async (result: "1-0" | "0-1" | "0.5-0.5") => {
    if (!user?._id) {
      toast.error("Please log in to submit result");
      return;
    }
    const updatedTournament = await submitResult(
      tournamentId,
      matchId,
      result,
      user._id
    );
    if (updatedTournament) {
      socket.emit("tournamentUpdate", updatedTournament);
      socket.emit("gameEnded", { matchId, result });
      toast.success("Result submitted");
      router.push(`/tournaments/${tournamentId}`);
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? "0" + secs : secs}`;
  };

  if (isLoading || !match) return <div>Loading match...</div>;

  return (
    <div className="flex flex-col md:flex-row w-full h-screen items-center p-4 font-clashDisplay">
      <div className="flex flex-col items-center w-full md:w-1/2 h-full py-[30px]">
        <div className="flex items-center justify-between w-full max-w-[500px] pr-10 py-2 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 bg-[#262522] rounded-full flex items-center justify-center">
              {/* Opponent profile image */}
            </div>
            <h1 className="text-md font-semibold">
              {match.player1Id._id === user?._id
                ? match.player2Id.username
                : match.player1Id.username}
            </h1>
          </div>
          <div className="bg-[#262522] px-8 py-3 rounded-sm">
            <h1 className="text-md font-bold">
              {playerColor === "w"
                ? formatTime(blackTime)
                : formatTime(whiteTime)}
            </h1>
          </div>
        </div>

        <div className="flex-grow flex items-center justify-center w-full max-w-[500px] my-2">
          <ChessBoard
            gameId={matchId}
            playerColor={playerColor}
            opponentId={opponentId}
            onMove={handleMoveUpdate}
            onGameEnd={(result, lossType, fen) =>
              handleSubmitResult(
                result === "whiteWin"
                  ? "1-0"
                  : result === "blackWin"
                  ? "0-1"
                  : "0.5-0.5"
              )
            }
          />
        </div>

        <div className="flex items-center justify-between w-full max-w-[500px] pr-10 py-2 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 bg-[#262522] rounded-full flex items-center justify-center">
              {user?.profileImageUrl ? (
                <img
                  src={user.profileImageUrl}
                  alt="user profile"
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <span>User</span>
              )}
            </div>
            <h1 className="text-md font-semibold">
              {user?.username || "Guest"}
            </h1>
          </div>
          <div className="bg-[#262522] px-8 py-3 rounded-sm">
            <h1 className="text-md font-bold">
              {playerColor === "w"
                ? formatTime(whiteTime)
                : formatTime(blackTime)}
            </h1>
          </div>
        </div>
      </div>

      <div className="bg-[#262522] w-full md:w-1/4 h-[550px] p-6 flex flex-col gap-6 rounded-md">
        <div className="flex flex-col gap-4">
          <Button
            variant="outline"
            className="w-full bg-gray-700 text-white hover:bg-gray-600"
            onClick={() => handleSubmitResult("0.5-0.5")}
          >
            <Hand className="mr-2" /> Offer Draw
          </Button>
          <Button
            variant="destructive"
            className="w-full bg-red-600 hover:bg-red-700"
            onClick={() =>
              handleSubmitResult(playerColor === "w" ? "0-1" : "1-0")
            }
          >
            <Flag className="mr-2" /> Resign
          </Button>
          <Button
            variant="outline"
            className="w-full bg-gray-700 text-white hover:bg-gray-600"
            onClick={() => router.push(`/tournaments/${tournamentId}`)}
          >
            <CircleArrowLeft className="mr-2" /> Back to Tournament
          </Button>
        </div>
      </div>
    </div>
  );
}
