"use client";

import React from "react";
import { motion } from "framer-motion";
import { RelationshipData, AISummary } from "@/shared/types/wrapped";
import { Sparkles, Heart } from "lucide-react";

interface ThemeProps {
  data: RelationshipData;
  aiSummary: AISummary;
}

export default function StorybookWrapped({ data, aiSummary }: ThemeProps) {
  // Derive a chapter number based on streak or a random consistent number
  const chapterNumber = Math.max(1, Math.floor(data.streak / 7)) || 12;

  return (
    <div
      className="relative w-[1080px] h-[1920px] bg-[#FAF6EE] text-[#5C4D3C] flex flex-col justify-between p-[80px] overflow-hidden select-none"
      style={{
        boxShadow: "inset 0 0 100px rgba(92, 77, 60, 0.15)",
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      {/* Background paper textures and floral decorations */}
      <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-multiply bg-[radial-gradient(#5C4D3C_1px,transparent_1px)] [background-size:24px_24px]" />
      
      {/* Floral SVG Corners */}
      <div className="absolute top-[30px] left-[30px] w-[200px] h-[200px] text-[#A4907C] opacity-70">
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M10,90 Q10,10 90,10" />
          <path d="M10,50 Q40,40 50,10" />
          <path d="M50,90 Q60,60 90,60" />
          {/* Leaves */}
          <path d="M10,70 C5,65 5,55 10,50 C15,55 15,65 10,70 Z" fill="currentColor" fillOpacity="0.2" />
          <path d="M30,30 C25,25 25,15 30,10 C35,15 35,25 30,30 Z" fill="currentColor" fillOpacity="0.2" />
          <path d="M70,10 C75,15 85,15 90,10 C85,5 75,5 70,10 Z" fill="currentColor" fillOpacity="0.2" />
          {/* Small Flowers */}
          <circle cx="50" cy="10" r="4" fill="#E8A08A" stroke="none" />
          <circle cx="90" cy="60" r="4" fill="#E8A08A" stroke="none" />
        </svg>
      </div>

      <div className="absolute bottom-[30px] right-[30px] w-[200px] h-[200px] text-[#A4907C] opacity-70 rotate-180">
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M10,90 Q10,10 90,10" />
          <path d="M10,50 Q40,40 50,10" />
          <path d="M50,90 Q60,60 90,60" />
          <path d="M10,70 C5,65 5,55 10,50 C15,55 15,65 10,70 Z" fill="currentColor" fillOpacity="0.2" />
          <path d="M30,30 C25,25 25,15 30,10 C35,15 35,25 30,30 Z" fill="currentColor" fillOpacity="0.2" />
          <circle cx="50" cy="10" r="4" fill="#E8A08A" stroke="none" />
        </svg>
      </div>

      {/* Header ribbon */}
      <div className="flex flex-col items-center mt-[40px]">
        <div className="relative">
          {/* Ribbon SVG background */}
          <svg className="w-[450px] h-[100px] text-[#E8A08A]" viewBox="0 0 300 60" fill="currentColor">
            <path d="M10,10 L290,10 L280,30 L290,50 L10,50 L20,30 Z" />
            <path d="M20,50 L20,58 L35,50 Z" fill="#C57E69" />
            <path d="M280,50 L280,58 L265,50 Z" fill="#C57E69" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-serif text-[28px] font-bold tracking-widest text-white uppercase">
              Chapter {chapterNumber}
            </span>
          </div>
        </div>
        <h2 className="font-serif text-[68px] font-black tracking-tight text-[#4A3E31] mt-6 text-center leading-tight">
          Our Week Wrapped
        </h2>
        <div className="w-[100px] h-[4px] bg-[#E8A08A] rounded-full mt-4" />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col justify-center my-[60px] px-[40px] space-y-12">
        {/* Story illustration / quote box */}
        <div 
          className="relative bg-[#FFFDF9] border-2 border-[#EADEC9] rounded-[32px] p-[50px] space-y-6"
          style={{ boxShadow: "0 15px 35px rgba(92, 77, 60, 0.05)" }}
        >
          <div className="absolute -top-[25px] left-1/2 -translate-x-1/2 bg-[#FAF6EE] px-6 py-2 border-2 border-[#EADEC9] rounded-full font-serif italic text-[24px]">
            &ldquo;{aiSummary.title || "Another Beautiful Chapter"}&rdquo;
          </div>
          
          <p className="font-serif text-[34px] leading-relaxed text-[#6E5D4F] italic text-center pt-4">
            {aiSummary.story || "Once upon a time, two hearts connected across distances, sharing moments that painted their weekly story with love..."}
          </p>

          <div className="flex justify-center text-[#E8A08A]">
            <Heart className="w-[36px] h-[36px] fill-current animate-pulse" />
          </div>
        </div>

        {/* Stats Grid - styled like a storybook index */}
        <div className="grid grid-cols-2 gap-8">
          {[
            { label: "Love Score", value: `${data.loveScore}/100`, desc: "Of sheer magic", icon: "✨" },
            { label: "Streak", value: `${data.streak} Days`, desc: "Unstoppable bond", icon: "🔥" },
            { label: "Messages", value: data.messages, desc: "Words of warmth", icon: "💬" },
            { label: "Pokes Sent", value: data.pokes, desc: "Playful reminders", icon: "👉" },
            { label: "Memories Shared", value: data.memories, desc: "Captured forever", icon: "📸" },
            { label: "Weekly Insight", value: "Insight", desc: aiSummary.insight, isWide: true, icon: "💡" },
          ].map((stat, i) => {
            if (stat.isWide) {
              return (
                <div 
                  key={i} 
                  className="col-span-2 bg-[#FFFDF9] border border-[#EADEC9] rounded-[24px] p-6 flex items-start gap-4"
                >
                  <span className="text-[36px]">{stat.icon}</span>
                  <div>
                    <h4 className="text-[20px] font-bold text-[#8C7662] uppercase tracking-wider">{stat.label}</h4>
                    <p className="text-[24px] text-[#5C4D3C] mt-1 italic leading-normal">{stat.desc}</p>
                  </div>
                </div>
              );
            }
            return (
              <div 
                key={i} 
                className="bg-[#FFFDF9] border border-[#EADEC9] rounded-[24px] p-6 flex flex-col items-center text-center justify-center space-y-2"
              >
                <span className="text-[32px] mb-1">{stat.icon}</span>
                <span className="text-[40px] font-black text-[#4A3E31] leading-none">{stat.value}</span>
                <span className="text-[16px] font-bold text-[#8C7662] uppercase tracking-wider">{stat.label}</span>
                <span className="text-[14px] text-[#A4907C] italic">{stat.desc}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col items-center mt-[20px] border-t border-[#EADEC9] pt-[30px]">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            {data.partner1Image ? (
              <img src={data.partner1Image} alt={data.partner1Name} className="w-[60px] h-[60px] rounded-full object-cover border-2 border-[#E8A08A]" />
            ) : (
              <div className="w-[60px] h-[60px] rounded-full bg-[#E8A08A] text-white flex items-center justify-center font-bold text-[22px]">{data.partner1Name.charAt(0)}</div>
            )}
            <span className="text-[22px] font-bold">{data.partner1Name}</span>
          </div>
          <span className="text-[#E8A08A] font-serif text-[28px]">&amp;</span>
          <div className="flex items-center gap-3">
            <span className="text-[22px] font-bold">{data.partner2Name}</span>
            {data.partner2Image ? (
              <img src={data.partner2Image} alt={data.partner2Name} className="w-[60px] h-[60px] rounded-full object-cover border-2 border-[#E8A08A]" />
            ) : (
              <div className="w-[60px] h-[60px] rounded-full bg-[#E8A08A] text-white flex items-center justify-center font-bold text-[22px]">{data.partner2Name.charAt(0)}</div>
            )}
          </div>
        </div>
        
        <p className="text-[16px] text-[#A4907C] uppercase tracking-widest font-semibold mt-4">
          PokeUs · {data.weekRange}
        </p>
        <p className="text-[16px] font-serif italic text-[#8C7662] mt-1">
          Made with love &amp; PokeUs ❤️
        </p>
      </div>
    </div>
  );
}
