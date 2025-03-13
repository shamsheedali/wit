"use client"

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCallback, useState } from "react";
import {debounce} from "lodash";
import { useQuery } from "@tanstack/react-query";
import { searchFriend } from "@/lib/api/user";
import { useRouter } from "next/navigation";
import useUser from "@/hooks/queryHooks/useUser";

export function FriendsTabs() {
  const {data: mainUser} = useUser();

  const router = useRouter();
  const [query, setQuery] = useState<string>("");

  const debouncedSetQuery = useCallback(debounce((val) => setQuery(val), 500), []);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['searchFriend', query],
    queryFn: () => searchFriend(query),
    enabled: !!query,
  });
  
  const filteredUsers = users?.filter((user) => user._id !== mainUser?._id) || [];

  const handleUserPage = (username: string) => {
    router.push(`/${username}`)
  }

  return (
    <Tabs defaultValue="friends" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="friends">Friends</TabsTrigger>
        <TabsTrigger value="find">Find</TabsTrigger>
        <TabsTrigger value="received">Received</TabsTrigger>
      </TabsList>
      <TabsContent value="friends">
        <Card>
          <CardHeader>
            <CardTitle>Friends</CardTitle>
            <CardDescription>Your friends list</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Friend 1 */}
            <div className="flex items-center space-x-4 p-3 rounded-lg transition-all duration-200 hover:bg-accent hover:scale-[1.02] group">
              <div className="relative">
                <img
                  src="/placeholder.svg?height=40&width=40"
                  alt="User avatar"
                  className="rounded-full w-10 h-10 object-cover"
                  width={40}
                  height={40}
                />
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Alex Johnson</p>
                <p className="text-xs text-muted-foreground flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                  Online
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-primary hover:text-primary-foreground"
              >
                View
              </Button>
            </div>

            {/* Friend 2 */}
            <div className="flex items-center space-x-4 p-3 rounded-lg transition-all duration-200 hover:bg-accent hover:scale-[1.02] group">
              <div className="relative">
                <img
                  src="/placeholder.svg?height=40&width=40"
                  alt="User avatar"
                  className="rounded-full w-10 h-10 object-cover"
                  width={40}
                  height={40}
                />
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Sam Taylor</p>
                <p className="text-xs text-muted-foreground flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                  Online
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-primary hover:text-primary-foreground"
              >
                View
              </Button>
            </div>

            {/* Friend 3 */}
            <div className="flex items-center space-x-4 p-3 rounded-lg transition-all duration-200 hover:bg-accent hover:scale-[1.02] group">
              <div className="relative">
                <img
                  src="/placeholder.svg?height=40&width=40"
                  alt="User avatar"
                  className="rounded-full w-10 h-10 object-cover"
                  width={40}
                  height={40}
                />
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-gray-400 rounded-full border-2 border-white"></span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Jamie Smith</p>
                <p className="text-xs text-muted-foreground flex items-center">
                  <span className="w-2 h-2 bg-gray-400 rounded-full mr-1"></span>
                  Offline
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-primary hover:text-primary-foreground"
              >
                View
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="find">
        <Card>
          <CardHeader>
            <CardTitle>Find</CardTitle>
            <CardDescription>Search for new friends</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Input placeholder="Search by username" className="flex-1" onChange={(e) => debouncedSetQuery(e.target.value)} />
              <Button>Search</Button>
            </div>

            {filteredUsers && filteredUsers.map((user: object) => (

              <div key={user._id} className="flex items-center space-x-4 p-3 rounded-lg transition-all duration-200 hover:bg-accent hover:scale-[1.02] group" 
              onClick={() => handleUserPage(user.username)}>
                <div className="relative">
                  <img
                    src="/placeholder.svg?height=40&width=40"
                    alt="User avatar"
                    className="rounded-full w-10 h-10 object-cover"
                    width={40}
                    height={40}
                  />
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{user.username}</p>
                  <p className="text-xs text-muted-foreground flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                    Online
                  </p>
                </div>
              </div>
            ))}
            
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="received">
        <Card>
          <CardHeader>
            <CardTitle>Received</CardTitle>
            <CardDescription>
              Friend requests you&apos;ve received
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 p-3 rounded-lg transition-all duration-200 hover:bg-accent hover:scale-[1.02] group">
              <div className="relative">
                <img
                  src="/placeholder.svg?height=40&width=40"
                  alt="User avatar"
                  className="rounded-full w-10 h-10 object-cover"
                  width={40}
                  height={40}
                />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Riley Cooper</p>
                <p className="text-xs text-muted-foreground flex items-center">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></span>
                  Pending
                </p>
              </div>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="transition-all duration-200 hover:bg-destructive hover:text-destructive-foreground"
                >
                  Ignore
                </Button>
                <Button size="sm" className="transition-all duration-200">
                  Accept
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
