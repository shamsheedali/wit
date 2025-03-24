"use client";

import { ChessBoard } from "@/components/chess/chessBoard";
import { TimeDropdown } from "@/components/chess/time-dropdown";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores";
import { useFriendStore } from "@/stores/useFriendStore";
import { Friend } from "@/types/friend";
import { CircleArrowLeft, Handshake, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getSocket } from "@/lib/socket";

export default function PlayFriend() {
  const { user } = useAuthStore();
  const { fetchFriends, friends, sendPlayRequest } = useFriendStore();
  const [playAs, setPlayAs] = useState<boolean>(false);
  const [selectedFriend, setSelectedFriend] = useState<Friend | undefined>();
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [gameId, setGameId] = useState<string | undefined>(undefined);
  const [playerColor, setPlayerColor] = useState<"w" | "b">("w");
  const [opponentId, setOpponentId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (user?._id) {
      fetchFriends();
      const socketInstance = getSocket(); //existing socket
      if (socketInstance) {
        socketInstance.on("connect", () => {
          console.log(`Socket connected for user ${user._id}`);
        });

        socketInstance.on("playRequestReceived", (data) => {
          console.log("Received play request:", data);
          setOpponentId(data.senderId);
          toast(`Play request from ${data.senderId}`, {
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
                  onClick={() => {
                    if (!socketInstance || !user?._id) {
                      console.log("Socket or user ID missing:", { socket: socketInstance, userId: user?._id });
                      return;
                    }
                    const newGameId = `${data.senderId}-${user._id}-${Date.now()}`;
                    console.log("Emitting acceptPlayRequest:", { senderId: data.senderId, receiverId: user._id, gameId: newGameId });
                    socketInstance.emit("acceptPlayRequest", {
                      senderId: data.senderId,
                      receiverId: user._id,
                      gameId: newGameId,
                    });
                    setGameId(newGameId);
                    setPlayerColor("b");
                    setGameStarted(true);
                    toast.success(`Game started with ${data.senderId}`);
                  }}
                >
                  Accept
                </Button>
              </div>
            ),
            duration: 10000,
            onDismiss: () => toast.info("Play request declined"),
          });
        });

        socketInstance.on("playRequestAccepted", (data) => {
          console.log("Play request accepted:", data);
          setGameId(data.gameId);
          setOpponentId(data.opponentId);
          setPlayerColor("w");
          setGameStarted(true);
          toast.success(`Game started with ${data.opponentId}`);
        });

        return () => {
          socketInstance.off("connect");
          socketInstance.off("playRequestReceived");
          socketInstance.off("playRequestAccepted");
        };
      } else {
        console.log("No socket instance available");
      }
    }
  }, [user?._id, fetchFriends]);

  const handleClick = (friendId: string) => {
    setPlayAs(true);
    setSelectedFriend(friends.find((friend) => friend._id === friendId));
  };

  const handlePlay = () => {
    if (!selectedFriend?._id || !user?._id) {
      toast.error("Cannot send play request - missing user or friend");
      return;
    }
    sendPlayRequest(selectedFriend._id);
    toast.success(`Play request sent to ${selectedFriend.username}`);
  };

  return (
    <div className="flex flex-col md:flex-row w-full h-screen items-center p-4 font-clashDisplay">
      {/* Left Section (Game + Players) */}
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
              {gameStarted && selectedFriend ? selectedFriend.username : "Opponent"}
            </h1>
          </div>
          <div className="bg-[#262522] px-8 py-3 rounded-sm">
            <h1 className="text-md font-bold">10:00</h1>
          </div>
        </div>

        <div className="flex-grow flex items-center justify-center w-full max-w-[500px] my-2">
          <ChessBoard
            gameId={gameId}
            playerColor={playerColor}
            opponentId={opponentId}
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
            <h1 className="text-md font-semibold">{user?.username || "Guest"}</h1>
          </div>
          <div className="bg-[#262522] px-8 py-3 rounded-sm">
            <h1 className="text-md font-bold">10:00</h1>
          </div>
        </div>
      </div>

      {!playAs && !gameStarted && (
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
        </div>
      )}

      {playAs && !gameStarted && selectedFriend && (
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
                  src={selectedFriend.profileImageUrl || "/placeholder.svg"}
                  alt={selectedFriend.username}
                  className="h-32 w-32 rounded-full"
                />
              </div>
              <h1>{selectedFriend.username}</h1>
            </div>
          </div>

          <div className="space-y-2">
            <TimeDropdown />
          </div>

          <Button className="w-full h-11 font-bold" onClick={handlePlay}>
            Play
          </Button>
        </div>
      )}
    </div>
  );
}