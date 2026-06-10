"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

interface ImageViewerProps {
  image: string;
  onClose: () => void;
  onDragStateChange?: (isDragging: boolean) => void;
}

export function ImageViewer({ image, onClose, onDragStateChange }: ImageViewerProps) {
  const [scale, setScale] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [isInteracting, setIsInteracting] = useState(false);

  // References to track touch/pointer states
  const lastTap = useRef<number>(0);
  const startX = useRef<number>(0);
  const startY = useRef<number>(0);
  const startPanX = useRef<number>(0);
  const startPanY = useRef<number>(0);
  const initialDistance = useRef<number>(0);
  const initialScale = useRef<number>(1);
  const imageRef = useRef<HTMLDivElement>(null);

  // Notify parent component about dragging/interacting state (so background overlay can adjust opacity)
  useEffect(() => {
    onDragStateChange?.(isInteracting || dragY !== 0);
  }, [isInteracting, dragY, onDragStateChange]);

  // Handle Double Tap / Double Click to zoom
  const handleDoubleTap = (clientX: number, clientY: number) => {
    if (scale > 1) {
      // Zoom out
      setIsInteracting(false);
      setScale(1);
      setPanX(0);
      setPanY(0);
    } else {
      // Zoom in at tap point
      setIsInteracting(false);
      setScale(2.5);

      // Center the zoom around the double tap position
      if (imageRef.current) {
        const rect = imageRef.current.getBoundingClientRect();
        const offsetX = clientX - (rect.left + rect.width / 2);
        const offsetY = clientY - (rect.top + rect.height / 2);
        // Pan in opposite direction of displacement to keep tap point centered
        setPanX(-offsetX * 1.5);
        setPanY(-offsetY * 1.5);
      }
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only handle primary button clicks/touches
    if (e.button !== 0) return;

    // Detect double tap / click
    const now = Date.now();
    if (now - lastTap.current < 300) {
      handleDoubleTap(e.clientX, e.clientY);
      lastTap.current = 0; // Reset
      return;
    }
    lastTap.current = now;

    // Start tracking drag/pan
    setIsInteracting(true);
    startX.current = e.clientX;
    startY.current = e.clientY;
    startPanX.current = panX;
    startPanY.current = panY;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isInteracting) return;

    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;

    if (scale > 1) {
      // Pan zoomed-in image
      setPanX(startPanX.current + dx);
      setPanY(startPanY.current + dy);
    } else {
      // Swipe down to close (only allow downward drag for closing)
      if (dy > 0) {
        setDragY(dy);
      } else {
        // Apply slight resistance for upward drag when not zoomed
        setDragY(dy * 0.2);
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isInteracting) return;
    setIsInteracting(false);
    e.currentTarget.releasePointerCapture(e.pointerId);

    if (scale === 1) {
      // Check if dragged down far enough to trigger close
      if (dragY > 120) {
        onClose();
      } else {
        // Reset position
        setDragY(0);
      }
    } else {
      // Clamp pan bounds so image doesn't fly off-screen
      if (imageRef.current) {
        const rect = imageRef.current.getBoundingClientRect();
        const maxPanX = (rect.width * (scale - 1)) / 2;
        const maxPanY = (rect.height * (scale - 1)) / 2;

        // Allow some freedom but contain bounds nicely
        setPanX((prev) => Math.max(-maxPanX, Math.min(maxPanX, prev)));
        setPanY((prev) => Math.max(-maxPanY, Math.min(maxPanY, prev)));
      }
    }
  };

  // Touch handlers for multi-touch pinch to zoom on mobile
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      setIsInteracting(true);
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      initialDistance.current = dist;
      initialScale.current = scale;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && isInteracting) {
      e.preventDefault();
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / initialDistance.current;
      const newScale = Math.max(1, Math.min(4, initialScale.current * factor));
      setScale(newScale);

      // Reset panning when pinching out back to 1
      if (newScale === 1) {
        setPanX(0);
        setPanY(0);
      }
    }
  };

  const handleTouchEnd = () => {
    if (scale < 1.05) {
      setScale(1);
      setPanX(0);
      setPanY(0);
    }
    setIsInteracting(false);
  };

  // Calculate dynamic transition
  const transition = isInteracting
    ? { type: "tween" as const, duration: 0 } // No delay during active swipe/pan
    : { type: "spring" as const, stiffness: 300, damping: 28 };

  // Calculate opacity reduction when dragging down to close
  const dragOpacity = scale === 1 ? Math.max(0.4, 1 - dragY / 400) : 1;

  return (
    <div
      className="relative w-full h-full flex items-center justify-center select-none overflow-hidden touch-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      style={{ opacity: dragOpacity }}
    >
      <motion.div
        ref={imageRef}
        className="w-full h-full flex items-center justify-center"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        animate={{
          scale: scale,
          x: panX,
          y: panY + dragY,
        }}
        transition={transition}
      >
        <img
          src={image}
          alt="Profile picture preview"
          className="max-w-[90vw] max-h-[80vh] rounded-[32px] object-contain shadow-2xl border border-white/10 pointer-events-none select-none"
          draggable={false}
        />
      </motion.div>
    </div>
  );
}
