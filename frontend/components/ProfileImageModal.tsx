"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { ImageViewer } from "./ImageViewer";

interface ProfileImageModalProps {
  image: string;
  onClose: () => void;
}

export function ProfileImageModal({ image, onClose }: ProfileImageModalProps) {
  const [isDragging, setIsDragging] = useState(false);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Prevent body scrolling when the modal is open
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      {/* Close Button top-right */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-6 right-6 z-[1000] p-3 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-md shadow-lg transition-all active:scale-95 duration-200 cursor-pointer hover:rotate-90"
        title="Close Preview"
      >
        <X size={24} />
      </button>

      {/* Image container with opening scale/zoom animations */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", stiffness: 350, damping: 30 }}
        className="w-full h-full flex items-center justify-center"
        onClick={(e) => e.stopPropagation()} // Prevent click propagation to overlay backdrop
      >
        <ImageViewer
          image={image}
          onClose={onClose}
          onDragStateChange={setIsDragging}
        />
      </motion.div>
    </motion.div>
  );
}
