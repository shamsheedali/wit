"use client";

import { getUsers } from "@/lib/api/user";
import { User } from "@/types/auth";
import { Crown, Medal, Award, Trophy, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function getRankIcon(rank: number) {
  if (rank === 1) return <Crown className="w-5 h-5 text-amber-500" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-zinc-400" />;
  if (rank === 3) return <Award className="w-5 h-5 text-amber-700" />;
  return <span className="text-muted-foreground font-mono text-sm">#{rank}</span>;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchUserNames = async () => {
      try {
        const limit = 100;
        let page = 1;
        let allUsers: User[] = [];
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
        const filteredUsers = allUsers.sort((a, b) => b.eloRating - a.eloRating);
        setUsers(filteredUsers);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
    };

    fetchUserNames();
  }, []);

  const handleUserPage = (username: string) => {
    router.push(`/${username}`);
  };

  const top3 = [users[1], users[0], users[2]];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Pattern */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,var(--accent)_0%,transparent_50%)] opacity-[0.03]" />
      </div>

      <main className="relative z-10 max-w-5xl mx-auto px-6 pt-32 pb-20">
        {/* Header */}
        <div className="mb-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-10 h-10 text-accent" />
            <h1 className="font-serif text-4xl md:text-5xl font-bold tracking-tight">Leaderboard</h1>
          </div>
          <p className="text-muted-foreground text-lg ml-1">Top players ranked by Elo rating</p>
        </div>

        {/* Top 3 Podium */}
        {users.length >= 3 && (
          <div className="grid grid-cols-3 gap-2 md:gap-4 mb-16 animate-in zoom-in-95 duration-1000 delay-200 fill-mode-both max-w-3xl mx-auto">
            {top3.map((player, index) => {
              if (!player) return <div key={index} />;
              
              const rank = index === 0 ? 2 : index === 1 ? 1 : 3;
              const heights = ["h-28 md:h-32", "h-36 md:h-44", "h-24 md:h-28"];
              const bgColors = ["bg-secondary/60", "bg-accent/10", "bg-secondary/40"];
              
              return (
                <div
                  key={player._id}
                  className="flex flex-col items-center cursor-pointer group"
                  onClick={() => handleUserPage(player.username)}
                >
                  <div className="relative mb-4 group-hover:-translate-y-2 transition-transform duration-300">
                    <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-4 shadow-lg ${rank === 1 ? 'border-accent' : 'border-background'}`}>
                      {player.profileImageUrl ? (
                        <img src={player.profileImageUrl} alt={player.username} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-secondary flex items-center justify-center">
                          <UserRound className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-background flex items-center justify-center shadow-md border border-border/50">
                      {getRankIcon(rank)}
                    </div>
                  </div>
                  
                  <p className="font-medium text-foreground text-sm md:text-base truncate w-full text-center px-2">{player.username}</p>
                  <p className="text-accent font-mono text-base md:text-lg font-bold">{player.eloRating}</p>
                  
                  <div className={`${heights[index]} ${bgColors[index]} w-full mt-4 rounded-t-2xl flex items-end justify-center pb-4 border border-b-0 border-border/50`}>
                    <span className="font-serif text-3xl md:text-4xl text-foreground/20">{rank}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Leaderboard Table */}
        <div className="bg-card rounded-3xl border border-border/50 overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300 fill-mode-both">
          <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-border/50 bg-secondary/10 text-sm text-muted-foreground font-medium uppercase tracking-wider">
            <div className="col-span-2 text-center">Rank</div>
            <div className="col-span-7">Player</div>
            <div className="col-span-3 text-center">Rating</div>
          </div>

          <div className="divide-y divide-border/30">
            {users.slice(3).map((player, index) => {
              const actualRank = index + 4;
              return (
                <div
                  key={player._id}
                  onClick={() => handleUserPage(player.username)}
                  className="grid grid-cols-12 gap-4 px-6 py-4 items-center cursor-pointer hover:bg-secondary/50 transition-colors group"
                >
                  <div className="col-span-2 flex items-center justify-center">
                    {getRankIcon(actualRank)}
                  </div>
                  
                  <div className="col-span-7 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-border/50 bg-secondary shrink-0">
                      {player.profileImageUrl ? (
                        <img src={player.profileImageUrl} alt={player.username} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <UserRound className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <p className="font-medium text-foreground truncate group-hover:text-accent transition-colors">
                      {player.username}
                    </p>
                  </div>
                  
                  <div className="col-span-3 text-center">
                    <span className="font-mono font-bold text-foreground">
                      {player.eloRating}
                    </span>
                  </div>
                </div>
              );
            })}
            
            {users.length <= 3 && users.length > 0 && (
               <div className="p-8 text-center text-muted-foreground">
                 More players needed to fill the leaderboard table.
               </div>
            )}
            {users.length === 0 && (
               <div className="p-8 text-center text-muted-foreground animate-pulse">
                 Loading players...
               </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
