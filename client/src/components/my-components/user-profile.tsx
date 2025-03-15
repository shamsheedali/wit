import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import React from "react";
import { Button } from "../ui/button";
import {
  Calendar1,
  Ellipsis,
  Handshake,
  Pencil,
  Send,
  Sword,
  Swords,
  TrendingUp,
  UsersRound,
} from "lucide-react";
import useUser from "@/hooks/queryHooks/useUser";
import Link from "next/link";

const UserProfile = ({ user }) => {
  const { data: mainUser } = useUser();
  const isCurrentUser = mainUser?._id === user?._id;

  return (
    <div className="border-2 rounded-lg flex justify-center items-center p-8 gap-20">
      <Avatar className="cursor-pointer w-40 h-40">
        <AvatarImage
          src={isCurrentUser ? mainUser?.profileImageUrl : "https://github.com/shadcn.png"}
          alt="@shadcn"
        />
        <AvatarFallback>{user?.username[0].toUpperCase()}</AvatarFallback>
      </Avatar>

      <div className="flex flex-col gap-5 relative">
        <div>
          <h1 className="text-3xl mb-2">{user?.username}</h1>
          <h1 className="text-xl">{user?.firstName} {user?.lastName}</h1>
          <p className="text-sm w-[250px] text-gray-500">
            {user?.bio}
          </p>

          {isCurrentUser && (
            <Link href="/settings">
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
            Aug 27, 2023
          </div>
          <div className="flex flex-col items-center gap-3">
            <UsersRound />5
          </div>
          <div className="flex flex-col items-center gap-3">
            <Swords />
            123
          </div>
        </div>

        {!isCurrentUser && (
          <div className="flex gap-5">
            <Button className="bg-gray-300">
              <Handshake />
              Add Friend
            </Button>
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
