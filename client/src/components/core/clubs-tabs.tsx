"use client";

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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPublicClubs, joinClub, getUserClubs } from "@/lib/api/club";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores";
import { CirclePlus } from "lucide-react";
import { CreateClubDialog } from "../create-club-dialog";
import { useState, useCallback } from "react";
import { debounce } from "lodash";

interface IClub {
  _id: string;
  name: string;
  description?: string;
  clubType: "public" | "private";
  admins: string[];
  members?: string[];
}

export function ClubsTabs() {
  const { user: mainUser } = useAuthStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const router = useRouter();
  const queryClient = useQueryClient();

  // Debounced search for public clubs
  const debouncedSetQuery = useCallback(
    debounce((val) => setSearchQuery(val), 500),
    []
  );

  // Fetch user's clubs (public and private)
  const { data: userClubs = [], isLoading: userClubsLoading } = useQuery({
    queryKey: ["userClubs", mainUser?._id],
    queryFn: () => getUserClubs(mainUser!._id),
    enabled: !!mainUser?._id,
  });

  // Fetch public clubs with search query
  const { data: publicClubs = [], isLoading: publicClubsLoading } = useQuery({
    queryKey: ["publicClubs", searchQuery],
    queryFn: () => getPublicClubs(searchQuery),
  });

  // Mutation to join a club
  const joinClubMutation = useMutation({
    mutationFn: ({ clubId, userId }: { clubId: string; userId: string }) =>
      joinClub(clubId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["publicClubs"] });
      queryClient.invalidateQueries({ queryKey: ["userClubs"] }); // Refresh user's clubs
    },
  });

  const handleJoinClub = (clubId: string) => {
    if (!mainUser?._id) {
      router.push("/login");
      return;
    }
    joinClubMutation.mutate({ clubId, userId: mainUser._id });
  };

  const handlePageChange = (clubName: string) => {
    router.push(`/clubs/${clubName}`)
  }

  return (
    <Tabs defaultValue="clubs" className="w-full flex flex-col items-end">
      {mainUser?._id && (
        <Button className="mb-3" onClick={() => setDialogOpen(true)}>
          <CirclePlus />
          Create Club
        </Button>
      )}
      <CreateClubDialog open={dialogOpen} onOpenChange={setDialogOpen} />

      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="clubs">Your Clubs</TabsTrigger>
        <TabsTrigger value="publicClubs">Public Clubs</TabsTrigger>
      </TabsList>

      <TabsContent value="clubs" className="w-full">
        <Card>
          <CardHeader>
            <CardTitle>Your Clubs</CardTitle>
            <CardDescription>Your clubs list</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {userClubsLoading ? (
              <p>Loading your clubs...</p>
            ) : userClubs.length === 0 ? (
              <p>No clubs yet</p>
            ) : (
              userClubs.map((club: IClub) => (
                <div
                  key={club._id}
                  className="flex items-center space-x-4 p-3 rounded-lg transition-all duration-200 hover:bg-accent hover:scale-[1.02] group"
                >
                  <div className="relative">
                    <img
                      src="/placeholder.svg?height=40&width=40"
                      alt="Club avatar"
                      className="rounded-full w-10 h-10 object-cover"
                      width={40}
                      height={40}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{club.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {club.clubType} • Members:{" "}
                      {club.members?.length || "No members"}
                    </p>
                  </div>
                  <Button
                    onClick={() => handlePageChange(club.name)}
                    size="sm"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-primary hover:text-primary-foreground"
                  >
                    View
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="publicClubs" className="w-full">
        <Card>
          <CardHeader>
            <CardTitle>Welcome to Chess-Clubs!</CardTitle>
            <CardDescription>Explore and join public clubs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Search public clubs"
                className="flex-1"
                onChange={(e) => debouncedSetQuery(e.target.value)}
              />
              <Button>Search</Button>
            </div>
            {publicClubsLoading ? (
              <p>Loading public clubs...</p>
            ) : publicClubs.length === 0 ? (
              <p>No public clubs available</p>
            ) : (
              publicClubs.map((club: IClub) => {
                const isMember = club.members?.includes(mainUser?._id || "");
                return (
                  <div
                    key={club._id}
                    className="flex items-center space-x-4 p-3 rounded-lg transition-all duration-200 hover:bg-accent hover:scale-[1.02] group"
                  >
                    <div className="relative">
                      <img
                        src="/placeholder.svg?height=40&width=40"
                        alt="Club avatar"
                        className="rounded-full w-10 h-10 object-cover"
                        width={40}
                        height={40}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{club.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Total Members: {club.members?.length || "No members"}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="default"
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-primary hover:text-primary-foreground"
                      onClick={() => handleJoinClub(club._id)}
                      disabled={joinClubMutation.isPending || isMember}
                    >
                      {isMember
                        ? "Joined"
                        : joinClubMutation.isPending
                        ? "Joining..."
                        : "Join"}
                    </Button>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
