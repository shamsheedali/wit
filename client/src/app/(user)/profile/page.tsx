"use client";

import UserProfile from "@/components/core/user-profile";
import { useAuthStore } from "@/stores";

export default function UserProfilePage() {
  const { user } = useAuthStore();
  return (
    <div className="lg:px-56 w-full h-screen pt-[120px] font-clashDisplay">
      <UserProfile user={user} />
    </div>
  );
}
