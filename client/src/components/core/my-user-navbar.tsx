"use client";

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
import { useAuthStore } from "@/stores";
import { useNotificationStore } from "@/stores/useNotificationStore";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { format } from "date-fns";
import { useFriendStore } from "@/stores/useFriendStore";

export default function UserNavbar() {
  const { isAuthenticated, user } = useAuthStore();
  const { friendRequests } = useFriendStore();
  const { notifications } = useNotificationStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const navRef = useRef(null);

  const receivedRequests = friendRequests.filter(
    (req) => req.receiverId === user?._id && req.status === "pending"
  );

  useEffect(() => {
    gsap.fromTo(
      navRef.current,
      { y: -100, opacity: 0 },
      { y: 0, opacity: 1, delay: 0.5, ease: "power3.out" }
    );
  }, []);

  return (
    <div
      ref={navRef}
      className="bg-[#09090b] flex justify-between items-center px-4 sm:px-8 md:px-16 py-5 border-b-[1px] text-[#f0f0f0db] font-bold font-clashDisplay text-[15px] w-full fixed z-10"
    >
      {/* Left Section (Logo and Nav) */}
      <div className="flex items-center gap-16">
        <Link href={"/"} className="font-stardom text-xl">
          Wit.
        </Link>
        <nav className="hidden md:flex gap-16">
          <h1>About Us</h1>
          <h1>Contact Us</h1>
        </nav>
      </div>

      {/* Hamburger Button (Visible below md) */}
      <button
        className="md:hidden flex flex-col justify-center items-center w-10 h-10 relative z-20"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle navigation"
      >
        <span
          className={`bg-[#f0f0f0db] h-0.5 w-6 rounded-full transition-all duration-300 ease-in-out ${
            isOpen ? "rotate-45 absolute" : "mb-1.5"
          }`}
        />
        <span
          className={`bg-[#f0f0f0db] h-0.5 w-6 rounded-full transition-all duration-300 ease-in-out ${
            isOpen ? "opacity-0" : "mb-1.5"
          }`}
        />
        <span
          className={`bg-[#f0f0f0db] h-0.5 w-6 rounded-full transition-all duration-300 ease-in-out ${
            isOpen ? "-rotate-45 absolute" : ""
          }`}
        />
      </button>

      {/* Mobile Menu (Below md, Text Only) */}
      <nav
        className={`${
          isOpen ? "flex" : "hidden"
        } md:hidden flex-col gap-6 absolute top-16 left-0 w-full bg-[#09090b] p-4 border-b-[1px] z-10`}
      >
        <h1>About Us</h1>
        <h1>Contact Us</h1>
        <Link href={"/clubs"}>Clubs</Link>
        <Link href={"/friends"}>Friends</Link>
        <Link href={"/messages"}>Messages</Link>
        {isAuthenticated ? (
          <UserAvatar />
        ) : (
          <Link href={"/login"}>
            <Button>Login</Button>
          </Link>
        )}
      </nav>

      {/* Right Navigation (Desktop, Original with Icons) */}
      <nav className="hidden md:flex gap-10 items-center relative">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Link href={"/clubs"}>
                <GrGroup className="h-5 w-5" />
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>Clubs</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Link href={"/friends"}>
                <div className="relative">
                  <UsersRound className="h-5 w-5" />
                  {receivedRequests.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-2 w-2 flex items-center justify-center">
                      {/* {receivedRequests.length} */}
                    </span>
                  )}
                </div>
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>Friends</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative">
                <Bell
                  className="h-5 w-5 cursor-pointer"
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Notifications</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {isNotificationOpen && (
          <div className="absolute top-12 right-0 bg-[#262522] w-64 rounded-md shadow-lg z-20 p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-white font-bold">Notifications</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  useNotificationStore.getState().clearNotifications()
                }
              >
                Clear
              </Button>
            </div>
            {notifications.length === 0 ? (
              <p className="text-gray-400 text-sm">No notifications</p>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className="text-white text-sm mb-2 p-2 bg-gray-700 rounded"
                  onClick={() => {
                    setIsNotificationOpen(false);
                    // Optionally navigate to chat or open popup
                  }}
                >
                  <p>{notification.content}</p>
                  <p className="text-gray-400 text-xs">
                    {format(
                      new Date(notification.timestamp),
                      "MMM d, yyyy HH:mm"
                    )}
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {isAuthenticated ? (
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
