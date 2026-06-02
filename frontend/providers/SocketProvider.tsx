"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore, useNotificationStore } from "@/frontend/store";
import { useAuth } from "@clerk/nextjs";

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
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    if (!couple || !isSignedIn) return;

    let socketInstance: Socket | null = null;

    const initSocket = async () => {
      // Get Clerk JWT token for Socket.IO authentication
      const token = await getToken();

      if (!token) {
        console.warn("Socket.IO: No Clerk token found, skipping connection");
        return;
      }

      socketInstance = io(window.location.origin, {
        auth: { token },
      });

      socketInstance.on("connect", () => {
        setIsConnected(true);
        socketInstance?.emit("join_room", { coupleId: couple.id, userId: user?.id });
      });

      socketInstance.on("disconnect", () => {
        setIsConnected(false);
        setOnlineUsers([]);
      });

      // Global listener for new messages
      socketInstance.on("receive_message", () => {
        if (window.location.pathname !== "/chat") {
          incrementUnread();
        }
      });

      socketInstance.on("online_users", (users: string[]) => {
        setOnlineUsers(users);
      });

      socketInstance.on("user_connected", (userId: string) => {
        setOnlineUsers((prev) => [...prev.filter((id) => id !== userId), userId]);
      });

      socketInstance.on("user_disconnected", (userId: string) => {
        setOnlineUsers((prev) => prev.filter((id) => id !== userId));
      });

      socketInstance.on("error_msg", (msg: string) => {
        console.error("Socket error:", msg);
      });

      setSocket(socketInstance);
    };

    initSocket();

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [couple, user, isSignedIn, incrementUnread, getToken]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
}
