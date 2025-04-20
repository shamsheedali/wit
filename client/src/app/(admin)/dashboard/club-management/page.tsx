"use client";

import { DataTable } from "@/components/data-table";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { getClubs, createAdminClub, addClubMessage } from "@/lib/api/club";
import { clubColumns } from "./club-columns"; // Updated import
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores";
import { getSocket } from "@/lib/socket";
import { cn } from "@/lib/utils";

const LIMIT = 7;

export type ClubData = {
  _id: string;
  name: string;
  clubType: "public" | "private";
  admins: { _id: string; username: string }[];
  members: { _id: string; username: string }[];
  createdBy: "user" | "admin";
  messages?: { senderId: string; content: string; timestamp: number }[];
};

type Message = {
  id: string;
  senderId: string;
  content: string;
  timestamp: number;
};

export default function ClubManagementPage() {
  const [page, setPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [clubName, setClubName] = useState("");
  const [description, setDescription] = useState("");
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedClub, setSelectedClub] = useState<ClubData | null>(null);
  const [isChatDialogOpen, setIsChatDialogOpen] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const queryClient = useQueryClient();
  const { admin } = useAuthStore();
  const socket = getSocket();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["clubs", page],
    queryFn: () => getClubs(page, LIMIT),
    keepPreviousData: true,
  });

  // Initialize socket and load messages for selected club
  useEffect(() => {
    if (!socket || !admin?._id) return;

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
      console.error("Club chat error:", data.message);
      toast.error(data.message);
    });

    return () => {
      socket.off("clubMessageReceived");
      socket.off("clubChatError");
    };
  }, [socket, admin?._id]);

  // Load messages when chat dialog opens
  useEffect(() => {
    if (isChatDialogOpen && selectedClub?.messages) {
      const loadedMessages: Message[] = selectedClub.messages.map((msg) => ({
        id: `${msg.timestamp}-${msg.senderId}`,
        senderId: msg.senderId,
        content: msg.content,
        timestamp: msg.timestamp,
      }));
      setMessages(loadedMessages);
    } else if (!isChatDialogOpen) {
      setMessages([]);
      setNewMessage("");
    }
  }, [isChatDialogOpen, selectedClub?.messages]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Join club chat when opening chat dialog
  useEffect(() => {
    if (isChatDialogOpen && selectedClub?.name && admin?._id) {
      socket.emit("joinClubChat", {
        clubName: selectedClub.name,
        userId: admin._id,
      });
    }
  }, [isChatDialogOpen, selectedClub?.name, admin?._id, socket]);

  const handleCreateClub = async () => {
    if (!admin?._id) {
      toast.error("Please log in to create a club");
      return;
    }
    try {
      const response = await createAdminClub({
        name: clubName,
        description,
        userId: admin._id,
      });
      if (response?.success) {
        toast.success("Club created successfully");
        setIsCreateDialogOpen(false);
        setClubName("");
        setDescription("");
        await queryClient.invalidateQueries({ queryKey: ["clubs"] });
      } else {
        toast.error("Failed to create club");
      }
    } catch (error) {
      toast.error("Error creating club");
      console.error(error);
    }
  };

  const handleViewDetails = (club: ClubData) => {
    setSelectedClub(club);
    setIsDetailsDialogOpen(true);
  };

  // Send message to club (persist in DB and emit via socket)
  const sendClubMessage = async (clubId: string, message: string) => {
    if (!admin?._id || !selectedClub?.name) {
      toast.error("Authentication or club details missing");
      return { success: false };
    }

    try {
      // Persist message in backend
      const response = await addClubMessage(clubId, admin._id, message);
      if (!response?.success) {
        toast.error("Failed to save message");
        return { success: false };
      }

      // Emit message via socket
      socket.emit("sendClubMessage", {
        clubName: selectedClub.name,
        userId: admin._id,
        message,
      });

      toast.success("Message sent successfully");
      return { success: true };
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error(error.response?.data?.message || "Failed to send message");
      return { success: false };
    }
  };

  const handleSendMessage = async () => {
    if (!selectedClub?._id || !newMessage.trim()) {
      toast.error("Club ID and message are required");
      return;
    }
    const response = await sendClubMessage(selectedClub._id, newMessage);
    if (response?.success) {
      setNewMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) return <div>Loading clubs...</div>;
  if (isError) return <div>Error loading clubs</div>;

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1>All Clubs</h1>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex justify-end">
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            Create Club
          </Button>
        </div>
        <DataTable
          columns={clubColumns(queryClient, handleViewDetails)}
          data={data?.clubs || []}
        />

        {/* Pagination Controls */}
        <div className="flex justify-end mt-4 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1}
          >
            Previous
          </Button>

          <span className="flex items-center px-4">
            Page {page} of {data?.totalPages || 1}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((prev) => prev + 1)}
            disabled={page >= (data?.totalPages || 1)}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Create Club Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="bg-[#262522] text-white">
          <DialogHeader>
            <DialogTitle>Create Public Club</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-sm">
                Club Name
              </Label>
              <Input
                id="name"
                value={clubName}
                onChange={(e) => setClubName(e.target.value)}
                placeholder="Enter club name"
                className="bg-gray-800 text-white border-gray-700 mt-2"
              />
            </div>
            <div>
              <Label htmlFor="description" className="text-sm">
                Description (Optional)
              </Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter club description"
                className="bg-gray-800 text-white border-gray-700 mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              className="bg-gray-700 text-white hover:bg-gray-600"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateClub}
              className="bg-green-600 hover:bg-green-700"
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog
        open={isDetailsDialogOpen}
        onOpenChange={(open) => {
          setIsDetailsDialogOpen(open);
          if (!open) setSelectedClub(null); // Clear selected club when closing
        }}
      >
        <DialogContent className="bg-[#262522] text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Club Members - {selectedClub?.name || "Club"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedClub?.members.length > 0 ? (
              <ul className="space-y-2">
                {selectedClub.members.map((member) => (
                  <li
                    key={member._id}
                    className="flex justify-between border-b border-gray-700 py-2"
                  >
                    <span>{member.username}</span>
                    <span className="text-gray-400">{member._id}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400">No members in this club.</p>
            )}
          </div>
          <DialogFooter>
            {selectedClub?.createdBy === "admin" && (
              <Button
                onClick={() => setIsChatDialogOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Send Message
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setIsDetailsDialogOpen(false)}
              className="bg-gray-700 text-white hover:bg-gray-600"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Chat Interface Dialog */}
      <Dialog
        open={isChatDialogOpen}
        onOpenChange={(open) => {
          setIsChatDialogOpen(open);
          if (!open) setNewMessage(""); // Clear message when closing
        }}
      >
        <DialogContent className="bg-[#262522] text-white max-w-lg sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Chat - {selectedClub?.name}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[400px] p-4 bg-gray-900 rounded-lg">
            <div className="space-y-4">
              {messages.length > 0 ? (
                messages.map((message) => {
                  const isAdminMessage = message.senderId === admin?._id;
                  return (
                    <div
                      key={message.id}
                      className={cn(
                        "flex items-start gap-3 max-w-[80%]",
                        isAdminMessage
                          ? "ml-auto flex-row-reverse"
                          : "mr-auto flex-row"
                      )}
                    >
                      <div
                        className={cn(
                          "rounded-lg p-3",
                          isAdminMessage
                            ? "bg-blue-600 text-white"
                            : "bg-gray-800 text-white"
                        )}
                      >
                        {!isAdminMessage && (
                          <p className="text-xs font-medium mb-1">
                            {selectedClub?.members.find(
                              (m) => m._id === message.senderId
                            )?.username || "Unknown"}
                          </p>
                        )}
                        <p>{message.content}</p>
                        <p
                          className={cn(
                            "text-xs mt-1 text-right",
                            isAdminMessage ? "text-blue-200" : "text-gray-400"
                          )}
                        >
                          {formatTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-400 text-center">
                  No messages in this club yet.
                </p>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          <div className="p-4 border-t border-gray-700">
            <div className="flex items-center gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className="flex-1 bg-gray-800 text-white border-gray-700"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                size="icon"
                className="bg-green-600 hover:bg-green-700"
              >
                <Send className="h-5 w-5" />
                <span className="sr-only">Send message</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
