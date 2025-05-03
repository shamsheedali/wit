"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronDown,
  ChevronUp,
  User as UserIcon,
  Zap,
  MoveUpRight,
  Timer,
  MoreVertical,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { getUserGames } from "@/lib/api/game";
import { getUsers } from "@/lib/api/user";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { User } from "@/types/auth";

type Game = {
  _id: string;
  playerOne: string;
  playerTwo: string;
  result?: "whiteWin" | "blackWin" | "draw";
  moves: Array<{
    from: string;
    to: string;
    piece: string;
    san: string;
    timestamp: string;
  }>;
  gameType: "blitz" | "bullet" | "rapid";
  gameStatus: "completed" | "ongoing" | "terminated";
  eloDifference: number;
  timeControl: string;
  createdAt: string;
};

interface PlayerInfo {
  username: string;
  profileImageUrl?: string;
}

interface GameHistoryTableProps {
  initialGames?: Game[];
  playerNames?: { [key: string]: PlayerInfo };
  user: User;
}

export default function GameHistoryTable({
  initialGames = [],
  playerNames: initialPlayerNames = {},
  user,
}: GameHistoryTableProps) {
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [games, setGames] = useState<Game[]>(initialGames);
  const [playerNames, setPlayerNames] = useState<{ [key: string]: PlayerInfo }>(
    initialPlayerNames
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(5); // Number of games per page
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      if (user?._id) {
        try {
          const gameData = await getUserGames(user._id, currentPage, limit);
          setGames(gameData?.games || []);
          setTotalPages(gameData?.totalPages || 1);

          const usersLimit = 100;
          let page = 1;
          let allUsers: {
            _id: string;
            username: string;
            profileImageUrl?: string;
          }[] = [];
          let hasMore = true;

          while (hasMore) {
            const response = await getUsers(page, usersLimit);
            if (response && response.users && response.users.length > 0) {
              allUsers = [...allUsers, ...response.users];
              page += 1;
              hasMore = response.users.length === usersLimit;
            } else {
              hasMore = false;
            }
          }

          const namesMap: { [key: string]: PlayerInfo } = {
            [user._id]: {
              username: user.username || "You",
              profileImageUrl: user.profileImageUrl,
            },
          };
          allUsers.forEach((u) => {
            namesMap[u._id] = {
              username: u.username,
              profileImageUrl: u.profileImageUrl,
            };
          });
          setPlayerNames(namesMap);
        } catch (error) {
          console.error("Failed to fetch data:", error);
        }
      }
    };

    fetchData();
  }, [user?._id, currentPage, limit]);

  const sortByDate = () => {
    const sortedGames = [...games].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
    });
    setGames(sortedGames);
    setSortDirection(sortDirection === "asc" ? "desc" : "asc");
  };

  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), "MMM dd, yyyy");
  };

  const getResultDisplay = (game: Game) => {
    if (game.gameStatus === "terminated") return game.gameStatus;
    if (!game.result) return "Ongoing";
    if (game.result === "whiteWin") return "1-0";
    if (game.result === "blackWin") return "0-1";
    return "½-½";
  };

  const getResultClass = (game: Game) => {
    if (!game.result) return "text-gray-600 font-medium";
    if (
      (game.result === "whiteWin" && game.playerOne === user?._id) ||
      (game.result === "blackWin" && game.playerTwo === user?._id)
    ) {
      return "text-green-600 font-medium";
    }
    if (game.result === "draw") return "text-amber-600 font-medium";
    return "text-red-600 font-medium";
  };

  const getEloDifference = (game: Game) => {
    if (!game.result) return "";
    if (
      (game.result === "whiteWin" && game.playerOne === user?._id) ||
      (game.result === "blackWin" && game.playerTwo === user?._id)
    ) {
      return "+";
    }
    if (game.result === "draw") return "text-amber-600 font-medium";
    return "-";
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleReviewGame = (gameId: string) => {
    router.push(`/review/${gameId}`);
  };

  return (
    <div className="w-full rounded-lg border shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[300px]">Players</TableHead>
              <TableHead className="w-[100px] text-center">Result</TableHead>
              <TableHead className="w-[100px] text-center">Elo Diff</TableHead>
              <TableHead className="w-[100px] text-center">
                Time Control
              </TableHead>
              <TableHead className="w-[100px] text-center">Moves</TableHead>
              <TableHead
                className="w-[150px] cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={sortByDate}
              >
                <div className="flex items-center justify-between">
                  <span>Date</span>
                  {sortDirection === "asc" ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead className="w-[50px] text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {games && games.length > 0 ? (
              games.map((game) => (
                <TableRow
                  key={game._id}
                  className="hover:bg-muted/50 transition-colors"
                >
                  <TableCell>
                    <div className="flex items-center px-3 gap-3 space-y-2 py-1 sm:space-y-0 sm:py-0">
                      <div className="text-center">
                        {game.gameType === "blitz" ? (
                          <Zap />
                        ) : game.gameType === "bullet" ? (
                          <MoveUpRight />
                        ) : (
                          <Timer />
                        )}
                        <h1>{game.gameType}</h1>
                      </div>
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full overflow-hidden bg-muted">
                            {playerNames[game.playerOne]?.profileImageUrl ? (
                              <img
                                src={
                                  playerNames[game.playerOne].profileImageUrl
                                }
                                alt={playerNames[game.playerOne].username}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <UserIcon className="h-full w-full object-cover text-gray-500" />
                            )}
                          </div>
                          <span className={getResultClass(game)}>
                            {playerNames[game.playerOne]?.username ||
                              game.playerOne}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full overflow-hidden bg-muted">
                            {playerNames[game.playerTwo]?.profileImageUrl ? (
                              <img
                                src={
                                  playerNames[game.playerTwo].profileImageUrl
                                }
                                alt={playerNames[game.playerTwo].username}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <UserIcon className="h-full w-full object-cover text-gray-500" />
                            )}
                          </div>
                          <span className={getResultClass(game)}>
                            {playerNames[game.playerTwo]?.username ||
                              game.playerTwo}
                          </span>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    <span className={getResultClass(game)}>
                      {getResultDisplay(game)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    <span className={getResultClass(game)}>
                      {getEloDifference(game)}{game?.eloDifference}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {game.timeControl}
                  </TableCell>
                  <TableCell className="text-center">
                    {game.moves.length}
                  </TableCell>
                  <TableCell>{formatDate(game.createdAt)}</TableCell>
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-muted/80"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="bg-background"
                      >
                        <DropdownMenuItem
                          onClick={() => handleReviewGame(game._id)}
                          className="cursor-pointer"
                        >
                          Review Game
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  No games found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center p-4">
          <Button
            variant="outline"
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
