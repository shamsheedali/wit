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
  Eye,
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

  const getResultInfo = (game: Game) => {
    if (game.gameStatus === "terminated") return { text: "Terminated", type: "draw" };
    if (!game.result) return { text: "Ongoing", type: "draw" };
    
    let isWin = false;
    let isLoss = false;
    let isDraw = game.result === "draw";

    if (
      (game.result === "whiteWin" && game.playerOne === user?._id) ||
      (game.result === "blackWin" && game.playerTwo === user?._id)
    ) {
      isWin = true;
    } else if (!isDraw) {
      isLoss = true;
    }

    let text = "½-½";
    if (game.result === "whiteWin") text = "1-0";
    if (game.result === "blackWin") text = "0-1";

    return {
      text,
      type: isWin ? "win" : isLoss ? "loss" : "draw",
    };
  };

  const getEloDifferenceString = (game: Game) => {
    if (!game.result || game.result === "draw") return game?.eloDifference || "0";
    const isWin =
      (game.result === "whiteWin" && game.playerOne === user?._id) ||
      (game.result === "blackWin" && game.playerTwo === user?._id);
    return isWin ? `+${game.eloDifference}` : `-${game.eloDifference}`;
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
    <div className="w-full">
      <div className="overflow-x-auto">
        <Table className="border-collapse w-full">
          <TableHeader className="bg-secondary/30">
            <TableRow className="hover:bg-transparent border-b-border/50">
              <TableHead className="py-4 text-xs uppercase tracking-wider text-muted-foreground font-medium w-[150px]">Type</TableHead>
              <TableHead className="py-4 text-xs uppercase tracking-wider text-muted-foreground font-medium min-w-[200px]">Players</TableHead>
              <TableHead className="py-4 text-xs uppercase tracking-wider text-muted-foreground font-medium text-center">Result</TableHead>
              <TableHead className="py-4 text-xs uppercase tracking-wider text-muted-foreground font-medium text-center">Elo Diff</TableHead>
              <TableHead className="py-4 text-xs uppercase tracking-wider text-muted-foreground font-medium text-center">Time</TableHead>
              <TableHead className="py-4 text-xs uppercase tracking-wider text-muted-foreground font-medium text-center">Moves</TableHead>
              <TableHead
                className="py-4 text-xs uppercase tracking-wider text-muted-foreground font-medium cursor-pointer hover:text-foreground transition-colors"
                onClick={sortByDate}
              >
                <div className="flex items-center gap-1 justify-center">
                  Date
                  {sortDirection === "asc" ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </div>
              </TableHead>
              <TableHead className="py-4 w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border/30">
            {games && games.length > 0 ? (
              games.map((game) => {
                const resultInfo = getResultInfo(game);
                const eloStr = getEloDifferenceString(game);

                return (
                  <TableRow
                    key={game._id}
                    className="group hover:bg-secondary/50 transition-colors border-border/30"
                  >
                    {/* Type */}
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-secondary group-hover:bg-accent/10 transition-colors">
                          {game.gameType === "blitz" ? (
                            <Zap className="w-4 h-4 text-foreground/70" />
                          ) : game.gameType === "bullet" ? (
                            <Zap className="w-4 h-4 text-foreground/70" />
                          ) : (
                            <Timer className="w-4 h-4 text-foreground/70" />
                          )}
                        </div>
                        <span className="font-medium text-sm capitalize">{game.gameType}</span>
                      </div>
                    </TableCell>

                    {/* Players */}
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-xs font-medium overflow-hidden shrink-0">
                            {playerNames[game.playerOne]?.profileImageUrl ? (
                              <img src={playerNames[game.playerOne].profileImageUrl} alt="P1" className="w-full h-full object-cover" />
                            ) : (
                              (playerNames[game.playerOne]?.username?.[0] || "?").toUpperCase()
                            )}
                          </div>
                          <span className="text-sm font-medium max-w-[80px] truncate">
                            {playerNames[game.playerOne]?.username || "Unknown"}
                          </span>
                        </div>
                        <span className="text-muted-foreground text-xs mx-1">vs</span>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs font-medium overflow-hidden shrink-0">
                            {playerNames[game.playerTwo]?.profileImageUrl ? (
                              <img src={playerNames[game.playerTwo].profileImageUrl} alt="P2" className="w-full h-full object-cover" />
                            ) : (
                              (playerNames[game.playerTwo]?.username?.[0] || "?").toUpperCase()
                            )}
                          </div>
                          <span className="text-sm font-medium max-w-[80px] truncate">
                            {playerNames[game.playerTwo]?.username || "Unknown"}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Result */}
                    <TableCell className="py-4 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-mono font-semibold transition-colors ${
                        resultInfo.type === "win" ? "bg-green-500/10 text-green-500" :
                        resultInfo.type === "loss" ? "bg-red-500/10 text-red-500" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {resultInfo.text}
                      </span>
                    </TableCell>

                    {/* Elo Diff */}
                    <TableCell className="py-4 text-center">
                      <span className={`font-mono text-sm font-medium ${
                        resultInfo.type === "win" ? "text-green-500" :
                        resultInfo.type === "loss" ? "text-red-500" :
                        "text-muted-foreground"
                      }`}>
                        {eloStr}
                      </span>
                    </TableCell>

                    {/* Time Control */}
                    <TableCell className="py-4 text-center text-sm text-muted-foreground">
                      {game.timeControl}
                    </TableCell>

                    {/* Moves */}
                    <TableCell className="py-4 text-center text-sm text-muted-foreground font-mono">
                      {game.moves.length}
                    </TableCell>

                    {/* Date */}
                    <TableCell className="py-4 text-center text-sm text-muted-foreground">
                      {formatDate(game.createdAt)}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="py-4">
                      <div className="flex justify-end items-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full hover:bg-secondary/80 group-hover:bg-background/50 transition-colors"
                            >
                              <MoreVertical className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-background border-border/50">
                            <DropdownMenuItem onClick={() => handleReviewGame(game._id)} className="cursor-pointer gap-2">
                              <Eye className="w-4 h-4" />
                              Review Game
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  No games found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center px-6 py-4 border-t border-border/30">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className="rounded-full shadow-sm hover:bg-secondary"
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="rounded-full shadow-sm hover:bg-secondary"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
