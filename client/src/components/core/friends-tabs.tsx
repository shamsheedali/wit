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
import { getUsers, searchFriend } from "@/lib/api/user";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores";
import { User } from "@/types/auth";
import { useFriendStore } from "@/stores/useFriendStore";
import { useOnlineStatusStore } from "@/stores/useOnlineStatusStore";
import { UserRound } from "lucide-react";
import { getSocket } from "@/lib/socket";

export function FriendsTabs() {
  const { user: mainUser } = useAuthStore();
  const {
    friendRequests,
    fetchFriendRequests,
    updateFriendRequest,
    fetchFriends,
    friends,
  } = useFriendStore();
  const { onlineUsers, initializeSocket, isUserOnline } =
    useOnlineStatusStore();
  const router = useRouter();
  const [query, setQuery] = useState<string>("");
  const [player, setPlayer] = useState<{
    [key: string]: { username: string; profileImage: string };
  }>({});

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

        const namesMap: {
          [key: string]: { username: string; profileImage: string };
        } = {};
        allUsers.forEach((u) => {
          namesMap[u._id] = {
            username: u.username,
            profileImage: u.profileImageUrl,
          };
        });
        setPlayer(namesMap);
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

  const [error, setError] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);

  const handleAccept = async (requestId: string, receiverId: string) => {
    try {
      setIsAccepting(true);
      setError(null);
      await updateFriendRequest(requestId, "accepted");
      //notify other user
      const socket = getSocket();
      if (socket && mainUser) {
        socket.emit('friendRequestAccepted', {
          senderId: mainUser._id,
          senderName: mainUser.username,
          receiverId
        });
      }
    } catch (err) {
      setError("Failed to accept friend request");
      console.error(err);
    } finally {
      setIsAccepting(false);
    }
  };

  const handleIgnore = (requestId: string) => {
    updateFriendRequest(requestId, "ignored");
  };

  const FriendItem = ({
    user,
    showChallenge = false,
  }: {
    user: User;
    showChallenge?: boolean;
  }) => (
    <div
      key={user._id}
      className="flex items-center space-x-4 p-3 cursor-pointer rounded-lg transition-all duration-200 hover:bg-accent hover:scale-[1.02] group"
      onClick={() => handleUserPage(user.username)}
    >
      <div className="relative">
        {user.profileImageUrl ? (
          <img
            src={user.profileImageUrl || "/placeholder.svg?height=40&width=40"}
            alt="User avatar"
            className="rounded-full w-10 h-10 object-cover"
            width={40}
            height={40}
          />
        ) : (
          <UserRound />
        )}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{user.username}</p>
        <p className="text-xs text-muted-foreground flex items-center">
          <span
            className={`w-2 h-2 rounded-full mr-1 ${
              isUserOnline(user._id) ? "bg-green-500" : "bg-gray-500"
            }`}
          ></span>
          {isUserOnline(user._id) ? "Online" : "Offline"}
        </p>
      </div>
    </div>
  );

  return (
    <Tabs defaultValue="friends" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="friends">Friends</TabsTrigger>
        <TabsTrigger value="find">Find</TabsTrigger>
        <TabsTrigger value="received">
          Received
          {receivedRequests.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
              {receivedRequests.length}
            </span>
          )}
        </TabsTrigger>
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
              friends
                .filter((friend) => friend?._id)
                .map((friend) => (
                  <FriendItem key={friend._id} user={friend} showChallenge />
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
            {filteredUsers.map((user: User) => (
              <FriendItem key={user._id} user={user} />
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
              receivedRequests.map((req) => {
                const sender =
                  typeof req.senderId === "string"
                    ? {
                        _id: req.senderId,
                        username: player[req.senderId]?.username || "Unknown",
                        profileImageUrl:
                          player[req.senderId]?.profileImage || "",
                      }
                    : req.senderId;

                return sender ? (
                  <div
                    key={req._id}
                    className="flex items-center space-x-4 p-3 rounded-lg transition-all duration-200 hover:bg-accent hover:scale-[1.02] group"
                  >
                    <div className="relative">
                      {sender.profileImageUrl ? (
                        <img
                          src={
                            sender.profileImageUrl ||
                            "/placeholder.svg?height=40&width=40"
                          }
                          alt="User avatar"
                          className="rounded-full w-10 h-10 object-cover"
                          width={40}
                          height={40}
                        />
                      ) : (
                        <UserRound />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {sender.username || "Unknown"}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center">
                        <span
                          className={`w-2 h-2 rounded-full mr-1 ${
                            isUserOnline(sender._id)
                              ? "bg-green-500"
                              : "bg-gray-500"
                          }`}
                        ></span>
                        {isUserOnline(sender._id) ? "Online" : "Offline"}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => handleIgnore(req._id)}
                      >
                        Ignore
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleAccept(req._id, sender._id)}
                        disabled={isAccepting}
                      >
                        {isAccepting ? "Accepting..." : "Accept"}
                      </Button>
                    </div>
                  </div>
                ) : null;
              })
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
