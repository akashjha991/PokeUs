"use client";

import React from "react";
import { RelationshipData, AISummary } from "@/shared/types/wrapped";
import { Sparkles, Heart } from "lucide-react";

interface ThemeProps {
  data: RelationshipData;
  aiSummary: AISummary;
}

export default function NightSkyConstellationWrapped({ data, aiSummary }: ThemeProps) {
  return (
    <div
      className="relative w-[1080px] h-[1920px] bg-gradient-to-b from-[#090D1A] via-[#0D1527] to-[#030712] text-white flex flex-col justify-between p-[80px] overflow-hidden select-none"
      style={{
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      {/* Background Starry Sky */}
      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#ffffff_1.5px,transparent_1.5px)] [background-size:24px_24px] pointer-events-none" />
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_2px,transparent_2px)] [background-size:48px_48px] pointer-events-none" />

      {/* Nebula Glowing Effects */}
      <div className="absolute top-[25%] left-[10%] w-[500px] h-[500px] rounded-full bg-indigo-500/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[35%] right-[10%] w-[500px] h-[500px] rounded-full bg-pink-500/15 blur-[120px] pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col items-center mt-[20px] text-center space-y-3 relative z-10">
        <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-5 py-2 rounded-full text-indigo-300 font-bold uppercase tracking-widest text-[16px]">
          <Sparkles className="w-5 h-5" /> Written in the Stars
        </div>
        <h1 className="text-[68px] font-black tracking-tight leading-none bg-gradient-to-r from-indigo-200 via-pink-200 to-rose-200 bg-clip-text text-transparent">
          Written In The Stars
        </h1>
        <p className="text-[24px] text-indigo-200/60 font-medium">
          PokeUs Wrapped · {data.weekRange}
        </p>
      </div>

      {/* Heart-Shaped Constellation & Couple Silhouette */}
      <div className="flex-1 my-[40px] relative flex flex-col items-center justify-center">
        {/* Constellation Lines SVG */}
        <div className="absolute w-[650px] h-[650px] text-indigo-300/40">
          <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="0.8">
            {/* Heart shape paths connecting glowing stars */}
            <path 
              d="M 100 165 L 60 135 L 35 95 L 35 60 Q 35 30 65 30 Q 85 30 100 55 Q 115 30 135 30 Q 165 30 165 60 L 165 95 L 140 135 Z" 
              strokeDasharray="4 4"
            />
            {/* Inner web connecting stars */}
            <line x1="60" y1="135" x2="100" y2="55" />
            <line x1="140" y1="135" x2="100" y2="55" />
            <line x1="35" y1="95" x2="165" y2="95" />
            
            {/* Constellation Star Nodes */}
            <g fill="#A5B4FC">
              {/* Node 1: Love Score */}
              <circle cx="100" cy="55" r="5" className="animate-ping" />
              <circle cx="100" cy="55" r="4.5" />
              
              {/* Node 2: Streak */}
              <circle cx="65" cy="30" r="4.5" />
              <circle cx="135" cy="30" r="4.5" />
              
              {/* Node 3: Messages */}
              <circle cx="35" cy="95" r="4.5" />
              <circle cx="165" cy="95" r="4.5" />

              {/* Node 4: Memories */}
              <circle cx="60" cy="135" r="4.5" />
              <circle cx="140" cy="135" r="4.5" />

              {/* Node 5: Pokes */}
              <circle cx="100" cy="165" r="5" className="animate-pulse" />
              <circle cx="100" cy="165" r="4.5" />
            </g>
          </svg>
        </div>

        {/* Silhouette couple overlaying at the bottom of the constellation */}
        <div className="absolute bottom-[-10px] w-[320px] h-[220px] text-slate-800/80 pointer-events-none z-10 flex items-end justify-center">
          <svg viewBox="0 0 100 70" className="w-full h-full text-indigo-950/70" fill="currentColor">
            {/* Silhouette Hill */}
            <path d="M 0 70 Q 50 45 100 70 L 100 70 L 0 70 Z" />
            {/* Silhouette couple hugging/sitting */}
            <path d="M 43 55 C 43 50, 48 45, 48 38 C 48 36, 45 35, 45 33 C 45 31, 47 28, 50 28 C 53 28, 55 31, 55 33 C 55 35, 52 36, 52 38 C 52 45, 57 50, 57 55 Z" />
            {/* Cute details */}
            <circle cx="48" cy="24" r="1.5" className="animate-ping" fill="#FFEAA7" />
          </svg>
        </div>

        {/* Central Neon statistics card */}
        <div 
          className="relative z-20 w-[620px] bg-slate-950/70 border border-pink-500/30 rounded-[32px] p-8 flex flex-col space-y-6 backdrop-blur-lg mt-[380px]"
          style={{
            boxShadow: "0 0 50px rgba(236, 72, 153, 0.15), inset 0 0 20px rgba(236, 72, 153, 0.05)",
          }}
        >
          <div className="flex justify-between items-center border-b border-indigo-500/20 pb-4">
            <span className="text-[20px] uppercase tracking-widest text-indigo-300 font-extrabold">Weekly Constellation</span>
            <span className="px-4 py-1.5 bg-pink-500/20 border border-pink-500/30 text-pink-300 rounded-full text-[18px] font-bold">
              Love Score: {data.loveScore}/100
            </span>
          </div>

          <p className="text-[30px] leading-relaxed text-indigo-100 font-serif italic text-center">
            {aiSummary.story || "Our stars aligned this week, creating a radiant path filled with deep conversations, laughter, and pokes."}
          </p>

          <div className="grid grid-cols-4 gap-4 border-t border-indigo-500/20 pt-4">
            {[
              { label: "msgs", val: data.messages },
              { label: "pokes", val: data.pokes },
              { label: "memories", val: data.memories },
              { label: "streak", val: `${data.streak}d` },
            ].map((node, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <span className="text-[34px] font-black text-pink-400">{node.val}</span>
                <span className="text-[14px] uppercase tracking-widest text-indigo-300/60 font-extrabold mt-1">{node.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center relative z-10 border-t border-indigo-500/20 pt-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            {data.partner1Image ? (
              <img src={data.partner1Image} alt={data.partner1Name} className="w-[60px] h-[60px] rounded-full object-cover border-2 border-indigo-500" />
            ) : (
              <div className="w-[60px] h-[60px] rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-[22px]">{data.partner1Name.charAt(0)}</div>
            )}
            <span className="text-[22px] font-bold text-white">{data.partner1Name}</span>
          </div>
          <span className="text-pink-400 font-serif text-[24px]">&amp;</span>
          <div className="flex items-center gap-3">
            <span className="text-[22px] font-bold text-white">{data.partner2Name}</span>
            {data.partner2Image ? (
              <img src={data.partner2Image} alt={data.partner2Name} className="w-[60px] h-[60px] rounded-full object-cover border-2 border-indigo-500" />
            ) : (
              <div className="w-[60px] h-[60px] rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-[22px]">{data.partner2Name.charAt(0)}</div>
            )}
          </div>
        </div>

        <div className="text-right">
          <p className="text-[26px] font-extrabold bg-gradient-to-r from-indigo-300 to-pink-300 bg-clip-text text-transparent">
            PokeUs Wrapped
          </p>
          <p className="text-[16px] text-gray-400 uppercase tracking-widest font-semibold mt-1">
            Made with love &amp; stars ❤️
          </p>
        </div>
      </div>
    </div>
  );
}
