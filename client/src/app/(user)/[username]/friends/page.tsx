"use client";

import NotFoundPage from "@/app/not-found";
import { getUser, getUsers } from "@/lib/api/user";
import { User } from "@/types/auth";
import { useQuery } from "@tanstack/react-query";
import { UserRound } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function UserFriends() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  useEffect(() => {
    const fetchUserNames = async () => {
      try {
        const limit = 100;
        let page = 1;
        let allUsers: User[] = [];
        let hasMore = true;

        while (hasMore) {
          const response = await getUsers(page, limit);
          if (response && response.users && response.users.length > 0) {
            allUsers = [...allUsers, ...response.users];
            page += 1;
            hasMore = response.users.length === limit;
          } else {
            hasMore = false;
          }
        }
        const friendIds = user?.friends || [];

        const filteredUsers = allUsers
          .filter((u) => friendIds.includes(u._id))
          .sort((a, b) => b.eloRating - a.eloRating);
        setUsers(filteredUsers);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
    };

    fetchUserNames();
  }, []);
  
  const params = useParams();
  const pathUsername = params.username as string;

  const {
    data: user,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["otherUsers", pathUsername],
    queryFn: () => getUser(pathUsername),
    enabled: !!pathUsername, // Only fetch when username exists
  });

  if (isLoading) return <p>Loading...</p>;

  if (isError || !user) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <NotFoundPage />
      </div>
    );
  }

  const handleUserPage = (username: string) => {
    router.push(`/${username}`);
  };

  return (
    <div className="lg:px-56 w-full h-screen overflow-hidden pt-[120px] font-clashDisplay">
      <h1 className="text-2xl mb-3 font-bold">{pathUsername}</h1>
      <h3 className="text-md mb-3 font-bold">Friends</h3>

      <div>
        {users &&
          users.map((user) => (
            <div
              key={user._id}
              className="flex items-center space-x-4 p-3 cursor-pointer rounded-lg transition-all duration-200 hover:bg-accent hover:scale-[1.02] group"
              onClick={() => handleUserPage(user.username)}
            >
              <div className="relative">
                {user.profileImageUrl ? (
                  <img
                    src={
                      user.profileImageUrl ||
                      "/placeholder.svg?height=40&width=40"
                    }
                    alt="User avatar"
                    className="rounded-full w-10 h-10 object-cover"
                    width={40}
                    height={40}
                  />
                ) : (
                  <UserRound />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{user.username}</p>
              </div>
              <p className="text-sm font-medium">{user.eloRating}</p>
            </div>
          ))}
      </div>
    </div>
  );
}
