import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import {
  Calendar1,
  Ellipsis,
  Handshake,
  HeartCrack,
  Pencil,
  Send,
  Sword,
  Swords,
  // TrendingUp,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/stores";
import { useFriendStore } from "@/stores/useFriendStore";
import { User } from "@/types/auth";
import { format } from "date-fns";
import { toast } from "sonner";
import { removeFriend } from "@/lib/api/friend";
import { useRouter } from "next/navigation";
import ChatPopup from "@/components/core/ChatPopup";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

const UserProfile = ({ user }: { user: User }) => {
  const router = useRouter();
  const { user: mainUser, updateUser } = useAuthStore();
  const { sendFriendRequest, friends, fetchFriends } = useFriendStore();
  const isCurrentUser = mainUser?._id === user?._id;
  const [isRequestSent, setIsRequestSent] = useState(false);
  const [reRender, setReRender] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    if (mainUser?._id) {
      fetchFriends();
    }
  }, [reRender, mainUser?._id, fetchFriends]);

  const dateToFormat = isCurrentUser ? mainUser?.createdAt : user?.createdAt;
  let formatDate;
  if (dateToFormat) {
    formatDate = format(new Date(dateToFormat), "MMM d, yyyy");
  }

  const isFriend = friends.some((friend) => friend._id === user._id);

  const handleAddFriend = async () => {
    try {
      if (!mainUser?._id) {
        toast.info("You must be logged in to send a friend request");
        return;
      }
      await sendFriendRequest(user._id);
      setReRender(true);
      setIsRequestSent(true);
    } catch (error) {
      console.error("Failed to send friend request:", error);
      toast.error("Failed to send friend request");
    }
  };

  const handleRemoveFriend = async () => {
    const response = await removeFriend(mainUser?._id as string, user._id);
    updateUser(response?.updatedUser);
    setReRender(true);
  };

  const handleChallenge = () => {
    router.push("/play/friend");
  };

  return (
    <div className="w-full flex items-center justify-center">
      <div className="border-2 rounded-lg flex justify-center items-center w-fit p-5 md:py-8 md:px-14 gap-5 lg:gap-20">
        <Avatar className="cursor-pointer w-32 h-32 md:w-40 md:h-40">
          <AvatarImage
            src={
              isCurrentUser ? mainUser?.profileImageUrl : user?.profileImageUrl
            }
            alt={`${user?.username} profile image`}
            className="object-cover"
          />
          <AvatarFallback>{user?.username[0].toUpperCase()}</AvatarFallback>
        </Avatar>

        <div className="flex flex-col gap-5 relative">
          <div>
            <h1 className="text-3xl mb-2">{user?.username}</h1>
            <h1 className="text-xl">
              {user?.firstName} {user?.lastName}
            </h1>
            <p className="text-sm w-[250px] text-gray-500">{user?.bio}</p>

            {isCurrentUser && (
              <Link href="/settings/profile">
                <Button className="absolute right-0 top-0 bg-gray-300">
                  <Pencil />
                  Edit
                </Button>
              </Link>
            )}
          </div>

          <div className="flex gap-14 lg:gap-20 text-center">
            {/* <div className="flex flex-col items-center gap-3">
              <TrendingUp />
              Online Now
            </div> */}
            <div className="flex flex-col items-center gap-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                      <Calendar1 />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Joined</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {formatDate}
            </div>

            <div className="flex flex-col items-center gap-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Link href={`/${user.username}/friends`}>
                      <UsersRound />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Friends</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {isCurrentUser ? mainUser?.friends.length : user?.friends.length}
            </div>

            <div className="flex flex-col items-center gap-3">

            <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Swords />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Games Played</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {isCurrentUser ? mainUser?.gamesPlayed : user?.gamesPlayed}
            </div>
          </div>

          {!isCurrentUser && (
            <div className="flex gap-5">
              {isFriend ? (
                <Button variant="destructive" onClick={handleRemoveFriend}>
                  <HeartCrack />
                  Remove Friend
                </Button>
              ) : (
                <Button
                  className="bg-gray-300"
                  onClick={handleAddFriend}
                  disabled={isRequestSent}
                >
                  <Handshake />
                  {isRequestSent ? "Request Sent" : "Add Friend"}
                </Button>
              )}
              <Button className="bg-gray-300" onClick={handleChallenge}>
                <Sword />
                Challenge
              </Button>
              <Button
                className="bg-gray-300"
                onClick={() => setIsChatOpen(true)}
              >
                <Send />
                Message
              </Button>
              <Button className="bg-gray-300">
                <Ellipsis />
                More
              </Button>
            </div>
          )}
        </div>
      </div>
      {isChatOpen && mainUser?._id && (
        <ChatPopup
          userId={mainUser._id}
          otherUserId={user._id}
          otherUsername={user.username}
          onClose={() => setIsChatOpen(false)}
        />
      )}
    </div>
  );
};

export default UserProfile;
