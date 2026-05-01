"use client";

import NotFoundPage from "@/app/not-found";
import { getUser, getUsers } from "@/lib/api/user";
import { User } from "@/types/auth";
import { useQuery } from "@tanstack/react-query";
import { UserRound, Users, ArrowLeft, Search } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function UserFriends() {
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
        const friendIds = user?.friends || [];

        const filteredUsers = allUsers
          .filter((u) => friendIds.includes(u._id))
          .sort((a, b) => b.eloRating - a.eloRating);
        setUsers(filteredUsers);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
    };

    fetchUserNames();
  }, []);
  
  const params = useParams();
  const pathUsername = params.username as string;

  const {
    data: user,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["otherUsers", pathUsername],
    queryFn: () => getUser(pathUsername),
    enabled: !!pathUsername, // Only fetch when username exists
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
          <p className="text-muted-foreground font-medium animate-pulse">Loading connections...</p>
        </div>
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <NotFoundPage />
      </div>
    );
  }

  const handleUserPage = (username: string) => {
    router.push(`/${username}`);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Pattern */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,var(--accent)_0%,transparent_50%)] opacity-[0.03]" />
      </div>

      <main className="relative z-10 pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div>
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4 group"
              >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                <span className="text-sm font-medium">Back to Profile</span>
              </button>
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-8 h-8 text-accent" />
                <h1 className="font-serif text-4xl font-bold tracking-tight">
                  {pathUsername}&apos;s <span className="text-accent">Friends</span>
                </h1>
              </div>
              <p className="text-muted-foreground ml-1">
                {users.length} connections in the community
              </p>
            </div>

            <div className="relative w-full md:w-64 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
              <input
                type="text"
                placeholder="Search friends..."
                className="w-full pl-10 pr-4 py-2 bg-card/50 backdrop-blur-sm border border-border/50 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
              />
            </div>
          </div>

          {/* Friends List Container */}
          <div className="bg-card/50 backdrop-blur-sm rounded-3xl border border-border/50 overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200 fill-mode-both">
            <div className="p-2 md:p-4">
              {users.length > 0 ? (
                <div className="grid grid-cols-1 divide-y divide-border/50">
                  {users.map((friend) => (
                    <div
                      key={friend._id}
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-secondary/30 transition-all group"
                      onClick={() => handleUserPage(friend.username)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-secondary overflow-hidden ring-2 ring-border/50 group-hover:ring-accent/50 transition-all shadow-sm">
                            {friend.profileImageUrl ? (
                              <img
                                src={friend.profileImageUrl}
                                alt={friend.username}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent/10 to-accent/5">
                                <UserRound className="w-6 h-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-win rounded-full ring-2 ring-background shadow-sm" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground group-hover:text-accent transition-colors">
                            {friend.username}
                          </p>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider font-mono">
                            Rating: {friend.eloRating || 1200}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                         <div className="px-3 py-1 rounded-full bg-secondary/50 text-[10px] font-bold uppercase tracking-tighter text-muted-foreground group-hover:bg-accent/10 group-hover:text-accent transition-all">
                           View Profile
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
                    <Users className="w-8 h-8 text-muted-foreground opacity-20" />
                  </div>
                  <h3 className="text-lg font-semibold">No friends found</h3>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                    This user hasn&apos;t added any friends to their network yet.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
