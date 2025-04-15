"use client";

import { usePathname } from "next/navigation";
import UserNavbar from "@/components/core/my-user-navbar";

export default function ClientNavbarWrapper() {
  const pathname = usePathname();
  const noNavbarPaths = [
    "/play/friend",
    "/play/online",
    /^\/tournaments\/[^\/]+\/play\/[^\/]+$/,
  ];

  const hideNavbar = noNavbarPaths.some((path) => {
    if (typeof path === "string") {
      return path === pathname;
    }
    return path.test(pathname);
  });

  return hideNavbar ? null : <UserNavbar />;
}
