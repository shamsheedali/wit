"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore } from "@/stores";
import { useFriendStore } from "@/stores/useFriendStore";

export default function ClientSocketInitializer() {
  const { user, logout } = useAuthStore();
  const { initializeSocket } = useFriendStore();
  const router = useRouter();
  // const pathname = usePathname();

  useEffect(() => {
    if (user?._id) {
      const socket = initializeSocket();
      if (socket) {
        socket.emit("join", user._id);

        socket.on("userBanned", (data) => {
          if (data.userId === user._id) {
            toast.error("You have been banned by an admin.");
            logout();
            router.push("/login");
          }
        });

        return () => {
          socket.off("userBanned");
        };
      }
    }
  }, [user?._id, initializeSocket, router, logout]);


  return null;
}
