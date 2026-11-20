import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import {
  Calendar,
  Ellipsis,
  Handshake,
  HeartCrack,
  Pencil,
  Send,
  Sword,
  Swords,
  Users,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/stores";
import { useFriendStore } from "@/stores/useFriendStore";
import { User } from "@/types/auth";
import { format } from "date-fns";
import { toast } from "sonner";
import { removeFriend } from "@/lib/api/friend";
import { useRouter } from "next/navigation";
import ChatPopup from "@/components/core/ChatPopup";
import GameHistoryTable from "@/components/core/game-history-table";

const UserProfile = ({ user }: { user: User }) => {
  const router = useRouter();
  const { user: mainUser, updateUser } = useAuthStore();
  const { sendFriendRequest, friends, fetchFriends } = useFriendStore();
  const isCurrentUser = mainUser?._id === user?._id;
  const [isRequestSent, setIsRequestSent] = useState(false);
  const [reRender, setReRender] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    if (mainUser?._id) {
      fetchFriends();
    }
  }, [reRender, mainUser?._id, fetchFriends]);

  const dateToFormat = isCurrentUser ? mainUser?.createdAt : user?.createdAt;
  const formatDateStr = dateToFormat ? format(new Date(dateToFormat), "MMM d, yyyy") : "N/A";

  const isFriend = friends.some((friend) => friend?._id === user?._id);

  const handleAddFriend = async () => {
    try {
      if (!mainUser?._id) {
        toast.info("You must be logged in to send a friend request");
        return;
      }
      await sendFriendRequest(user._id);
      setReRender(true);
      setIsRequestSent(true);
    } catch (error) {
      console.error("Failed to send friend request:", error);
      toast.error("Failed to send friend request");
    }
  };

  const handleRemoveFriend = async () => {
    const response = await removeFriend(mainUser?._id as string, user._id);
    updateUser(response?.updatedUser);
    setReRender(true);
  };

  const handleChallenge = () => {
    router.push("/play/friend");
  };

  const displayedUser = isCurrentUser ? mainUser : user;
  
  const stats = [
    { icon: Calendar, label: "Joined", value: formatDateStr },
    { icon: Users, label: "Friends", value: displayedUser?.friends?.length || 0, href: `/${user.username}/friends` },
    { icon: Swords, label: "Games", value: displayedUser?.gamesPlayed || 0 },
    { icon: TrendingUp, label: "Rating", value: displayedUser?.rating || "1200" },
  ];

  return (
    <div className="w-full flex flex-col gap-12">
      {/* Profile Header */}
      <div className="relative">
        {/* Background Card */}
        <div className="absolute inset-0 bg-card rounded-3xl border border-border/50 shadow-sm" />
        
        {/* Content */}
        <div className="relative p-8 md:p-12">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Avatar */}
            <div className="relative animate-in zoom-in-95 duration-500">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-secondary overflow-hidden ring-4 ring-background shadow-xl">
                {displayedUser?.profileImageUrl ? (
                  <img src={displayedUser.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent/20 to-accent/5">
                    <span className="font-serif text-5xl md:text-6xl font-bold text-foreground/20 uppercase">
                      {displayedUser?.username?.[0] || "?"}
                    </span>
                  </div>
                )}
              </div>
              {/* Online indicator */}
              <div className="absolute bottom-2 right-2 w-5 h-5 bg-win rounded-full ring-4 ring-background animate-pulse" />
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left w-full">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className="font-serif text-3xl md:text-4xl font-bold">{displayedUser?.username}</h1>
                  {(displayedUser?.firstName || displayedUser?.lastName) && (
                    <p className="text-muted-foreground mt-1">
                      {displayedUser.firstName} {displayedUser.lastName}
                    </p>
                  )}
                  {displayedUser?.bio && (
                    <p className="text-sm text-muted-foreground mt-2 max-w-md">{displayedUser.bio}</p>
                  )}
                </div>

                <div className="flex flex-wrap justify-center md:justify-end gap-3">
                  {isCurrentUser ? (
                    <Link href="/settings/profile">
                      <Button variant="outline" className="rounded-full gap-2 hover:bg-accent hover:text-accent-foreground hover:border-accent transition-colors shadow-sm">
                        <Pencil className="w-3.5 h-3.5" />
                        Edit Profile
                      </Button>
                    </Link>
                  ) : (
                    <>
                      {isFriend ? (
                        <Button variant="destructive" className="rounded-full gap-2 shadow-sm" onClick={handleRemoveFriend}>
                          <HeartCrack className="w-4 h-4" />
                          Remove Friend
                        </Button>
                      ) : (
                        <Button variant="outline" className="rounded-full gap-2 shadow-sm" onClick={handleAddFriend} disabled={isRequestSent}>
                          <Handshake className="w-4 h-4" />
                          {isRequestSent ? "Request Sent" : "Add Friend"}
                        </Button>
                      )}
                      <Button variant="outline" className="rounded-full gap-2 shadow-sm hover:bg-accent hover:text-accent-foreground" onClick={handleChallenge}>
                        <Sword className="w-4 h-4" />
                        Challenge
                      </Button>
                      <Button variant="outline" className="rounded-full gap-2 shadow-sm" onClick={() => setIsChatOpen(true)}>
                        <Send className="w-4 h-4" />
                        Message
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in slide-in-from-bottom-4 duration-500 delay-150 fill-mode-both">
                {stats.map((stat, index) => (
                  <div key={stat.label} className="group">
                    {stat.href ? (
                      <Link href={stat.href}>
                        <div className="p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-all cursor-pointer hover:scale-[1.02] active:scale-95 shadow-sm h-full">
                          <stat.icon className="w-5 h-5 text-muted-foreground mb-2 group-hover:text-accent transition-colors" />
                          <p className="font-mono text-lg font-semibold">{stat.value}</p>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">{stat.label}</p>
                        </div>
                      </Link>
                    ) : (
                      <div className="p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors cursor-default shadow-sm h-full">
                        <stat.icon className="w-5 h-5 text-muted-foreground mb-2 group-hover:text-accent transition-colors" />
                        <p className="font-mono text-lg font-semibold">{stat.value}</p>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">{stat.label}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Popup */}
      {isChatOpen && mainUser?._id && (
        <ChatPopup
          userId={mainUser._id}
          otherUserId={user._id}
          otherUsername={user.username}
          onClose={() => setIsChatOpen(false)}
        />
      )}

      {/* Game History */}
      <div className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm animate-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-both">
        <div className="px-6 py-5 border-b border-border/50">
          <h2 className="font-serif text-xl font-semibold">Match History</h2>
          <p className="text-sm text-muted-foreground mt-1">Recent games and statistics</p>
        </div>
        <div className="p-0 sm:p-6 sm:pt-4 overflow-hidden">
          {/* We keep the original functional GameHistoryTable component intact here */}
          <GameHistoryTable user={user} />
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
