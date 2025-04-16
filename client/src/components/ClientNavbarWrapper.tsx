"use client";

import { usePathname } from "next/navigation";
import UserNavbar from "@/components/core/my-user-navbar";

export default function ClientNavbarWrapper() {
  const pathname = usePathname();
  const noNavbarPaths = [
    "/login",
    "/signup/email",
    "signup/details",
    "/play/friend",
    "/play/online",
    /^\/tournaments\/[^\/]+\/play\/[^\/]+$/,
    /^\/dashboard(\/.*)?$/, // Matches /admin and any subroutes
    "/admin-login"
  ];

  const hideNavbar = noNavbarPaths.some((path) => {
    if (typeof path === "string") {
      return path === pathname;
    }
    return path.test(pathname);
  });

  return hideNavbar ? null : <UserNavbar />;
}
