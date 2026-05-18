"use client";

import { AppShell } from "@/frontend/components/layouts/AppShell";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef } from "react";
import { useAuthStore } from "@/frontend/store";
import { getInitials, getXPLevel } from "@/backend/lib/utils";
import { Camera, Edit3, Mail, Send, Shield, Trophy, Star, Flame, LogOut, ChevronRight, Check, X, Loader2, Settings, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
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
    await fetch("/api/auth/logout", { method: "POST" });
    logout();
    window.location.href = "/login";
  }



  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Downscale and compress the image using HTML5 Canvas to prevent storing huge Base64 strings
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = async () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // Target profile square size: 256x256
        const targetSize = 256;
        canvas.width = targetSize;
        canvas.height = targetSize;

        // Draw cropped center square
        if (ctx) {
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, targetSize, targetSize);
        }

        const base64Avatar = canvas.toDataURL("image/jpeg", 0.8);

        const res = await fetch("/api/user/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: user?.name, bio: user?.bio, avatar: base64Avatar }),
        });

        const data = await res.json();
        if (res.ok) {
          setUser(data.user);
          toast.success("Profile picture updated! 📸");
        } else {
          toast.error(data.error || "Failed to update picture");
        }
      } catch (err) {
        console.error("Avatar compression error:", err);
        toast.error("Failed to process image");
      }
    };
    img.onerror = () => {
      toast.error("Failed to load image file");
    };
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

  return (
    <AppShell>
      <div className="px-4 pt-6 pb-4 space-y-5" style={{ color: "rgb(var(--text))" }}>
        {/* Avatar + Name */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center text-center gap-3">
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl bg-gradient-brand flex items-center justify-center text-white font-bold text-3xl shadow-brand overflow-hidden">
              {user?.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover rounded-3xl" /> : getInitials(user?.name || "U")}
            </div>
            
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleAvatarChange} 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-gradient-brand flex items-center justify-center shadow-brand cursor-pointer z-10"
            >
              <Camera size={14} className="text-white" />
            </button>
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl">{user?.name}</h1>
            <p className="text-sm" style={{ color: "rgb(var(--text-muted))" }}>{user?.email}</p>
            <p className="text-sm mt-1" style={{ color: "rgb(var(--text-subtle))" }}>{user?.bio || "No bio yet"}</p>
          </div>

          {/* XP Badge */}
          <div className="flex items-center gap-3">
            <div className="badge-pill"><Flame size={11} /> {user?.streakDays || 0} day streak</div>
            <div className="badge-pill"><Star size={11} /> Level {xpInfo.level}</div>
            <div className="badge-pill"><Trophy size={11} /> {user?.xpPoints || 0} XP</div>
          </div>
        </motion.div>

        {/* XP Bar */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold">{xpInfo.title}</p>
            <p className="text-xs" style={{ color: "rgb(var(--text-muted))" }}>{user?.xpPoints || 0} / {xpInfo.nextLevelXP} XP</p>
          </div>
          <div className="xp-bar-track">
            <motion.div className="xp-bar-fill" initial={{ width: 0 }} animate={{ width: `${xpInfo.progress}%` }} transition={{ duration: 1 }} />
          </div>
        </div>

        {/* Couple Status */}
        <div className="card p-5">
          <h2 className="font-display font-bold text-base mb-3">Partner</h2>
          {partner ? (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-brand flex items-center justify-center text-white font-bold overflow-hidden">
                {partner.avatar ? <img src={partner.avatar} className="w-full h-full object-cover" /> : getInitials(partner.name)}
              </div>
              <div className="flex-1">
                <p className="font-semibold">{partner.name}</p>
                <p className="text-sm" style={{ color: "rgb(var(--text-muted))" }}>{partner.email}</p>
              </div>
              <div className="badge-pill" style={{ background: "rgba(16,185,129,0.15)", color: "#10b981", borderColor: "rgba(16,185,129,0.25)" }}>
                <Check size={10} /> Connected
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm" style={{ color: "rgb(var(--text-muted))" }}>
                Invite your partner to connect your private space.
              </p>
              {!inviteSent ? (
                <div className="flex gap-2">
                  <input
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="input-field flex-1"
                    placeholder="partner@email.com"
                    type="email"
                  />
                  <button onClick={sendInvite} disabled={sendingInvite || !inviteEmail.trim()} className="btn-brand py-2 px-4">
                    <Send size={15} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: "rgba(16,185,129,0.1)" }}>
                  <Check size={16} style={{ color: "#10b981" }} />
                  <p className="text-sm" style={{ color: "#10b981" }}>Invite sent to {inviteEmail}!</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Badges */}
        <div className="card p-5">
          <h2 className="font-display font-bold text-base mb-4">Badges</h2>
          <div className="grid grid-cols-3 gap-3">
            {BADGES.map((badge, i) => (
              <div
                key={badge.name}
                className="flex flex-col items-center gap-1.5 p-3 rounded-2xl text-center"
                style={{
                  background: badge.earned ? "rgba(217,70,239,0.1)" : "rgb(var(--surface-muted))",
                  border: badge.earned ? "1px solid rgba(217,70,239,0.25)" : "1px solid rgb(var(--border))",
                  opacity: badge.earned ? 1 : 0.5,
                }}
              >
                <span className="text-2xl">{badge.icon}</span>
                <p className="text-xs font-semibold" style={{ color: badge.earned ? "rgb(217,70,239)" : "rgb(var(--text-muted))" }}>{badge.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button onClick={() => {
            setEditName(user?.name || "");
            setEditBio(user?.bio || "");
            setIsEditModalOpen(true);
          }} className="card w-full flex items-center gap-3 p-4 text-left">
            <Edit3 size={18} style={{ color: "rgb(217,70,239)" }} />
            <span className="flex-1 text-sm font-medium">Edit Profile</span>
            <ChevronRight size={16} style={{ color: "rgb(var(--text-subtle))" }} />
          </button>
          <Link href="/settings" className="card w-full flex items-center gap-3 p-4 text-left">
            <Settings size={18} style={{ color: "rgb(59,130,246)" }} />
            <span className="flex-1 text-sm font-medium">Settings</span>
            <ChevronRight size={16} style={{ color: "rgb(var(--text-subtle))" }} />
          </Link>
          <button onClick={handleLogout} className="card w-full flex items-center gap-3 p-4 text-left">
            <LogOut size={18} style={{ color: "rgb(239,68,68)" }} />
            <span className="flex-1 text-sm font-medium" style={{ color: "rgb(239,68,68)" }}>Sign Out</span>
          </button>
        </div>


      </div>

      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="card w-full max-w-sm overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "rgb(var(--border))" }}>
                <h3 className="font-display font-bold">Edit Profile</h3>
                <button onClick={() => setIsEditModalOpen(false)} className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <X size={18} />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "rgb(var(--text-muted))" }}>Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="input-field w-full text-sm py-2"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "rgb(var(--text-muted))" }}>Bio</label>
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    className="input-field w-full text-sm py-2 min-h-[80px] resize-none"
                    placeholder="Tell us about yourself..."
                  />
                </div>
              </div>
              <div className="p-4 pt-0">
                <button 
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="btn-brand w-full justify-center py-2.5"
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
