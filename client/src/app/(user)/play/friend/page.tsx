"use client";

import { ChessBoard } from "@/components/chess/chessBoard";
import { TimeDropdown } from "@/components/chess/time-dropdown";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores";
import { useFriendStore } from "@/stores/useFriendStore";
import { Friend } from "@/types/friend";
import { CircleArrowLeft, Handshake, UserRound, Clock } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { getSocket } from "@/lib/socket";
import { saveGame, updateGame, getUserGames } from "@/lib/api/game";
import { getUsers } from "@/lib/api/admin";
import { useRouter } from "next/navigation";

export default function PlayFriend() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { fetchFriends, friends, sendPlayRequest } = useFriendStore();
  const [playAs, setPlayAs] = useState<boolean>(false);
  const [selectedFriend, setSelectedFriend] = useState<Friend | undefined>();
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [gameId, setGameId] = useState<string | undefined>(undefined);
  const [dbGameId, setDbGameId] = useState<string | undefined>(undefined);
  const [playerColor, setPlayerColor] = useState<"w" | "b">("w");
  const [opponentId, setOpponentId] = useState<string | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("10min");
  const [whiteTime, setWhiteTime] = useState<number>(600);
  const [blackTime, setBlackTime] = useState<number>(600);
  const [activePlayer, setActivePlayer] = useState<"w" | "b">("w");
  const [moves, setMoves] = useState<any[]>([]);
  const [gameStartTime, setGameStartTime] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [gameHistory, setGameHistory] = useState<any[]>([]);
  const [playerNames, setPlayerNames] = useState<{ [key: string]: string }>({});
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch friends and users on mount
  useEffect(() => {
    if (user?._id) {
      fetchFriends();
      fetchUserNames();
      const socketInstance = getSocket();
      if (socketInstance) {
        socketInstance.on("connect", () => {
          console.log(`Socket connected for user ${user._id}`);
        });

        // Handle game termination
        socketInstance.on("gameTerminated", (data) => {
          console.log("game terminated", data.gameId, gameId)
          // if (data.gameId === gameId) {
            toast.info("This game has been terminated by an admin.");
            router.push("/play");
          // }
        });

        // listener for opponentBanned
        socketInstance.on("opponentBanned", (data) => {
          console.log("game terminated", data.gameId, gameId)
          // if (data.gameId === gameId) {
            toast.info("Admin banned your opponent.");
            router.push("/home");
          // }
        });

        socketInstance.on("playRequestReceived", (data) => {
          console.log("Received play request:", data);
          setOpponentId(data.senderId);
          toast(
            `Game request from ${
              playerNames[data.senderId] || data.senderId
            } (${data.time})`,
            {
              description: (
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toast.info("Play request declined")}
                  >
                    Decline
                  </Button>
                  <Button
                    size="sm"
                    onClick={async () => {
                      if (!socketInstance || !user?._id) {
                        console.log("Socket or user ID missing:", {
                          socket: socketInstance,
                          userId: user._id,
                        });
                        return;
                      }
                      const newGameId = `${data.senderId}-${
                        user._id
                      }-${Date.now()}`;
                      console.log("Emitting acceptPlayRequest:", {
                        senderId: data.senderId,
                        receiverId: user._id,
                        gameId: newGameId,
                        time: data.time,
                      });
                      socketInstance.emit("acceptPlayRequest", {
                        senderId: data.senderId,
                        receiverId: user._id,
                        gameId: newGameId,
                        time: data.time,
                      });
                      setGameId(newGameId);
                      setPlayerColor("b");
                      const initialTime = timeToSeconds(data.time);
                      setWhiteTime(initialTime);
                      setBlackTime(initialTime);
                      setGameStarted(true);
                      setActivePlayer("w");
                      setGameStartTime(Date.now());

                      const gameType = getGameType(data.time);
                      const savedGame = await saveGame(
                        data.senderId,
                        user._id,
                        "w",
                        "rnbqkbnr/pppppppp/5n5/8/8/5N5/PPPPPPPP/RNBQKB1R w KQkq - 1 1",
                        gameType,
                        data.time
                      );
                      setDbGameId(savedGame?._id);
                      toast.success(
                        `Game started with ${
                          playerNames[data.senderId] || data.senderId
                        }`
                      );
                    }}
                  >
                    Accept
                  </Button>
                </div>
              ),
              duration: 10000,
            }
          );
        });

        socketInstance.on("playRequestAccepted", (data) => {
          console.log("Play request accepted:", data);
          setGameId(data.gameId);
          setOpponentId(data.opponentId);
          setPlayerColor("w");
          const initialTime = timeToSeconds(data.time);
          setWhiteTime(initialTime);
          setBlackTime(initialTime);
          setGameStarted(true);
          setActivePlayer("w");
          setGameStartTime(Date.now());
          toast.success(
            `Game started with ${
              playerNames[data.opponentId] || data.opponentId
            }`
          );
        });

        socketInstance.on("moveMade", (data) => {
          console.log("Move made:", data);
          const newActivePlayer =
            data.playerId === user?._id
              ? playerColor === "w"
                ? "b"
                : "w"
              : playerColor === "w"
              ? "w"
              : "b";
          setActivePlayer(newActivePlayer);
          console.log(`Active player switched to: ${newActivePlayer}`);
        });

        return () => {
          socketInstance.off("connect");
          socketInstance.off("playRequestReceived");
          socketInstance.off("playRequestAccepted");
          socketInstance.off("moveMade");
          socketInstance.off("gameTerminated");
          socketInstance.off("opponentBanned");
          if (timerRef.current) clearInterval(timerRef.current);
        };
      } else {
        console.log("No socket instance available");
      }
    }
  }, [user?._id, fetchFriends, playerColor]);

  // Fetch all usernames
  const fetchUserNames = async () => {
    try {
      const limit = 100; // Adjust based on your needs
      let page = 1;
      let allUsers: { _id: string; username: string }[] = [];
      let hasMore = true;

      // Fetch all pages of users
      while (hasMore) {
        const response = await getUsers(page, limit);
        if (response && response.users && response.users.length > 0) {
          allUsers = [...allUsers, ...response.users];
          page += 1;
          hasMore = response.users.length === limit; // If less than limit, assume no more pages
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
        fen:
          fen || "rnbqkbnr/pppppppp/5n5/8/8/5N5/PPPPPPPP/RNBQKB1R w KQkq - 1 1",
      });
      setGameStarted(false);
      setGameId(undefined);
      setDbGameId(undefined);
      setMoves([]);
      setGameStartTime(null);
      toast.success(`Game ended: ${result}`);
    }
  };

  const handleMoveUpdate = async (move: any, fen: string) => {
    setMoves((prev) => [...prev, move]);
    if (dbGameId) {
      await updateGame(dbGameId, { moves: [...moves, move], fen });
    }
  };

  const fetchGameHistory = async () => {
    if (user?._id) {
      const games = await getUserGames(user._id);
      setGameHistory(games || []);
      setShowHistory(true);
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
    sendPlayRequest(selectedFriend._id, selectedTime);
    toast.success(
      `Play request sent to ${selectedFriend.username} (${selectedTime})`
    );
  };

  const handleTimeChange = (value: string) => {
    setSelectedTime(value);
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
              ) : (
                <UserRound />
              )}
            </div>
            <h1 className="text-md font-semibold">
              {gameStarted && selectedFriend
                ? selectedFriend.username
                : "Opponent"}
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
                  src={user?.profileImageUrl}
                  alt="user profile image"
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <UserRound />
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

      {!playAs && !gameStarted && !showHistory && (
        <div className="bg-[#262522] w-full md:w-1/4 h-[550px] p-10 flex flex-col gap-10 rounded-md">
          <div className="w-full flex justify-center items-center gap-2">
            <Handshake width={30} height={30} />
            <h1 className="text-3xl font-bold">Play a friend</h1>
          </div>
          <div>
            <h1 className="text-xl font-bold">Friends</h1>
            {friends && friends.length > 0 ? (
              friends.map((friend) => (
                <div
                  key={friend._id}
                  className="flex items-center gap-2 mt-5 cursor-pointer"
                  onClick={() => handleClick(friend._id)}
                >
                  <div className="h-10 w-10 bg-white rounded-full">
                    <img
                      src={friend.profileImageUrl || "/placeholder.svg"}
                      alt={`${friend.username}`}
                      className="h-10 w-10 rounded-full"
                    />
                  </div>
                  <h1>{friend.username}</h1>
                </div>
              ))
            ) : (
              <p>No friends yet</p>
            )}
          </div>
          <Button onClick={fetchGameHistory} className="w-full h-11 font-bold">
            <Clock className="mr-2" /> View History
          </Button>
        </div>
      )}

      {playAs && !gameStarted && !showHistory && (
        <div className="bg-[#262522] w-full md:w-1/4 h-[550px] p-10 flex flex-col items-center gap-10 rounded-md">
          <div className="w-full flex justify-center items-center gap-2 relative">
            <div
              className="absolute left-0 cursor-pointer"
              onClick={() => setPlayAs(false)}
            >
              <CircleArrowLeft />
            </div>
            <div className="flex justify-center items-center gap-2">
              <Handshake width={30} height={30} />
              <h1 className="text-3xl font-bold">Play vs</h1>
            </div>
          </div>
          <div>
            <div className="flex flex-col items-center gap-2 mt-5">
              <div className="h-32 w-32 bg-white rounded-full">
                <img
                  src={selectedFriend?.profileImageUrl || "/placeholder.svg"}
                  alt={selectedFriend?.username}
                  className="h-32 w-32 rounded-full"
                />
              </div>
              <h1>{selectedFriend?.username}</h1>
            </div>
          </div>
          <div className="space-y-2">
            <TimeDropdown onValueChange={handleTimeChange} />
          </div>
          <Button className="w-full h-11 font-bold" onClick={handlePlay}>
            Play
          </Button>
        </div>
      )}

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
    </div>
  );
}
