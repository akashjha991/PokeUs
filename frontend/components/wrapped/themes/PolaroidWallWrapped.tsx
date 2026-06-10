"use client";

import React from "react";
import { RelationshipData, AISummary } from "@/shared/types/wrapped";
import { Heart } from "lucide-react";

interface ThemeProps {
  data: RelationshipData;
  aiSummary: AISummary;
}

export default function PolaroidWallWrapped({ data, aiSummary }: ThemeProps) {
  // Let's create content for 4 polaroid pictures
  const polaroids = [
    {
      label: "Our Week's Vibe",
      content: aiSummary.title || "Pure connection & endless chats",
      image: data.partner1Image || data.partner2Image,
      bg: "bg-rose-50",
      rotation: "rotate-[-5deg]",
      translate: "translate-x-[-20px] translate-y-[-10px]",
    },
    {
      label: "Top Stat",
      content: `Sent a whopping ${data.messages} messages this week!`,
      textStyle: "text-blue-700 font-sans font-bold",
      bg: "bg-blue-50",
      rotation: "rotate-[6deg]",
      translate: "translate-x-[20px] translate-y-[-20px]",
    },
    {
      label: "Fun Moment",
      content: `Sent ${data.pokes} playful pokes to tease each other.`,
      textStyle: "text-purple-700 font-sans font-bold",
      bg: "bg-purple-50",
      rotation: "rotate-[-4deg]",
      translate: "translate-x-[-15px] translate-y-[15px]",
    },
    {
      label: "Achievement",
      content: aiSummary.achievement || "Streak Champions",
      textStyle: "text-amber-700 font-sans font-bold",
      bg: "bg-amber-50",
      rotation: "rotate-[5deg]",
      translate: "translate-x-[25px] translate-y-[10px]",
    }
  ];

  return (
    <div
      className="relative w-[1080px] h-[1920px] bg-[#E8DCC4] text-[#4F3F2E] flex flex-col justify-between p-[80px] overflow-hidden select-none"
      style={{
        backgroundImage: "radial-gradient(#CBB893 2px, transparent 2px)",
        backgroundSize: "30px 30px",
        fontFamily: "'Caveat', cursive, sans-serif",
      }}
    >
      {/* Wooden cork board frame or room wall details */}
      <div className="absolute inset-0 border-[30px] border-[#8C7662] pointer-events-none z-30 shadow-[inset_0_0_80px_rgba(0,0,0,0.4)]" />

      {/* String Lights SVG decoration at the top */}
      <div className="absolute top-[40px] left-[40px] right-[40px] z-10 text-[#FFEBB3]">
        <svg viewBox="0 0 400 45" className="w-full h-[120px]" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M 0 10 Q 100 45 200 10 Q 300 45 400 10" stroke="#8C7662" />
          {/* Light bulbs along the line */}
          {[10, 45, 80, 120, 160, 200, 240, 280, 320, 355, 390].map((cx, idx) => {
            // Find y coordinate along path approximately
            const cy = 10 + 20 * Math.sin((cx / 400) * 2.5 * Math.PI);
            return (
              <g key={idx}>
                <circle cx={cx} cy={cy + 3} r="6" fill="#FBBF24" className="animate-pulse shadow-lg" />
                <line x1={cx} y1={cy} x2={cx} y2={cy + 3} stroke="#8C7662" />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Title block */}
      <div className="flex flex-col items-center mt-[70px] relative z-20">
        <div className="px-6 py-2 bg-[#F5E6CC] border border-[#D9C4A6] rounded-full text-[24px] uppercase tracking-widest text-[#7C6249] font-bold">
          📌 Memory Wall
        </div>
        <h1 className="text-[76px] font-black text-[#5C422D] leading-none mt-3">
          Our Polaroid Wall
        </h1>
        <p className="text-[28px] text-[#8C7662] italic mt-1">
          Week of {data.weekRange}
        </p>
      </div>

      {/* Overlapping Polaroid grid */}
      <div className="flex-1 grid grid-cols-2 gap-[50px] items-center justify-center my-[40px] px-6 relative z-10">
        {polaroids.map((pic, idx) => (
          <div
            key={idx}
            className={`w-[410px] bg-white p-6 shadow-[0_20px_45px_rgba(92,66,45,0.15)] flex flex-col items-center border border-[#ECE0CC] relative justify-self-center ${pic.rotation} ${pic.translate}`}
          >
            {/* Pushpin at the top */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-6 h-6 bg-red-500 rounded-full shadow-md flex items-center justify-center">
              <div className="w-2 h-2 bg-red-700 rounded-full" />
              <div className="absolute top-2 w-[2px] h-4 bg-gray-400 rotate-12" />
            </div>

            {/* Photo slot */}
            <div className="w-[360px] h-[360px] bg-[#FAF8F5] overflow-hidden relative border border-gray-100 flex items-center justify-center">
              {idx === 0 && pic.image ? (
                <img src={pic.image} alt={pic.label} className="w-full h-full object-cover" />
              ) : (
                <div className={`w-full h-full ${pic.bg} flex flex-col items-center justify-center p-8 text-center`}>
                  <p className="text-[34px] leading-relaxed text-gray-700">
                    &ldquo;{pic.content}&rdquo;
                  </p>
                </div>
              )}
            </div>

            {/* Polaroid Label */}
            <div className="mt-5 text-center w-full">
              <span className="text-[36px] font-bold text-[#5C422D] block">
                {pic.label}
              </span>
              <span className="text-[20px] uppercase tracking-widest text-[#A48E7A] block font-sans font-bold mt-1">
                PokeUs Memories
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center relative z-20 border-t border-[#D9C4A6]/50 pt-[25px] mt-[10px]">
        <div className="flex items-center gap-4 text-[24px]">
          <span className="font-bold">{data.partner1Name}</span>
          <Heart className="w-6 h-6 text-red-500 fill-current animate-pulse" />
          <span className="font-bold">{data.partner2Name}</span>
        </div>

        <div className="text-right">
          <p className="text-[26px] font-bold text-[#5C422D]">Made with PokeUs ❤️</p>
          <p className="text-[18px] text-[#8C7662] uppercase tracking-wider font-sans font-semibold">Weekly Wrapped</p>
        </div>
      </div>
    </div>
  );
}
