import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import React, { useState } from "react";
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
  TrendingUp,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/stores";
import { useFriendStore } from "@/stores/useFriendStore";
import { User } from "@/types/auth";
import { format } from "date-fns";

const UserProfile = ({ user }: { user: User }) => {
  const { user: mainUser } = useAuthStore();
  const { sendFriendRequest } = useFriendStore();
  const isCurrentUser = mainUser?._id === user?._id;
  const [isRequestSent, setIsRequestSent] = useState(false);

  const dateToFormat = isCurrentUser ? mainUser?.createdAt : user?.createdAt;
  let formatDate
  if(dateToFormat) {
    formatDate = format(new Date(dateToFormat), "MMM d, yyyy"); // "Aug 27, 2023"
  }

  const isFriend = mainUser?.friends.includes(user._id);

  const handleAddFriend = async () => {
    try {
      if (!mainUser?._id) {
        alert("You must be logged in to send a friend request");
        return;
      }
      await sendFriendRequest(user._id); // Only pass receiverId
      setIsRequestSent(true); // Disable button and show feedback
    } catch (error) {
      console.error("Failed to send friend request:", error);
      alert("Failed to send friend request");
    }
  };

  return (
    <div className="border-2 rounded-lg flex justify-center items-center p-8 gap-20">
      <Avatar className="cursor-pointer w-40 h-40">
        <AvatarImage
          src={isCurrentUser ? mainUser?.profileImageUrl : user?.profileImageUrl}
          alt="@shadcn"
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

        {/* icons */}
        <div className="flex gap-20 text-center">
          <div className="flex flex-col items-center gap-3">
            <TrendingUp />
            Online Now
          </div>
          <div className="flex flex-col items-center gap-3">
            <Calendar1 />
            {formatDate}
          </div>
          <div className="flex flex-col items-center gap-3">
            <UsersRound />
            {isCurrentUser ? mainUser?.friends.length : user?.friends.length}
          </div>
          <div className="flex flex-col items-center gap-3">
            <Swords />
            123
          </div>
        </div>

        {!isCurrentUser && (
          <div className="flex gap-5">
            {isFriend ? (
              <Button
                variant="destructive"
                // onClick={handleAddFriend}
                // disabled={isRequestSent}
              >
                <HeartCrack />
                {/* {isRequestSent ? "Request Sent" : "Add Friend"} */}
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
            <Button className="bg-gray-300">
              <Sword />
              Challenge
            </Button>
            <Button className="bg-gray-300">
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
  );
};

export default UserProfile;
