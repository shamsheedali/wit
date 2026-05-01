"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPublicClubs, joinClub, getUserClubs } from "@/lib/api/club";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores";
import { CirclePlus, Search, X, UsersRound, Users, ShieldAlert, ArrowRight } from "lucide-react";
import { CreateClubDialog } from "../create-club-dialog";
import { useState, useCallback } from "react";
import { debounce } from "lodash";

interface IClub {
  _id: string;
  name: string;
  description?: string;
  clubType: "public" | "private";
  admins: string[];
  members?: string[];
  maxMembers?: number;
}

export function ClubsTabs() {
  const { user: mainUser } = useAuthStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<"my-clubs" | "public-clubs">("my-clubs");
  
  const router = useRouter();
  const queryClient = useQueryClient();

  const debouncedSetQuery = useCallback(
    debounce((val) => {
      setSearchQuery(val);
      setIsSearching(val.length > 0);
    }, 500),
    []
  );

  const { data: userClubs = [], isLoading: userClubsLoading } = useQuery({
    queryKey: ["userClubs", mainUser?._id],
    queryFn: () => getUserClubs(mainUser!._id),
    enabled: !!mainUser?._id,
  });

  const { data: publicClubs = [], isLoading: publicClubsLoading } = useQuery({
    queryKey: ["publicClubs", searchQuery],
    queryFn: () => getPublicClubs(searchQuery),
  });

  const joinClubMutation = useMutation({
    mutationFn: ({ clubId, userId }: { clubId: string; userId: string }) =>
      joinClub(clubId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["publicClubs"] });
      queryClient.invalidateQueries({ queryKey: ["userClubs"] });
    },
  });

  const handleJoinClub = (clubId: string) => {
    if (!mainUser?._id) {
      router.push("/login");
      return;
    }
    joinClubMutation.mutate({ clubId, userId: mainUser._id });
  };

  const handlePageChange = (clubName: string) => {
    router.push(`/clubs/${clubName}`);
  };

  return (
    <div className="w-full">
      <CreateClubDialog open={dialogOpen} onOpenChange={setDialogOpen} />

      {/* Search Bar */}
      <div className="relative mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="relative z-20">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
          <input
            type="text"
            placeholder="Search for public clubs..."
            onChange={(e) => {
              const val = e.target.value;
              if (val.length === 0) {
                setSearchQuery("");
                setIsSearching(false);
              }
              debouncedSetQuery(val);
            }}
            className="w-full pl-12 pr-4 py-4 bg-card border border-border rounded-xl text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setIsSearching(false);
                const input = document.querySelector('input[type="text"]') as HTMLInputElement;
                if (input) input.value = '';
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-foreground/40 hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {isSearching && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-3 border-b border-border bg-secondary/30">
              <p className="text-sm text-muted-foreground font-medium">Search results</p>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {publicClubs.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  No clubs found matching "{searchQuery}"
                </div>
              ) : (
                publicClubs.map((club: IClub) => {
                  const isMember = club.members?.includes(mainUser?._id || "");
                  return (
                    <div
                      key={club._id}
                      className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors border-b border-border/50 last:border-0"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center border border-border">
                          <UsersRound className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{club.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {club.members?.length || 0} {club.maxMembers ? `/ ${club.maxMembers}` : ""} Members
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isMember ? (
                          <button
                            onClick={() => handlePageChange(club.name)}
                            className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors"
                          >
                            View
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleJoinClub(club._id)}
                            disabled={joinClubMutation.isPending}
                            className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors shadow-sm disabled:opacity-50"
                          >
                            {joinClubMutation.isPending ? "Joining..." : "Join Club"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tabs & Create Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("my-clubs")}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
              activeTab === "my-clubs"
                ? "bg-accent text-accent-foreground shadow-sm"
                : "bg-card text-foreground/70 hover:bg-secondary border border-border"
            }`}
          >
            My Clubs ({userClubs.length})
          </button>
          <button
            onClick={() => {
              setActiveTab("public-clubs");
              if (searchQuery) {
                 setSearchQuery("");
                 setIsSearching(false);
              }
            }}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
              activeTab === "public-clubs"
                ? "bg-accent text-accent-foreground shadow-sm"
                : "bg-card text-foreground/70 hover:bg-secondary border border-border"
            }`}
          >
            Explore Public
          </button>
        </div>

        {mainUser?._id && (
          <button 
            onClick={() => setDialogOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
          >
            <CirclePlus className="w-4 h-4" />
            Create Club
          </button>
        )}
      </div>

      {/* Content */}
      <div className="animate-in fade-in slide-in-from-bottom-8 duration-500 delay-200">
        {activeTab === "my-clubs" ? (
          <div>
            {userClubsLoading ? (
              <div className="text-center py-16 text-muted-foreground animate-pulse">Loading your clubs...</div>
            ) : userClubs.length === 0 ? (
              <div className="text-center py-16">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">You haven't joined any clubs yet.</p>
                <p className="text-sm text-muted-foreground mt-1">Check out the Explore tab to find communities.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userClubs.map((club: IClub) => (
                  <div
                    key={club._id}
                    onClick={() => handlePageChange(club.name)}
                    className="group bg-card rounded-2xl border border-border/50 p-5 hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-14 h-14 rounded-xl bg-secondary/50 flex items-center justify-center border border-border group-hover:bg-accent/10 transition-colors shrink-0">
                        <UsersRound className="w-7 h-7 text-muted-foreground group-hover:text-accent transition-colors" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground text-lg group-hover:text-accent transition-colors line-clamp-1">{club.name}</h3>
                        <p className="text-sm text-foreground/60 mt-1 capitalize">
                          {club.clubType} Club
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>{club.members?.length || 0} Members</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm font-medium text-accent opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0">
                        View
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            {publicClubsLoading && !isSearching ? (
              <div className="text-center py-16 text-muted-foreground animate-pulse">Loading public clubs...</div>
            ) : publicClubs.length === 0 && !isSearching ? (
              <div className="text-center py-16">
                <ShieldAlert className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No public clubs available right now.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {publicClubs.map((club: IClub) => {
                  const isMember = club.members?.includes(mainUser?._id || "");
                  return (
                    <div
                      key={club._id}
                      className="group bg-card rounded-2xl border border-border/50 p-5 transition-all flex flex-col justify-between hover:shadow-md"
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-14 h-14 rounded-xl bg-secondary/50 flex items-center justify-center border border-border shrink-0">
                          <UsersRound className="w-7 h-7 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-foreground text-lg line-clamp-1">{club.name}</h3>
                          <p className="text-sm text-foreground/60 mt-1">
                            {club.members?.length || 0} {club.maxMembers ? `/ ${club.maxMembers}` : ""} Members
                          </p>
                        </div>
                      </div>
                      <div className="mt-auto pt-4 border-t border-border/50 flex justify-end">
                        {isMember ? (
                          <button
                            onClick={() => handlePageChange(club.name)}
                            className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors w-full justify-center"
                          >
                            View Club
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleJoinClub(club._id)}
                            disabled={joinClubMutation.isPending}
                            className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors shadow-sm w-full disabled:opacity-50"
                          >
                            {joinClubMutation.isPending ? "Joining..." : "Join Club"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
