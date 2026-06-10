"use client";

import React from "react";
import { RelationshipData, AISummary } from "@/shared/types/wrapped";
import { MessageSquare, Image, Star, Trophy, Sparkles, Heart } from "lucide-react";

interface ThemeProps {
  data: RelationshipData;
  aiSummary: AISummary;
}

export default function MemoryTimelineWrapped({ data, aiSummary }: ThemeProps) {
  // Let's generate a list of timeline events based on the actual stats
  const timelineEvents = [
    {
      title: "Chapter Begins",
      dayLabel: "Monday / Day 1",
      description: `We started the week strong, sharing thoughts and laughing together. A total of ${data.messages} words of love were typed this week!`,
      icon: <MessageSquare className="w-8 h-8 text-white" />,
      color: "from-blue-400 to-indigo-500",
      badge: `${Math.round(data.messages / 3)} daily avg`,
    },
    {
      title: "Sparks & Pokes",
      dayLabel: "Wednesday / Day 3",
      description: `A playful nudge in the middle of the week! We sent ${data.pokes} pokes to make each other smile. Favorite poke emoji: 👉`,
      icon: <Heart className="w-8 h-8 text-white fill-current" />,
      color: "from-pink-400 to-rose-500",
      badge: `${data.pokes} playful taps`,
    },
    {
      title: "Memories Captured",
      dayLabel: "Friday / Day 5",
      description: data.memories > 0 
        ? `We stored ${data.memories} precious photo memories in our couple capsule, locking them in forever.` 
        : `Even without photos, we built lasting memories, growing our interaction streak to an amazing ${data.streak} days!`,
      icon: <Image className="w-8 h-8 text-white" />,
      color: "from-purple-400 to-fuchsia-500",
      badge: data.memories > 0 ? `${data.memories} uploads` : `Streak: ${data.streak} days`,
    },
    {
      title: "Weekly Triumph",
      dayLabel: "Sunday / Day 7",
      description: `Finished the week with a Love Score of ${data.loveScore}/100! Awarded the title: "${aiSummary.achievement || "Perfect Connection"}"`,
      icon: <Trophy className="w-8 h-8 text-white" />,
      color: "from-amber-400 to-orange-500",
      badge: aiSummary.achievement ? "Unlocked Achievement" : "High Connection",
    }
  ];

  return (
    <div
      className="relative w-[1080px] h-[1920px] bg-gradient-to-b from-[#0F172A] to-[#1E1B4B] text-white flex flex-col justify-between p-[80px] overflow-hidden select-none"
      style={{
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      {/* Starry background details */}
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:32px_32px] pointer-events-none" />
      
      {/* Decorative neon blobs */}
      <div className="absolute top-[20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-rose-500/10 blur-[120px] pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col items-center mt-[20px] text-center space-y-4">
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-5 py-2 rounded-full backdrop-blur-md">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <span className="text-[18px] font-bold tracking-[0.15em] text-purple-300 uppercase">
            Our Weekly Memory Lane
          </span>
        </div>
        <h1 className="text-[64px] font-black tracking-tight leading-none bg-gradient-to-r from-purple-200 via-pink-200 to-rose-200 bg-clip-text text-transparent">
          This Week Together
        </h1>
        <p className="text-[24px] text-gray-400 font-medium">
          {data.weekRange}
        </p>
      </div>

      {/* Timeline Grid */}
      <div className="flex-1 my-[50px] relative flex justify-center">
        {/* Central Vertical Line */}
        <div className="absolute left-[100px] top-4 bottom-4 w-[4px] bg-gradient-to-b from-purple-500 via-pink-500 to-rose-500 rounded-full" />

        {/* Timeline Events Stack */}
        <div className="w-full flex flex-col justify-between pl-[160px] relative z-10 py-6">
          {timelineEvents.map((evt, idx) => (
            <div key={idx} className="relative flex flex-col space-y-3">
              {/* Timeline dot */}
              <div 
                className={`absolute left-[-100px] top-2 -translate-x-1/2 w-[72px] h-[72px] rounded-full bg-gradient-to-br ${evt.color} border-[6px] border-[#0F172A] flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.3)]`}
              >
                {evt.icon}
              </div>

              {/* Event Card */}
              <div 
                className="bg-white/5 border border-white/10 rounded-[28px] p-8 space-y-3 backdrop-blur-md"
                style={{ boxShadow: "0 15px 35px rgba(0, 0, 0, 0.2)" }}
              >
                <div className="flex justify-between items-center">
                  <span className="text-[20px] font-bold text-purple-400 tracking-wider uppercase">
                    {evt.dayLabel}
                  </span>
                  <span className="bg-white/10 px-3 py-1 rounded-full text-[16px] font-semibold tracking-wide text-white/90">
                    {evt.badge}
                  </span>
                </div>
                
                <h3 className="text-[32px] font-extrabold text-white">
                  {evt.title}
                </h3>
                
                <p className="text-[24px] text-gray-300 leading-relaxed font-light">
                  {evt.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center border-t border-white/10 pt-6 mt-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            {data.partner1Image ? (
              <img src={data.partner1Image} alt={data.partner1Name} className="w-[64px] h-[64px] rounded-full object-cover border-2 border-purple-500" />
            ) : (
              <div className="w-[64px] h-[64px] rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-[22px]">{data.partner1Name.charAt(0)}</div>
            )}
            <span className="text-[22px] font-bold text-white">{data.partner1Name}</span>
          </div>
          <Heart className="w-6 h-6 text-purple-400 fill-current" />
          <div className="flex items-center gap-3">
            <span className="text-[22px] font-bold text-white">{data.partner2Name}</span>
            {data.partner2Image ? (
              <img src={data.partner2Image} alt={data.partner2Name} className="w-[64px] h-[64px] rounded-full object-cover border-2 border-purple-500" />
            ) : (
              <div className="w-[64px] h-[64px] rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-[22px]">{data.partner2Name.charAt(0)}</div>
            )}
          </div>
        </div>

        <div className="text-right">
          <p className="text-[24px] font-extrabold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            PokeUs Wrapped
          </p>
          <p className="text-[16px] text-gray-400 uppercase tracking-widest font-semibold mt-1">
            Made with PokeUs ❤️
          </p>
        </div>
      </div>
    </div>
  );
}
