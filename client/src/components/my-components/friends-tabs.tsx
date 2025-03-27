"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCallback, useEffect, useState } from "react";
import { debounce } from "lodash";
import { useQuery } from "@tanstack/react-query";
import { searchFriend } from "@/lib/api/user";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores";
import { User } from "@/types/auth";
import { useFriendStore } from "@/stores/useFriendStore";
import { Sword } from "lucide-react";
import { getUsers } from "@/lib/api/admin";

export function FriendsTabs() {
  const { user: mainUser } = useAuthStore();
  const {
    friendRequests,
    fetchFriendRequests,
    updateFriendRequest,
    fetchFriends,
    friends,
  } = useFriendStore();
  const router = useRouter();
  const [query, setQuery] = useState<string>("");
  const [playerNames, setPlayerNames] = useState<{ [key: string]: string }>({}); // Map userId to username

  const debouncedSetQuery = useCallback(
    debounce((val) => setQuery(val), 500),
    []
  );

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["searchFriend", query],
    queryFn: () => searchFriend(query),
    enabled: !!query,
  });

  const filteredUsers =
    users?.filter((user: User) => user._id !== mainUser?._id) || [];

  // Fetch usernames for mapping
  useEffect(() => {
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

    fetchUserNames();
  }, []);

  // Fetch friend requests and friends
  useEffect(() => {
    console.log("mainUser in useEffect:", mainUser); // Ensure this logs
    if (mainUser?._id) {
      fetchFriendRequests();
      fetchFriends();
    }
  }, [mainUser?._id, fetchFriendRequests, fetchFriends]);

  const handleUserPage = (username: string) => {
    router.push(`/${username}`);
  };

  console.log("friendRequests:", friendRequests);
  const receivedRequests = friendRequests.filter(
    (req) => req.receiverId === mainUser?._id && req.status === "pending"
  );
  console.log("receivedRequests:", receivedRequests);

  const handleAccept = (requestId: string) => {
    updateFriendRequest(requestId, "accepted");
  };

  const handleIgnore = (requestId: string) => {
    updateFriendRequest(requestId, "ignored");
  };

  return (
    <Tabs defaultValue="friends" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="friends">Friends</TabsTrigger>
        <TabsTrigger value="find">Find</TabsTrigger>
        <TabsTrigger value="received">Received</TabsTrigger>
      </TabsList>
      <TabsContent value="friends">
        <Card>
          <CardHeader>
            <CardTitle>Friends</CardTitle>
            <CardDescription>Your friends list</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {friends.length === 0 ? (
              <p>No friends yet</p>
            ) : (
              friends.map((friend) => (
                <div
                  key={friend._id}
                  className="flex items-center space-x-4 p-3 rounded-lg transition-all duration-200 hover:bg-accent hover:scale-[1.02] group"
                  onClick={() => handleUserPage(friend.username)}
                >
                  <div className="relative">
                    <img
                      src={friend?.profileImageUrl || "/placeholder.svg?height=40&width=40"}
                      alt="User avatar"
                      className="rounded-full w-10 h-10 object-cover"
                      width={40}
                      height={40}
                    />
                    <span
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                        friend.online ? "bg-green-500" : "bg-gray-500"
                      }`}
                    ></span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{friend.username}</p>
                    <p className="text-xs text-muted-foreground flex items-center">
                      <span
                        className={`w-2 h-2 rounded-full mr-1 ${
                          friend.online ? "bg-green-500" : "bg-gray-500"
                        }`}
                      ></span>
                      {friend.online ? "Online" : "Offline"}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-primary hover:text-primary-foreground"
                  >
                    <Sword />
                    Challenge
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="find">
        <Card>
          <CardHeader>
            <CardTitle>Find</CardTitle>
            <CardDescription>Search for new friends</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Search by username"
                className="flex-1"
                onChange={(e) => debouncedSetQuery(e.target.value)}
              />
              <Button>Search</Button>
            </div>

            {filteredUsers &&
              filteredUsers.map((user: User) => (
                <div
                  key={user._id}
                  className="flex items-center space-x-4 p-3 rounded-lg transition-all duration-200 hover:bg-accent hover:scale-[1.02] group"
                  onClick={() => handleUserPage(user.username)}
                >
                  <div className="relative">
                    <img
                      src={user.profileImageUrl || "/placeholder.svg?height=40&width=40"}
                      alt="User avatar"
                      className="rounded-full w-10 h-10 object-cover"
                      width={40}
                      height={40}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{user.username}</p>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="received">
        <Card>
          <CardHeader>
            <CardTitle>Received</CardTitle>
            <CardDescription>Friend requests you've received</CardDescription>
          </CardHeader>
          <CardContent>
            {receivedRequests.length === 0 ? (
              <p>No pending requests</p>
            ) : (
              receivedRequests.map((req) => (
                <div
                  key={req._id}
                  className="flex items-center space-x-4 p-3 rounded-lg transition-all duration-200 hover:bg-accent hover:scale-[1.02] group"
                >
                  <div className="relative">
                    <img
                      src={req.senderId.profileImageUrl ||  "/placeholder.svg?height=40&width=40"}
                      alt="User avatar"
                      className="rounded-full w-10 h-10 object-cover"
                      width={40}
                      height={40}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {typeof req.senderId === "string"
                        ? playerNames[req.senderId] || req.senderId
                        : req.senderId.username || "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></span>
                      Pending
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="transition-all duration-200 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => handleIgnore(req._id)}
                    >
                      Ignore
                    </Button>
                    <Button
                      size="sm"
                      className="transition-all duration-200"
                      onClick={() => handleAccept(req._id)}
                    >
                      Accept
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}