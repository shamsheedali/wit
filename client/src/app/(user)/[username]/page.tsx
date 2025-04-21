"use client";

import NotFoundPage from "@/app/not-found";
import UserProfile from "@/components/core/user-profile";
import { getUser } from "@/lib/api/user";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";

export default function ProfilePage() {
  const params = useParams();
  const username = params?.username as string;

  const { data: user, isLoading, isError } = useQuery({
    queryKey: ["otherUsers", username],
    queryFn: () => getUser(username),
    enabled: !!username, // Only fetch when username exists
  });

  if (isLoading) return <p>Loading...</p>;

  if (isError || !user) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <NotFoundPage />
      </div>
    )
  }

  return (
    <div className="px-56 w-full h-screen pt-[120px] font-clashDisplay">
      <UserProfile user={user} />
    </div>
  );
}
