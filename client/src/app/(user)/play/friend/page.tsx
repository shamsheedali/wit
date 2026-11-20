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
import { Friend } from "@/types/friend";
import {
  CircleArrowLeft,
  Handshake,
  UserRound,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Flag,
  Hand,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { getSocket } from "@/lib/socket";
import { updateGame } from "@/lib/api/game";
import { getUser, getUsers } from "@/lib/api/user";
import { Chess } from "chess.js";
import ChatInterface from "@/components/core/chat-interface";
import { reportGame } from "@/lib/api/gameReport";
import { ChessMove, LossType, openings } from "@/types/game";

export default function PlayFriend() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  const { fetchFriends, friends, sendPlayRequest } = useFriendStore();
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
  } = useGameStore();

  const [playAs, setPlayAs] = useState<boolean>(false);
  const [selectedFriend, setSelectedFriend] = useState<Friend | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>("10min");
  const [playerNames, setPlayerNames] = useState<{ [key: string]: string }>({});
  const [chess, setChess] = useState<Chess>(new Chess());
  const [currentOpening, setCurrentOpening] = useState<string>("No moves yet");
  const [openings, setOpenings] = useState<openings[]>([]);
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
            toast.success(`Opponent resigned: ${data.result}`);
            resetGame();
            setChess(new Chess());
            setMoveIndex(-1);
            setViewMode(false);
            setCurrentOpening("No moves yet");
            setBoardKey((prevKey) => prevKey + 1);
        }
      );

      socket.on("drawRequestAccepted", () => {
        endGame(
          "draw",
          "draw",
          chess.fen()
        )
      })

      return () => {
        socket.off("moveMade");
        socket.off("opponentResigned");
        socket.off("drawRequestAccepted");
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
    lossType: LossType,
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

      if (lossType === "resignation") {
        const socket = getSocket();
        if (socket) {
          socket.emit("opponentResigned", {
            opponentId,
            result,
          });
        }
      }

      toast.success(`Game ended: ${result}`);

      // Reset all chess-related states
      resetGame();
      setChess(new Chess());
      setMoveIndex(-1);
      setViewMode(false);
      setCurrentOpening("No moves yet");
      setBoardKey((prevKey) => prevKey + 1);

      const updatedUser = await getUser(user?.username as string);
      updateUser(updatedUser);
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
  }

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

  const handleClick = (friendId: string) => {
    setPlayAs(true);
    setSelectedFriend(friends.find((friend) => friend._id === friendId));
  };

  const handlePlay = () => {
    if (!selectedFriend?._id || !user?._id) {
      toast.error("Cannot send play request - missing user or friend");
      return;
    }
    // Set initial timers based on selected time
    const timeInSeconds = parseTimeToSeconds(selectedTime);
    setGameState({
      whiteTime: timeInSeconds,
      blackTime: timeInSeconds,
    });
    sendPlayRequest(
      selectedFriend._id,
      user.username,
      user.profileImageUrl as string,
      user.eloRating,
      selectedTime
    );
    toast.success(
      `Play request sent to ${selectedFriend.username} (${selectedTime})`
    );
  };

  const handleTimeChange = (value: string) => {
    setSelectedTime(value);
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

  const parseTimeToSeconds = (time: string): number => {
    if (time.includes("sec")) {
      return parseInt(time.replace("sec", ""));
    } else if (time.includes("min")) {
      return parseInt(time.replace("min", "")) * 60;
    }
    return 600; // Default to 10 minutes
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? "0" + secs : secs}`;
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
              {selectedFriend?.profileImageUrl ? (
                <img
                  src={selectedFriend.profileImageUrl}
                  alt="opponent profile image"
                  className="w-full h-full object-cover"
                />
              ) : opponentProfilePicture ? (
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
              {gameStarted && selectedFriend
                ? selectedFriend.username
                : opponentName || "Opponent"}
              <span className="text-muted-foreground ml-1">
                (
                {gameStarted && selectedFriend
                  ? selectedFriend.eloRating
                  : opponentEloRating || 500}
                )
              </span>
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

      {/* Right Section: Pre-Game Panels */}
      {!playAs && !gameStarted && (
        <div className="relative z-10 bg-card/50 backdrop-blur-sm border border-border/50 w-full md:w-1/4 h-[550px] p-10 flex flex-col items-center gap-6 rounded-3xl">
          <div className="w-full flex justify-center items-center gap-3 text-foreground">
            <Handshake width={32} height={32} className="text-accent" />
            <h1 className="text-3xl font-serif font-bold">Play a friend</h1>
          </div>
          <div className="w-full">
            <h1 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Friends</h1>
            {friends && friends.length > 0 ? (
              <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                {friends.map((friend) => (
                  <div
                    key={friend._id}
                    className="flex items-center gap-3 p-3 bg-secondary/30 border border-border/50 rounded-xl cursor-pointer hover:bg-secondary/60 transition-colors"
                    onClick={() => handleClick(friend._id)}
                  >
                    <div className="h-10 w-10 bg-secondary rounded-full overflow-hidden border border-border/50">
                      <img
                        src={friend.profileImageUrl || "/placeholder.svg"}
                        alt={`${friend.username}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <h1 className="font-medium text-foreground">{friend.username}</h1>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4 bg-secondary/20 rounded-xl border border-border/30">No friends yet</p>
            )}
          </div>
        </div>
      )}

      {/* Play Vs */}
      {playAs && !gameStarted && (
        <div className="relative z-10 bg-card/50 backdrop-blur-sm border border-border/50 w-full md:w-1/4 h-[550px] p-8 flex flex-col items-center justify-center gap-8 rounded-3xl">
          <div className="w-full flex justify-center items-center gap-3 relative text-foreground">
            <div
              className="absolute left-0 cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setPlayAs(false)}
            >
              <CircleArrowLeft className="w-6 h-6" />
            </div>
            <div className="flex justify-center items-center gap-2">
              <Handshake width={32} height={32} className="text-accent" />
              <h1 className="text-3xl font-serif font-bold">Play vs</h1>
            </div>
          </div>
          <div className="w-full">
            <div className="flex flex-col items-center gap-3 mt-2 mb-6">
              <div className="h-32 w-32 bg-secondary rounded-full overflow-hidden border-4 border-border/50">
                <img
                  src={selectedFriend?.profileImageUrl || "/placeholder.svg"}
                  alt={selectedFriend?.username}
                  className="h-full w-full object-cover"
                />
              </div>
              <h1 className="font-bold text-xl text-foreground">{selectedFriend?.username}</h1>
            </div>
          </div>
          <div className="space-y-2 w-full">
            <TimeDropdown onValueChange={handleTimeChange} />
          </div>
          <button className="w-full h-12 font-bold rounded-full bg-accent text-accent-foreground hover:bg-accent/90 transition-all duration-300" onClick={handlePlay}>
            Play
          </button>
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
              <button 
                className="p-2 rounded-full bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
                onClick={handleFirstMove}
              >
                <ChevronsLeft className="w-5 h-5" />
              </button>
              <button 
                className="p-2 rounded-full bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
                onClick={handlePreviousMove}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                className="p-2 rounded-full bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
                onClick={handleNextMove}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <button 
                className="p-2 rounded-full bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
                onClick={handleLastMove}
              >
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
