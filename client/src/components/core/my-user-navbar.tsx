"use client";

import Link from "next/link";
import { UserAvatar } from "./user-avatar";
import { Bell, UsersRound, Menu, X } from "lucide-react";
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
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Image from "next/image";

export default function UserNavbar() {
  const { isAuthenticated, user } = useAuthStore();
  const { friendRequests } = useFriendStore();
  const { notifications } = useNotificationStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const navRef = useRef(null);
  const pathname = usePathname();

  const receivedRequests = friendRequests.filter(
    (req) => req.receiverId === user?._id && req.status === "pending"
  );

  useEffect(() => {
    gsap.fromTo(
      navRef.current,
      { y: -100, opacity: 0 },
      { y: 0, opacity: 1, delay: 0.2, ease: "power3.out" }
    );
  }, []);

  const navItems = [
    { href: "/", label: "Play" },
    { href: "/leaderboard", label: "Leaderboard" },
    { href: "/aboutus", label: "About Us" },
    { href: "/contact", label: "Contact Us" },
  ];

  return (
    <header
      ref={navRef}
      className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 py-4"
    >
      <nav className="mx-auto max-w-7xl flex items-center justify-between relative">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-3">
          {/* <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg bg-primary/10 flex items-center justify-center transition-transform hover:scale-105">
            <span className="font-serif text-2xl font-bold text-foreground">W</span>
          </div> */}
          <span className="font-serif text-4xl font-extrabold tracking-tight text-foreground">Wit.</span>
        </Link>

        {/* Center Nav */}
        <div className="hidden md:flex items-center gap-1 bg-secondary/80 backdrop-blur-md border border-border/50 rounded-full p-1 shadow-sm">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative px-5 py-2 text-sm font-medium transition-all rounded-full",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <span className="relative z-10">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Right Actions */}
        <div className="hidden md:flex items-center gap-2">
          {/* Clubs / Groups */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/clubs">
                  <div
                    className={cn(
                      "p-2.5 rounded-full bg-secondary/80 backdrop-blur-sm border border-border/50 transition-all hover:scale-105 active:scale-95 shadow-sm",
                      pathname === "/clubs" ? "text-accent bg-secondary" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <GrGroup className="w-5 h-5" />
                  </div>
                </Link>
              </TooltipTrigger>
              <TooltipContent><p>Clubs</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Friends */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/friends">
                  <div
                    className={cn(
                      "relative p-2.5 rounded-full bg-secondary/80 backdrop-blur-sm border border-border/50 transition-all hover:scale-105 active:scale-95 shadow-sm",
                      pathname === "/friends" ? "text-accent bg-secondary" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <UsersRound className="w-5 h-5" />
                    {receivedRequests.length > 0 && (
                      <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-background" />
                    )}
                  </div>
                </Link>
              </TooltipTrigger>
              <TooltipContent><p>Friends</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Notifications */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative">
                  <button
                    onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                    className={cn(
                      "relative p-2.5 rounded-full bg-secondary/80 backdrop-blur-sm border border-border/50 transition-all hover:scale-105 active:scale-95 shadow-sm",
                      isNotificationOpen ? "text-accent bg-secondary" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Bell className="w-5 h-5" />
                    {notifications.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 border-2 border-background">
                        {notifications.length}
                      </span>
                    )}
                  </button>
                </div>
              </TooltipTrigger>
              <TooltipContent><p>Notifications</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Notifications Dropdown */}
          {isNotificationOpen && (
            <div className="absolute top-16 right-16 bg-popover border border-border w-80 rounded-xl shadow-lg z-50 p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-foreground font-semibold">Notifications</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => useNotificationStore.getState().clearNotifications()}
                  className="text-muted-foreground hover:text-foreground h-8 text-xs"
                >
                  Clear all
                </Button>
              </div>
              <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {notifications.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">No new notifications</p>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification._id}
                      className="text-foreground text-sm p-3 bg-secondary/50 hover:bg-secondary rounded-lg transition-colors cursor-pointer"
                      onClick={() => setIsNotificationOpen(false)}
                    >
                      <p className="font-medium leading-tight mb-1">{notification.content}</p>
                      <p className="text-muted-foreground text-xs">
                        {format(new Date(notification.timestamp), "MMM d, yyyy HH:mm")}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* User / Login */}
          <div className="ml-2 pl-2 border-l border-border/50">
            {isAuthenticated ? (
              <UserAvatar />
            ) : (
              <Link href={"/login"}>
                <Button className="rounded-full font-semibold px-6 shadow-sm bg-accent text-accent-foreground hover:bg-accent/90">Sign In</Button>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden p-2 text-foreground"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-border p-4 shadow-lg flex flex-col gap-2 mt-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "p-3 rounded-lg font-medium transition-colors",
                pathname === item.href ? "bg-primary/10 text-primary" : "text-foreground hover:bg-secondary"
              )}
            >
              {item.label}
            </Link>
          ))}
          <div className="h-px bg-border my-2" />
          <Link href="/clubs" onClick={() => setIsOpen(false)} className="p-3 rounded-lg font-medium text-foreground hover:bg-secondary flex items-center gap-3">
            <GrGroup className="w-5 h-5" /> Clubs
          </Link>
          <Link href="/friends" onClick={() => setIsOpen(false)} className="p-3 rounded-lg font-medium text-foreground hover:bg-secondary flex items-center gap-3">
            <UsersRound className="w-5 h-5" /> Friends
          </Link>
          <div className="h-px bg-border my-2" />
          <div className="p-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <UserAvatar />
                <span className="font-medium text-foreground">{user?.username || "Profile"}</span>
              </div>
            ) : (
              <Link href="/login" onClick={() => setIsOpen(false)}>
                <Button className="w-full rounded-xl bg-accent text-accent-foreground hover:bg-accent/90">Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
