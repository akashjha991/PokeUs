"use client";

import React, { useEffect, useRef, useState } from "react";
import { RelationshipData, AISummary } from "@/shared/types/wrapped";
import StorybookWrapped from "./themes/StorybookWrapped";
import ScrapbookWrapped from "./themes/ScrapbookWrapped";
import LoveLetterWrapped from "./themes/LoveLetterWrapped";
import MemoryTimelineWrapped from "./themes/MemoryTimelineWrapped";
import PolaroidWallWrapped from "./themes/PolaroidWallWrapped";
import NightSkyConstellationWrapped from "./themes/NightSkyConstellationWrapped";
import { motion, AnimatePresence } from "framer-motion";

interface WrappedContainerProps {
  data: RelationshipData;
  aiSummary: AISummary;
  theme: string;
  isExportMode?: boolean; // If true, disable responsive scaling and just render at 1080x1920
}

export default function WrappedContainer({
  data,
  aiSummary,
  theme,
  isExportMode = false,
}: WrappedContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (isExportMode) return;

    function handleResize() {
      if (!containerRef.current) return;
      const parentWidth = containerRef.current.parentElement?.clientWidth || 360;
      // Calculate scale factor so 1080px fits parent
      const calculatedScale = Math.min(parentWidth / 1080, 0.5); // cap at 0.5 for large screens, or scale accordingly
      setScale(parentWidth / 1080);
    }

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isExportMode]);

  // Select the appropriate theme component
  const renderTheme = () => {
    switch (theme) {
      case "storybook":
        return <StorybookWrapped data={data} aiSummary={aiSummary} />;
      case "scrapbook":
        return <ScrapbookWrapped data={data} aiSummary={aiSummary} />;
      case "loveletter":
        return <LoveLetterWrapped data={data} aiSummary={aiSummary} />;
      case "timeline":
        return <MemoryTimelineWrapped data={data} aiSummary={aiSummary} />;
      case "polaroid":
        return <PolaroidWallWrapped data={data} aiSummary={aiSummary} />;
      case "constellation":
        return <NightSkyConstellationWrapped data={data} aiSummary={aiSummary} />;
      default:
        return <StorybookWrapped data={data} aiSummary={aiSummary} />;
    }
  };

  // If in export mode, render the raw theme directly without any scaling wrapper
  if (isExportMode) {
    return (
      <div id="wrapped-card" className="w-[1080px] h-[1920px] relative overflow-hidden">
        {renderTheme()}
      </div>
    );
  }

  // Preview Mode: Scale 1080x1920 down to fit the responsive preview container
  const scaledWidth = 1080 * scale;
  const scaledHeight = 1920 * scale;

  return (
    <div
      ref={containerRef}
      className="w-full flex justify-center items-start overflow-hidden py-2 select-none relative"
      style={{ height: scaledHeight }}
    >
      {/* Scaling Wrapper - prevents Framer Motion from overriding the calculated scale transform */}
      <div
        className="w-[1080px] h-[1920px] absolute origin-top"
        style={{
          transform: `scale(${scale})`,
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={theme}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="w-full h-full shadow-2xl rounded-[40px] overflow-hidden border border-white/10 relative"
            style={{
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            }}
          >
            {renderTheme()}

            {/* Floating hearts animation overlay for magical preview feel */}
            <FloatingHeartsOverlay />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// Sparkly floating hearts overlay
function FloatingHeartsOverlay() {
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number; size: number; duration: number }[]>([]);

  useEffect(() => {
    // Generate some random particles
    const list = Array.from({ length: 8 }).map((_, i) => ({
      id: i,
      x: Math.random() * 90 + 5, // percentage
      y: Math.random() * 30 + 70, // bottom area
      size: Math.random() * 25 + 15,
      duration: Math.random() * 6 + 4,
    }));
    setHearts(list);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
      {hearts.map((h) => (
        <motion.span
          key={h.id}
          className="absolute text-rose-400 opacity-60"
          style={{
            left: `${h.x}%`,
            fontSize: `${h.size}px`,
          }}
          initial={{ y: "1920px", opacity: 0 }}
          animate={{
            y: "-100px",
            opacity: [0, 0.7, 0.7, 0],
            rotate: [0, 45, -45, 0],
          }}
          transition={{
            duration: h.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: h.id * 0.8,
          }}
        >
          ❤️
        </motion.span>
      ))}
    </div>
  );
}
