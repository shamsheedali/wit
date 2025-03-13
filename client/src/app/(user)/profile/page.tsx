"use client"

import UserProfile from "@/components/my-components/user-profile";
import useUser from "@/hooks/queryHooks/useUser";

export default function UserProfilePage() {
  const {data: user} = useUser();
  return (
    <div className="px-56 w-full h-screen overflow-hidden pt-[120px] font-clashDisplay">
      <UserProfile user={user} />
    </div>
  );
}
