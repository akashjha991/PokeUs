"use client";

import React from "react";
import { RelationshipData, AISummary } from "@/shared/types/wrapped";
import { Star, Heart, Smile } from "lucide-react";

interface ThemeProps {
  data: RelationshipData;
  aiSummary: AISummary;
}

export default function ScrapbookWrapped({ data, aiSummary }: ThemeProps) {
  return (
    <div
      className="relative w-[1080px] h-[1920px] bg-[#FFFBEB] text-[#374151] flex flex-col justify-between p-[80px] overflow-hidden select-none"
      style={{
        backgroundImage: `
          linear-gradient(rgba(229, 231, 235, 0.5) 1px, transparent 1px),
          linear-gradient(90deg, rgba(229, 231, 235, 0.5) 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
        fontFamily: "'Caveat', cursive, sans-serif",
      }}
    >
      {/* Red vertical margin line of notebook paper */}
      <div className="absolute left-[120px] top-0 bottom-0 w-[2px] bg-red-300 opacity-60" />

      {/* Decorative Washi Tapes */}
      <div 
        className="absolute top-[60px] left-[150px] w-[200px] h-[50px] bg-pink-300/40 border border-pink-400/20 rotate-[-8deg] flex items-center justify-center text-[22px] font-bold text-pink-700/60 uppercase tracking-widest"
        style={{ backdropFilter: "blur(2px)", transformOrigin: "center" }}
      >
        LOVELY WEEK
      </div>

      <div 
        className="absolute top-[80px] right-[120px] w-[180px] h-[45px] bg-yellow-300/40 border border-yellow-400/20 rotate-[6deg] flex items-center justify-center text-[20px] font-bold text-yellow-800/60 uppercase tracking-widest"
        style={{ backdropFilter: "blur(2px)", transformOrigin: "center" }}
      >
        PokeUs Wrapped
      </div>

      {/* Title Header */}
      <div className="flex flex-col items-center mt-[30px] pl-[60px]">
        <h1 className="text-[76px] font-black text-purple-700 leading-none drop-shadow-sm rotate-[-2deg]">
          Our Little Moments
        </h1>
        <p className="text-[32px] text-gray-500 font-medium mt-3 italic tracking-wider">
          Week: {data.weekRange}
        </p>
      </div>

      {/* Overlapping Polaroids Container */}
      <div className="relative h-[560px] my-[20px] pl-[60px] flex items-center justify-center">
        {/* Partner 1 Polaroid (left, tilted counter-clockwise) */}
        <div 
          className="absolute left-[80px] w-[340px] bg-white p-6 shadow-2xl rotate-[-6deg] border border-gray-100 flex flex-col items-center"
          style={{ transformOrigin: "center" }}
        >
          {/* Tape on Polaroid */}
          <div className="absolute -top-[25px] left-1/3 w-[120px] h-[35px] bg-blue-200/40 border border-blue-300/20 rotate-[-15deg]" />
          <div className="w-[290px] h-[290px] bg-gray-100 overflow-hidden relative border border-gray-200">
            {data.partner1Image ? (
              <img src={data.partner1Image} alt={data.partner1Name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-indigo-100 text-indigo-500 flex items-center justify-center text-[90px] font-bold">
                {data.partner1Name.charAt(0)}
              </div>
            )}
          </div>
          <p className="text-[42px] font-bold text-gray-700 mt-6 leading-tight">{data.partner1Name}</p>
        </div>

        {/* Heart icon joining the polaroids */}
        <div className="absolute z-20 text-red-500 text-[96px] animate-bounce drop-shadow-lg">
          ❤️
        </div>

        {/* Partner 2 Polaroid (right, tilted clockwise) */}
        <div 
          className="absolute right-[80px] w-[340px] bg-white p-6 shadow-2xl rotate-[8deg] border border-gray-100 flex flex-col items-center"
          style={{ transformOrigin: "center" }}
        >
          {/* Tape on Polaroid */}
          <div className="absolute -top-[25px] right-1/3 w-[120px] h-[35px] bg-green-200/40 border border-green-300/20 rotate-[12deg]" />
          <div className="w-[290px] h-[290px] bg-gray-100 overflow-hidden relative border border-gray-200">
            {data.partner2Image ? (
              <img src={data.partner2Image} alt={data.partner2Name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-rose-100 text-rose-500 flex items-center justify-center text-[90px] font-bold">
                {data.partner2Name.charAt(0)}
              </div>
            )}
          </div>
          <p className="text-[42px] font-bold text-gray-700 mt-6 leading-tight">{data.partner2Name}</p>
        </div>
      </div>

      {/* Scrapbook Diary Section */}
      <div className="flex-1 flex flex-col justify-between pl-[60px] space-y-8">
        {/* Story Box */}
        <div className="relative bg-white/70 border-2 border-dashed border-purple-300 rounded-[28px] p-8 space-y-4">
          {/* Doodle heart */}
          <span className="absolute -top-6 -right-6 text-[48px] rotate-[15deg]">✨</span>
          <span className="absolute -bottom-6 -left-6 text-[48px] rotate-[-15deg]">🌸</span>
          
          <h3 className="text-[38px] font-bold text-purple-700 flex items-center gap-3">
            📝 Diary Entry: {aiSummary.title || "Our Week Together"}
          </h3>
          <p className="text-[34px] leading-relaxed text-gray-700">
            {aiSummary.story || "What a week we had! We sent so many sweet words to each other and checked in whenever we could. Looking forward to making more memories together!"}
          </p>
        </div>

        {/* Statistics styled as handwritten doodles */}
        <div className="grid grid-cols-3 gap-6">
          {[
            { label: "exchanges", val: `${data.messages} msgs`, color: "text-blue-600", bg: "bg-blue-50/80" },
            { label: "pokes", val: `${data.pokes} pokes`, color: "text-pink-600", bg: "bg-pink-50/80" },
            { label: "memories", val: `${data.memories} shared`, color: "text-emerald-600", bg: "bg-emerald-50/80" },
            { label: "streak", val: `${data.streak} days`, color: "text-amber-600", bg: "bg-amber-50/80" },
            { label: "love score", val: `${data.loveScore}/100`, color: "text-indigo-600", bg: "bg-indigo-50/80" },
            { label: "achievement", val: aiSummary.achievement || "Besties", color: "text-red-600", bg: "bg-red-50/80" },
          ].map((item, idx) => (
            <div 
              key={idx} 
              className={`p-5 rounded-[24px] ${item.bg} border-2 border-gray-200/50 flex flex-col items-center justify-center text-center`}
            >
              <span className={`text-[36px] font-black ${item.color} leading-none`}>{item.val}</span>
              <span className="text-[20px] font-bold text-gray-500 uppercase tracking-widest mt-2">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer / Sticker Layer */}
      <div className="flex justify-between items-center pl-[60px] pt-8 border-t-2 border-dashed border-gray-200 mt-6 relative">
        <div className="flex gap-4">
          {/* Sticker Doodles */}
          <div className="px-4 py-2 bg-yellow-200 border-2 border-yellow-300 rounded-full text-[20px] font-bold text-yellow-800 rotate-[-5deg]">
            ⭐ Super Couple
          </div>
          <div className="px-4 py-2 bg-purple-200 border-2 border-purple-300 rounded-full text-[20px] font-bold text-purple-800 rotate-[8deg]">
            💖 Forever
          </div>
        </div>

        <div className="text-right">
          <p className="text-[28px] font-bold text-purple-700">Made with PokeUs ❤️</p>
          <p className="text-[20px] text-gray-400 italic">Every little moment counts</p>
        </div>
      </div>
    </div>
  );
}
