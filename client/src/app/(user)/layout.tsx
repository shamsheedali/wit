"use client";

import UserNavbar from "@/components/my-components/my-user-navbar";
import { useAuthStore } from "@/stores";
import { useFriendStore } from "@/stores/useFriendStore";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { initSocket } from "@/lib/socket"; // Import initSocket directly

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuthStore();
  const { initializeSocket } = useFriendStore();
  const pathname = usePathname();
  const noNavbarPaths = ["/play/friend"];

  useEffect(() => {
    if (user?._id) {
      const socket = initializeSocket();
      if (socket) {
        socket.emit("join", user._id); 
      }
    }
  }, [user?._id, initializeSocket]);

  return (
    <>
      {!noNavbarPaths.includes(pathname) && <UserNavbar />}
      {children}
    </>
  );
}