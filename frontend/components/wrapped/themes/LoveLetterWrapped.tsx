"use client";

import React from "react";
import { RelationshipData, AISummary } from "@/shared/types/wrapped";
import { Heart } from "lucide-react";

interface ThemeProps {
  data: RelationshipData;
  aiSummary: AISummary;
}

export default function LoveLetterWrapped({ data, aiSummary }: ThemeProps) {
  return (
    <div
      className="relative w-[1080px] h-[1920px] bg-gradient-to-tr from-[#FDF2F8] to-[#FFF1F2] text-[#5C3F46] flex flex-col justify-between p-[80px] overflow-hidden select-none"
      style={{
        fontFamily: "'Playfair Display', serif",
      }}
    >
      {/* Background soft particles (floating hearts) */}
      <div className="absolute top-[10%] left-[5%] text-[48px] opacity-20 rotate-[-12deg] animate-pulse">❤️</div>
      <div className="absolute top-[20%] right-[8%] text-[36px] opacity-15 rotate-[15deg]">💖</div>
      <div className="absolute bottom-[25%] left-[8%] text-[42px] opacity-25 rotate-[8deg]">🌹</div>
      <div className="absolute bottom-[10%] right-[10%] text-[54px] opacity-20 rotate-[-15deg] animate-pulse">❤️</div>

      {/* Ribbon Header */}
      <div className="flex flex-col items-center mt-[20px] text-center space-y-2">
        <span className="text-[18px] uppercase tracking-[0.25em] font-semibold text-rose-400">
          A Letter to Our Relationship
        </span>
        <div className="h-[1px] w-[200px] bg-rose-200 my-2" />
        <span className="font-serif italic text-[24px] text-gray-400">
          Week: {data.weekRange}
        </span>
      </div>

      {/* Main Letter Board (elegant stationary card) */}
      <div 
        className="flex-1 bg-[#FFFDFB] border border-[#F5E6E8] rounded-[36px] p-[60px] my-[50px] flex flex-col justify-between relative"
        style={{
          boxShadow: "0 25px 60px rgba(225, 29, 72, 0.04), inset 0 0 60px rgba(253, 242, 248, 0.7)",
        }}
      >
        {/* Delicate Double Border */}
        <div className="absolute inset-[15px] border border-[#F3E1E4] rounded-[24px] pointer-events-none opacity-60" />
        <div className="absolute inset-[20px] border border-[#F8EAEB] rounded-[20px] pointer-events-none opacity-40" />

        {/* Wax Seal SVG watermark/background */}
        <div className="absolute bottom-[40px] right-[40px] opacity-90 z-20">
          <div className="relative w-[150px] h-[150px] flex items-center justify-center">
            {/* Wax Spill Outline */}
            <svg className="absolute inset-0 text-red-700/80 drop-shadow-lg" viewBox="0 0 100 100" fill="currentColor">
              <path d="M50,10 C75,5 92,20 90,48 C88,75 72,92 48,90 C20,88 5,75 10,50 C15,20 20,15 50,10 Z" />
            </svg>
            {/* Inner Ring */}
            <div className="w-[100px] h-[100px] rounded-full border-2 border-dashed border-red-500/20 bg-red-800 flex items-center justify-center relative z-10 shadow-inner">
              <span className="text-white text-[42px] leading-none select-none">❤️</span>
            </div>
          </div>
        </div>

        {/* Letter Top */}
        <div className="space-y-4">
          <p className="text-[36px] font-bold italic tracking-wide text-rose-800">
            Dearest {data.partner1Name} &amp; {data.partner2Name},
          </p>
          <div className="h-[2px] w-[80px] bg-rose-200" />
        </div>

        {/* Letter Body */}
        <div className="flex-1 flex flex-col justify-center py-6 space-y-6">
          <p className="text-[34px] leading-relaxed text-[#6B5A5E] font-serif tracking-wide text-justify">
            {aiSummary.story || "Another seven days have passed, and our bond continues to blossom in the most beautiful ways. Through every morning check-in and late-night message, we whisper our love into this small world we share..."}
          </p>

          {/* Special Insight Quote */}
          <div className="border-l-4 border-rose-300 pl-6 my-4 py-2 bg-rose-50/50 rounded-r-2xl">
            <p className="text-[28px] italic text-rose-700 font-sans tracking-wide leading-relaxed">
              &ldquo;{aiSummary.insight}&rdquo;
            </p>
          </div>
        </div>

        {/* Relationship Stats / Letter Signature */}
        <div className="border-t border-rose-100 pt-6 flex justify-between items-end">
          <div className="space-y-4">
            <p className="text-[22px] uppercase tracking-widest text-gray-400 font-sans font-bold">
              This Week's Signature
            </p>
            <div className="flex gap-12 font-sans">
              <div>
                <p className="text-[44px] font-black text-rose-700 leading-none">{data.loveScore}</p>
                <p className="text-[16px] text-gray-400 uppercase tracking-widest mt-1 font-semibold">Love Score</p>
              </div>
              <div>
                <p className="text-[44px] font-black text-rose-700 leading-none">{data.streak}</p>
                <p className="text-[16px] text-gray-400 uppercase tracking-widest mt-1 font-semibold">Days Streak</p>
              </div>
              <div>
                <p className="text-[44px] font-black text-rose-700 leading-none">{data.messages}</p>
                <p className="text-[16px] text-gray-400 uppercase tracking-widest mt-1 font-semibold">Messages</p>
              </div>
            </div>
          </div>

          <div className="text-right pr-[120px]">
            <p className="text-[28px] font-serif italic text-rose-800 font-bold">Yours truly,</p>
            <p className="text-[32px] font-serif font-black text-rose-700 mt-2">PokeUs ❤️</p>
          </div>
        </div>
      </div>

      {/* Footer (Envelope Flap Look) */}
      <div className="flex justify-between items-center text-[20px] font-sans font-bold uppercase tracking-wider text-rose-400 border-t border-rose-100 pt-6">
        <div>
          <span>{data.partner1Name}</span>
          <span className="mx-2 text-rose-300">•</span>
          <span>{data.partner2Name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>COUPLE WRAPPED WEEKLY</span>
        </div>
      </div>
    </div>
  );
}
