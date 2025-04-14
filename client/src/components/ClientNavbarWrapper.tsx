"use client";

import { usePathname } from "next/navigation";
import UserNavbar from "@/components/core/my-user-navbar";

export default function ClientNavbarWrapper() {
  const pathname = usePathname();
  const noNavbarPaths = ["/play/friend", "/play/online"];

  return !noNavbarPaths.includes(pathname) ? <UserNavbar /> : null;
}
