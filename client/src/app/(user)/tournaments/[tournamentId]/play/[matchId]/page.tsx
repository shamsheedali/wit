"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ChessBoard } from "@/components/chess/chessBoard";
import { useAuthStore } from "@/stores";
import { useGameStore } from "@/stores/useGameStore";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { getSocket } from "@/lib/socket";
import {
  getTournament,
  submitResult,
  submitPlayoffResult,
} from "@/lib/api/tournament";
import { Chess, Move } from "chess.js";
import {
  CircleArrowLeft,
  Hand,
  Flag,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { updateGame } from "@/lib/api/game";
import ChatInterface from "@/components/core/chat-interface";
import { reportGame } from "@/lib/api/gameReport";

export default function PlayPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    gameId,
    dbGameId,
    opponentId,
    opponentName,
    opponentProfilePicture,
    playerColor,
    whiteTime,
    blackTime,
    gameStarted,
    activePlayer,
    gameStartTime,
    moves,
    addMove,
    resetGame,
    setGameState,
  } = useGameStore();

  const tournamentId = params.tournamentId as string;
  const matchId = params.matchId as string;
  const isPlayoff = matchId === "playoff";
  const socketInstance = getSocket();

  const [chess, setChess] = useState<Chess>(new Chess());
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState<string>("cheating");
  const [reportDetails, setReportDetails] = useState<string>("");
  const [currentMoveIndex, setCurrentMoveIndex] = useState<number>(
    moves.length
  );
  const [currentOpening, setCurrentOpening] = useState<string>("No moves yet");
  const [openings, setOpenings] = useState<any[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastProcessedMove = useRef<string | null>(null); // Track last processed move to prevent duplicates

  const { data: tournament, isLoading } = useQuery({
    queryKey: ["tournament", tournamentId],
    queryFn: () => getTournament(tournamentId),
    enabled: !!tournamentId,
  });

  // Guess ECO range based on first move
  const guessEcoPrefixes = (history: string[]): string[] => {
    if (history.length === 0) return [];
    const firstMove = history[0];
    if (firstMove === "e4") return ["b", "c"];
    if (firstMove === "d4") return ["d", "e"];
    return ["a"];
  };

  // Normalize PGN by removing move numbers and dots
  const normalizePGN = (pgn: string): string => {
    return pgn.replace(/\d+\./g, "").replace(/\s+/g, " ").trim();
  };

  // Function to determine opening from PGN
  const getOpeningFromPGN = (chessInstance: Chess): string => {
    const history = chessInstance.history();
    if (history.length === 0) return "No moves yet";
    if (!openings.length) return "Loading openings...";

    const moveSequence = history.join(" ");
    let bestMatch = "Unknown Opening";
    let longestMatchLength = 0;

    for (const opening of openings) {
      const normalizedOpeningPGN = normalizePGN(opening.pgn);
      if (
        moveSequence.startsWith(normalizedOpeningPGN) &&
        normalizedOpeningPGN.split(" ").length > longestMatchLength
      ) {
        bestMatch = opening.name;
        longestMatchLength = normalizedOpeningPGN.split(" ").length;
      }
    }

    return bestMatch;
  };

  // Load relevant openings and sync chess instance
  useEffect(() => {
    const loadRelevantOpenings = async () => {
      const newChess = new Chess();
      moves.forEach((move) => newChess.move(move.san));
      setChess(newChess);

      const history = newChess.history();
      const prefixes = guessEcoPrefixes(history);
      if (prefixes.length === 0) {
        setOpenings([]);
        setCurrentOpening("No moves yet");
        return;
      }

      const allOpenings = [];
      try {
        for (const prefix of prefixes) {
          const response = await fetch(`/openings/${prefix}.json`);
          if (!response.ok) throw new Error(`Failed to fetch ${prefix}.json`);
          const data = await response.json();
          allOpenings.push(...data);
        }
        setOpenings(allOpenings);

        if (
          getOpeningFromPGN(newChess) === "Unknown Opening" &&
          prefixes.length < 5
        ) {
          const allPrefixes = ["a", "b", "c", "d", "e"];
          for (const prefix of allPrefixes) {
            if (!prefixes.includes(prefix)) {
              const response = await fetch(`/openings/${prefix}.json`);
              if (response.ok) {
                const data = await response.json();
                allOpenings.push(...data);
              }
            }
          }
          setOpenings(allOpenings);
        }
      } catch (error) {
        console.error("Error loading openings:", error);
        setOpenings([]);
        setCurrentOpening("Failed to load openings");
      }
    };

    loadRelevantOpenings();
  }, [moves]);

  // Update opening when chess or openings change
  useEffect(() => {
    if (chess) {
      setCurrentOpening(getOpeningFromPGN(chess));
    }
  }, [chess, openings]);

  useEffect(() => {
    const gameIdFromUrl = searchParams.get("gameId");
    const dbGameIdFromUrl = searchParams.get("dbGameId");
    if (gameIdFromUrl && dbGameIdFromUrl && tournament && user?._id) {
      const match = isPlayoff
        ? tournament.playoffMatch
        : tournament.matches.find((m: any) => m._id === matchId);
      if (match) {
        const opponent =
          match.player1Id._id === user._id ? match.player2Id : match.player1Id;
        const timeControl = tournament.timeControl || "5|0";
        const initialTime = timeToSeconds(timeControl);
        setGameState({
          gameId: gameIdFromUrl,
          dbGameId: dbGameIdFromUrl,
          opponentId: opponent._id,
          opponentName: opponent.username,
          opponentProfilePicture: opponent.profileImageUrl || null,
          playerColor: match.player1Id._id === user._id ? "w" : "b",
          whiteTime: initialTime,
          blackTime: initialTime,
          gameStarted: true,
          activePlayer: "w",
          gameStartTime: Date.now(),
          moves: [],
          isTournamentGame: true,
          tournamentId,
          matchId,
        });
        socketInstance?.emit("joinGame", { gameId: gameIdFromUrl });
      }
    }
  }, [tournament, user, searchParams, setGameState, socketInstance]);

  useEffect(() => {
    if (gameStarted && gameId) {
      socketInstance?.on(
        "moveMade",
        (data: {
          gameId: string;
          move: Move;
          playerId: string;
          fen: string;
        }) => {
          if (
            data.gameId === gameId &&
            data.playerId !== user?._id &&
            data.move.san !== lastProcessedMove.current // Prevent duplicate moves
          ) {
            lastProcessedMove.current = data.move.san;
            addMove(data.move);
            const newChess = new Chess(data.fen);
            setChess(newChess);
            setGameState({ activePlayer: data.move.color === "w" ? "b" : "w" });
            setCurrentMoveIndex(moves.length + 1);
          }
        }
      );

      socketInstance?.on(
        "chatMessageReceived",
        (data: { senderId: string; content: string; timestamp: number }) => {
          if (data.senderId !== user?._id) {
            console.log(
              `Chat message received from ${data.senderId}: ${data.content}`
            );
          }
        }
      );

      socketInstance?.on(
        "opponentResigned",
        (data: { opponentId: string; result: string }) => {
          if (data.opponentId === opponentId) {
            toast.info("Your opponent has resigned.");
            handleSubmitResult(data.result as "1-0" | "0-1" | "0.5-0.5");
          }
        }
      );

      socketInstance?.on("gameTerminated", () => {
        toast.info("This game has been terminated by an admin.");
        resetGame();
        router.push(`/tournaments/${tournamentId}`);
      });

      socketInstance?.on("opponentBanned", () => {
        toast.info("Admin banned your opponent.");
        resetGame();
        router.push(`/tournaments/${tournamentId}`);
      });

      return () => {
        socketInstance?.off("moveMade");
        socketInstance?.off("chatMessageReceived");
        socketInstance?.off("opponentResigned");
        socketInstance?.off("gameTerminated");
        socketInstance?.off("opponentBanned");
      };
    }
  }, [
    gameStarted,
    gameId,
    opponentId,
    user,
    router,
    tournamentId,
    socketInstance,
    moves,
  ]);

  useEffect(() => {
    if (gameStarted && gameId) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        if (activePlayer === "w") {
          if (whiteTime <= 0) {
            clearInterval(timerRef.current!);
            handleSubmitResult("0-1");
            return;
          }
          setGameState({ whiteTime: whiteTime - 1 });
        } else if (activePlayer === "b") {
          if (blackTime <= 0) {
            clearInterval(timerRef.current!);
            handleSubmitResult("1-0");
            return;
          }
          setGameState({ blackTime: blackTime - 1 });
        }
      }, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [gameStarted, gameId, activePlayer, whiteTime, blackTime]);

  const handleMoveUpdate = async (move: Move | undefined, fen: string) => {
    if (!move || !user?._id || !gameId) return;

    // Check if move is already processed
    if (move.san === lastProcessedMove.current) return;

    lastProcessedMove.current = move.san;
    addMove(move);
    setChess(new Chess(fen));
    setGameState({ activePlayer: move.color === "w" ? "b" : "w" });
    setCurrentMoveIndex(moves.length + 1);

    // Update database with new moves
    if (dbGameId) {
      try {
        await updateGame(dbGameId, { moves: [...moves, move], fen });
      } catch (error) {
        console.error("Failed to update game:", error);
        toast.error("Failed to update game state");
        return;
      }
    }

    // Emit move to opponent
    socketInstance?.emit("makeMove", {
      gameId,
      move,
      playerId: user._id,
      fen,
    });

    if (chess.isCheckmate()) {
      const result = playerColor === "w" ? "1-0" : "0-1";
      await handleSubmitResult(result);
    } else if (chess.isDraw()) {
      await handleSubmitResult("0.5-0.5");
    }
  };

  const endGame = (
    result: "whiteWin" | "blackWin" | "draw",
    lossType: string,
    fen: string
  ) => {
    if (dbGameId) {
      updateGame(dbGameId, {
        status:
          result === "draw"
            ? "draw"
            : result === "whiteWin"
            ? "whiteWin"
            : "blackWin",
        lossType,
        fen,
      });
    }
    resetGame();
  };

  const handleSubmitResult = async (result: "1-0" | "0-1" | "0.5-0.5") => {
    if (!user?._id) {
      toast.error("Please log in to submit result");
      return;
    }

    const submitFunction = isPlayoff ? submitPlayoffResult : submitResult;
    const updatedTournament = await submitFunction(
      tournamentId,
      isPlayoff ? undefined : matchId,
      result,
      user._id
    );

    if (updatedTournament) {
      const socketInstance = getSocket();
      socketInstance?.emit("tournamentUpdate", updatedTournament);

      endGame(
        result === "1-0" ? "whiteWin" : result === "0-1" ? "blackWin" : "draw",
        "checkmate",
        chess.fen()
      );

      toast.success("Result submitted");
      router.push(`/tournaments/${tournamentId}`);
    }
  };

  const handleReportSubmit = async () => {
    if (!dbGameId || !user?._id || !opponentId) {
      toast.error("Cannot submit report - missing game or user details");
      return;
    }

    try {
      const response = await reportGame({
        gameId: dbGameId,
        reportedUserId: opponentId,
        reason: reportReason,
        details: reportDetails,
      });

      if (response?.success) {
        socketInstance?.emit("gameReport", {
          _id: response.data._id,
          gameId: dbGameId,
          reportingUserId: user._id,
          reportedUserId: opponentId,
          reason: reportReason,
          details: reportDetails,
          timestamp: response.data.timestamp,
        });
        toast.success("Game report submitted successfully");
        setIsReportModalOpen(false);
        setReportReason("cheating");
        setReportDetails("");
      } else {
        toast.error("Failed to submit report");
      }
    } catch (error) {
      toast.error("Error submitting report");
      console.error(error);
    }
  };

  const timeToSeconds = (time: string): number => {
    const [minutes] = time.split("|")[0].split("|");
    return parseInt(minutes) * 60;
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? "0" + secs : secs}`;
  };

  const getPieceIcon = (piece: string, color: "w" | "b"): string => {
    switch (piece) {
      case "p":
        return "";
      case "n":
        return color === "w" ? "♘" : "♞";
      case "b":
        return color === "w" ? "♗" : "♝";
      case "r":
        return color === "w" ? "♖" : "♜";
      case "q":
        return color === "w" ? "♕" : "♛";
      case "k":
        return color === "w" ? "♔" : "♚";
      default:
        return "";
    }
  };

  const getMovePairs = (
    moves: Move[]
  ): { white: Move | null; black: Move | null }[] => {
    const pairs: { white: Move | null; black: Move | null }[] = [];
    for (let i = 0; i < moves.length; i += 2) {
      pairs.push({
        white: moves[i] || null,
        black: moves[i + 1] || null,
      });
    }
    return pairs;
  };

  const navigateToMove = (index: number) => {
    if (index < 0 || index > moves.length) return;
    const newChess = new Chess();
    for (let i = 0; i < index; i++) {
      newChess.move(moves[i]);
    }
    setChess(newChess);
    setCurrentMoveIndex(index);
  };

  if (isLoading || !tournament) return <div>Loading match...</div>;

  return (
    <div className="flex flex-col md:flex-row w-full h-screen items-center p-4 font-clashDisplay">
      <div className="flex flex-col items-center w-full md:w-1/2 h-full py-[30px]">
        <div className="flex items-center justify-between w-full max-w-[500px] pr-10 py-2 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 bg-[#262522] rounded-full flex items-center justify-center">
              {opponentProfilePicture ? (
                <img
                  src={opponentProfilePicture}
                  alt="opponent profile"
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <span>Opponent</span>
              )}
            </div>
            <h1 className="text-md font-semibold">
              {opponentName || "Opponent"}
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
            gameId={gameId || ""}
            playerColor={playerColor || "w"}
            opponentId={opponentId || ""}
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
              {user?.username || "Guest"}{" "}
              <span className="text-gray-500 ml-1">
                ({user?.eloRating || 500})
              </span>
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
        <div className="border-b border-gray-600 pb-2">
          <h2 className="text-lg font-semibold text-white">Opening</h2>
          <p className="text-sm text-gray-300">{currentOpening}</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          <h2 className="text-lg font-semibold text-white mb-2">Moves</h2>
          <div className="bg-[#3a3a3a] rounded-md p-2">
            <table className="w-full text-sm text-white">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="w-1/6 text-center">#</th>
                  <th className="w-5/12 text-center">White</th>
                  <th className="w-5/12 text-center">Black</th>
                </tr>
              </thead>
              <tbody>
                {getMovePairs(moves).map((pair, index) => (
                  <tr key={index} className="hover:bg-[#4a4a4a]">
                    <td className="text-center">{index + 1}.</td>
                    <td className="text-center">
                      {pair.white && (
                        <>
                          <span className="inline-block w-4 h-4 mr-1">
                            {getPieceIcon(
                              pair.white.piece,
                              pair.white.color || "w"
                            )}
                          </span>
                          {pair.white.san}
                        </>
                      )}
                    </td>
                    <td className="text-center">
                      {pair.black && (
                        <>
                          <span className="inline-block w-4 h-4 mr-1">
                            {getPieceIcon(
                              pair.black.piece,
                              pair.black.color || "b"
                            )}
                          </span>
                          {pair.black.san}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex gap-2 justify-between">
            <Button
              variant="outline"
              className="w-1/2 bg-gray-700 text-white hover:bg-gray-600"
              onClick={() => handleSubmitResult("0.5-0.5")}
            >
              <Hand className="mr-2" /> Draw
            </Button>
            <Button
              variant="destructive"
              className="w-1/2 bg-red-600 hover:bg-red-700"
              onClick={() =>
                handleSubmitResult(playerColor === "w" ? "0-1" : "1-0")
              }
            >
              <Flag className="mr-2" /> Resign
            </Button>
          </div>
          <div className="flex gap-2 justify-center">
            <Button
              size="icon"
              variant="outline"
              className="bg-gray-700 text-white hover:bg-gray-600"
              onClick={() => navigateToMove(0)}
            >
              <ChevronsLeft />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="bg-gray-700 text-white hover:bg-gray-600"
              onClick={() => navigateToMove(currentMoveIndex - 1)}
            >
              <ChevronLeft />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="bg-gray-700 text-white hover:bg-gray-600"
              onClick={() => navigateToMove(currentMoveIndex + 1)}
            >
              <ChevronRight />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="bg-gray-700 text-white hover:bg-gray-600"
              onClick={() => navigateToMove(moves.length)}
            >
              <ChevronsRight />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="bg-gray-700 text-white hover:bg-gray-600"
              onClick={() => setIsReportModalOpen(true)}
            >
              <AlertCircle />
            </Button>
          </div>
          <Button
            variant="outline"
            className="w-full bg-gray-700 text-white hover:bg-gray-600"
            onClick={() => router.push(`/tournaments/${tournamentId}`)}
          >
            <CircleArrowLeft className="mr-2" /> Back to Tournament
          </Button>
        </div>
      </div>

      {gameStarted && (
        <div className="bg-[#262522] w-full md:w-1/4 h-[550px] p-10 flex flex-col gap-10 rounded-md">
          <ChatInterface
            gameId={gameId || ""}
            userId={user?._id || ""}
            opponentId={opponentId || ""}
            playerNames={{ [opponentId || ""]: opponentName || "Opponent" }}
          />
        </div>
      )}

      <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
        <DialogContent className="bg-[#262522] text-white">
          <DialogHeader>
            <DialogTitle>Report Game</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm">Reason for Report</Label>
              <RadioGroup
                value={reportReason}
                onValueChange={setReportReason}
                className="mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cheating" id="cheating" />
                  <Label htmlFor="cheating">Cheating</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="inappropriate_behavior"
                    id="inappropriate_behavior"
                  />
                  <Label htmlFor="inappropriate_behavior">
                    Inappropriate Behavior
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other">Other</Label>
                </div>
              </RadioGroup>
            </div>
            <div>
              <Label htmlFor="details" className="text-sm">
                Additional Details
              </Label>
              <Input
                id="details"
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Provide more information..."
                className="bg-gray-800 text-white border-gray-700 mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsReportModalOpen(false)}
              className="bg-gray-700 text-white hover:bg-gray-600"
            >
              Cancel
            </Button>
            <Button
              onClick={handleReportSubmit}
              className="bg-red-600 hover:bg-red-700"
            >
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
