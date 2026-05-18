"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore, useNotificationStore } from "@/frontend/store";
import { usePathname } from "next/navigation";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: string[];
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  onlineUsers: [],
});

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const { couple, user } = useAuthStore();
  const incrementUnread = useNotificationStore((s) => s.increment);
  const pathname = usePathname();

  useEffect(() => {
    if (!couple) return;

    // Connect to the Socket.IO server hosted on the same origin
    const socketInstance = io(window.location.origin);

    socketInstance.on("connect", () => {
      setIsConnected(true);
      socketInstance.emit("join_room", { coupleId: couple.id, userId: user?.id });
    });

    socketInstance.on("disconnect", () => {
      setIsConnected(false);
      setOnlineUsers([]);
    });

    // Global listener for new messages
    socketInstance.on("receive_message", (msg) => {
      // If the user is NOT actively on the chat page, increment the unread badge
      if (window.location.pathname !== "/chat") {
        incrementUnread();
      }
    });

    // Listeners for online/offline tracking
    socketInstance.on("online_users", (users: string[]) => {
      setOnlineUsers(users);
    });

    socketInstance.on("user_connected", (userId: string) => {
      setOnlineUsers((prev) => [...prev.filter((id) => id !== userId), userId]);
    });

    socketInstance.on("user_disconnected", (userId: string) => {
      setOnlineUsers((prev) => prev.filter((id) => id !== userId));
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [couple, user, incrementUnread]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
}
