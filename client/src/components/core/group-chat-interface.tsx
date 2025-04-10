"use client"

import type React from "react"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send } from "lucide-react"
import { cn } from "@/lib/utils"
import { useQuery } from "@tanstack/react-query"
import { getUserClubs } from "@/lib/api/club"
import { useAuthStore } from "@/stores"

// Mock data for users
const users = [
  {
    id: 1,
    name: "Alex Johnson",
    avatar: "/placeholder.svg?height=40&width=40",
    isOnline: true,
    lastSeen: "Just now",
  },
  {
    id: 2,
    name: "Sarah Williams",
    avatar: "/placeholder.svg?height=40&width=40",
    isOnline: true,
    lastSeen: "Just now",
  },
  {
    id: 3,
    name: "Michael Brown",
    avatar: "/placeholder.svg?height=40&width=40",
    isOnline: false,
    lastSeen: "5m ago",
  },
  {
    id: 4,
    name: "Emily Davis",
    avatar: "/placeholder.svg?height=40&width=40",
    isOnline: true,
    lastSeen: "Just now",
  },
  {
    id: 5,
    name: "David Wilson",
    avatar: "/placeholder.svg?height=40&width=40",
    isOnline: false,
    lastSeen: "1h ago",
  },
]

// Mock data for messages
const initialMessages = [
  {
    id: 1,
    userId: 2,
    text: "Hey everyone! How's it going?",
    timestamp: "10:30 AM",
  },
  {
    id: 2,
    userId: 1,
    text: "Hi Sarah! I'm doing great, just finished the project proposal.",
    timestamp: "10:32 AM",
  },
  {
    id: 3,
    userId: 4,
    text: "Hello! I'm good too. Has anyone started on the design tasks yet?",
    timestamp: "10:33 AM",
  },
  {
    id: 4,
    userId: 2,
    text: "I've made some initial sketches. I'll share them later today.",
    timestamp: "10:35 AM",
  },
  {
    id: 5,
    userId: 1,
    text: "That sounds great! Looking forward to seeing them.",
    timestamp: "10:36 AM",
  },
]

export default function GroupChat() {
  const [messages, setMessages] = useState(initialMessages)
  const [newMessage, setNewMessage] = useState("")
  const [activeUserId, setActiveUserId] = useState(1) // Current user ID

  const handleSendMessage = () => {
    if (newMessage.trim() === "") return

    const newMsg = {
      id: messages.length + 1,
      userId: activeUserId,
      text: newMessage,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    }

    setMessages([...messages, newMsg])
    setNewMessage("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

    const { user: mainUser } = useAuthStore();
  

  const { data: userClubs = [], isLoading: userClubsLoading } = useQuery({
    queryKey: ["userClubs", mainUser?._id],
    queryFn: () => getUserClubs(mainUser!._id),
    enabled: !!mainUser?._id,
  });

  return (
    <div className="flex h-[89vh] max-h-screen overflow-hidden w-full">
      {/* Left sidebar - User list */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-[#09090b] hidden md:block">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold">Group Members</h2>
        </div>
        <ScrollArea className="h-[calc(100vh-65px)]">
          <div className="p-2">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
              >
                <div className="relative">
                  <Avatar>
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  {user.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-950 rounded-full"></span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user.isOnline ? "Online" : user.lastSeen}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Mobile user list toggle */}
      <div className="md:hidden absolute top-4 left-4 z-10">
        <Button variant="outline" size="icon" className="rounded-full">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <path d="M17 6.1H3"></path>
            <path d="M21 12.1H3"></path>
            <path d="M15.1 18.1H3"></path>
          </svg>
          <span className="sr-only">Toggle menu</span>
        </Button>
      </div>

      {/* Right side - Chat area */}
      <div className="flex-1 flex flex-col">
        {/* Chat header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#09090b]">
          <h2 className="text-xl font-bold">Team Chat</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {users.filter((u) => u.isOnline).length} members online
          </p>
        </div>

        {/* Messages area */}
        <ScrollArea className="flex-1 p-4 bg-gray-50 dark:bg-gray-900">
          <div className="space-y-4">
            {messages.map((message) => {
              const sender = users.find((u) => u.id === message.userId)
              const isCurrentUser = message.userId === activeUserId

              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex items-start gap-3 max-w-[80%]",
                    isCurrentUser ? "ml-auto flex-row-reverse" : "mr-auto flex-row",
                  )}
                >
                  {!isCurrentUser && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={sender?.avatar} alt={sender?.name || ""} />
                      <AvatarFallback>
                        {sender?.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      "rounded-lg p-3",
                      isCurrentUser ? "bg-primary text-primary-foreground" : "bg-gray-200 dark:bg-gray-800",
                    )}
                  >
                    {!isCurrentUser && <p className="text-xs font-medium mb-1">{sender?.name}</p>}
                    <p>{message.text}</p>
                    <p
                      className={cn(
                        "text-xs mt-1 text-right",
                        isCurrentUser ? "text-primary-foreground/80" : "text-gray-500 dark:text-gray-400",
                      )}
                    >
                      {message.timestamp}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>

        {/* Message input */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#09090b]">
          <div className="flex items-center gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="flex-1"
            />
            <Button onClick={handleSendMessage} disabled={!newMessage.trim()} size="icon">
              <Send className="h-5 w-5" />
              <span className="sr-only">Send message</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
