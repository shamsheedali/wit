"use client";

import { ChessBoard } from "@/components/chess/chessBoard";
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
import { Friend } from "@/types/friend";
import {
  UserRound,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Flag,
  Hand,
  AlertCircle,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { getSocket } from "@/lib/socket";
import { updateGame } from "@/lib/api/game";
import { getUsers } from "@/lib/api/user";
import { ChessMove } from "@/types/game";
import { Chess } from "chess.js";
import ChatInterface from "@/components/core/chat-interface";
import { reportGame } from "@/lib/api/gameReport";
import { useRouter } from "next/navigation";

export default function PlayTournament() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { fetchFriends } = useFriendStore();
  const {
    gameId,
    dbGameId,
    opponentId,
    opponentName,
    opponentProfilePicture,
    opponentEloRating,
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
    tournamentId,
  } = useGameStore();

  const [selectedFriend, setSelectedFriend] = useState<Friend | undefined>();
  const [playerNames, setPlayerNames] = useState<{ [key: string]: string }>({});
  const [chess, setChess] = useState<Chess>(new Chess());
  const [currentOpening, setCurrentOpening] = useState<string>("No moves yet");
  const [openings, setOpenings] = useState<any[]>([]);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState<string>("cheating");
  const [reportDetails, setReportDetails] = useState<string>("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [moveIndex, setMoveIndex] = useState(-1);
  const [viewMode, setViewMode] = useState(false);

  //to reset the chess-board after the game
  const [boardKey, setBoardKey] = useState(0);

  // Update the chess instance when moves or moveIndex changes
  useEffect(() => {
    const newChess = new Chess();

    if (moveIndex === -1) {
      // Show current position (all moves)
      moves.forEach((move) => {
        try {
          newChess.move({
            from: move.from,
            to: move.to,
            promotion: move.promotion || "q",
          });
        } catch (e) {
          console.error("Invalid move:", move, e);
        }
      });
    } else if (moveIndex >= 0 && moveIndex < moves.length) {
      // Show position up to the selected move
      for (let i = 0; i <= moveIndex; i++) {
        try {
          newChess.move({
            from: moves[i].from,
            to: moves[i].to,
            promotion: moves[i].promotion || "q",
          });
        } catch (e) {
          console.error("Invalid move:", moves[i], e);
        }
      }
    }

    setChess(newChess);
  }, [moves, moveIndex]);

  // Handle navigation button clicks
  const handleFirstMove = () => {
    setMoveIndex(-2); // Special index for initial position
    setViewMode(true);
    setChess(new Chess()); // Reset to initial position
  };

  const handlePreviousMove = () => {
    setViewMode(true);
    if (moveIndex === -1) {
      // If at current position, go to last move
      setMoveIndex(moves.length - 1);
    } else if (moveIndex > -2) {
      // Go back one move
      setMoveIndex(Math.max(-2, moveIndex - 1));
    }

    // Create a new game instance and replay moves up to the current index
    const newChess = new Chess();
    if (moveIndex > -2) {
      const targetIndex = moveIndex === -1 ? moves.length - 2 : moveIndex - 1;
      for (let i = 0; i <= targetIndex; i++) {
        try {
          newChess.move({
            from: moves[i].from,
            to: moves[i].to,
            promotion: moves[i].promotion || "q",
          });
        } catch (e) {
          console.error("Invalid move:", moves[i], e);
        }
      }
    }
    setChess(newChess);
  };

  const handleNextMove = () => {
    setViewMode(true);
    if (moveIndex === -2) {
      // From initial position, go to first move
      setMoveIndex(0);
    } else if (moveIndex < moves.length - 1) {
      // Go forward one move
      setMoveIndex(moveIndex + 1);
    } else {
      // If at last move, go to current position
      setMoveIndex(-1);
      setViewMode(false);
    }

    // Create a new game instance and replay moves up to the current index
    const newChess = new Chess();
    if (moveIndex === -2) {
      // Just show first move
      try {
        newChess.move({
          from: moves[0].from,
          to: moves[0].to,
          promotion: moves[0].promotion || "q",
        });
      } catch (e) {
        console.error("Invalid move:", moves[0], e);
      }
    } else if (moveIndex >= 0 && moveIndex < moves.length - 1) {
      // Show up to next move
      for (let i = 0; i <= moveIndex + 1; i++) {
        try {
          newChess.move({
            from: moves[i].from,
            to: moves[i].to,
            promotion: moves[i].promotion || "q",
          });
        } catch (e) {
          console.error("Invalid move:", moves[i], e);
        }
      }
    } else if (moveIndex === moves.length - 1) {
      // Show all moves (current position)
      for (let i = 0; i < moves.length; i++) {
        try {
          newChess.move({
            from: moves[i].from,
            to: moves[i].to,
            promotion: moves[i].promotion || "q",
          });
        } catch (e) {
          console.error("Invalid move:", moves[i], e);
        }
      }
    }
    setChess(newChess);
  };

  const handleLastMove = () => {
    setMoveIndex(-1); // Go to current position
    setViewMode(false);

    // Create a new game instance with all moves
    const newChess = new Chess();
    moves.forEach((move) => {
      try {
        newChess.move({
          from: move.from,
          to: move.to,
          promotion: move.promotion || "q",
        });
      } catch (e) {
        console.error("Invalid move:", move, e);
      }
    });
    setChess(newChess);
  };

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

  // Timer logic
  useEffect(() => {
    if (gameStarted && gameId) {
      // Ensure activePlayer is set to "w" when game starts
      if (!activePlayer) {
        setGameState({ activePlayer: "w" });
      }

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        if (activePlayer === "w") {
          if (whiteTime <= 0) {
            clearInterval(timerRef.current!);
            toast.error("White ran out of time!");
            endGame("blackWin", "timeout", chess.fen());
            return;
          }
          setGameState({ whiteTime: whiteTime - 1 });
        } else if (activePlayer === "b") {
          if (blackTime <= 0) {
            clearInterval(timerRef.current!);
            toast.error("Black ran out of time!");
            endGame("whiteWin", "timeout", chess.fen());
            return;
          }
          setGameState({ blackTime: blackTime - 1 });
        }
      }, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [gameStarted, gameId, activePlayer, whiteTime, blackTime, setGameState]);

  // Socket listener for opponent moves
  useEffect(() => {
    const socket = getSocket();
    if (socket) {
      socket.on(
        "moveMade",
        (data: {
          gameId: string;
          move: ChessMove;
          playerId: string;
          fen: string;
        }) => {
          if (data.gameId === gameId && data.playerId !== user?._id) {
            // Update chess instance
            const newChess = new Chess(data.fen);
            setChess(newChess);
            // Add opponent's move
            addMove(data.move);
            // Update activePlayer based on whose turn it is now
            setGameState({ activePlayer: newChess.turn() });
          }
        }
      );

      socket.on(
        "opponentResigned",
        (data: {
          opponentId: string;
          result: "whiteWin" | "blackWin" | "draw";
        }) => {
          if (data.opponentId === opponentId) {
            toast.success(`Opponent resigned: ${data.result}`);
            resetGame();
          }
        }
      );

      return () => {
        socket.off("moveMade");
        socket.off("opponentResigned");
      };
    }
  }, [gameId, user?._id, opponentId, addMove, setGameState, resetGame]);

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
    lossType: "checkmate" | "resignation" | "timeout",
    fen: string
  ) => {
    if (dbGameId && gameStartTime) {
      const gameDuration = Math.floor((Date.now() - gameStartTime) / 1000);
      await updateGame(dbGameId, {
        result,
        moves,
        lossType,
        gameDuration,
        gameStatus: "completed",
        fen,
      });
      const socket = getSocket();
      if (socket) {
        socket.emit("opponentResigned", {
          opponentId,
          result,
        });
      }
      toast.success(`Game ended: ${result}`);

      // Reset all chess-related states
      resetGame();
      setChess(new Chess());
      setMoveIndex(-1);
      setViewMode(false);
      setCurrentOpening("No moves yet");
      setBoardKey((prevKey) => prevKey + 1);

      //redirect back to tournament info page
      router.push(`/tournaments/${tournamentId}`);
    }
  };

  const handleMoveUpdate = async (move: ChessMove | undefined, fen: string) => {
    if (!move) return;

    // Reset view mode when a new move is made
    setViewMode(false);
    setMoveIndex(-1);

    // Update chess instance
    const newChess = new Chess(fen);
    setChess(newChess);

    // Add move to store
    addMove(move);

    // Update activePlayer for next turn
    setGameState({ activePlayer: newChess.turn() });

    // Update game in database
    if (dbGameId) {
      await updateGame(dbGameId, { moves: [...moves, move], fen });
    }

    // Emit move to opponent
    const socket = getSocket();
    if (socket && gameId && user?._id) {
      socket.emit("moveMade", {
        gameId,
        move,
        playerId: user._id,
        fen,
      });
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

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? "0" + secs : secs}`;
  };

  return (
    <div className="flex flex-col md:flex-row w-full h-screen items-center p-4 font-clashDisplay">
      {/* Left Section: Chessboard and Player Info */}
      <div className="flex flex-col items-center w-full md:w-1/2 h-full py-[30px]">
        <div className="flex items-center justify-between w-full max-w-[500px] pr-10 py-2 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 bg-[#262522] rounded-full flex items-center justify-center">
              {selectedFriend?.profileImageUrl ? (
                <img
                  src={selectedFriend.profileImageUrl}
                  alt="opponent profile image"
                  className="w-10 h-10 rounded-full"
                />
              ) : opponentProfilePicture ? (
                <img
                  src={opponentProfilePicture}
                  alt="opponent profile image"
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <UserRound />
              )}
            </div>
            <h1 className="text-md font-semibold">
              {gameStarted && selectedFriend
                ? selectedFriend.username
                : opponentName || "Opponent"}
              <span className="text-gray-500 ml-1">
                (
                {gameStarted && selectedFriend
                  ? selectedFriend.eloRating
                  : opponentEloRating || 500}
                )
              </span>
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

        {/* CHESS BOARD */}
        <div className="flex-grow flex items-center justify-center w-full max-w-[500px] my-2">
          <ChessBoard
            key={boardKey}
            gameId={gameId || ""}
            playerColor={playerColor || "w"}
            opponentId={opponentId || ""}
            onMove={handleMoveUpdate}
            onGameEnd={endGame}
            viewMode={viewMode}
            position={gameStarted ? chess.fen() : undefined}
          />
        </div>

        {/* Player - 01 */}
        <div className="flex items-center justify-between w-full max-w-[500px] pr-10 py-2 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 bg-[#262522] rounded-full flex items-center justify-center">
              {user?.profileImageUrl ? (
                <img
                  src={user.profileImageUrl}
                  alt="user profile image"
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <UserRound />
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

      {/* Game Info Panel */}
      {gameStarted && (
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
                onClick={() => endGame("draw", "resignation", chess.fen())}
              >
                <Hand className="mr-2" /> Draw
              </Button>
              <Button
                variant="destructive"
                className="w-1/2 bg-red-600 hover:bg-red-700"
                onClick={() =>
                  endGame(
                    playerColor === "w" ? "blackWin" : "whiteWin",
                    "resignation",
                    chess.fen()
                  )
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
                onClick={handleFirstMove}
              >
                <ChevronsLeft />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="bg-gray-700 text-white hover:bg-gray-600"
                onClick={handlePreviousMove}
              >
                <ChevronLeft />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="bg-gray-700 text-white hover:bg-gray-600"
                onClick={handleNextMove}
              >
                <ChevronRight />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="bg-gray-700 text-white hover:bg-gray-600"
                onClick={handleLastMove}
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
          </div>
        </div>
      )}

      {/* Report Modal */}
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

      {/* Chat Interface */}
      {gameStarted && (
        <div className="bg-[#262522] w-full md:w-1/4 h-[550px] p-10 flex flex-col gap-10 rounded-md">
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
