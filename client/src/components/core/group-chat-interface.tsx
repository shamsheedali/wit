"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  getUserClubs,
  leaveClub,
  addClubMessage,
  deleteClub,
  updateClub,
} from "@/lib/api/club";
import { useAuthStore } from "@/stores";
import { getSocket } from "@/lib/socket";
import { useRouter, useParams } from "next/navigation";
import { getUsers, searchFriend } from "@/lib/api/user";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { debounce } from "lodash";

type Message = {
  id: string;
  senderId: string;
  content: string;
  timestamp: number;
};

type ClubMember = {
  _id: string;
  username: string;
  profileImageUrl?: string;
  isOnline?: boolean;
};

interface User {
  _id: string;
  username: string;
  profileImageUrl?: string;
}

interface Club {
  _id: string;
  name: string;
  description?: string;
  clubType: "public" | "private";
  admins: string[];
  members?: string[];
  maxMembers?: number;
  messages?: { senderId: string; content: string; timestamp: number }[];
}

export default function ClubChat() {
  const { user: mainUser, admin } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [playerNames, setPlayerNames] = useState<{ [key: string]: string }>({});
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socket = getSocket();
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const clubName = params.clubname as string;

  // Fetch user's clubs
  const { data: userClubs = [], isLoading: userClubsLoading } = useQuery({
    queryKey: ["userClubs", mainUser?._id],
    queryFn: () => getUserClubs(mainUser!._id),
    enabled: !!mainUser?._id,
  });

  // Fetch all users to get usernames
  const { data: allUsers = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["allUsers"],
    queryFn: async () => {
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
      return allUsers;
    },
    enabled: !!mainUser?._id,
  });

  useEffect(() => {
    if (allUsers.length > 0) {
      const namesMap: { [key: string]: string } = {};
      allUsers.forEach((user) => {
        namesMap[user._id] = user.username;
      });
      setPlayerNames(namesMap);
    }
  }, [allUsers]);

  const club = userClubs.find((c) => c.name === clubName);
  const isAdmin = club?.admins?.some((id) => id.toString() === mainUser?._id);
  const members: ClubMember[] =
    club?.members?.map((id) => {
      const userId = id.toString();
      return {
        _id: userId,
        username: playerNames[userId] || userId,
        profileImageUrl: allUsers.find((u) => u._id === userId)
          ?.profileImageUrl,
        isOnline: false,
      };
    }) || [];

  // Load persisted messages
  useEffect(() => {
    if (club?.messages) {
      const loadedMessages: Message[] = club.messages.map((msg) => ({
        id: `${msg.timestamp}-${msg.senderId}`,
        senderId: msg.senderId.toString(),
        content: msg.content,
        timestamp: msg.timestamp,
      }));
      setMessages(loadedMessages);
    }
  }, [club?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!socket || !clubName || !mainUser?._id) return;

    socket.emit("joinClubChat", { clubName, userId: mainUser._id });

    socket.on(
      "clubMessageReceived",
      (data: { senderId: string; content: string; timestamp: number }) => {
        const newMsg: Message = {
          id: `${data.timestamp}-${data.senderId}`,
          senderId: data.senderId,
          content: data.content,
          timestamp: data.timestamp,
        };
        setMessages((prev) => {
          if (prev.some((msg) => msg.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      }
    );

    socket.on("clubChatError", (data: { message: string }) => {
      console.error(data.message);
      router.push("/clubs");
    });

    socket.on("clubDeleted", () => {
      toast.error("This club has been deleted");
      queryClient.invalidateQueries({ queryKey: ["userClubs", mainUser?._id] });
      router.push("/clubs");
    });

    return () => {
      socket.off("clubMessageReceived");
      socket.off("clubChatError");
      socket.off("clubDeleted");
    };
  }, [socket, clubName, mainUser?._id, router, queryClient]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (
      !newMessage.trim() ||
      !socket ||
      !clubName ||
      !mainUser?._id ||
      !club?._id
    )
      return;

    // Persist message in backend
    await addClubMessage(club._id, mainUser._id, newMessage);

    // Emit via socket
    socket.emit("sendClubMessage", {
      clubName,
      userId: mainUser._id,
      message: newMessage,
    });
    setNewMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleLeaveClub = async () => {
    if (!club?._id || !mainUser?._id) return;

    try {
      const response = await leaveClub(club._id, mainUser._id);
      if (response?.success) {
        await queryClient.invalidateQueries({
          queryKey: ["userClubs", mainUser._id],
        });
        router.push("/clubs");
      }
    } catch (error) {
      console.error("Failed to leave club:", error);
    }
  };

  const handleDeleteClub = async () => {
    if (!club?._id || !mainUser?._id || !clubName) return;

    try {
      const response = await deleteClub(club._id, mainUser._id);
      if (response?.success) {
        // Emit clubDeleted event to notify other members
        socket.emit("clubDeleted", { clubName });
        await queryClient.invalidateQueries({
          queryKey: ["userClubs", mainUser._id],
        });
        router.push("/clubs");
      }
    } catch (error) {
      console.error("Failed to delete club:", error);
      toast.error(error.response?.data?.message || "Failed to delete club");
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // EditClubDialog Component
  function EditClubDialog({
    open,
    onOpenChange,
    club,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    club: Club;
  }) {
    const [formData, setFormData] = useState({
      name: club.name,
      description: club.description || "",
      maxMembers: club.maxMembers?.toString() || "",
    });
    const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [maxMembersError, setMaxMembersError] = useState<string | null>(null);
    const [nameError, setNameError] = useState<string | null>(null);

    // Debounced search for users
    const debouncedSetQuery = useCallback(
      debounce((val: string) => setSearchQuery(val), 500),
      []
    );

    const { data: searchResults = [] } = useQuery({
      queryKey: ["searchFriend", searchQuery],
      queryFn: () => searchFriend(searchQuery),
      enabled: !!searchQuery,
    });

    const filteredSearchResults = searchResults.filter(
      (user: User) =>
        !selectedUsers.some((u) => u._id === user._id) &&
        user._id !== mainUser?._id &&
        !club.members?.includes(user._id)
    );

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      debouncedSetQuery(e.target.value);
    };

    const addUser = (user: User) => {
      if (club.members?.includes(user._id)) {
        toast.error(`${user.username} is already a member of the club`);
        return;
      }
      setSelectedUsers([...selectedUsers, user]);
      setSearchQuery("");
      validateMaxMembers([...selectedUsers, user]);
    };

    const removeUser = (userId: string) => {
      const updatedUsers = selectedUsers.filter((user) => user._id !== userId);
      setSelectedUsers(updatedUsers);
      validateMaxMembers(updatedUsers);
    };

    const handleChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
      const { name, value } = e.target;
      if (name === "name") {
        // Validate no spaces in club name
        if (/\s/.test(value)) {
          setNameError("Club name cannot contain spaces");
        } else {
          setNameError(null);
        }
      }
      setFormData((prev) => ({ ...prev, [name]: value }));
      if (name === "maxMembers") {
        validateMaxMembers(selectedUsers, value);
      }
    };

    // Validate max members
    const validateMaxMembers = (
      users: User[],
      maxMembersValue = formData.maxMembers
    ) => {
      const maxLimit = club.clubType === "public" ? 100 : 50;
      const max = maxMembersValue ? parseInt(maxMembersValue, 10) : maxLimit;
      const totalMembers = (club.members?.length || 0) + users.length; // Existing + new members

      if (max > maxLimit) {
        setMaxMembersError(
          `Maximum members cannot exceed ${maxLimit} for ${club.clubType} clubs.`
        );
      } else if (maxMembersValue && !isNaN(max) && totalMembers > max) {
        setMaxMembersError(
          `Total members (${totalMembers}) exceed the maximum limit (${max}).`
        );
      } else {
        setMaxMembersError(null);
      }
    };

    const updateClubMutation = useMutation({
      mutationFn: () =>
        updateClub({
          clubId: club._id,
          userId: mainUser!._id,
          name: formData.name,
          description: formData.description || undefined,
          maxMembers: formData.maxMembers
            ? parseInt(formData.maxMembers)
            : undefined,
          memberIds: selectedUsers.map((user) => user._id),
        }),
      onSuccess: (response) => {
        if (response?.success) {
          // Update userClubs cache
          queryClient.setQueryData(
            ["userClubs", mainUser?._id],
            (oldData: Club[] | undefined) => {
              if (!oldData) return oldData;
              return oldData.map((c) =>
                c._id === club._id
                  ? {
                      ...c,
                      name: formData.name,
                      description: formData.description || undefined,
                      maxMembers: formData.maxMembers
                        ? parseInt(formData.maxMembers)
                        : club.maxMembers,
                      members: [
                        ...(c.members || []),
                        ...selectedUsers.map((user) => user._id),
                      ],
                    }
                  : c
              );
            }
          );

          // Invalidate queries
          queryClient.invalidateQueries({ queryKey: ["userClubs"] });
          queryClient.invalidateQueries({ queryKey: ["publicClubs"] });

          // If club name changed, update the URL
          if (formData.name !== club.name) {
            router.push(`/clubs/${encodeURIComponent(formData.name)}`);
          }

          // Close dialog and reset
          onOpenChange(false);
          setFormData({
            name: club.name,
            description: club.description || "",
            maxMembers: club.maxMembers?.toString() || "",
          });
          setSelectedUsers([]);
          setMaxMembersError(null);
          setNameError(null);
        }
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || "Failed to update club");
        console.error(error);
      },
    });

    const handleSubmit = () => {
      if (!formData.name || !mainUser?._id) {
        toast.error("Club name and authentication are required");
        return;
      }
      if (nameError) {
        toast.error(nameError);
        return;
      }
      if (maxMembersError) {
        toast.error(maxMembersError);
        return;
      }
      updateClubMutation.mutate();
    };

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Club</DialogTitle>
            <DialogDescription>
              Modify the details of {club.name}. Add members and update
              settings.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="clubName" className="text-right">
                Club Name
              </Label>
              <div className="col-span-3 space-y-1">
                <Input
                  id="clubName"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter club name"
                  className="w-full"
                />
                {nameError && (
                  <p className="text-sm text-red-500">{nameError}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your club"
                className="col-span-3 min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="maxMembers" className="text-right">
                Max Members
              </Label>
              <div className="col-span-3 space-y-1">
                <Input
                  id="maxMembers"
                  name="maxMembers"
                  type="number"
                  min="1"
                  max={club.clubType === "public" ? 100 : 50}
                  value={formData.maxMembers}
                  onChange={handleChange}
                  placeholder={`Max ${
                    club.clubType === "public" ? 100 : 50
                  } members`}
                  className="w-full"
                />
                {maxMembersError && (
                  <p className="text-sm text-red-500">{maxMembersError}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="members" className="text-right pt-2">
                Add Members
              </Label>
              <div className="col-span-3 space-y-2">
                <div className="relative">
                  <Input
                    id="members"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                  />
                  {filteredSearchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                      {filteredSearchResults.map((user) => (
                        <div
                          key={user._id}
                          className="p-2 hover:bg-muted cursor-pointer"
                          onClick={() => addUser(user)}
                        >
                          {user.username}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {selectedUsers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedUsers.map((user) => (
                      <div
                        key={user._id}
                        className="flex items-center gap-1 bg-muted px-2 py-1 rounded-full text-sm"
                      >
                        {user.username}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 rounded-full"
                          onClick={() => removeUser(user._id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleSubmit}
              disabled={
                updateClubMutation.isPending || !!maxMembersError || !!nameError
              }
            >
              {updateClubMutation.isPending ? "Updating..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (usersLoading || userClubsLoading) return <div>Loading...</div>;
  if (!clubName) return <div>No club name provided</div>;
  if (!club) return <div>Club not found or you’re not a member</div>;

  return (
    <div className="flex h-[89vh] max-h-screen w-full">
      {/* Confirmation Dialogs */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to leave?</AlertDialogTitle>
            <AlertDialogDescription>
              You will no longer be a member of {club.name} and will lose access
              to this chat.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLeaveClub}>
              Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to delete this club?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {club.name} and all its data,
              including messages and memberships. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClub}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EditClubDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        club={club}
      />

      {/* Left sidebar - Member list */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-[#09090b] hidden md:block">
        <div className="p-[26px] border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold">{club.name} Members</h2>
        </div>
        <ScrollArea className="">
          <div className="p-2">
            {members.map((member) => (
              <div
                key={member._id}
                onClick={() => router.push(`/${member.username}`)}
                className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <div className="relative">
                  <Avatar>
                    <AvatarImage
                      src={member.profileImageUrl || "/placeholder.svg"}
                      alt={member.username}
                    />
                    <AvatarFallback>{member.username[0]}</AvatarFallback>
                  </Avatar>
                  {member.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-950 rounded-full"></span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {member._id === admin?._id
                      ? "Wit Official"
                      : member._id === mainUser?._id
                      ? "You"
                      : member.username}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {member._id === mainUser?._id
                      ? "Online"
                      : member.isOnline
                      ? "Online"
                      : "Offline"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Right side - Chat area */}
      <div className="flex-1 flex flex-col">
        <div className="flex justify-between items-center p-4 pr-12 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#09090b]">
          <div>
            <h2 className="text-xl font-bold">{club.name}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {members.length} members
            </p>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <Button variant="success" onClick={() => setShowEditDialog(true)}>
                Edit Club
              </Button>
            )}
            <Button
              variant="destructive"
              onClick={() => setShowLeaveDialog(true)}
            >
              Exit Club
            </Button>
            {isAdmin && (
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                Delete Club
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1 p-4 bg-gray-50 dark:bg-gray-900">
          <div className="space-y-4">
            {messages.map((message) => {
              const sender = members.find((m) => m._id === message.senderId);
              const isCurrentUser = message.senderId === mainUser?._id;

              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex items-start gap-3 max-w-[80%]",
                    isCurrentUser
                      ? "ml-auto flex-row-reverse"
                      : "mr-auto flex-row"
                  )}
                >
                  {!isCurrentUser && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={sender?.profileImageUrl || "/placeholder.svg"}
                        alt={sender?.username || ""}
                      />
                      <AvatarFallback>
                        {sender?.username[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      "rounded-lg p-3",
                      isCurrentUser
                        ? "bg-primary text-primary-foreground"
                        : "bg-gray-200 dark:bg-gray-800"
                    )}
                  >
                    {!isCurrentUser && (
                      <p className="text-xs font-medium mb-1">
                        {sender?._id === admin?._id
                          ? "Wit Official"
                          : sender?.username || "Unknown"}
                      </p>
                    )}
                    <p>{message.content}</p>
                    <p
                      className={cn(
                        "text-xs mt-1 text-right",
                        isCurrentUser
                          ? "text-primary-foreground/80"
                          : "text-gray-500 dark:text-gray-400"
                      )}
                    >
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#09090b]">
          <div className="flex items-center gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              size="icon"
            >
              <Send className="h-5 w-5" />
              <span className="sr-only">Send message</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
