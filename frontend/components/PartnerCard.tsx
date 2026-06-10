"use client";

import { motion } from "framer-motion";
import { Check, Send } from "lucide-react";
import { Avatar } from "./Avatar";
import type { User } from "@/shared/types";

interface PartnerCardProps {
  partner: User | null;
  inviteEmail: string;
  setInviteEmail: (email: string) => void;
  sendInvite: () => Promise<void>;
  sendingInvite: boolean;
  inviteSent: boolean;
  onAvatarClick?: () => void;
}

export function PartnerCard({
  partner,
  inviteEmail,
  setInviteEmail,
  sendInvite,
  sendingInvite,
  inviteSent,
  onAvatarClick,
}: PartnerCardProps) {
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
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
    <motion.div
      variants={cardVariants}
      className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl rounded-3xl p-6 transition-all duration-300 hover:border-violet-500/30 hover:shadow-[0_0_30px_rgba(124,58,237,0.15)]"
    >
      <h2 className="font-display font-bold text-base mb-4 text-violet-300 tracking-wide">
        Partner Info
      </h2>

      {partner ? (
        <div className="flex flex-col items-center text-center gap-4">
          {/* Circular partner avatar: 64px x 64px, violet ring border */}
          <Avatar
            src={partner.avatar}
            name={partner.name}
            size={64}
            borderClass="border-2 border-violet-500/50"
            onClick={onAvatarClick}
          />

          <div className="space-y-1">
            <p className="font-semibold text-lg text-white">{partner.name}</p>
            <p className="text-sm text-violet-200/60">{partner.email}</p>
          </div>

          {/* Connected Badge: Green glass effect, glow border, pill shape */}
          <div className="mt-1 flex justify-center">
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 backdrop-blur-md text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.25)]">
              <Check size={12} className="stroke-[3px]" /> Connected
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-violet-200/70">
            Invite your partner to connect your private space.
          </p>
          {!inviteSent ? (
            <div className="flex gap-2">
              <input
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="input-field flex-1 text-sm py-2.5 px-4 rounded-2xl bg-white/5 border-white/10 text-white placeholder-violet-200/30 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30"
                placeholder="partner@email.com"
                type="email"
              />
              <button
                onClick={sendInvite}
                disabled={sendingInvite || !inviteEmail.trim()}
                className="btn-brand py-2 px-5 rounded-2xl flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
              >
                <Send size={15} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <Check size={16} className="text-emerald-400" />
              <p className="text-sm text-emerald-400">
                Invite sent to {inviteEmail}!
              </p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
