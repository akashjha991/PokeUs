"use client";

import { AppShell } from "@/frontend/components/layouts/AppShell";
import { useAuthStore, useNotificationStore } from "@/frontend/store";
import { getInitials, formatChatTime } from "@/backend/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { Send, Image, Smile, MoreVertical, ArrowLeft, Reply, X, Camera, Heart, Sparkles, Maximize2 } from "lucide-react";
import Link from "next/link";
import { useSocket } from "@/frontend/providers/SocketProvider";
import { encryptMessage, decryptMessage, generateCID } from "@/backend/lib/crypto";

// Predefined Stickers categories
const STICKER_PACKS = [
  {
    category: "💝 Love",
    items: ["💖", "💝", "💕", "💞", "💘", "💓", "❤️", "💌", "👩‍❤️‍👨", "🫂", "💋", "🌹"],
  },
  {
    category: "🧸 Cute",
    items: ["🧸", "🥞", "🍩", "🧁", "🍪", "🍬", "🍿", "🍩", "✨", "🎀", "🌟", "🌸"],
  },
  {
    category: "🐱 Pets",
    items: ["🐱", "🐶", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🦁", "🐯", "🐱‍👤", "🐾"],
  },
  {
    category: "🔥 Expressions",
    items: ["🥺", "🥰", "😘", "😍", "🥳", "🤩", "😜", "😇", "😈", "🔥", "🍑", "🍒"],
  },
];

const EMOJIS = ["😀", "😊", "🥰", "😍", "😌", "😴", "😢", "😤", "🤩", "💜", "👍", "😂", "😮", "🥺", "🔥", "🎉"];
const REACTION_LIST = ["❤️", "👍", "😂", "😮", "🥺", "🔥"];

export default function ChatPage() {
  const { user, couple } = useAuthStore();
  const partner = couple ? (couple.user1.id === user?.id ? couple.user2 : couple.user1) : null;
  const { reset: resetUnreadCount } = useNotificationStore();
  const { socket, onlineUsers } = useSocket();
  const isPartnerOnline = partner ? onlineUsers.includes(partner.id) : false;
  
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [input, setInput] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [emojiTab, setEmojiTab] = useState<"emojis" | "stickers">("emojis");
  const [stickerPackIndex, setStickerPackIndex] = useState(0);
  const [replyTo, setReplyTo] = useState<any | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [activeReactionMenu, setActiveReactionMenu] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [partnerProfile, setPartnerProfile] = useState<any | null>(null);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [isFetchingProfile, setIsFetchingProfile] = useState(false);
  const [showE2EEMenu, setShowE2EEMenu] = useState(false);
  const [activeMessageCIDs, setActiveMessageCIDs] = useState<{ id: string, text: string, cid: string }[]>([]);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  async function openE2EEMenu() {
    if (!couple) return;
    const lastMessages = messages.filter(m => m.type === "TEXT" || m.type === "STICKER").slice(-5);
    const cids = await Promise.all(
      lastMessages.map(async (msg) => {
        const cidHex = await generateCID(msg.id, msg.senderId, msg.content);
        return {
          id: msg.id,
          text: msg.content.length > 28 ? msg.content.substring(0, 28) + "..." : msg.content,
          cid: cidHex.substring(0, 24) + "...",
        };
      })
    );
    setActiveMessageCIDs(cids);
    setShowE2EEMenu(true);
  }

  async function fetchAndOpenPartnerProfile() {
    setIsFetchingProfile(true);
    setShowPartnerModal(true);
    try {
      const res = await fetch("/api/couple/partner");
      const data = await res.json();
      if (data.partner) {
        setPartnerProfile(data.partner);
      }
    } catch (e) {
      console.error("Failed to load partner profile:", e);
    } finally {
      setIsFetchingProfile(false);
    }
  }

  function getXPLevelDetails(xp: number) {
    if (xp < 100) return { title: "New Couple 💌", level: 1, nextThreshold: 100, min: 0 };
    if (xp < 300) return { title: "Sweethearts 💖", level: 2, nextThreshold: 300, min: 100 };
    if (xp < 600) return { title: "Lovebirds 🐦", level: 3, nextThreshold: 600, min: 300 };
    if (xp < 1000) return { title: "Soulmates 🔮", level: 4, nextThreshold: 1000, min: 600 };
    if (xp < 1500) return { title: "Eternal Partners ♾️", level: 5, nextThreshold: 1500, min: 1000 };
    return { title: "Legendary Lovers 🔥", level: 6, nextThreshold: 1500, min: 1500 };
  }

  // Initialize Socket and fetch history
  useEffect(() => {
    if (!couple || !user) return;

    // Fetch history
    fetch("/api/chat")
      .then((res) => res.json())
      .then(async (data) => {
        if (data.messages) {
          const decryptedMessages = await Promise.all(
            data.messages.map(async (msg: any) => {
              const decrypted = await decryptMessage(msg.content, couple.id);
              return { ...msg, content: decrypted };
            })
          );
          setMessages(decryptedMessages);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));

    // Mark messages as seen and reset unread badge
    fetch("/api/chat/seen", { method: "POST" })
      .then(() => {
        resetUnreadCount();
        if (socket && couple) {
          socket.emit("messages_read", { coupleId: couple.id, seenBy: user.id });
        }
      })
      .catch(console.error);

  }, [couple, user, resetUnreadCount, socket]);

  useEffect(() => {
    if (!socket || !couple || !user) return;
    
    // Notify that we entered chat
    socket.emit("messages_read", { coupleId: couple.id, seenBy: user.id });

    // Receive standard messages
    socket.on("receive_message", async (msg) => {
      const decrypted = await decryptMessage(msg.content, couple.id);
      const decryptedMsg = { ...msg, content: decrypted };

      setMessages((prev) => {
        // Prevent duplicate optimistic messages
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, decryptedMsg];
      });
      setIsTyping(false);
      
      // Auto-mark as seen if we are actively on the page receiving messages
      fetch("/api/chat/seen", { method: "POST" })
        .then(() => {
          socket.emit("messages_read", { coupleId: couple.id, seenBy: user.id });
        })
        .catch(console.error);
    });

    // Real-time message read receipts
    socket.on("receive_messages_read", ({ seenBy }) => {
      if (seenBy !== user.id) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.senderId === user.id && !msg.seenAt
              ? { ...msg, seenAt: new Date().toISOString() }
              : msg
          )
        );
      }
    });

    // Receive message reactions/likes in real-time
    socket.on("receive_reaction", ({ messageId, reaction }) => {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? { ...msg, reaction } : msg))
      );
    });

    socket.on("partner_typing", (isPartnerTyping) => {
      setIsTyping(isPartnerTyping);
    });

    return () => {
      socket.off("receive_message");
      socket.off("receive_messages_read");
      socket.off("receive_reaction");
      socket.off("partner_typing");
    };
  }, [socket, couple, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // General message sender
  async function sendMessage(customContent?: string, type: "TEXT" | "STICKER" | "IMAGE" = "TEXT", mediaUrl?: string) {
    if (!user || !couple) return;

    const content = customContent !== undefined ? customContent : input.trim();
    if (!content && !mediaUrl) return;

    if (customContent === undefined) {
      setInput("");
    }
    setReplyTo(null);
    setShowEmoji(false);

    const tempId = `temp-${Date.now()}`;

    // Optimistic UI update
    const optimisticMsg = {
      id: tempId,
      senderId: user.id,
      coupleId: couple.id,
      content,
      type,
      mediaUrl: mediaUrl || null,
      createdAt: new Date().toISOString(),
      reaction: null,
    };
    
    setMessages((prev) => [...prev, optimisticMsg]);
    
    // Encrypt content for wire transit & storage
    const encryptedContent = await encryptMessage(content, couple.id);
    
    socket?.emit("send_message", { ...optimisticMsg, content: encryptedContent, coupleId: couple.id });
    socket?.emit("stop_typing", { coupleId: couple.id });

    // Save to DB
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: encryptedContent, type, replyToId: replyTo?.id, mediaUrl }),
      });
      const data = await response.json();
      
      if (data.message) {
        const decryptedDbContent = await decryptMessage(data.message.content, couple.id);
        const finalMsg = { ...data.message, content: decryptedDbContent };

        // Swap temp ID with actual DB ID
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? finalMsg : m))
        );
      }
    } catch (e) {
      console.error("Failed to send message", e);
    }
  }

  // Handle double-tap to Heart message (like Instagram)
  let lastTap = 0;
  function handleDoubleTap(messageId: string, currentReaction: string | null) {
    const now = Date.now();
    if (now - lastTap < 300) {
      // Toggle ❤️ reaction
      const nextReaction = currentReaction === "❤️" ? null : "❤️";
      handleReact(messageId, nextReaction);
    }
    lastTap = now;
  }

  // React to message (like, laugh, etc.)
  async function handleReact(messageId: string, reaction: string | null) {
    setActiveReactionMenu(null);
    if (!couple) return;

    // Optimistic local state update
    setMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, reaction } : msg))
    );

    // Broadcast reaction via WebSocket
    socket?.emit("send_reaction", { messageId, reaction, coupleId: couple.id });

    // Save reaction to database
    try {
      await fetch("/api/chat/react", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, reaction }),
      });
    } catch (err) {
      console.error("Failed to save reaction:", err);
    }
  }

  // Process & compress media uploads
  function processAndSendImage(file: File) {
    if (!file || !user || !couple) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;

      // Scale and compress the image using standard client-side HTML5 canvas
      const img = document.createElement("img");
      img.src = base64;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 800; // Optimal display boundary
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
        
        // Send as IMAGE type message immediately
        sendMessage("Shared a photo 📷", "IMAGE", compressedBase64);
      };
    };
    reader.readAsDataURL(file);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { 
      e.preventDefault(); 
      sendMessage(); 
    } else {
      if (socket && couple) {
        socket.emit("typing", { coupleId: couple.id });
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          socket.emit("stop_typing", { coupleId: couple.id });
        }, 2000);
      }
    }
  }

  if (!couple) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center h-screen gap-4 px-6 text-center">
          <span className="text-5xl">💌</span>
          <h2 className="font-display font-bold text-xl">No Partner Yet</h2>
          <p className="text-sm" style={{ color: "rgb(var(--text-muted))" }}>Invite your partner to start chatting in your private space.</p>
          <Link href="/profile" className="btn-brand py-3 px-8">Invite Partner</Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="fixed inset-0 flex flex-col bg-[rgb(var(--background))]" style={{ color: "rgb(var(--text))" }}>
        
        {/* HIDDEN FILE INPUTS FOR CAMERA & GALLERY */}
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          className="hidden"
          onChange={(e) => e.target.files?.[0] && processAndSendImage(e.target.files[0])}
        />
        <input
          type="file"
          accept="image/*"
          capture="user"
          ref={cameraInputRef}
          className="hidden"
          onChange={(e) => e.target.files?.[0] && processAndSendImage(e.target.files[0])}
        />

        {/* CHAT HEADER */}
        <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "rgb(var(--border))", background: "rgb(var(--surface))" }}>
          <Link href="/dashboard" className="p-1"><ArrowLeft size={20} /></Link>
          
          <div 
            onClick={() => fetchAndOpenPartnerProfile()}
            className="flex items-center gap-3 flex-1 cursor-pointer select-none group/hdr py-0.5"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-brand flex items-center justify-center text-white font-bold text-sm transition-transform group-hover/hdr:scale-105">
              {partner?.avatar ? <img src={partner.avatar} alt="" className="w-full h-full object-cover rounded-2xl" /> : getInitials(partner?.name || "P")}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm group-hover/hdr:text-pink-500 transition-colors flex items-center gap-1.5">
                  {partner?.name} 
                  <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded-full opacity-0 group-hover/hdr:opacity-100 transition-opacity font-normal">View Stats</span>
                </p>
                {/* E2EE Lock Icon */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    openE2EEMenu();
                  }}
                  className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all flex items-center gap-0.5 scale-95 cursor-pointer z-10 border border-emerald-500/20"
                  title="End-to-End Encrypted conversation. Click to audit keys."
                >
                  <Sparkles size={9} className="animate-pulse" />
                  <span className="text-[8px] font-bold uppercase tracking-wider">E2EE Secured</span>
                </button>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${isPartnerOnline ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"}`} />
                <p className="text-xs" style={{ color: "rgb(var(--text-muted))" }}>
                  {isPartnerOnline ? "Online" : "Offline"}
                </p>
              </div>
            </div>
          </div>

          <button 
            onClick={() => fetchAndOpenPartnerProfile()}
            className="p-2 rounded-xl hover:scale-105 active:scale-95 transition-transform" 
            style={{ background: "rgb(var(--surface-muted))" }}
            title="Partner Profile"
          >
            <MoreVertical size={18} style={{ color: "rgb(var(--text-muted))" }} />
          </button>
        </div>

        {/* MESSAGES VIEWPORT */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
          {isLoading ? (
            <>
              {[
                { isMe: false, width: "w-3/5" },
                { isMe: true, width: "w-2/5" },
                { isMe: false, width: "w-1/2" },
                { isMe: true, width: "w-3/4" },
              ].map((item, i) => (
                <div key={`chat-skel-${i}`} className={`flex w-full gap-2 ${item.isMe ? "justify-end" : "justify-start"}`}>
                  {!item.isMe && <div className="w-7 h-7 rounded-full bg-zinc-800 animate-pulse self-end mb-1" />}
                  <div className={`group relative ${item.width} flex flex-col ${item.isMe ? "items-end" : "items-start"}`}>
                    <div className={`w-full h-12 rounded-2xl animate-pulse ${item.isMe ? "bg-purple-900/20" : "bg-zinc-850"}`} />
                  </div>
                  {item.isMe && <div className="w-7 h-7 rounded-full bg-zinc-800 animate-pulse self-end mb-1" />}
                </div>
              ))}
            </>
          ) : (
            messages.map((msg, i) => {
              const isMe = msg.senderId === user?.id;
              const hasReaction = !!msg.reaction;

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.01 }}
                  className={`flex w-full gap-2 ${isMe ? "justify-end" : "justify-start"}`}
                >
                  {/* Partner Avatar */}
                  {!isMe && (
                    <div className="w-7 h-7 rounded-full bg-gradient-brand flex-shrink-0 flex items-center justify-center text-white font-bold text-[10px] self-end overflow-hidden mb-1 shadow">
                      {partner?.avatar ? <img src={partner.avatar} alt="" className="w-full h-full object-cover" /> : getInitials(partner?.name || "P")}
                    </div>
                  )}

                  {/* Message Bubble Container */}
                  <div className={`group relative max-w-[70%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                    
                    {/* Floating Reaction Selector Popover */}
                    <AnimatePresence>
                      {activeReactionMenu === msg.id && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.9 }}
                          className="absolute -top-11 z-30 flex items-center gap-1.5 p-1.5 rounded-full shadow-2xl border"
                          style={{
                            background: "rgb(var(--surface))",
                            borderColor: "rgb(var(--border))",
                            left: isMe ? "auto" : "0px",
                            right: isMe ? "0px" : "auto",
                          }}
                        >
                          {REACTION_LIST.map((react) => (
                            <button
                              key={react}
                              onClick={() => handleReact(msg.id, msg.reaction === react ? null : react)}
                              className="text-lg hover:scale-130 transition-transform active:scale-95 duration-100"
                            >
                              {react}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Interactive Bubble */}
                    <div
                      onClick={() => handleDoubleTap(msg.id, msg.reaction)}
                      className="cursor-pointer select-none relative"
                    >
                      {msg.type === "STICKER" ? (
                        // Premium borderless giant sticker display
                        <motion.div 
                          whileHover={{ scale: 1.12, rotate: [0, -3, 3, 0] }}
                          className="p-1 text-[72px] filter drop-shadow-md select-none transition-transform"
                          title="Double-tap to Love"
                        >
                          {msg.content}
                        </motion.div>
                      ) : msg.type === "IMAGE" && msg.mediaUrl ? (
                        // Elegant custom image card with lightbox trigger
                        <div className="relative rounded-2xl overflow-hidden border border-zinc-800/80 bg-zinc-900 group/img max-w-[240px]">
                          <img
                            src={msg.mediaUrl}
                            alt="Shared couple timeline pic"
                            className="w-full h-auto object-cover max-h-[220px] transition-transform duration-300 group-hover/img:scale-105 cursor-zoom-in"
                            onClick={() => setLightboxImage(msg.mediaUrl)}
                          />
                          <div 
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center cursor-zoom-in"
                            onClick={() => setLightboxImage(msg.mediaUrl)}
                          >
                            <Maximize2 className="text-white drop-shadow-lg" size={20} />
                          </div>
                        </div>
                      ) : (
                        // Standard messaging bubble
                        <div className={isMe ? "bubble-out" : "bubble-in"}>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      )}

                      {/* Floating Reaction Badge */}
                      {hasReaction && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          whileHover={{ scale: 1.15 }}
                          className="absolute -bottom-1.5 right-1.5 bg-[rgb(var(--surface-muted))] border rounded-full px-1.5 py-0.5 text-xs flex items-center justify-center shadow-md select-none cursor-pointer hover:brightness-110 active:scale-95 transition-all"
                          style={{ borderColor: "rgb(var(--border))" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReact(msg.id, null);
                          }}
                          title="Click to remove"
                        >
                          {msg.reaction}
                        </motion.div>
                      )}
                    </div>

                    {/* Timestamp & Quick-Controls info */}
                    <div className="flex items-center gap-1.5 mt-1 select-none">
                      <p className="text-[10px]" style={{ color: "rgb(var(--text-subtle))" }}>
                        {formatChatTime(msg.createdAt)}
                      </p>
                      {isMe && (
                        <span 
                          className={`text-[10px] font-bold select-none ${
                            msg.seenAt 
                              ? "text-pink-500 font-extrabold" 
                              : "text-zinc-500"
                          }`}
                          title={msg.seenAt ? `Seen at ${formatChatTime(msg.seenAt)}` : (isPartnerOnline ? "Delivered (Online)" : "Sent (Offline)")}
                        >
                          {msg.seenAt || isPartnerOnline ? "✓✓" : "✓"}
                        </span>
                      )}
                    </div>

                    {/* Quick Reaction & Reply HUD inside Hover Overlay */}
                    <div 
                      className={`absolute top-1/2 -translate-y-1/2 ${isMe ? "-left-16" : "-right-16"} flex gap-1 items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10`}
                    >
                      <button
                        onClick={() => setActiveReactionMenu(activeReactionMenu === msg.id ? null : msg.id)}
                        className="p-1.5 rounded-lg hover:brightness-125 transition-all"
                        style={{ background: "rgb(var(--surface-muted))" }}
                        title="React to message"
                      >
                        <Heart size={12} className="text-pink-400" />
                      </button>
                      <button
                        onClick={() => setReplyTo(msg)}
                        className="p-1.5 rounded-lg hover:brightness-125 transition-all"
                        style={{ background: "rgb(var(--surface-muted))" }}
                        title="Reply to message"
                      >
                        <Reply size={12} style={{ color: "rgb(var(--text-muted))" }} />
                      </button>
                    </div>
                  </div>

                  {/* My Avatar */}
                  {isMe && (
                    <div className="w-7 h-7 rounded-full bg-gradient-brand flex-shrink-0 flex items-center justify-center text-white font-bold text-[10px] self-end overflow-hidden mb-1 shadow">
                      {user?.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : getInitials(user?.name || "U")}
                    </div>
                  )}
                </motion.div>
              );
            })
          )}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-center gap-2">
              <div className="bubble-in flex gap-1 py-3 px-4 shadow-sm border border-zinc-800/40">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-pink-500"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.8, delay: i * 0.15, repeat: Infinity }}
                  />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* REPLY TIMELINE BANNER */}
        <AnimatePresence>
          {replyTo && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="px-4 py-2 flex items-center gap-3 border-t"
              style={{ borderColor: "rgb(var(--border))", background: "rgb(var(--surface-muted))" }}
            >
              <div className="w-0.5 h-8 rounded-full bg-pink-500" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold" style={{ color: "rgb(217,70,239)" }}>
                  Replying to {replyTo.senderId === user?.id ? "yourself" : partner?.name}
                </p>
                <p className="text-xs truncate text-zinc-400">{replyTo.content}</p>
              </div>
              <button onClick={() => setReplyTo(null)}>
                <X size={16} style={{ color: "rgb(var(--text-muted))" }} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* INPUT CONTROLS BAR */}
        <div className="px-4 pt-3 border-t flex items-end gap-2" style={{ borderColor: "rgb(var(--border))", background: "rgb(var(--surface))", paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
          
          <div className="flex gap-1.5 flex-shrink-0">
            <button 
              onClick={() => cameraInputRef.current?.click()}
              className="p-2.5 rounded-xl transition-all active:scale-95 hover:bg-zinc-800/40" 
              style={{ background: "rgb(var(--surface-muted))" }}
              title="Snap Camera Pic"
            >
              <Camera size={20} style={{ color: "rgb(var(--text-muted))" }} />
            </button>

            <button 
              onClick={() => setShowEmoji(!showEmoji)} 
              className="p-2.5 rounded-xl transition-all active:scale-95 hover:bg-zinc-800/40" 
              style={{ background: "rgb(var(--surface-muted))" }}
              title="Emojis & Stickers"
            >
              <Smile size={20} style={{ color: showEmoji ? "rgb(217,70,239)" : "rgb(var(--text-muted))" }} />
            </button>
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-xl transition-all active:scale-95 hover:bg-zinc-800/40" 
              style={{ background: "rgb(var(--surface-muted))" }}
              title="Upload Image"
            >
              <Image size={20} style={{ color: "rgb(var(--text-muted))" }} />
            </button>
          </div>
          
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="input-field resize-none py-2.5 flex-1"
            style={{ minHeight: 44, maxHeight: 120 }}
          />

          <button
            onClick={() => sendMessage()}
            disabled={!input.trim()}
            className="flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 active:scale-95"
            style={{
              background: input.trim() ? "linear-gradient(135deg, rgb(var(--brand)), rgb(var(--brand-secondary)))" : "rgb(var(--surface-muted))",
              color: input.trim() ? "white" : "rgb(var(--text-subtle))",
            }}
          >
            <Send size={18} />
          </button>
        </div>

        {/* TABBED EMOJI & STICKERS SELECTOR HUD */}
        <AnimatePresence>
          {showEmoji && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="flex flex-col border-t shadow-2xl overflow-hidden z-20"
              style={{ background: "rgb(var(--surface))", borderColor: "rgb(var(--border))", maxHeight: "280px" }}
            >
              {/* Tab Selector Headers */}
              <div className="flex border-b text-sm" style={{ borderColor: "rgb(var(--border))" }}>
                <button
                  onClick={() => setEmojiTab("emojis")}
                  className={`flex-1 py-3 font-semibold transition-all border-b-2 flex items-center justify-center gap-1.5 ${emojiTab === "emojis" ? "border-pink-500 text-pink-500" : "border-transparent text-zinc-400 hover:text-zinc-200"}`}
                >
                  <Smile size={16} /> Emojis
                </button>
                <button
                  onClick={() => setEmojiTab("stickers")}
                  className={`flex-1 py-3 font-semibold transition-all border-b-2 flex items-center justify-center gap-1.5 ${emojiTab === "stickers" ? "border-pink-500 text-pink-500" : "border-transparent text-zinc-400 hover:text-zinc-200"}`}
                >
                  <Sparkles size={16} /> Stickers
                </button>
              </div>

              {/* Viewport for Emojis tab */}
              {emojiTab === "emojis" && (
                <div className="p-4 overflow-y-auto grid grid-cols-8 gap-3 max-h-[220px]">
                  {EMOJIS.map((emo) => (
                    <button
                      key={emo}
                      onClick={() => setInput((val) => val + emo)}
                      className="text-3xl hover:scale-120 active:scale-95 transition-transform"
                    >
                      {emo}
                    </button>
                  ))}
                </div>
              )}

              {/* Viewport for Stickers tab */}
              {emojiTab === "stickers" && (
                <div className="flex flex-col flex-1 min-h-0">
                  {/* Category Filter Chips */}
                  <div className="flex gap-2 px-4 py-2 bg-[rgb(var(--surface-muted))] overflow-x-auto whitespace-nowrap scrollbar-none border-b" style={{ borderColor: "rgb(var(--border))" }}>
                    {STICKER_PACKS.map((pack, idx) => (
                      <button
                        key={pack.category}
                        onClick={() => setStickerPackIndex(idx)}
                        className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${stickerPackIndex === idx ? "bg-gradient-brand text-white shadow-sm" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-750"}`}
                      >
                        {pack.category}
                      </button>
                    ))}
                  </div>

                  {/* Stickers Grid */}
                  <div className="p-4 overflow-y-auto grid grid-cols-6 gap-3 max-h-[160px] flex-1">
                    {STICKER_PACKS[stickerPackIndex].items.map((stk, idx) => (
                      <button
                        key={`stk-${idx}`}
                        onClick={() => sendMessage(stk, "STICKER")}
                        className="text-4xl hover:scale-115 active:scale-90 transition-transform filter drop-shadow select-none py-1"
                        title="Click to send immediately"
                      >
                        {stk}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* GALLERY LIGHTBOX OVERLAY */}
        <AnimatePresence>
          {lightboxImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLightboxImage(null)}
              className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 cursor-zoom-out"
            >
              <button 
                onClick={() => setLightboxImage(null)}
                className="absolute top-4 right-4 p-2 bg-zinc-800/80 rounded-full hover:bg-zinc-700/80 text-white transition-colors"
              >
                <X size={22} />
              </button>
              <motion.img
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                src={lightboxImage}
                alt="Expanded couple gallery view"
                className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-zinc-800"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* PARTNER PROFILE DETAILS MODAL */}
        <AnimatePresence>
          {showPartnerModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 cursor-zoom-out"
              onClick={() => setShowPartnerModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md rounded-3xl p-6 border shadow-2xl relative overflow-hidden cursor-default flex flex-col gap-5 max-h-[85vh] overflow-y-auto"
                style={{ background: "rgb(var(--surface))", borderColor: "rgb(var(--border))" }}
              >
                {/* Close Button */}
                <button
                  onClick={() => setShowPartnerModal(false)}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-zinc-800/60 transition-colors"
                >
                  <X size={18} style={{ color: "rgb(var(--text-muted))" }} />
                </button>

                {isFetchingProfile ? (
                  // Elegant Loading skeleton
                  <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <div className="w-24 h-24 rounded-full bg-zinc-800/30 animate-pulse" />
                    <div className="w-1/2 h-6 bg-zinc-800/30 animate-pulse rounded-full" />
                    <div className="w-3/4 h-4 bg-zinc-800/30 animate-pulse rounded-full mt-2" />
                    <div className="w-full h-24 bg-zinc-800/30 animate-pulse rounded-2xl mt-4" />
                  </div>
                ) : partnerProfile ? (
                  <>
                    {/* Header Info */}
                    <div className="flex flex-col items-center text-center gap-3">
                      {/* Avatar with Glow Ring */}
                      <div className="relative p-1 rounded-full bg-gradient-brand shadow-lg">
                        <div className="w-24 h-24 rounded-full bg-zinc-900 border-4 border-zinc-950 flex items-center justify-center text-white font-bold text-3xl overflow-hidden">
                          {partnerProfile.avatar ? (
                            <img src={partnerProfile.avatar} alt={partnerProfile.name} className="w-full h-full object-cover" />
                          ) : (
                            getInitials(partnerProfile.name)
                          )}
                        </div>
                      </div>

                      <div className="mt-1">
                        <h3 className="text-xl font-bold font-display">{partnerProfile.name}</h3>
                        <p className="text-xs mt-0.5" style={{ color: "rgb(var(--text-muted))" }}>
                          {partnerProfile.email}
                        </p>
                      </div>

                      {/* Bio Card */}
                      {partnerProfile.bio && (
                        <p className="text-xs px-4 py-2 rounded-2xl italic bg-[rgb(var(--surface-muted))] border border-zinc-800/30 max-w-xs" style={{ color: "rgb(var(--text-subtle))" }}>
                          "{partnerProfile.bio}"
                        </p>
                      )}
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* Relationship Level Card */}
                      <div className="p-3.5 rounded-2xl border flex flex-col items-center justify-center text-center gap-1 bg-[rgb(var(--surface-muted))]" style={{ borderColor: "rgb(var(--border))" }}>
                        <span className="text-2xl">🏆</span>
                        <p className="text-[10px] uppercase font-bold tracking-wider" style={{ color: "rgb(var(--text-muted))" }}>Rank Title</p>
                        <p className="text-xs font-semibold text-pink-500 truncate w-full">
                          {getXPLevelDetails(partnerProfile.xpPoints).title}
                        </p>
                        <p className="text-[10px]" style={{ color: "rgb(var(--text-subtle))" }}>
                          Level {getXPLevelDetails(partnerProfile.xpPoints).level} • {partnerProfile.xpPoints} XP
                        </p>
                      </div>

                      {/* Streak Card */}
                      <div className="p-3.5 rounded-2xl border flex flex-col items-center justify-center text-center gap-1 bg-[rgb(var(--surface-muted))]" style={{ borderColor: "rgb(var(--border))" }}>
                        <span className="text-2xl">🔥</span>
                        <p className="text-[10px] uppercase font-bold tracking-wider" style={{ color: "rgb(var(--text-muted))" }}>Active Streak</p>
                        <p className="text-sm font-extrabold text-orange-500">
                          {partnerProfile.streakDays} Days
                        </p>
                        <p className="text-[10px]" style={{ color: "rgb(var(--text-subtle))" }}>
                          {partnerProfile.streakDays > 0 ? "Daily connections active!" : "Start connection today!"}
                        </p>
                      </div>
                    </div>

                    {/* Real-time Mood tracker status */}
                    <div className="flex flex-col gap-2">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "rgb(var(--text-muted))" }}>Current Mood Status</h4>
                      {partnerProfile.moods && partnerProfile.moods.length > 0 ? (
                        <div 
                          className="flex items-center gap-3 p-3 rounded-2xl border bg-gradient-to-r from-purple-900/10 to-pink-900/10 animate-pulse-slow"
                          style={{ borderColor: "rgba(217,70,239, 0.15)" }}
                        >
                          <span className="text-4xl filter drop-shadow-sm select-none">
                            {partnerProfile.moods[0].emoji}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-pink-400 capitalize">
                              Feeling {partnerProfile.moods[0].mood}
                            </p>
                            <p className="text-xs truncate mt-0.5 text-zinc-350">
                              {partnerProfile.moods[0].note || "No custom note added."}
                            </p>
                            <p className="text-[9px] mt-1 text-zinc-500">
                              Updated {new Date(partnerProfile.moods[0].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 text-center rounded-2xl border border-dashed bg-zinc-800/10" style={{ borderColor: "rgb(var(--border))" }}>
                          <p className="text-xs" style={{ color: "rgb(var(--text-muted))" }}>
                            {partnerProfile.name} hasn't shared a mood today yet 🌸
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Unlocked Badges section */}
                    <div className="flex flex-col gap-2 flex-1">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "rgb(var(--text-muted))" }}>Achievements / Badges</h4>
                      {partnerProfile.badges && partnerProfile.badges.length > 0 ? (
                        <div className="grid grid-cols-1 gap-2 max-h-[160px] overflow-y-auto pr-1">
                          {partnerProfile.badges.map((ub: any) => (
                            <div 
                              key={ub.id}
                              className="flex items-center gap-3 p-2.5 rounded-xl border bg-zinc-850/30"
                              style={{ borderColor: "rgb(var(--border))" }}
                            >
                              <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center text-xl shadow-sm">
                                {ub.badge.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 justify-between">
                                  <p className="text-xs font-semibold">{ub.badge.name}</p>
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                    ub.badge.rarity === "LEGENDARY" ? "bg-amber-500/20 text-amber-500 border border-amber-500/30" :
                                    ub.badge.rarity === "EPIC" ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" :
                                    ub.badge.rarity === "RARE" ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" :
                                    "bg-zinc-700/30 text-zinc-400 border border-zinc-700/30"
                                  }`}>
                                    {ub.badge.rarity}
                                  </span>
                                </div>
                                <p className="text-[10px] truncate" style={{ color: "rgb(var(--text-muted))" }}>
                                  {ub.badge.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 text-center rounded-2xl border border-dashed bg-zinc-800/10" style={{ borderColor: "rgb(var(--border))" }}>
                          <p className="text-xs" style={{ color: "rgb(var(--text-muted))" }}>
                            No achievements unlocked yet. Keep interacting to earn badges! ⚡
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="py-12 text-center">
                    <p className="text-sm text-red-500">Failed to load partner details.</p>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* E2EE SECURITY PANEL MODAL */}
        <AnimatePresence>
          {showE2EEMenu && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 cursor-zoom-out"
              onClick={() => setShowE2EEMenu(false)}
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md rounded-3xl p-6 border shadow-2xl relative overflow-hidden cursor-default flex flex-col gap-5 max-h-[85vh] overflow-y-auto"
                style={{ background: "rgb(var(--surface))", borderColor: "rgb(var(--border))" }}
              >
                {/* Close Button */}
                <button
                  onClick={() => setShowE2EEMenu(false)}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-zinc-800/60 transition-colors"
                >
                  <X size={18} style={{ color: "rgb(var(--text-muted))" }} />
                </button>

                <div className="flex flex-col items-center text-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 text-2xl shadow-inner animate-pulse-slow">
                    🔒
                  </div>
                  <div>
                    <h3 className="text-lg font-bold font-display">End-to-End Encrypted</h3>
                    <p className="text-xs mt-1 text-emerald-400 font-semibold uppercase tracking-wider">AES-GCM 256-Bit Secured</p>
                  </div>
                  <p className="text-xs leading-relaxed max-w-xs mt-2" style={{ color: "rgb(var(--text-muted))" }}>
                    Messages in PokeUs are encrypted exclusively in your browser using derived couple-specific secret tokens. Nobody — not even the database administrators or PokeUs hosting servers — can access or read your plain text conversations.
                  </p>
                </div>

                <div className="flex flex-col gap-2.5 mt-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "rgb(var(--text-muted))" }}>
                    Active Message Content IDs (CIDs)
                  </h4>
                  {activeMessageCIDs.length > 0 ? (
                    <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
                      {activeMessageCIDs.map((item) => (
                        <div 
                          key={item.id}
                          className="flex flex-col p-2.5 rounded-xl border bg-zinc-850/20 gap-1"
                          style={{ borderColor: "rgb(var(--border))" }}
                        >
                          <div className="flex justify-between items-center gap-2">
                            <span className="text-[10px] text-zinc-400 italic truncate flex-1 font-mono">
                              "{item.text}"
                            </span>
                            <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-bold uppercase">
                              Verified ✓
                            </span>
                          </div>
                          <div className="text-[10px] font-mono text-zinc-500 flex items-center gap-1">
                            <span className="text-emerald-500/60">CID:</span>
                            <span className="select-all cursor-pointer hover:text-emerald-400 transition-colors">
                              {item.cid}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center rounded-2xl border border-dashed bg-zinc-800/10" style={{ borderColor: "rgb(var(--border))" }}>
                      <p className="text-xs" style={{ color: "rgb(var(--text-muted))" }}>
                        Send some messages first to generate content signatures. 🛡️
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-3 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 text-[10px] leading-relaxed text-center text-zinc-400 mt-1">
                  💡 <strong>Cryptographic Audit:</strong> Matching CIDs on both devices confirm the channel's cryptographic integrity.
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </AppShell>
  );
}
