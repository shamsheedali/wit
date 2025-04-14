"use client";

import { getUsers } from "@/lib/api/user";
import { User } from "@/types/auth";
import { UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Leaderboard() {
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
        const filteredUsers = allUsers.sort(
          (a, b) => b.eloRating - a.eloRating
        );
        setUsers(filteredUsers);
        console.log(allUsers);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
    };

    fetchUserNames();
  }, []);

  const handleUserPage = (username: string) => {
    router.push(`/${username}`);
  };

  return (
    <div className="lg:px-56 w-full h-screen overflow-hidden pt-[120px] font-clashDisplay">
      <h1 className="text-xl mb-3 font-bold">Leaderboard</h1>

      <div>
        {users &&
          users.map((user) => (
            <div
              key={user._id}
              className="flex items-center space-x-4 p-3 rounded-lg transition-all duration-200 hover:bg-accent hover:scale-[1.02] group"
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
