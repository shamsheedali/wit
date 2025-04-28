"use client";

import { useEffect, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { getGame } from "@/lib/api/game";
import { getUsers } from "@/lib/api/user";
import { useAuthStore } from "@/stores/useAuthStore";
import { useFriendStore } from "@/stores/useFriendStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronFirst, ChevronLast, StepBack, StepForward } from "lucide-react";
import { useParams } from "next/navigation";

interface Move {
  from: string;
  to: string;
  piece: string;
  san: string;
  timestamp: string;
  _id: string;
}

interface PlayerDetails {
  _id: string;
  username: string;
  profileImageUrl?: string;
  eloRating?: number;
}

interface GameData {
  _id: string;
  playerOne: string;
  playerTwo: string;
  playerAt: string;
  fen: string;
  gameType: string;
  timeControl: string;
  moves: (Move | null)[];
  gameStatus: string;
  createdAt: string;
  updatedAt: string;
  gameDuration: number;
  lossType: string;
  result: string;
}

interface GameResponse {
  game: GameData;
}

export default function GameReview() {
    const params = useParams();
    const gameId = params.gameId;
  const [game, setGame] = useState<GameData | null>(null);
  const [chess, setChess] = useState<Chess>(new Chess());
  const [fen, setFen] = useState<string>("");
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [validMoves, setValidMoves] = useState<Move[]>([]);
  const [playerDetails, setPlayerDetails] = useState<{
    [key: string]: PlayerDetails;
  }>({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const { fetchFriends } = useFriendStore();

  useEffect(() => {
    async function fetchGame() {
      const data: GameResponse = await getGame(gameId as string);
      if (data && data.game) {
        setGame(data.game);
        const filteredMoves = data.game.moves.filter(
          (m): m is Move => m !== null
        );
        setValidMoves(filteredMoves);
        setFen(new Chess().fen());
      }
      setLoading(false);
    }
    fetchGame();
  }, [gameId]);

  useEffect(() => {
    if (user?._id) {
      fetchFriends();
      fetchUserDetails();
    }
  }, [user?._id, fetchFriends]);

  const fetchUserDetails = async () => {
    try {
      const limit = 100;
      let page = 1;
      let allUsers: PlayerDetails[] = [];
      let hasMore = true;

      while (hasMore) {
        const response = await getUsers(page, limit);
        if (response?.users?.length > 0) {
          allUsers = [...allUsers, ...response.users];
          page += 1;
          hasMore = response.users.length === limit;
        } else {
          hasMore = false;
        }
      }

      const detailsMap: { [key: string]: PlayerDetails } = {};
      allUsers.forEach((u) => {
        detailsMap[u._id] = {
          _id: u._id,
          username: u.username,
          profileImageUrl: u.profileImageUrl,
          eloRating: u.eloRating,
        };
      });
      setPlayerDetails(detailsMap);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  useEffect(() => {
    const newChess = new Chess();

    try {
      for (let i = 0; i < currentMoveIndex; i++) {
        const move = validMoves[i];
        if (move) {
          newChess.move({
            from: move.from,
            to: move.to,
            promotion: "q",
          });
        }
      }
      setChess(newChess);
      setFen(newChess.fen());
    } catch (error) {
      console.error("Error applying move:", error);
    }
  }, [currentMoveIndex, validMoves]);

  const nextMove = () => {
    if (currentMoveIndex < validMoves.length) {
      setCurrentMoveIndex(currentMoveIndex + 1);
    }
  };

  const prevMove = () => {
    if (currentMoveIndex > 0) {
      setCurrentMoveIndex(currentMoveIndex - 1);
    }
  };

  const firstMove = () => {
    setCurrentMoveIndex(0);
  };

  const lastMove = () => {
    setCurrentMoveIndex(validMoves.length);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-xl font-semibold">Loading Game...</p>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-xl font-semibold text-red-500">Game not found</p>
      </div>
    );
  }

  // Group moves into pairs for display
  const movePairs = [];
  for (let i = 0; i < validMoves.length; i += 2) {
    movePairs.push({
      white: validMoves[i],
      black: validMoves[i + 1],
    });
  }

  // Get player details
  const whitePlayer = playerDetails[game.playerOne] || { username: "Player 1" };
  const blackPlayer = playerDetails[game.playerTwo] || { username: "Player 2" };

  return (
    <div className="container mx-auto p-4 lg:p-8">

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chessboard - Takes full width on mobile, 2/3 on desktop */}
        <div className="lg:col-span-2">
          <div className="w-full max-w-2xl mx-auto">
            {/* Player headers */}
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={whitePlayer.profileImageUrl} />
                  <AvatarFallback>
                    {whitePlayer.username?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold">{whitePlayer.username}</div>
                  <div className="text-sm text-muted-foreground">
                    {whitePlayer.eloRating || "?"} Elo
                  </div>
                </div>
              </div>

              <div className="text-lg font-bold mx-4">
                {game.result === "whiteWin"
                  ? "1-0"
                  : game.result === "blackWin"
                  ? "0-1"
                  : "½-½"}
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="font-semibold">{blackPlayer.username}</div>
                  <div className="text-sm text-muted-foreground">
                    {blackPlayer.eloRating || "?"} Elo
                  </div>
                </div>
                <Avatar className="h-12 w-12">
                  <AvatarImage src={blackPlayer.profileImageUrl} />
                  <AvatarFallback>
                    {blackPlayer.username?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>

            <Chessboard
              position={fen}
              arePiecesDraggable={false}
              boardWidth={600}
              customBoardStyle={{
                borderRadius: "4px",
                boxShadow: "0 5px 15px rgba(0, 0, 0, 0.5)",
              }}
            />

            {/* Game metadata below board */}
            <div className="flex justify-between mt-2 text-sm text-muted-foreground">
              <div>{new Date(game.createdAt).toLocaleDateString()}</div>
              <div>
                {game.timeControl} • {game.gameType}
              </div>
            </div>
          </div>
        </div>

        {/* Analysis Panel */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle>Game Analysis</CardTitle>
                <div className="text-sm text-muted-foreground">
                  Move {currentMoveIndex}/{validMoves.length}
                </div>
              </div>
              <Separator />
            </CardHeader>
            <CardContent>
              {/* Move Navigation Controls */}
              <div className="flex justify-between mb-4 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={firstMove}
                  disabled={currentMoveIndex === 0}
                >
                  <ChevronFirst className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevMove}
                  disabled={currentMoveIndex === 0}
                >
                  <StepBack className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextMove}
                  disabled={currentMoveIndex === validMoves.length}
                >
                  <StepForward className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={lastMove}
                  disabled={currentMoveIndex === validMoves.length}
                >
                  <ChevronLast className="h-4 w-4" />
                </Button>
              </div>

              {/* Move List */}
              <div className="border rounded-lg overflow-hidden">
                <div className="grid grid-cols-12 bg-secondary p-2 text-sm font-medium">
                  <div className="col-span-2">#</div>
                  <div className="col-span-5">White</div>
                  <div className="col-span-5">Black</div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {movePairs.map((pair, index) => (
                    <div
                      key={index}
                      className={`grid grid-cols-12 p-2 text-sm hover:bg-muted/50 ${
                        currentMoveIndex === index * 2 + 1 ||
                        currentMoveIndex === index * 2 + 2
                          ? "bg-blue-100 dark:bg-blue-900"
                          : ""
                      }`}
                    >
                      <div className="col-span-2 text-muted-foreground">
                        {index + 1}.
                      </div>
                      <div
                        className={`col-span-5 cursor-pointer ${
                          currentMoveIndex === index * 2 + 1
                            ? "font-bold text-primary"
                            : ""
                        }`}
                        onClick={() => setCurrentMoveIndex(index * 2 + 1)}
                      >
                        {pair.white?.san || "-"}
                      </div>
                      <div
                        className={`col-span-5 cursor-pointer ${
                          currentMoveIndex === index * 2 + 2
                            ? "font-bold text-primary"
                            : ""
                        }`}
                        onClick={() =>
                          pair.black && setCurrentMoveIndex(index * 2 + 2)
                        }
                      >
                        {pair.black?.san || "-"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Game Info */}
              <div className="mt-6 space-y-2">
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Result:</span>
                  <span className="font-medium">{game.result}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-medium">{game.gameDuration} sec</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ended by:</span>
                  <span className="font-medium">{game.lossType}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
