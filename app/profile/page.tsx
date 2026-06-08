"use client";

import { AppShell } from "@/frontend/components/layouts/AppShell";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef } from "react";
import { useAuthStore } from "@/frontend/store";
import { getXPLevel } from "@/backend/lib/utils";
import { Camera, Edit3, Send, Trophy, Star, Flame, LogOut, ChevronRight, Check, X, Loader2, Settings } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useClerk } from "@clerk/nextjs";
import { Avatar } from "@/frontend/components/Avatar";
import { PartnerCard } from "@/frontend/components/PartnerCard";

const BADGES = [
  { icon: "🌟", name: "First Week", desc: "Stayed connected for 7 days", earned: true },
  { icon: "💬", name: "Chatterbox", desc: "Sent 100 messages", earned: true },
  { icon: "📸", name: "Photographer", desc: "Uploaded 10 memories", earned: false },
  { icon: "🔥", name: "On Fire", desc: "30-day streak", earned: false },
  { icon: "💜", name: "Soulmate", desc: "1 year together", earned: false },
  { icon: "✈️", name: "Adventurers", desc: "Planned 3 trips", earned: false },
];

export default function ProfilePage() {
  const { user, couple, logout, setUser, setCouple } = useAuthStore();
  const { signOut } = useClerk();
  const partner = couple ? (couple.user1.id === user?.id ? couple.user2 : couple.user1) : null;
  const xpInfo = getXPLevel(user?.xpPoints || 0);
  const [inviteEmail, setInviteEmail] = useState("");
  const [sendingInvite, setSendingInvite] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState(user?.name || "");
  const [editBio, setEditBio] = useState(user?.bio || "");
  const [isSaving, setIsSaving] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function sendInvite() {
    if (!inviteEmail.trim()) return;
    setSendingInvite(true);
    
    try {
      const res = await fetch("/api/couple/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverEmail: inviteEmail })
      });
      const data = await res.json();
      
      if (res.ok) {
        setInviteSent(true);
        toast.success(`Invite sent to ${inviteEmail} 💜`);
        if (data.inviteCode) {
          console.log("Local testing invite url:", data.inviteUrl);
        }
      } else {
        toast.error(data.error || "Failed to send invite");
      }
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setSendingInvite(false);
    }
  }

  async function handleLogout() {
    try {
      await signOut();
    } catch (err) {
      console.error("Clerk signout error:", err);
    }
    logout();
    window.location.href = "/login";
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be smaller than 10MB");
      return;
    }

    const uploadToast = toast.loading("Uploading profile picture...");

    try {
      const base64Avatar = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            const targetSize = 256;
            canvas.width = targetSize;
            canvas.height = targetSize;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              const minDim = Math.min(img.width, img.height);
              const sx = (img.width - minDim) / 2;
              const sy = (img.height - minDim) / 2;
              ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, targetSize, targetSize);
            }
            resolve(canvas.toDataURL("image/jpeg", 0.8));
          };
          img.onerror = () => reject(new Error("Could not decode image"));
          img.src = result;
        };
        reader.onerror = () => reject(new Error("Could not read file"));
        reader.readAsDataURL(file);
      });

      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: user?.name, bio: user?.bio, avatar: base64Avatar }),
      });

      const data = await res.json();
      toast.dismiss(uploadToast);

      if (res.ok) {
        setUser(data.user);
        toast.success("Profile picture updated! 📸");
      } else {
        toast.error(data.error || "Failed to update picture");
      }
    } catch (err: any) {
      toast.dismiss(uploadToast);
      console.error("Avatar upload error:", err);
      toast.error(err.message || "Failed to process image");
    }

    e.target.value = "";
  }

  async function handleSaveProfile() {
    if (!editName.trim()) {
      toast.error("Name is required");
      return;
    }
    
    setIsSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, bio: editBio }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");
      
      setUser(data.user);
      toast.success("Profile updated successfully!");
      setIsEditModalOpen(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  // Framer Motion staggered entrance animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15,
      },
    },
  };

  return (
    <AppShell>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="px-4 pt-6 pb-28 space-y-6 max-w-md mx-auto"
      >
        {/* Avatar + Name section with custom circular premium avatar */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col items-center text-center gap-4"
        >
          <Avatar
            src={user?.avatar}
            name={user?.name || "U"}
            size={120}
            editable={true}
            onEditClick={() => fileInputRef.current?.click()}
            gradientBorder={true}
            glow={true}
            floating={true}
          />
          
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleAvatarChange} 
          />

          <div className="space-y-1">
            <h1 className="font-display font-bold text-2xl text-white tracking-tight">
              {user?.name}
            </h1>
            <p className="text-sm text-violet-300/60 font-medium">{user?.email}</p>
            <p className="text-sm text-violet-200/50 italic px-4 mt-2 max-w-[280px] mx-auto leading-relaxed">
              {user?.bio || "No bio yet"}
            </p>
          </div>

          {/* XP Badges */}
          <div className="flex items-center gap-2 flex-wrap justify-center mt-1">
            <div className="badge-pill bg-violet-500/10 border-violet-500/25 text-violet-300">
              <Flame size={12} className="text-pink-500 animate-pulse" /> {user?.streakDays || 0} day streak
            </div>
            <div className="badge-pill bg-violet-500/10 border-violet-500/25 text-violet-300">
              <Star size={12} className="text-violet-400" /> Level {xpInfo.level}
            </div>
            <div className="badge-pill bg-violet-500/10 border-violet-500/25 text-violet-300">
              <Trophy size={12} className="text-amber-400" /> {user?.xpPoints || 0} XP
            </div>
          </div>
        </motion.div>

        {/* XP Card with premium glassmorphism styling */}
        <motion.div
          variants={itemVariants}
          className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl rounded-3xl p-5 transition-all duration-300 hover:border-violet-500/30"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-white tracking-wide">{xpInfo.title}</p>
            <p className="text-xs text-violet-200/50 font-medium">
              {user?.xpPoints || 0} / {xpInfo.nextLevelXP} XP
            </p>
          </div>
          <div className="xp-bar-track bg-white/5 h-2.5 rounded-full overflow-hidden">
            <motion.div 
              className="xp-bar-fill h-full bg-gradient-to-r from-violet-600 to-pink-500 rounded-full" 
              initial={{ width: 0 }} 
              animate={{ width: `${xpInfo.progress}%` }} 
              transition={{ duration: 1, ease: "easeOut" }} 
            />
          </div>
        </motion.div>

        {/* Partner Card Component */}
        <PartnerCard
          partner={partner}
          inviteEmail={inviteEmail}
          setInviteEmail={setInviteEmail}
          sendInvite={sendInvite}
          sendingInvite={sendingInvite}
          inviteSent={inviteSent}
        />

        {/* Badges Card with glassmorphism */}
        <motion.div
          variants={itemVariants}
          className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl rounded-3xl p-5 transition-all duration-300 hover:border-violet-500/30"
        >
          <h2 className="font-display font-bold text-base mb-4 text-violet-300 tracking-wide">
            Badges
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {BADGES.map((badge) => (
              <div
                key={badge.name}
                className="flex flex-col items-center gap-1.5 p-3 rounded-2xl text-center transition-all duration-200 hover:scale-105"
                style={{
                  background: badge.earned ? "rgba(124, 58, 237, 0.15)" : "rgba(255, 255, 255, 0.03)",
                  border: badge.earned ? "1px solid rgba(124, 58, 237, 0.3)" : "1px solid rgba(255, 255, 255, 0.05)",
                  opacity: badge.earned ? 1 : 0.4,
                }}
              >
                <span className="text-2xl filter drop-shadow-[0_2px_8px_rgba(124,58,237,0.3)]">
                  {badge.icon}
                </span>
                <p className="text-[11px] font-semibold text-white tracking-tight">
                  {badge.name}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Actions List with micro-interactions and glassmorphic designs */}
        <motion.div variants={itemVariants} className="space-y-2.5">
          <button
            onClick={() => {
              setEditName(user?.name || "");
              setEditBio(user?.bio || "");
              setIsEditModalOpen(true);
            }}
            className="w-full flex items-center gap-3.5 p-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-violet-500/30 hover:bg-white/10 transition-all duration-300 text-left cursor-pointer group"
          >
            <Edit3 size={18} className="text-violet-400 group-hover:scale-110 transition-transform" />
            <span className="flex-1 text-sm font-medium text-white">Edit Profile</span>
            <ChevronRight size={16} className="text-violet-300/40 group-hover:translate-x-1 group-hover:text-violet-300 transition-all" />
          </button>
          
          <Link
            href="/settings"
            className="w-full flex items-center gap-3.5 p-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-violet-500/30 hover:bg-white/10 transition-all duration-300 text-left group"
          >
            <Settings size={18} className="text-blue-400 group-hover:rotate-45 transition-transform duration-300" />
            <span className="flex-1 text-sm font-medium text-white">Settings</span>
            <ChevronRight size={16} className="text-violet-300/40 group-hover:translate-x-1 group-hover:text-violet-300 transition-all" />
          </Link>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3.5 p-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-red-500/30 hover:bg-red-500/10 transition-all duration-300 text-left cursor-pointer group"
          >
            <LogOut size={18} className="text-red-400 group-hover:translate-x-0.5 transition-transform" />
            <span className="flex-1 text-sm font-medium style={{ color: 'rgb(239,68,68)' }} text-red-400">
              Sign Out
            </span>
          </button>
        </motion.div>
      </motion.div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0f0b1f] border border-white/10 shadow-2xl rounded-3xl w-full max-w-sm overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-white/5">
                <h3 className="font-display font-bold text-white">Edit Profile</h3>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-1.5 rounded-xl text-violet-200/50 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-violet-300">Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="input-field w-full text-sm py-2.5 px-4 rounded-2xl bg-white/5 border-white/10 text-white focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-violet-300">Bio</label>
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    className="input-field w-full text-sm py-2.5 px-4 rounded-2xl bg-white/5 border-white/10 text-white min-h-[80px] resize-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30"
                    placeholder="Tell us about yourself..."
                  />
                </div>
              </div>
              <div className="p-4 pt-0">
                <button 
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="btn-brand w-full justify-center py-3 rounded-2xl text-white font-semibold flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : "Save Changes"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}

