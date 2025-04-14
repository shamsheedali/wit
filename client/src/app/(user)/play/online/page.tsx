"use client";

import { ChessBoard } from "@/components/chess/chessBoard";
import { TimeDropdown } from "@/components/chess/time-dropdown";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores";
import { useFriendStore } from "@/stores/useFriendStore";
import { ChessMove } from "@/types/game";
import { Chess } from "chess.js";
import {
  UserRound,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RotateCcw,
  Flag,
  Hand,
  Swords,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { getSocket } from "@/lib/socket";
import { saveGame, updateGame, getUserGames } from "@/lib/api/game";
import { useRouter } from "next/navigation";
import { getUsers } from "@/lib/api/user";
import ChatInterface from "@/components/core/chat-interface";

export default function PlayOnline() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { fetchFriends } = useFriendStore(); // Keep for consistency
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [gameId, setGameId] = useState<string | undefined>(undefined);
  const [dbGameId, setDbGameId] = useState<string | undefined>(undefined);
  const [playerColor, setPlayerColor] = useState<"w" | "b">("w");
  const [opponentId, setOpponentId] = useState<string | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("10min");
  const [whiteTime, setWhiteTime] = useState<number>(600);
  const [blackTime, setBlackTime] = useState<number>(600);
  const [activePlayer, setActivePlayer] = useState<"w" | "b">("w");
  const [moves, setMoves] = useState<ChessMove[]>([]);
  const [gameStartTime, setGameStartTime] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [gameHistory, setGameHistory] = useState<any[]>([]);
  const [playerNames, setPlayerNames] = useState<{ [key: string]: string }>({});
  const [chess, setChess] = useState<Chess>(new Chess());
  const [currentOpening, setCurrentOpening] = useState<string>("No moves yet");
  const [openings, setOpenings] = useState<any[]>([]);
  const [matchmakingStatus, setMatchmakingStatus] = useState<
    "idle" | "searching" | "matched"
  >("idle");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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

        const opening = getOpeningFromPGN(newChess);
        if (opening === "Unknown Opening" && prefixes.length < 5) {
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

  // Socket and fetch logic
  useEffect(() => {
    if (user?._id) {
      fetchFriends();
      fetchUserNames();
      const socketInstance = getSocket();
      if (socketInstance) {
        socketInstance.on("connect", () => {
          console.log(`Socket connected for user ${user._id}`);
        });

        socketInstance.on("gameTerminated", () => {
          toast.info("This game has been terminated by an admin.");
          router.push("/play");
        });

        socketInstance.on("opponentBanned", () => {
          toast.info("Admin banned your opponent.");
          router.push("/");
        });

        socketInstance.on(
          "matchFound",
          (data: { opponentId: string; gameId: string; time: string }) => {
            setMatchmakingStatus("matched");
            setGameId(data.gameId);
            setOpponentId(data.opponentId);
            setPlayerColor(Math.random() > 0.5 ? "w" : "b");
            const initialTime = timeToSeconds(data.time);
            setWhiteTime(initialTime);
            setBlackTime(initialTime);
            setGameStarted(true);
            setActivePlayer("w");
            setGameStartTime(Date.now());
            toast.success(
              `Matched with ${playerNames[data.opponentId] || data.opponentId}`
            );

            const gameType = getGameType(data.time);
            saveGame(
              user._id,
              data.opponentId,
              playerColor,
              chess.fen(),
              gameType,
              data.time
            ).then((savedGame) => setDbGameId(savedGame?._id));

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
              setMoves((prev) => {
                if (
                  prev.some(
                    (m) =>
                      m.san === data.move.san && m.color === data.move.color
                  )
                ) {
                  return prev;
                }
                return [...prev, data.move];
              });
              const newActivePlayer = data.move.color === "w" ? "b" : "w";
              setActivePlayer(newActivePlayer);
            }
          }
        );

        return () => {
          socketInstance.off("connect");
          socketInstance.off("matchFound");
          socketInstance.off("moveMade");
          socketInstance.off("gameTerminated");
          socketInstance.off("opponentBanned");
          if (timerRef.current) clearInterval(timerRef.current);
        };
      }
    }
  }, [user?._id, fetchFriends, playerColor, gameId]);

  // Timer logic
  useEffect(() => {
    if (gameStarted && gameId) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        if (activePlayer === "w") {
          setWhiteTime((prev) => {
            if (prev <= 0) {
              clearInterval(timerRef.current!);
              toast.error("White ran out of time!");
              endGame("blackWin", "timeout", "");
              return 0;
            }
            return prev - 1;
          });
        } else if (activePlayer === "b") {
          setBlackTime((prev) => {
            if (prev <= 0) {
              clearInterval(timerRef.current!);
              toast.error("Black ran out of time!");
              endGame("whiteWin", "timeout", "");
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
  }, [gameStarted, gameId, activePlayer]);

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

  // Helper functions
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
        fen: fen || chess.fen(),
      });
      setGameStarted(false);
      setGameId(undefined);
      setDbGameId(undefined);
      setMoves([]);
      setGameStartTime(null);
      setMatchmakingStatus("idle");
      toast.success(`Game ended: ${result}`);
    }
  };

  const handleMoveUpdate = async (move: ChessMove | undefined, fen: string) => {
    if (!move) return;
    setMoves((prev) => [...prev, move]);
    if (dbGameId) {
      await updateGame(dbGameId, { moves: [...moves, move], fen });
    }
    const socket = getSocket();
    if (socket && gameId && user?._id) {
      socket.emit("moveMade", { gameId, move, playerId: user._id, fen });
    }
  };

  const fetchGameHistory = async () => {
    if (user?._id) {
      const games = await getUserGames(user._id);
      setGameHistory(games || []);
      setShowHistory(true);
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
    <div className="flex flex-col md:flex-row w-full h-screen items-center p-4 font-clashDisplay">
      {/* Chessboard and Player Info */}
      <div className="flex flex-col items-center w-full md:w-1/2 h-full py-[30px]">
        <div className="flex items-center justify-between w-full max-w-[500px] pr-10 py-2 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 bg-[#262522] rounded-full flex items-center justify-center">
              {opponentId && playerNames[opponentId] ? (
                <img
                  src="/placeholder.svg?height=40&width=40" // Replace with actual profile image if available
                  alt="opponent profile image"
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <UserRound />
              )}
            </div>
            <h1 className="text-md font-semibold">
              {opponentId ? playerNames[opponentId] : "Opponent"}
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
            gameId={gameId}
            playerColor={playerColor}
            opponentId={opponentId}
            onMove={handleMoveUpdate}
            onGameEnd={endGame}
          />
        </div>

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

      {/* Matchmaking Panel */}
      {!gameStarted && !showHistory && (
        <div className="bg-[#262522] w-full md:w-1/4 h-[550px] p-10 flex flex-col items-center gap-10 rounded-md">
          <div className="w-full flex justify-center items-center gap-2">
            <Swords width={30} height={30} />
            <h1 className="text-3xl font-bold">Play Online</h1>
          </div>
          <Button onClick={fetchGameHistory} className="w-full h-11 font-bold">
            <Clock className="mr-2" /> View History
          </Button>
          <div className="space-y-2">
            <TimeDropdown onValueChange={setSelectedTime} />
          </div>
          {matchmakingStatus === "idle" && (
            <Button className="w-full h-11 font-bold" onClick={joinMatchmaking}>
              Find Match
            </Button>
          )}
          {matchmakingStatus === "searching" && (
            <>
              <p className="text-white">Searching for an opponent...</p>
              <Button
                className="w-full h-11 font-bold bg-red-600 hover:bg-red-700"
                onClick={cancelMatchmaking}
              >
                Cancel
              </Button>
            </>
          )}
        </div>
      )}

      {/* Game History Panel */}
      {showHistory && (
        <div className="bg-[#262522] w-full md:w-1/4 h-[550px] p-10 flex flex-col gap-10 rounded-md overflow-y-auto">
          <div className="w-full flex justify-center items-center gap-2">
            <Clock width={30} height={30} />
            <h1 className="text-3xl font-bold">Game History</h1>
          </div>
          <div>
            {gameHistory.length > 0 ? (
              gameHistory.map((game) => (
                <div key={game._id} className="mb-4 p-2 bg-[#3a3a3a] rounded">
                  <p>
                    Opponent:{" "}
                    {game.playerOne === user?._id
                      ? playerNames[game.playerTwo] || game.playerTwo
                      : playerNames[game.playerOne] || game.playerOne}
                  </p>
                  <p>Result: {game.result || "Ongoing"}</p>
                  <p>Type: {game.gameType}</p>
                  <p>Time: {game.timeControl}</p>
                  <p>Moves: {game.moves.length}</p>
                  <p>Status: {game.gameStatus}</p>
                </div>
              ))
            ) : (
              <p>No games found</p>
            )}
          </div>
          <Button
            onClick={() => setShowHistory(false)}
            className="w-full h-11 font-bold"
          >
            Back to Play
          </Button>
        </div>
      )}

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
              >
                <ChevronsLeft />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="bg-gray-700 text-white hover:bg-gray-600"
              >
                <ChevronLeft />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="bg-gray-700 text-white hover:bg-gray-600"
              >
                <ChevronRight />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="bg-gray-700 text-white hover:bg-gray-600"
              >
                <ChevronsRight />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="bg-gray-700 text-white hover:bg-gray-600"
              >
                <RotateCcw />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Panel */}
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
