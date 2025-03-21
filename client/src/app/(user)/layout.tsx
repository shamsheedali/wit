"use client"

import UserNavbar from "@/components/my-components/my-user-navbar";
import { usePathname } from "next/navigation";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const noNavbarPaths = ["/play/friend"];
  return (
    <>
      {!noNavbarPaths.includes(pathname) && <UserNavbar />}
      {children}
    </>
  );
}
