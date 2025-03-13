"use client";

import UserProfile from "@/components/my-components/user-profile";
import { getUser } from "@/lib/api/user";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
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
    return <p>User not found. <Link href="/">Go back</Link></p>;
  }

  return (
    <div className="px-56 w-full h-screen overflow-hidden pt-[120px] font-clashDisplay">
      <UserProfile user={user} />
    </div>
  );
}
