import { NextRequest } from "next/server";
import { requireCouple } from "@/backend/lib/requireAuth";
import { apiError, apiSuccess } from "@/backend/lib/utils";
import { generateWeeklyWrapped } from "@/backend/services/wrapped";
import { uploadImage } from "@/backend/lib/cloudinary";
import prisma from "@/backend/lib/db";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import React from "react";

// Global cache for fonts to prevent downloading on every request
let outfitRegular: ArrayBuffer | null = null;
let outfitBold: ArrayBuffer | null = null;
let playfairDisplay: ArrayBuffer | null = null;
let dancingScript: ArrayBuffer | null = null;

async function loadFonts() {
  const fontSources = [
    {
      name: "outfitRegular",
      url: "https://cdn.jsdelivr.net/fontsource/fonts/outfit@latest/latin-400-normal.ttf",
      cached: outfitRegular,
      setter: (buf: ArrayBuffer) => (outfitRegular = buf),
    },
    {
      name: "outfitBold",
      url: "https://cdn.jsdelivr.net/fontsource/fonts/outfit@latest/latin-700-normal.ttf",
      cached: outfitBold,
      setter: (buf: ArrayBuffer) => (outfitBold = buf),
    },
    {
      name: "playfairDisplay",
      url: "https://cdn.jsdelivr.net/fontsource/fonts/playfair-display@latest/latin-400-normal.ttf",
      cached: playfairDisplay,
      setter: (buf: ArrayBuffer) => (playfairDisplay = buf),
    },
    {
      name: "dancingScript",
      url: "https://cdn.jsdelivr.net/fontsource/fonts/dancing-script@latest/latin-400-normal.ttf",
      cached: dancingScript,
      setter: (buf: ArrayBuffer) => (dancingScript = buf),
    },
  ];

  await Promise.all(
    fontSources.map(async (source) => {
      if (source.cached) return;
      try {
        console.log(`[wrapped/export] Fetching font: ${source.name}`);
        const res = await fetch(source.url);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const buf = await res.arrayBuffer();
        source.setter(buf);
      } catch (err) {
        console.error(`[wrapped/export] Error loading font ${source.name}:`, err);
        // Fallback: If one fails, try to load a basic sans-serif font
        if (source.name === "outfitRegular" || source.name === "outfitBold") {
          const res = await fetch("https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.ttf");
          const buf = await res.arrayBuffer();
          source.setter(buf);
        }
      }
    })
  );
}

// Convert week string like "2026-06-03" to a readable format
function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch (e) {
    return dateStr;
  }
}

export async function POST(request: NextRequest) {
  // 1. Auth check
  const auth = await requireCouple(request);
  if (auth.error) return auth.error;
  const { coupleId, prismaUserId } = auth.context;

  try {
    // 2. Parse request body
    const body = await request.json().catch(() => ({}));
    const theme = body.theme || "storybook";

    // 3. Generate wrapped stats and AI summary
    const wrappedRaw = await generateWeeklyWrapped(coupleId, prismaUserId);
    const wrappedResult: any = {
      ...wrappedRaw,
      messagesSent: wrappedRaw.data.messages,
      pokesExchanged: wrappedRaw.data.pokes,
      memoriesCreated: wrappedRaw.data.memories,
      streakCount: wrappedRaw.data.streak,
    };
    const { story, title: storyTitle, achievement, insight } = wrappedResult.aiSummary;

    // Fetch couple names using prisma
    const couple = await prisma.couple.findUnique({
      where: { id: coupleId },
      include: {
        user1: { select: { name: true } },
        user2: { select: { name: true } },
      },
    });

    // Get partner and user names
    const user1Name = couple?.user1?.name || "Partner 1";
    const user2Name = couple?.user2?.name || "Partner 2";
    const coupleNames = `${user1Name} & ${user2Name}`;

    // 4. Ensure fonts are loaded
    await loadFonts();

    // Setup fonts array for Satori
    const fonts = [
      {
        name: "Outfit",
        data: outfitRegular!,
        weight: 400 as const,
        style: "normal" as const,
      },
      {
        name: "Outfit",
        data: outfitBold!,
        weight: 700 as const,
        style: "normal" as const,
      },
      {
        name: "Playfair Display",
        data: playfairDisplay || outfitRegular!,
        weight: 400 as const,
        style: "normal" as const,
      },
      {
        name: "Dancing Script",
        data: dancingScript || outfitRegular!,
        weight: 400 as const,
        style: "normal" as const,
      },
    ] as any;

    // 5. Build Satori element based on theme
    let element: React.ReactNode;

    const dateRange = wrappedResult.data.weekRange;

    if (theme === "scrapbook") {
      element = (
        <div
          style={{
            width: "1080px",
            height: "1920px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            backgroundColor: "#f9f6ef",
            backgroundImage: "radial-gradient(#d3cbbe 1px, transparent 1px)",
            backgroundSize: "24px 24px",
            padding: "80px 60px",
            position: "relative",
            fontFamily: "Outfit",
            color: "#2c251d",
          }}
        >
          {/* Header tape */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
            <div
              style={{
                backgroundColor: "#e2b864",
                padding: "16px 60px",
                transform: "rotate(-2deg)",
                boxShadow: "2px 4px 10px rgba(0,0,0,0.15)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                borderRadius: "4px",
                border: "1px dashed rgba(0,0,0,0.2)",
              }}
            >
              <span style={{ fontSize: "32px", fontWeight: "bold", letterSpacing: "2px", color: "#4f3807" }}>
                📌 WEEKLY SCRAPBOOK
              </span>
            </div>
            <span style={{ fontSize: "56px", fontWeight: "bold", marginTop: "30px", color: "#3a2a10" }}>
              {coupleNames}
            </span>
            <span style={{ fontSize: "28px", color: "#7a6a50", marginTop: "8px" }}>{dateRange}</span>
          </div>

          {/* Polaroid Cards area */}
          <div style={{ display: "flex", justifyContent: "space-between", width: "100%", padding: "20px 0" }}>
            {/* Stats card left */}
            <div
              style={{
                width: "450px",
                backgroundColor: "white",
                padding: "30px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                boxShadow: "5px 5px 15px rgba(0,0,0,0.08)",
                transform: "rotate(-4deg)",
                borderRadius: "4px",
              }}
            >
              <div style={{ fontSize: "28px", color: "#8b765d", fontWeight: "bold" }}>Exchanges</div>
              <div style={{ fontSize: "72px", fontWeight: "bold", color: "#c15c5c", margin: "15px 0" }}>
                {wrappedResult.messagesSent}
              </div>
              <div style={{ fontSize: "24px", color: "#7a6a50" }}>Messages Sent</div>
            </div>

            {/* Stats card right */}
            <div
              style={{
                width: "450px",
                backgroundColor: "white",
                padding: "30px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                boxShadow: "5px 5px 15px rgba(0,0,0,0.08)",
                transform: "rotate(3deg)",
                borderRadius: "4px",
              }}
            >
              <div style={{ fontSize: "28px", color: "#8b765d", fontWeight: "bold" }}>Pokes & Streaks</div>
              <div style={{ fontSize: "72px", fontWeight: "bold", color: "#4f7ca2", margin: "15px 0" }}>
                {wrappedResult.streakCount}d
              </div>
              <div style={{ fontSize: "24px", color: "#7a6a50" }}>Current Love Streak</div>
            </div>
          </div>

          {/* AI Narrative block */}
          <div
            style={{
              backgroundColor: "white",
              border: "2px dashed #b5a995",
              borderRadius: "16px",
              padding: "40px",
              display: "flex",
              flexDirection: "column",
              boxShadow: "2px 8px 20px rgba(0,0,0,0.05)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", marginBottom: "15px" }}>
              <span style={{ fontSize: "36px", marginRight: "10px" }}>🌟</span>
              <span style={{ fontSize: "32px", fontWeight: "bold", color: "#c15c5c" }}>{storyTitle}</span>
            </div>
            <p style={{ fontSize: "28px", lineHeight: "1.6", color: "#544637", margin: 0 }}>{story}</p>
          </div>

          {/* Sticker metrics row */}
          <div style={{ display: "flex", justifyContent: "space-around", width: "100%" }}>
            <div
              style={{
                backgroundColor: "#e8f0fe",
                color: "#1a73e8",
                borderRadius: "100px",
                padding: "12px 30px",
                fontSize: "24px",
                fontWeight: "bold",
                transform: "rotate(-1deg)",
              }}
            >
              👉 {wrappedResult.pokesExchanged} Pokes Exchanged
            </div>
            <div
              style={{
                backgroundColor: "#fef7e0",
                color: "#b06000",
                borderRadius: "100px",
                padding: "12px 30px",
                fontSize: "24px",
                fontWeight: "bold",
                transform: "rotate(2deg)",
              }}
            >
              📸 {wrappedResult.memoriesCreated} Memories Saved
            </div>
          </div>

          {/* Footer badge */}
          <div style={{ display: "flex", justifyContent: "center", width: "100%", marginTop: "20px" }}>
            <span style={{ fontSize: "26px", fontWeight: "bold", color: "#aba08c" }}>❤️ PokeUs Wrapped</span>
          </div>
        </div>
      );
    } else if (theme === "loveletter") {
      element = (
        <div
          style={{
            width: "1080px",
            height: "1920px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            backgroundColor: "#fcf7ea",
            border: "30px solid #f2e7cc",
            padding: "80px",
            fontFamily: "Dancing Script",
            color: "#4e3a24",
          }}
        >
          {/* Top greeting */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "52px", color: "#8a2b2b" }}>My Dearest,</span>
            <span style={{ fontSize: "24px", fontFamily: "Outfit", color: "#a8967f", marginTop: "10px" }}>
              {dateRange}
            </span>
          </div>

          {/* Letter Body */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              justifyContent: "center",
              padding: "40px 0",
            }}
          >
            <span style={{ fontSize: "48px", lineHeight: "1.7", marginBottom: "40px" }}>
              This week with you was like a beautiful chapter from our own book. We sent each other{" "}
              <span style={{ color: "#8a2b2b", fontWeight: "bold" }}>{wrappedResult.messagesSent} messages</span>,
              exchanged <span style={{ color: "#8a2b2b", fontWeight: "bold" }}>{wrappedResult.pokesExchanged} pokes</span>,
              and kept our love burning bright with a{" "}
              <span style={{ color: "#8a2b2b", fontWeight: "bold" }}>{wrappedResult.streakCount}-day streak</span>.
            </span>

            <span style={{ fontSize: "44px", lineHeight: "1.7", color: "#5c4933", fontStyle: "italic" }}>
              "{story}"
            </span>
          </div>

          {/* Sign-off & Seal */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <span style={{ fontSize: "40px", color: "#8a2b2b" }}>With all my love,</span>
            <span style={{ fontSize: "48px", fontWeight: "bold", marginTop: "10px", marginRight: "20px" }}>
              {coupleNames}
            </span>

            {/* Red Wax Seal */}
            <div
              style={{
                alignSelf: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                marginTop: "40px",
              }}
            >
              <div
                style={{
                  width: "120px",
                  height: "120px",
                  borderRadius: "60px",
                  backgroundColor: "#8a2b2b",
                  boxShadow: "0px 8px 15px rgba(138,43,43,0.3)",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  border: "4px solid #6b1d1d",
                }}
              >
                <span style={{ fontSize: "48px", color: "white" }}>❤️</span>
              </div>
              <span
                style={{
                  fontSize: "20px",
                  fontFamily: "Outfit",
                  color: "#a8967f",
                  marginTop: "12px",
                  letterSpacing: "3px",
                  fontWeight: "bold",
                }}
              >
                POKEUS
              </span>
            </div>
          </div>
        </div>
      );
    } else if (theme === "timeline") {
      element = (
        <div
          style={{
            width: "1080px",
            height: "1920px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            backgroundColor: "#0d0c15",
            backgroundImage: "linear-gradient(to bottom, #0d0c15 0%, #151329 100%)",
            padding: "80px 60px",
            fontFamily: "Outfit",
            color: "white",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div
              style={{
                backgroundColor: "rgba(168, 85, 247, 0.15)",
                border: "1px solid rgba(168, 85, 247, 0.3)",
                borderRadius: "100px",
                padding: "8px 24px",
                display: "flex",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: "20px", color: "#c084fc", fontWeight: "bold" }}>📅 OUR TIMELINE</span>
            </div>
            <span style={{ fontSize: "56px", fontWeight: "bold", marginTop: "24px" }}>{coupleNames}</span>
            <span style={{ fontSize: "26px", color: "#a78bda", marginTop: "8px" }}>{dateRange}</span>
          </div>

          {/* Timeline Nodes */}
          <div style={{ display: "flex", flexDirection: "column", paddingLeft: "80px", position: "relative" }}>
            {/* Vertical line background */}
            <div
              style={{
                position: "absolute",
                left: "118px",
                top: "10px",
                bottom: "10px",
                width: "4px",
                backgroundColor: "#a855f7",
                opacity: 0.3,
              }}
            />

            {[
              { label: "Messages Sent", value: wrappedResult.messagesSent, color: "#a855f7", desc: "Words of warmth shared" },
              { label: "Pokes Exchanged", value: wrappedResult.pokesExchanged, color: "#ec4899", desc: "Nudges to say hello" },
              { label: "Memories Saved", value: wrappedResult.memoriesCreated, color: "#3b82f6", desc: "Moments frozen in time" },
              { label: "Love Streak", value: `${wrappedResult.streakCount} Days`, color: "#10b981", desc: "Consecutive daily pokes" },
            ].map((node, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  margin: "40px 0",
                  position: "relative",
                }}
              >
                {/* Node bubble */}
                <div
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "40px",
                    backgroundColor: "#0d0c15",
                    border: `4px solid ${node.color}`,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    zIndex: 10,
                    marginRight: "40px",
                    boxShadow: `0 0 20px ${node.color}40`,
                  }}
                >
                  <span style={{ fontSize: "28px" }}>{i === 0 ? "💬" : i === 1 ? "👉" : i === 2 ? "📸" : "🔥"}</span>
                </div>

                {/* Node details */}
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "40px", fontWeight: "bold" }}>{node.value}</span>
                  <span style={{ fontSize: "26px", color: node.color, fontWeight: "bold" }}>{node.label}</span>
                  <span style={{ fontSize: "20px", color: "#6b7280", marginTop: "2px" }}>{node.desc}</span>
                </div>
              </div>
            ))}
          </div>

          {/* AI Insight Box */}
          <div
            style={{
              backgroundColor: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "24px",
              padding: "40px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ fontSize: "32px", marginRight: "12px" }}>🏆</span>
              <span style={{ fontSize: "28px", fontWeight: "bold", color: "#a855f7" }}>{achievement}</span>
            </div>
            <p style={{ fontSize: "26px", lineHeight: "1.6", color: "#d1d5db", margin: 0 }}>{insight}</p>
          </div>

          {/* Footer */}
          <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
            <span style={{ fontSize: "24px", color: "#4b5563" }}>❤️ PokeUs Wrapped</span>
          </div>
        </div>
      );
    } else if (theme === "polaroid") {
      element = (
        <div
          style={{
            width: "1080px",
            height: "1920px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            backgroundColor: "#eae4d9",
            backgroundImage: "radial-gradient(#d3c7b3 2px, transparent 2px)",
            backgroundSize: "40px 40px",
            border: "30px solid #8c7662",
            padding: "80px 60px",
            fontFamily: "Outfit",
            color: "#3e2723",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div
              style={{
                backgroundColor: "#8c7662",
                color: "white",
                borderRadius: "4px",
                padding: "8px 24px",
                fontWeight: "bold",
                fontSize: "20px",
                letterSpacing: "1px",
              }}
            >
              📌 MEMORY WALL
            </div>
            <span style={{ fontSize: "56px", fontWeight: "bold", marginTop: "24px", color: "#4e342e" }}>
              Our Polaroid Wall
            </span>
            <span style={{ fontSize: "24px", color: "#795548", marginTop: "8px" }}>{dateRange}</span>
          </div>

          {/* Polaroid Cards Grid */}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "40px 0" }}>
            {/* Left Polaroid */}
            <div
              style={{
                width: "450px",
                backgroundColor: "white",
                padding: "24px 24px 60px 24px",
                boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                transform: "rotate(-5deg)",
                display: "flex",
                flexDirection: "column",
                borderRadius: "2px",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "360px",
                  backgroundColor: "#ffebee",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  borderRadius: "2px",
                }}
              >
                <span style={{ fontSize: "80px" }}>💬</span>
              </div>
              <div
                style={{
                  marginTop: "24px",
                  textAlign: "center",
                  fontFamily: "Dancing Script",
                  fontSize: "36px",
                  color: "#d81b60",
                }}
              >
                {user1Name}
              </div>
              <div style={{ textAlign: "center", fontSize: "20px", color: "#757575", marginTop: "4px" }}>
                {wrappedResult.messagesSent} messages
              </div>
            </div>

            {/* Right Polaroid */}
            <div
              style={{
                width: "450px",
                backgroundColor: "white",
                padding: "24px 24px 60px 24px",
                boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                transform: "rotate(4deg)",
                display: "flex",
                flexDirection: "column",
                borderRadius: "2px",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "360px",
                  backgroundColor: "#e3f2fd",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  borderRadius: "2px",
                }}
              >
                <span style={{ fontSize: "80px" }}>👉</span>
              </div>
              <div
                style={{
                  marginTop: "24px",
                  textAlign: "center",
                  fontFamily: "Dancing Script",
                  fontSize: "36px",
                  color: "#1e88e5",
                }}
              >
                {user2Name}
              </div>
              <div style={{ textAlign: "center", fontSize: "20px", color: "#757575", marginTop: "4px" }}>
                {wrappedResult.pokesExchanged} pokes
              </div>
            </div>
          </div>

          {/* Sticky Note */}
          <div
            style={{
              backgroundColor: "#fff59d",
              padding: "40px",
              boxShadow: "5px 10px 20px rgba(0,0,0,0.08)",
              transform: "rotate(1deg)",
              display: "flex",
              flexDirection: "column",
              borderRadius: "4px",
              borderLeft: "15px solid #ffeb3b",
            }}
          >
            <span style={{ fontSize: "24px", fontWeight: "bold", color: "#f57f17", marginBottom: "8px" }}>
              💡 Weekly Insight
            </span>
            <p style={{ fontSize: "26px", lineHeight: "1.6", color: "#5d4037", margin: 0 }}>{story}</p>
          </div>

          {/* Footer */}
          <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
            <span style={{ fontSize: "24px", color: "#795548" }}>❤️ PokeUs Wrapped</span>
          </div>
        </div>
      );
    } else if (theme === "constellation") {
      element = (
        <div
          style={{
            width: "1080px",
            height: "1920px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            backgroundColor: "#030208",
            backgroundImage: "linear-gradient(to bottom, #030208 0%, #0c081e 100%)",
            padding: "80px 60px",
            fontFamily: "Outfit",
            color: "white",
            position: "relative",
          }}
        >
          {/* Constellation line drawing (SVG background layer) */}
          <div
            style={{
              position: "absolute",
              top: "400px",
              left: "100px",
              right: "100px",
              height: "600px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              opacity: 0.15,
            }}
          >
            <svg width="800" height="600" viewBox="0 0 800 600" fill="none">
              <path d="M 150 150 L 400 300 L 650 150 M 400 300 L 400 500" stroke="white" strokeWidth="3" strokeDasharray="8 8" />
              <circle cx="150" cy="150" r="12" fill="white" />
              <circle cx="400" cy="300" r="16" fill="white" />
              <circle cx="650" cy="150" r="12" fill="white" />
              <circle cx="400" cy="500" r="12" fill="white" />
            </svg>
          </div>

          {/* Header */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 10 }}>
            <div
              style={{
                backgroundColor: "rgba(129, 140, 248, 0.15)",
                border: "1px solid rgba(129, 140, 248, 0.3)",
                borderRadius: "100px",
                padding: "8px 24px",
                fontSize: "18px",
                color: "#818cf8",
                fontWeight: "bold",
                letterSpacing: "1px",
              }}
            >
              ✨ WEEKLY CONSTELLATION
            </div>
            <span style={{ fontSize: "56px", fontWeight: "bold", marginTop: "24px", color: "#e0e7ff" }}>
              {storyTitle}
            </span>
            <span style={{ fontSize: "24px", color: "#a5b4fc", marginTop: "8px" }}>{dateRange}</span>
          </div>

          {/* Star Nodes (Visual layout) */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "600px",
              zIndex: 10,
            }}
          >
            {/* Top Row Stars */}
            <div style={{ display: "flex", justifyContent: "space-between", width: "100%", padding: "0 60px" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div
                  style={{
                    width: "120px",
                    height: "120px",
                    borderRadius: "60px",
                    backgroundColor: "rgba(224, 231, 255, 0.05)",
                    border: "2px solid #818cf8",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    boxShadow: "0 0 30px rgba(129, 140, 248, 0.4)",
                  }}
                >
                  <span style={{ fontSize: "44px", fontWeight: "bold", color: "#c7d2fe" }}>
                    {wrappedResult.messagesSent}
                  </span>
                </div>
                <span style={{ fontSize: "20px", color: "#9cb3f9", marginTop: "12px", fontWeight: "bold" }}>
                  Messages
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div
                  style={{
                    width: "120px",
                    height: "120px",
                    borderRadius: "60px",
                    backgroundColor: "rgba(224, 231, 255, 0.05)",
                    border: "2px solid #f472b6",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    boxShadow: "0 0 30px rgba(244, 114, 182, 0.4)",
                  }}
                >
                  <span style={{ fontSize: "44px", fontWeight: "bold", color: "#fbcfe8" }}>
                    {wrappedResult.streakCount}d
                  </span>
                </div>
                <span style={{ fontSize: "20px", color: "#f9a8d4", marginTop: "12px", fontWeight: "bold" }}>
                  Streak
                </span>
              </div>
            </div>

            {/* Center Node Star */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                margin: "40px 0",
              }}
            >
              <div
                style={{
                  width: "140px",
                  height: "140px",
                  borderRadius: "70px",
                  backgroundColor: "rgba(255,255,255,0.08)",
                  border: "3px solid #fbbf24",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  boxShadow: "0 0 45px rgba(251, 191, 36, 0.6)",
                }}
              >
                <span style={{ fontSize: "48px", fontWeight: "bold", color: "#fef08a" }}>
                  {wrappedResult.pokesExchanged}
                </span>
              </div>
              <span style={{ fontSize: "22px", color: "#fde047", marginTop: "12px", fontWeight: "bold" }}>
                Pokes Swapped
              </span>
            </div>
          </div>

          {/* Cosmic Narratives */}
          <div
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "24px",
              padding: "40px",
              zIndex: 10,
              display: "flex",
              flexDirection: "column",
              backdropFilter: "blur(10px)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
            }}
          >
            <span style={{ fontSize: "24px", color: "#fbbf24", fontWeight: "bold", marginBottom: "8px" }}>
              🌌 Constellation Insight
            </span>
            <p style={{ fontSize: "26px", lineHeight: "1.6", color: "#e2e8f0", margin: 0 }}>{story}</p>
          </div>

          {/* Footer */}
          <div style={{ display: "flex", justifyContent: "center", width: "100%", zIndex: 10 }}>
            <span style={{ fontSize: "24px", color: "#4b5563" }}>❤️ PokeUs Wrapped</span>
          </div>
        </div>
      );
    } else {
      // Default: Storybook Theme
      element = (
        <div
          style={{
            width: "1080px",
            height: "1920px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            backgroundColor: "#0d0a1b",
            backgroundImage: "linear-gradient(135deg, #0d0a1b 0%, #1c0e2b 50%, #06040e 100%)",
            border: "25px solid #d4af37",
            padding: "80px 60px",
            fontFamily: "Playfair Display",
            color: "white",
            position: "relative",
          }}
        >
          {/* Gold corners design */}
          <div style={{ position: "absolute", top: "10px", left: "10px", width: "40px", height: "40px", borderTop: "6px solid #d4af37", borderLeft: "6px solid #d4af37" }} />
          <div style={{ position: "absolute", top: "10px", right: "10px", width: "40px", height: "40px", borderTop: "6px solid #d4af37", borderRight: "6px solid #d4af37" }} />
          <div style={{ position: "absolute", bottom: "10px", left: "10px", width: "40px", height: "40px", borderBottom: "6px solid #d4af37", borderLeft: "6px solid #d4af37" }} />
          <div style={{ position: "absolute", bottom: "10px", right: "10px", width: "40px", height: "40px", borderBottom: "6px solid #d4af37", borderRight: "6px solid #d4af37" }} />

          {/* Header */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
            <span style={{ fontSize: "32px", color: "#d4af37", letterSpacing: "4px" }}>CHAPTER ONE</span>
            <span style={{ fontSize: "56px", fontWeight: "bold", marginTop: "20px", textAlign: "center", color: "#f3e5ab" }}>
              Our Love Storybook
            </span>
            <span style={{ fontSize: "24px", fontFamily: "Outfit", color: "#a090b8", marginTop: "12px" }}>
              {dateRange}
            </span>
          </div>

          {/* Mid decorative book graphic */}
          <div style={{ display: "flex", justifyContent: "center", width: "100%", margin: "30px 0" }}>
            <svg width="200" height="150" viewBox="0 0 100 100" fill="none">
              <path d="M 10 70 Q 35 60 50 75 Q 65 60 90 70 L 90 20 Q 65 10 50 25 Q 35 10 10 20 Z" stroke="#d4af37" strokeWidth="3" />
              <path d="M 50 25 L 50 75" stroke="#d4af37" strokeWidth="3" />
              <circle cx="50" cy="15" r="5" fill="#d4af37" />
            </svg>
          </div>

          {/* Stats summary row */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", padding: "10px 0" }}>
            <span style={{ fontSize: "40px", fontWeight: "bold", color: "#f3e5ab", textAlign: "center" }}>
              {coupleNames}
            </span>
            
            <div style={{ display: "flex", justifyContent: "space-around", width: "100%", marginTop: "40px" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <span style={{ fontSize: "48px", fontWeight: "bold", color: "#d4af37", fontFamily: "Outfit" }}>
                  {wrappedResult.messagesSent}
                </span>
                <span style={{ fontSize: "20px", color: "#a090b8", fontFamily: "Outfit", marginTop: "4px" }}>
                  Messages
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <span style={{ fontSize: "48px", fontWeight: "bold", color: "#d4af37", fontFamily: "Outfit" }}>
                  {wrappedResult.pokesExchanged}
                </span>
                <span style={{ fontSize: "20px", color: "#a090b8", fontFamily: "Outfit", marginTop: "4px" }}>
                  Pokes Swapped
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <span style={{ fontSize: "48px", fontWeight: "bold", color: "#d4af37", fontFamily: "Outfit" }}>
                  {wrappedResult.streakCount}d
                </span>
                <span style={{ fontSize: "20px", color: "#a090b8", fontFamily: "Outfit", marginTop: "4px" }}>
                  Streak
                </span>
              </div>
            </div>
          </div>

          {/* Story Paragraph */}
          <div
            style={{
              borderTop: "1px solid rgba(212, 175, 55, 0.3)",
              borderBottom: "1px solid rgba(212, 175, 55, 0.3)",
              padding: "40px 0",
              margin: "30px 0",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "36px", color: "#f3e5ab", fontWeight: "bold", marginBottom: "15px", textAlign: "center" }}>
              {storyTitle}
            </span>
            <p style={{ fontSize: "26px", lineHeight: "1.7", color: "#e6e1f0", margin: 0, textAlign: "center", fontFamily: "Outfit" }}>
              "{story}"
            </p>
          </div>

          {/* Footer badge */}
          <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
            <span style={{ fontSize: "24px", color: "#d4af37", letterSpacing: "2px" }}>❤️ POKEUS WRAPPED</span>
          </div>
        </div>
      );
    }

    // 6. Generate SVG string using Satori
    console.log(`[wrapped/export] Generating SVG using Satori width=1080 height=1920`);
    const svg = await satori(element, {
      width: 1080,
      height: 1920,
      fonts: fonts,
    });

    // 7. Convert SVG to PNG buffer using Resvg
    console.log(`[wrapped/export] Converting SVG to PNG using Resvg`);
    const resvg = new Resvg(svg, {
      fitTo: {
        mode: "width",
        value: 1080,
      },
      font: {
        loadSystemFonts: false,
      },
    });

    const pngBuffer = resvg.render().asPng();

    console.log("[wrapped/export] PNG buffer ready. Uploading to Cloudinary...");

    // 8. Upload to Cloudinary
    const uploadResult = await uploadImage(
      pngBuffer,
      "pokeus_wrapped",
      "image"
    );

    console.log("[wrapped/export] Uploaded successfully to Cloudinary:", uploadResult.url);

    return apiSuccess({
      url: uploadResult.url,
      theme,
    });
  } catch (error) {
    console.error("[api/wrapped/export] Satori export error:", error);
    return apiError(
      `Failed to export wrapped card: ${error instanceof Error ? error.message : "unknown"}`,
      500
    );
  }
}
