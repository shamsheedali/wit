"use client";

import { useEffect } from "react";
import { useFriendStore } from "@/stores/useFriendStore"; 

export default function ClientSocketInitializer() {
  const initializeSocket = useFriendStore((state) => state.initializeSocket);

  useEffect(() => {
    initializeSocket();
  }, [initializeSocket]);

  return null;
}
