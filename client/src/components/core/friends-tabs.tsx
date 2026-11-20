"use client";

import { useCallback, useEffect, useState } from "react";
import { debounce } from "lodash";
import { useQuery } from "@tanstack/react-query";
import { getUsers, searchFriend } from "@/lib/api/user";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores";
import { User } from "@/types/auth";
import { useFriendStore } from "@/stores/useFriendStore";
import { useOnlineStatusStore } from "@/stores/useOnlineStatusStore";
import { 
  Users, Search, UserPlus, MessageSquare, Swords, 
  X, Check, Clock, UserMinus, UserRound
} from "lucide-react";
import { getSocket } from "@/lib/socket";

type Sender = {
  _id: string;
  username: string;
  profileImageUrl?: string;
};

function getStatusColor(isOnline: boolean) {
  if (isOnline) {
    return "bg-emerald-500";
  }
  return "bg-foreground/30";
}

export function FriendsTabs() {
  const { user: mainUser } = useAuthStore();
  const {
    friendRequests,
    fetchFriendRequests,
    updateFriendRequest,
    fetchFriends,
    friends,
    sendFriendRequest,
  } = useFriendStore();
  const { initializeSocket, isUserOnline } = useOnlineStatusStore();
  const router = useRouter();

  const [query, setQuery] = useState<string>("");
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<"friends" | "requests">("friends");
  const [players, setPlayers] = useState<Record<string, { username: string; profileImage: string }>>({});
  const [isAccepting, setIsAccepting] = useState(false);
  const [sentRequests, setSentRequests] = useState<string[]>([]);

  const debouncedSetQuery = useCallback(
    debounce((val: string) => {
      setQuery(val);
      setIsSearching(val.length > 0);
    }, 500),
    []
  );

  const { data: searchResults = [] } = useQuery({
    queryKey: ["searchFriend", query],
    queryFn: () => searchFriend(query),
    enabled: !!query,
  });

  const filteredSearchResults = searchResults?.filter((u: User) => u._id !== mainUser?._id) || [];

  useEffect(() => {
    const fetchUserNames = async () => {
      try {
        const limit = 100;
        let page = 1;
        let allUsers: {
          _id: string;
          username: string;
          profileImageUrl: string;
        }[] = [];
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

        const namesMap: Record<string, { username: string; profileImage: string }> = {};
        allUsers.forEach((u) => {
          namesMap[u._id] = {
            username: u.username,
            profileImage: u.profileImageUrl,
          };
        });
        setPlayers(namesMap);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
    };

    fetchUserNames();
  }, []);

  useEffect(() => {
    if (!mainUser?._id) {
      console.error("Main user ID is missing!");
      return;
    }
    initializeSocket();
    fetchFriendRequests();
    fetchFriends();
  }, [mainUser?._id, fetchFriendRequests, fetchFriends, initializeSocket]);

  const handleUserPage = (username: string) => {
    router.push(`/${username}`);
  };

  const receivedRequests = friendRequests.filter(
    (req) => req.receiverId === mainUser?._id && req.status === "pending"
  );

  const handleAccept = async (requestId: string, receiverId: string) => {
    try {
      setIsAccepting(true);
      await updateFriendRequest(requestId, "accepted");

      const socket = getSocket();
      if (socket && mainUser) {
        socket.emit("friendRequestAccepted", {
          senderId: mainUser._id,
          senderName: mainUser.username,
          receiverId,
        });
      }
    } catch (err) {
      console.error("Failed to accept friend request", err);
    } finally {
      setIsAccepting(false);
    }
  };

  const handleIgnore = (requestId: string) => {
    updateFriendRequest(requestId, "ignored");
  };

  const handleSendRequest = async (id: string) => {
    try {
      await sendFriendRequest(id);
      setSentRequests((prev) => [...prev, id]);
    } catch(err) {
      console.error(err);
    }
  };

  const onlineFriends = friends.filter((f) => isUserOnline(f._id));
  const offlineFriends = friends.filter((f) => !isUserOnline(f._id));

  return (
    <div className="w-full">
      {/* Search Bar */}
      <div className="relative mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="relative z-20">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
          <input
            type="text"
            placeholder="Search players by username to add them..."
            onChange={(e) => {
              const val = e.target.value;
              if (val.length === 0) {
                setQuery("");
                setIsSearching(false);
              }
              debouncedSetQuery(val);
            }}
            className="w-full pl-12 pr-4 py-4 bg-card border border-border rounded-xl text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all shadow-sm"
          />
          {query && (
            <button
              onClick={() => {
                setQuery("");
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
              <p className="text-sm text-muted-foreground font-medium">
                Search results
              </p>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {filteredSearchResults.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  No users found matching "{query}"
                </div>
              ) : (
                filteredSearchResults.map((user: User) => {
                  const isFriend = friends.some(f => f._id === user._id);
                  const isOnline = isUserOnline(user._id);
                  return (
                    <div
                      key={user._id}
                      className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors border-b border-border/50 last:border-0"
                    >
                      <div 
                        className="flex items-center gap-3 cursor-pointer"
                        onClick={() => handleUserPage(user.username)}
                      >
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-border bg-secondary flex items-center justify-center">
                            {user.profileImageUrl ? (
                              <img src={user.profileImageUrl} alt={user.username} className="object-cover w-full h-full" />
                            ) : (
                              <UserRound className="w-6 h-6 text-muted-foreground" />
                            )}
                          </div>
                          <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card ${getStatusColor(isOnline)}`} />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{user.username}</p>
                          <p className="text-sm text-muted-foreground">
                            {user.eloRating || 1200} ELO
                          </p>
                        </div>
                      </div>
                      {!isFriend && (
                        <button
                          onClick={() => handleSendRequest(user._id)}
                          disabled={sentRequests.includes(user._id)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            sentRequests.includes(user._id)
                              ? "bg-secondary text-muted-foreground"
                              : "bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm"
                          }`}
                        >
                          {sentRequests.includes(user._id) ? (
                            <>
                              <Clock className="w-4 h-4" />
                              Pending
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-4 h-4" />
                              Add
                            </>
                          )}
                        </button>
                      )}
                      {isFriend && (
                        <span className="text-sm text-muted-foreground px-4 py-2 bg-secondary/50 rounded-lg font-medium">Friend</span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
        <button
          onClick={() => setActiveTab("friends")}
          className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
            activeTab === "friends"
              ? "bg-accent text-accent-foreground shadow-sm"
              : "bg-card text-foreground/70 hover:bg-secondary border border-border"
          }`}
        >
          My Friends ({friends.length})
        </button>
        <button
          onClick={() => setActiveTab("requests")}
          className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
            activeTab === "requests"
              ? "bg-accent text-accent-foreground shadow-sm"
              : "bg-card text-foreground/70 hover:bg-secondary border border-border"
          }`}
        >
          Friend Requests
          {receivedRequests.length > 0 && (
            <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center ${
              activeTab === "requests" ? "bg-accent-foreground/20" : "bg-accent text-accent-foreground"
            }`}>
              {receivedRequests.length}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="animate-in fade-in slide-in-from-bottom-8 duration-500 delay-200">
        {activeTab === "friends" ? (
          <div>
            {/* Online Friends */}
            {onlineFriends.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-medium text-foreground/60 mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                  Online — {onlineFriends.length}
                </h2>
                <div className="grid gap-3">
                  {onlineFriends.map((friend) => (
                    <div
                      key={friend._id}
                      className="group bg-card rounded-xl border border-border/50 p-4 hover:shadow-md transition-all cursor-pointer"
                      onClick={() => handleUserPage(friend.username)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-border bg-secondary flex justify-center items-center">
                              {friend.profileImageUrl ? (
                                <img src={friend.profileImageUrl} alt={friend.username} className="w-full h-full object-cover" />
                              ) : (
                                <UserRound className="w-8 h-8 text-muted-foreground" />
                              )}
                            </div>
                            <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-card bg-emerald-500" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground text-lg group-hover:text-accent transition-colors">{friend.username}</p>
                            <p className="text-sm text-foreground/60">
                              {friend.eloRating || 1200} ELO • Online
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); router.push('/play/friend'); }}
                            className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors shadow-sm"
                          >
                            <Swords className="w-4 h-4" />
                            Challenge
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Offline Friends */}
            {offlineFriends.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-foreground/60 mb-4">
                  Offline — {offlineFriends.length}
                </h2>
                <div className="grid gap-3">
                  {offlineFriends.map((friend) => (
                    <div
                      key={friend._id}
                      className="group bg-card rounded-xl border border-border/50 p-4 hover:shadow-md transition-all opacity-70 hover:opacity-100 cursor-pointer"
                      onClick={() => handleUserPage(friend.username)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-border bg-secondary flex justify-center items-center grayscale group-hover:grayscale-0 transition-all">
                              {friend.profileImageUrl ? (
                                <img src={friend.profileImageUrl} alt={friend.username} className="w-full h-full object-cover" />
                              ) : (
                                <UserRound className="w-8 h-8 text-muted-foreground" />
                              )}
                            </div>
                            <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-card bg-foreground/30" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground text-lg group-hover:text-accent transition-colors">{friend.username}</p>
                            <p className="text-sm text-foreground/60">
                              {friend.eloRating || 1200} ELO • Offline
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 bg-secondary text-foreground/70 rounded-lg hover:bg-secondary/80 transition-colors">
                            <MessageSquare className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {friends.length === 0 && (
               <div className="text-center py-16">
                 <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                 <p className="text-muted-foreground">You don't have any friends yet.</p>
                 <p className="text-sm text-muted-foreground mt-1">Use the search bar above to find players.</p>
               </div>
            )}
          </div>
        ) : (
          <div>
            {receivedRequests.length === 0 ? (
              <div className="text-center py-16">
                <UserPlus className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No pending friend requests</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {receivedRequests.map((req) => {
                  const sender =
                    typeof req.senderId === "string"
                      ? {
                          _id: req.senderId,
                          username: players[req.senderId]?.username || "Unknown",
                          profileImageUrl: players[req.senderId]?.profileImage,
                        }
                      : {
                          _id: req.senderId._id,
                          username: req.senderId.username,
                          profileImageUrl: "profileImageUrl" in req.senderId
                              ? (req.senderId as { profileImageUrl?: string }).profileImageUrl
                              : undefined,
                        };

                  return (
                    <div
                      key={req._id}
                      className="bg-card rounded-xl border border-border/50 p-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 cursor-pointer" onClick={() => handleUserPage(sender.username)}>
                          <div className="relative">
                             <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-accent bg-secondary flex justify-center items-center">
                               {sender.profileImageUrl ? (
                                 <img src={sender.profileImageUrl} alt={sender.username} className="w-full h-full object-cover" />
                               ) : (
                                 <UserRound className="w-8 h-8 text-muted-foreground" />
                               )}
                             </div>
                             <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-card ${getStatusColor(isUserOnline(sender._id))}`} />
                          </div>
                          <div>
                            <p className="font-medium text-foreground text-lg hover:text-accent transition-colors">{sender.username}</p>
                            <p className="text-sm text-foreground/60 flex items-center gap-1">
                              {isUserOnline(sender._id) ? "Online" : "Offline"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleAccept(req._id, sender._id)}
                            disabled={isAccepting}
                            className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors shadow-sm disabled:opacity-50"
                          >
                            <Check className="w-4 h-4" />
                            {isAccepting ? "..." : "Accept"}
                          </button>
                          <button
                            onClick={() => handleIgnore(req._id)}
                            className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground/70 rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors"
                          >
                            <UserMinus className="w-4 h-4" />
                            Decline
                          </button>
                        </div>
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
