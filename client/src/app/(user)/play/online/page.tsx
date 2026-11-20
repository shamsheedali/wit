"use client";

import { ChessBoard } from "@/components/chess/chessBoard";
import { TimeDropdown } from "@/components/chess/time-dropdown";
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
import { useAuthStore } from "@/stores";
import { useFriendStore } from "@/stores/useFriendStore";
import { useGameStore } from "@/stores/useGameStore";
import {
  UserRound,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Flag,
  Hand,
  Swords,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { getSocket } from "@/lib/socket";
import { saveGame, updateGame } from "@/lib/api/game";
import { getUsers } from "@/lib/api/user";
import { ChessMove, LossType, openings } from "@/types/game";
import { Chess } from "chess.js";
import ChatInterface from "@/components/core/chat-interface";
import { reportGame } from "@/lib/api/gameReport";

export default function PlayOnline() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { fetchFriends } = useFriendStore();
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
  } = useGameStore();

  const [selectedTime, setSelectedTime] = useState<string>("10min");
  const [playerNames, setPlayerNames] = useState<{ [key: string]: string }>({});
  const [chess, setChess] = useState<Chess>(new Chess());
  const [currentOpening, setCurrentOpening] = useState<string>("No moves yet");
  const [openings, setOpenings] = useState<openings[]>([]);
  const [matchmakingStatus, setMatchmakingStatus] = useState<
    "idle" | "searching" | "matched"
  >("idle");
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState<string>("cheating");
  const [reportDetails, setReportDetails] = useState<string>("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isGameEnded = useRef(false);

  // Helper function to pair moves
  const getMovePairs = (
    moves: ChessMove[]
  ): { white: ChessMove | null; black: ChessMove | null }[] => {
    const pairs: { white: ChessMove | null; black: ChessMove | null }[] = [];
    for (let i = 0; i < moves.length; i += 2) {
      pairs.push({
        white: moves[i] || null,
        black: moves[i + 1] || null,
      });
    }
    return pairs;
  };

  // Helper function to get piece icons
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

  // Fetch friends and user names
  useEffect(() => {
    if (user?._id) {
      fetchFriends();
      fetchUserNames();
    }
  }, [user?._id, fetchFriends]);

  // Socket and matchmaking logic
  useEffect(() => {
    if (user?._id) {
      const socketInstance = getSocket();
      if (socketInstance) {
        socketInstance.on("connect", () => {
          console.log(`Socket connected for user ${user._id}`);
        });

        socketInstance.on("gameTerminated", () => {
          toast.info("This game has been terminated by an admin.");
          resetGame();
          setMatchmakingStatus("idle");
          isGameEnded.current = true;
        });

        socketInstance.on("opponentBanned", () => {
          toast.info("Admin banned your opponent.");
          resetGame();
          setMatchmakingStatus("idle");
          isGameEnded.current = true;
        });

        socketInstance.on(
          "matchFound",
          (data: {
            opponentId: string;
            gameId: string;
            time: string;
            playerColor: "w" | "b";
          }) => {
            setMatchmakingStatus("matched");
            const initialTime = timeToSeconds(data.time);
            useGameStore.setState({
              gameId: data.gameId,
              opponentId: data.opponentId,
              opponentName: playerNames[data.opponentId] || data.opponentId,
              opponentProfilePicture: null,
              playerColor: data.playerColor,
              whiteTime: initialTime,
              blackTime: initialTime,
              gameStarted: true,
              activePlayer: "w",
              gameStartTime: Date.now(),
              moves: [],
            });
            toast.success(
              `Matched with ${playerNames[data.opponentId] || data.opponentId}`
            );

            const gameType = getGameType(data.time);
            saveGame(
              user._id,
              data.opponentId,
              data.playerColor,
              chess.fen(),
              gameType,
              data.time
            ).then((savedGame) =>
              useGameStore.setState({ dbGameId: savedGame?._id })
            );

            socketInstance.emit("joinGame", { gameId: data.gameId });
          }
        );

        socketInstance.on(
          "moveMade",
          (data: {
            gameId: string;
            move: ChessMove;
            playerId: string;
            fen: string;
          }) => {
            if (data.gameId === gameId && data.playerId !== user._id) {
              addMove(data.move);
              const newChess = new Chess(data.fen);
              setChess(newChess);
              useGameStore.setState({
                activePlayer: newChess.turn(),
              });
              if (newChess.isCheckmate()) {
                const result = playerColor === "w" ? "blackWin" : "whiteWin";
                endGame(result, "checkmate", data.fen);
              } else if (newChess.isDraw()) {
                endGame("draw", "resignation", data.fen);
              }
            }
          }
        );

        socketInstance.on(
          "opponentResigned",
          (data: {
            gameId: string;
            opponentId: string;
            result: string;
            lossType: string;
          }) => {
            if (data.opponentId === opponentId && !isGameEnded.current) {
              isGameEnded.current = true;
              toast.info("Your opponent has resigned.");
              resetGame();
              setMatchmakingStatus("idle");
              toast.success(`Game ended: ${data.result}`);
            }
          }
        );

        socketInstance.on("drawRequestAccepted", () => {
          endGame("draw", "draw", chess.fen());
        });

        return () => {
          socketInstance.off("connect");
          socketInstance.off("matchFound");
          socketInstance.off("moveMade");
          socketInstance.off("gameTerminated");
          socketInstance.off("opponentBanned");
          socketInstance.off("opponentResigned");
          socketInstance.off("drawRequestAccepted");
          if (timerRef.current) clearInterval(timerRef.current);
        };
      }
    }
  }, [user?._id, gameId, opponentId, playerNames]);

  // Timer logic
  useEffect(() => {
    if (gameStarted && gameId) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        if (activePlayer === "w") {
          if (whiteTime <= 0) {
            clearInterval(timerRef.current!);
            toast.error("White ran out of time!");
            endGame("blackWin", "timeout", chess.fen());
            return;
          }
          useGameStore.setState({
            whiteTime: whiteTime - 1,
          });
        } else if (activePlayer === "b") {
          if (blackTime <= 0) {
            clearInterval(timerRef.current!);
            toast.error("Black ran out of time!");
            endGame("whiteWin", "timeout", chess.fen());
            return;
          }
          useGameStore.setState({
            blackTime: blackTime - 1,
          });
        }
      }, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [gameStarted, gameId, activePlayer, whiteTime, blackTime]);

  // Matchmaking handlers
  const joinMatchmaking = () => {
    const socket = getSocket();
    if (!socket || !user?._id) {
      toast.error("Cannot join matchmaking - socket or user missing");
      return;
    }
    setMatchmakingStatus("searching");
    socket.emit("joinMatchmaking", { userId: user._id, time: selectedTime });
    toast.info("Searching for an opponent...");
  };

  const cancelMatchmaking = () => {
    const socket = getSocket();
    if (!socket || !user?._id) return;
    socket.emit("cancelMatchmaking", user._id);
    setMatchmakingStatus("idle");
    toast.info("Matchmaking canceled");
  };

  const fetchUserNames = async () => {
    try {
      const limit = 100;
      let page = 1;
      let allUsers: { _id: string; username: string }[] = [];
      let hasMore = true;

      while (hasMore) {
        const response = await getUsers(page, limit);
        if (response && response.users && response.users.length > 0) {
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

  const endGame = async (
    result: "whiteWin" | "blackWin" | "draw",
    lossType: LossType,
    fen: string
  ) => {
    if (isGameEnded.current || !dbGameId || !gameStartTime) return;
    isGameEnded.current = true;

    try {
      const gameDuration = Math.floor((Date.now() - gameStartTime) / 1000);
      await updateGame(dbGameId, {
        result,
        moves,
        lossType,
        gameDuration,
        gameStatus: "completed",
        fen,
      });

      if (lossType === "resignation") {
        const socket = getSocket();
        if (socket) {
          socket.emit("opponentResigned", {
            gameId,
            opponentId,
            result,
            lossType,
          });
        }
      }
      resetGame();
      setMatchmakingStatus("idle");
      toast.success(`Game ended: ${result}`);
    } catch (error) {
      console.error("Failed to end game:", error);
      toast.error(
        "Failed to save game result: " + 
        (error instanceof Error ? error.message : "Unknown error")
      );
      isGameEnded.current = false;
    }
  };

  const handleDraw = () => {
    const socket = getSocket();
    if (socket) {
      socket.emit("opponentDrawRequest", {
        opponentId,
        senderId: user?._id,
        senderName: user?.username,
      });
    }
  };

  const handleMoveUpdate = async (move: ChessMove | undefined, fen: string) => {
    if (!move || isGameEnded.current) return;

    addMove(move);
    const newChess = new Chess(fen);
    setChess(newChess);

    if (dbGameId) {
      try {
        await updateGame(dbGameId, { moves: [...moves, move], fen });
      } catch (error) {
        console.error("Failed to end game:", error);
        toast.error(
          "Failed to save game result: " + 
          (error instanceof Error ? error.message : "Unknown error")
        );
        isGameEnded.current = false;
      }
    }

    const socket = getSocket();
    if (socket && gameId && user?._id) {
      socket.emit("moveMade", {
        gameId,
        move,
        playerId: user._id,
        fen,
      });
    }

    if (newChess.isCheckmate()) {
      const result = playerColor === "w" ? "whiteWin" : "blackWin";
      await endGame(result, "checkmate", fen);
    } else if (newChess.isDraw()) {
      await endGame("draw", "resignation", fen);
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
        const socket = getSocket();
        if (socket) {
          socket.emit("gameReport", {
            _id: response.data._id,
            gameId: dbGameId,
            reportingUserId: user._id,
            reportedUserId: opponentId,
            reason: reportReason,
            details: reportDetails,
            timestamp: response.data.timestamp,
          });
        }
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
    switch (time) {
      case "30sec":
        return 30;
      case "1min":
        return 60;
      case "3min":
        return 180;
      case "5min":
        return 300;
      case "10min":
        return 600;
      case "15min":
        return 900;
      case "30min":
        return 1800;
      default:
        return 600;
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? "0" + secs : secs}`;
  };

  const getGameType = (time: string): "blitz" | "bullet" | "rapid" => {
    switch (time) {
      case "30sec":
      case "1min":
        return "bullet";
      case "3min":
      case "5min":
        return "blitz";
      case "10min":
      case "15min":
      case "30min":
        return "rapid";
      default:
        return "rapid";
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col md:flex-row items-center p-4 pt-20 font-clashDisplay gap-6 justify-center">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,var(--accent)_0%,transparent_50%)] opacity-[0.03]" />
      </div>

      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="absolute top-8 left-8 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 backdrop-blur-md border border-border/50 text-muted-foreground hover:text-foreground transition-all group"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        <span className="text-sm font-medium">Back</span>
      </button>

      {/* Left Section: Chessboard and Player Info */}
      <div className="relative z-10 flex flex-col items-center w-full md:w-1/2 h-full py-[30px]">
        <div className="flex items-center justify-between w-full max-w-[500px] bg-card/50 backdrop-blur-sm border border-border/50 px-4 py-3 rounded-2xl mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-secondary rounded-full flex items-center justify-center overflow-hidden">
              {opponentProfilePicture ? (
                <img
                  src={opponentProfilePicture}
                  alt="opponent profile image"
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserRound />
              )}
            </div>
            <h1 className="text-md font-semibold text-foreground">
              {opponentName || playerNames[opponentId || ""] || "Opponent"}
            </h1>
          </div>
          <div className="bg-secondary/50 px-6 py-2 rounded-xl">
            <h1 className="text-md font-bold font-mono tracking-wider text-foreground">
              {playerColor === "w"
                ? formatTime(blackTime)
                : formatTime(whiteTime)}
            </h1>
          </div>
        </div>

        {/* CHESS BOARD */}
        <div className="flex-grow flex items-center justify-center w-full max-w-[500px] my-2">
          <ChessBoard
            gameId={gameId || ""}
            playerColor={playerColor || "w"}
            opponentId={opponentId || ""}
            onMove={handleMoveUpdate}
            onGameEnd={endGame}
          />
        </div>

        {/* Player - 01 */}
        <div className="flex items-center justify-between w-full max-w-[500px] bg-card/50 backdrop-blur-sm border border-border/50 px-4 py-3 rounded-2xl mt-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-secondary rounded-full flex items-center justify-center overflow-hidden">
              {user?.profileImageUrl ? (
                <img
                  src={user.profileImageUrl}
                  alt="user profile image"
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserRound />
              )}
            </div>
            <h1 className="text-md font-semibold text-foreground">
              {user?.username || "Guest"}{" "}
              <span className="text-muted-foreground ml-1">
                ({user?.eloRating || 500})
              </span>
            </h1>
          </div>
          <div className="bg-secondary/50 px-6 py-2 rounded-xl">
            <h1 className="text-md font-bold font-mono tracking-wider text-foreground">
              {playerColor === "w"
                ? formatTime(whiteTime)
                : formatTime(blackTime)}
            </h1>
          </div>
        </div>
      </div>

      {/* Matchmaking Panel */}
      {!gameStarted && (
        <div className="relative z-10 bg-card/50 backdrop-blur-sm border border-border/50 w-full md:w-1/4 h-[550px] p-10 flex flex-col items-center justify-center gap-10 rounded-3xl">
          <div className="w-full flex justify-center items-center gap-3 text-foreground">
            <Swords width={32} height={32} className="text-accent" />
            <h1 className="text-3xl font-serif font-bold">Play Online</h1>
          </div>
          <div className="space-y-2 w-full">
            <TimeDropdown onValueChange={setSelectedTime} />
          </div>
          {matchmakingStatus === "idle" && (
            <button className="w-full h-12 font-bold rounded-full bg-accent text-accent-foreground hover:bg-accent/90 transition-all duration-300" onClick={joinMatchmaking}>
              Find Match
            </button>
          )}
          {matchmakingStatus === "searching" && (
            <div className="w-full flex flex-col items-center gap-4">
              <p className="text-muted-foreground animate-pulse">Searching for an opponent...</p>
              <button
                className="w-full h-12 font-bold rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/50 transition-all duration-300"
                onClick={cancelMatchmaking}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {/* Game Info Panel */}
      {gameStarted && (
        <div className="relative z-10 bg-card/50 backdrop-blur-sm border border-border/50 w-full md:w-1/4 h-[550px] p-6 flex flex-col gap-6 rounded-3xl">
          <div className="border-b border-border/50 pb-3">
            <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-1">Opening</h2>
            <p className="font-medium text-foreground">{currentOpening}</p>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-3">Moves</h2>
            <div className="bg-secondary/30 rounded-xl overflow-hidden border border-border/50">
              <table className="w-full text-sm text-foreground">
                <thead className="bg-secondary/50">
                  <tr className="border-b border-border/50">
                    <th className="w-1/6 text-center py-2 text-muted-foreground font-medium">#</th>
                    <th className="w-5/12 text-center py-2 font-medium">White</th>
                    <th className="w-5/12 text-center py-2 font-medium">Black</th>
                  </tr>
                </thead>
                <tbody>
                  {getMovePairs(moves).map((pair, index) => (
                    <tr key={index} className="hover:bg-secondary/40 border-b border-border/10 transition-colors">
                      <td className="text-center py-2 text-muted-foreground">{index + 1}.</td>
                      <td className="text-center py-2">
                        {pair.white && (
                          <span className="flex items-center justify-center gap-1">
                            <span className="text-lg">
                              {getPieceIcon(
                                pair.white.piece,
                                pair.white.color || "w"
                              )}
                            </span>
                            {pair.white.san}
                          </span>
                        )}
                      </td>
                      <td className="text-center py-2">
                        {pair.black && (
                          <span className="flex items-center justify-center gap-1">
                            <span className="text-lg">
                              {getPieceIcon(
                                pair.black.piece,
                                pair.black.color || "b"
                              )}
                            </span>
                            {pair.black.san}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <div className="flex gap-3 justify-between">
              <button
                className="w-1/2 flex items-center justify-center py-2.5 rounded-full bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
                onClick={handleDraw}
              >
                <Hand className="mr-2 w-4 h-4" /> Draw
              </button>
              <button
                className="w-1/2 flex items-center justify-center py-2.5 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/50 transition-colors"
                onClick={() =>
                  endGame(
                    playerColor === "w" ? "blackWin" : "whiteWin",
                    "resignation",
                    chess.fen()
                  )
                }
              >
                <Flag className="mr-2 w-4 h-4" /> Resign
              </button>
            </div>
            <div className="flex gap-2 justify-center mt-2">
              <button className="p-2 rounded-full bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors">
                <ChevronsLeft className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-full bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-full bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-full bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors">
                <ChevronsRight className="w-5 h-5" />
              </button>
              <button 
                className="p-2 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors ml-auto"
                onClick={() => setIsReportModalOpen(true)}
              >
                <AlertCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Report Game</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div>
              <Label className="text-sm text-muted-foreground mb-3 block uppercase tracking-wider">Reason for Report</Label>
              <RadioGroup
                value={reportReason}
                onValueChange={setReportReason}
                className="space-y-3"
              >
                <div className="flex items-center space-x-3 bg-secondary/30 p-3 rounded-xl border border-border/50">
                  <RadioGroupItem value="cheating" id="cheating" />
                  <Label htmlFor="cheating" className="cursor-pointer">Cheating</Label>
                </div>
                <div className="flex items-center space-x-3 bg-secondary/30 p-3 rounded-xl border border-border/50">
                  <RadioGroupItem
                    value="inappropriate_behavior"
                    id="inappropriate_behavior"
                  />
                  <Label htmlFor="inappropriate_behavior" className="cursor-pointer">
                    Inappropriate Behavior
                  </Label>
                </div>
                <div className="flex items-center space-x-3 bg-secondary/30 p-3 rounded-xl border border-border/50">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other" className="cursor-pointer">Other</Label>
                </div>
              </RadioGroup>
            </div>
            <div>
              <Label htmlFor="details" className="text-sm text-muted-foreground mb-2 block uppercase tracking-wider">
                Additional Details
              </Label>
              <Input
                id="details"
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Provide more information..."
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <button
              onClick={() => setIsReportModalOpen(false)}
              className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleReportSubmit}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
            >
              Submit Report
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Chat Interface */}
      {gameStarted && (
        <div className="relative z-10 bg-card/50 backdrop-blur-sm border border-border/50 w-full md:w-1/4 h-[550px] p-6 flex flex-col gap-10 rounded-3xl">
          <ChatInterface
            gameId={gameId || ""}
            userId={user?._id || ""}
            opponentId={opponentId || ""}
            playerNames={playerNames}
          />
        </div>
      )}
    </div>
  );
}
