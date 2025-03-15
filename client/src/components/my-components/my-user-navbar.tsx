"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserAvatar } from "./user-avatar";
import { Bell, UsersRound } from "lucide-react";
import { GrGroup } from "react-icons/gr";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Button } from "../ui/button";
import { useAuth } from "@/hooks/queryHooks/useAuth";

export default function UserNavbar() {
  const [user, setUser] = useState(false);
  const {data: authState} = useAuth();

  useEffect(() => {
    const token = localStorage.getItem("userToken");
    if (token) setUser(true);
  }, []);

  return (
    <div className="bg-[#09090b] flex justify-between items-center px-16 py-5 border-b-[1px] text-[#f0f0f0db] font-bold font-clashDisplay text-[15px]  w-full fixed z-10">
      <nav className="flex gap-16">
        <Link href={"/home"} className="font-stardom text-xl">
          Wit
        </Link>
        <h1>About Us</h1>
        <h1>Contact Us</h1>
      </nav>

      <nav className="flex gap-10 items-center">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <GrGroup className="h-5 w-5" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Groups</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Link href={'/friends'}>
                <UsersRound className="h-5 w-5" />
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>Friends</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Bell className="h-5 w-5" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Messages</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {authState ? (
          <UserAvatar />
        ) : (
          <Link href={"/login"}>
            <Button>Login</Button>
          </Link>
        )}
      </nav>
    </div>
  );
}
