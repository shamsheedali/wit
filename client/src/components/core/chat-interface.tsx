"use client";

import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { getSocket } from "@/lib/socket";

type Message = {
  id: string;
  content: string;
  senderId: string;
  timestamp: number;
};

interface ChatInterfaceProps {
  gameId: string;
  userId: string;
  opponentId: string;
  playerNames: { [key: string]: string };
}

export default function ChatInterface({
  gameId,
  userId,
  // opponentId,
  playerNames,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socket = getSocket();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!socket || !gameId) return;

    socket.on(
      "chatMessageReceived",
      (data: { senderId: string; content: string; timestamp: number }) => {
        const newMessage: Message = {
          id: `${data.timestamp}-${data.senderId}`, // Unique ID from server
          content: data.content,
          senderId: data.senderId,
          timestamp: data.timestamp,
        };
        setMessages((prev) => {
          // Deduplicate: only add if this ID isn’t already in the list
          if (prev.some((msg) => msg.id === newMessage.id)) {
            return prev;
          }
          return [...prev, newMessage];
        });
      }
    );

    return () => {
      socket.off("chatMessageReceived");
    };
  }, [socket, gameId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (inputValue.trim() === "" || !socket || !gameId || !userId) return;

    const messageData = {
      gameId,
      userId,
      message: inputValue,
    };
    socket.emit("sendChatMessage", messageData);
    setInputValue(""); // Clear input after sending
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="text-gray-300 text-lg font-medium mb-4">Chat</div>

      {/* Messages container */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.senderId === userId ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] px-3 py-2 rounded-lg ${
                message.senderId === userId
                  ? "bg-gray-700 text-white rounded-tr-none"
                  : "bg-gray-600 text-gray-100 rounded-tl-none"
              }`}
            >
              <div className="text-xs text-gray-300">
                {playerNames[message.senderId] || message.senderId}
              </div>
              <div className="text-sm">{message.content}</div>
              <div className="text-xs text-gray-400 mt-1 text-right">
                {formatTime(message.timestamp)}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="mt-auto">
        <div className="flex items-center bg-gray-700 rounded-md overflow-hidden">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSendMessage();
            }}
            placeholder="Type a message..."
            className="flex-1 bg-transparent border-none outline-none text-white px-3 py-2 text-sm"
          />
          <button
            onClick={handleSendMessage}
            className="p-2 text-gray-300 hover:text-white"
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
