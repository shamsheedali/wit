import { useEffect, useState, useRef } from "react";
import { X } from "lucide-react";
import { useAuthStore } from "@/stores";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMessages, sendMessage } from "@/lib/api/message";
import { getSocket } from "@/lib/socket";
import { format } from "date-fns";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

interface ChatPopupProps {
  userId: string;
  otherUserId: string;
  otherUsername: string;
  onClose: () => void;
}

interface Message {
  _id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
}

export default function ChatPopup({
  userId,
  otherUserId,
  otherUsername,
  onClose,
}: ChatPopupProps) {
  const { user } = useAuthStore();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery({
    queryKey: ["messages", userId, otherUserId],
    queryFn: () => getMessages(otherUserId),
    enabled: !!userId && !!otherUserId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: sendMessage,
    onSuccess: (response) => {
      const newMessage = response?.data;
      queryClient.setQueryData(
        ["messages", userId, otherUserId],
        (old: Message[] | undefined) => {
          if (old?.some((msg) => msg._id === newMessage._id)) {
            return old; // Prevent duplicate
          }
          return old ? [...old, newMessage] : [newMessage];
        }
      );
      const socket = getSocket();
      if (socket && user?._id) {
        socket.emit("sendMessage", {
          senderId: user._id,
          senderName: user.username,
          receiverId: otherUserId,
          content: message,
          _id: newMessage._id,
          timestamp: newMessage.timestamp,
        });
      }
      setMessage("");
    },
  });

  useEffect(() => {
    const socket = getSocket();
    if (socket) {
      socket.on("messageReceived", (data: Message) => {
        queryClient.setQueryData(
          ["messages", userId, otherUserId],
          (old: Message[] | undefined) => {
            if (
              (data.senderId === otherUserId && data.receiverId === userId) ||
              (data.senderId === userId && data.receiverId === otherUserId)
            ) {
              if (old?.some((msg) => msg._id === data._id)) {
                return old; // Prevent duplicate
              }
              return old ? [...old, data] : [data];
            }
            return old;
          }
        );
      });

      return () => {
        socket.off("messageReceived");
      };
    }
  }, [queryClient, userId, otherUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (message.trim() && user?._id) {
      sendMessageMutation.mutate({ receiverId: otherUserId, content: message });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#262522] w-full max-w-md h-[500px] rounded-lg p-4 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">
            {otherUsername}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5 text-white" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto mb-4">
          {messages.map((msg: Message) => (
            <div
              key={msg._id}
              className={`mb-2 ${
                msg.senderId === userId ? "text-right" : "text-left"
              }`}
            >
              <div
                className={`inline-block p-2 rounded-lg ${
                  msg.senderId === userId
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-white"
                }`}
              >
                <p>{msg.content}</p>
                <p className="text-xs text-gray-400">
                  {format(new Date(msg.timestamp), "MMM d, yyyy HH:mm")}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            className="bg-gray-800 text-white border-gray-700"
          />
          <Button onClick={handleSendMessage} disabled={!message.trim()}>
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
