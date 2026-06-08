"use client";

import { motion } from "framer-motion";
import { Camera } from "lucide-react";
import { getInitials } from "@/backend/lib/utils";

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: number; // e.g. 120 or 64
  editable?: boolean;
  onEditClick?: () => void;
  gradientBorder?: boolean;
  glow?: boolean;
  floating?: boolean;
  borderClass?: string; // e.g. "border-2 border-violet-500/50"
}

export function Avatar({
  src,
  name,
  size = 120,
  editable = false,
  onEditClick,
  gradientBorder = false,
  glow = false,
  floating = false,
  borderClass = "",
}: AvatarProps) {
  const containerVariants = {
    initial: { opacity: 0, scale: 0.8 },
    animate: {
      opacity: 1,
      scale: 1,
      y: floating ? [0, -6, 0] : 0,
      transition: {
        opacity: { duration: 0.5, ease: "easeOut" as const },
        scale: { duration: 0.5, ease: "easeOut" as const },
        y: floating
          ? {
              repeat: Infinity,
              duration: 3,
              repeatType: "reverse" as const,
              ease: "easeInOut" as const,
            }
          : undefined,
      },
    },
  };

  const containerClasses = [
    "relative rounded-full flex items-center justify-center select-none overflow-visible",
    glow ? "shadow-[0_0_40px_rgba(124,58,237,0.45)]" : "",
    gradientBorder ? "bg-gradient-to-r from-violet-600 to-pink-500 p-[3px]" : "",
    !gradientBorder && borderClass ? `p-[2px] ${borderClass}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      whileTap={{ scale: editable ? 0.95 : 1 }}
      className={containerClasses}
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      {/* Inner Avatar Content */}
      <div className="w-full h-full rounded-full overflow-hidden bg-gradient-brand flex items-center justify-center text-white font-bold">
        {src ? (
          <img
            src={src}
            alt={name}
            className="w-full h-full object-cover rounded-full"
            style={{ objectPosition: "center" }}
          />
        ) : (
          <span style={{ fontSize: `${size * 0.35}px` }}>
            {getInitials(name || "U")}
          </span>
        )}
      </div>

      {/* Overlapping camera icon for profile editing */}
      {editable && (
        <button
          onClick={onEditClick}
          type="button"
          className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-gradient-to-r from-violet-600 to-pink-500 border-2 border-white dark:border-[#0f0b1f] flex items-center justify-center shadow-lg hover:brightness-110 hover:scale-105 active:scale-95 transition-all duration-200 z-20 cursor-pointer"
        >
          <Camera size={16} className="text-white" />
        </button>
      )}
    </motion.div>
  );
}
