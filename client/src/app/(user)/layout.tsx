"use client";

import UserNavbar from "@/components/core/my-user-navbar";
import { useAuthStore } from "@/stores";
import { useFriendStore } from "@/stores/useFriendStore";
import { usePathname, useRouter } from "next/navigation"; 
import { useEffect } from "react";
import { toast } from "sonner"; 

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuthStore();
  const { initializeSocket } = useFriendStore();
  const pathname = usePathname();
  const router = useRouter();
  const noNavbarPaths = ["/play/friend", "/play/online"];

  useEffect(() => {
    if (user?._id) {
      const socket = initializeSocket();
      if (socket) {
        socket.emit("join", user._id);

        socket.on("userBanned", (data) => {
          if (data.userId === user._id) {
            toast.error("You have been banned by an admin.");
            logout();
            router.push('/login');
          }
        });

        return () => {
          socket.off("userBanned");
        };
      }
    }
  }, [user?._id, initializeSocket, router]);

  return (
    <>
      {!noNavbarPaths.includes(pathname) && <UserNavbar />}
      {children}
    </>
  );
}