import { NextRequest } from "next/server";
import prisma from "@/backend/lib/db";
import { requireCouple } from "@/backend/lib/requireAuth";
import { apiError, apiSuccess } from "@/backend/lib/utils";

const WRAPPED_PROMPT = `You are the PokeUs Couple Wrapped AI.

Your job is to create a warm, cute, positive, shareable weekly relationship summary for a couple.

The tone should feel:
- Romantic
- Playful
- Supportive
- Social-media friendly
- Never negative or judgmental

Do not mention being an AI.

Analyze the relationship data provided and generate:

1. Relationship Score (0-100)
2. Weekly Headline
3. Weekly Highlights (exactly 3)
4. Cute Relationship Insight
5. This Week's Achievement
6. Personalized Suggestion
7. Short Shareable Summary

Rules:
- Keep it positive.
- If activity is low, encourage instead of criticizing.
- Use emojis naturally.
- Make users feel happy and connected.
- Write as if celebrating their relationship.
- Maximum 250 words total.

Input Data:

Couple Name: {{couple_name}}
Week Range: {{week_range}}
Pokes Sent: {{pokes_sent}}
Messages Exchanged: {{messages_exchanged}}
Memories Added: {{memories_added}}
Mood Check-ins: {{mood_data}}
Longest Interaction Streak: {{streak}}
Most Active Day: {{most_active_day}}
Favorite Poke Type: {{favorite_poke}}
Special Events: {{special_events}}

Generate output ONLY as valid JSON (no markdown, no code fences) in this exact format:

{
  "relationshipScore": number,
  "headline": "string",
  "highlights": ["string", "string", "string"],
  "insight": "string",
  "achievement": "string",
  "suggestion": "string",
  "shareableSummary": "string"
}`;

// ── Fallback generator (no AI needed) ─────────────────────────────────────
function buildFallback(
  myName: string, partnerName: string,
  messageCount: number, pokesCount: number,
  memories: number, favoritePoke: string
) {
  return {
    relationshipScore: 80,
    headline: `${myName} & ${partnerName}'s Week Was Pure Love 💜`,
    highlights: [
      `Exchanged ${messageCount} sweet messages 💬`,
      `Sent ${pokesCount} playful pokes ${favoritePoke}`,
      `${memories} new memories captured 📸`,
    ],
    insight: "Every message, every poke, every moment together builds something beautiful. You two are doing amazing! 🌟",
    achievement: "✨ Weekly Connection Champions",
    suggestion: "Plan a cozy virtual or in-person date night this week!",
    shareableSummary: `${myName} & ${partnerName} had a beautiful week on PokeUs 💜 ${messageCount} messages, ${pokesCount} pokes, and ${memories} memories. Love is in the air! 🌸`,
  };
}

// GET /api/wrapped — generate a weekly couple wrapped summary
export async function GET(request: NextRequest) {
  // ── Step 1: Auth ──────────────────────────────────────────────────────
  const auth = await requireCouple(request);
  if (auth.error) return auth.error;
  const { coupleId, prismaUserId } = auth.context;

  try {
    // ── Step 2: Fetch couple names ────────────────────────────────────────
    let couple;
    try {
      couple = await prisma.couple.findUnique({
        where: { id: coupleId },
        select: {
          user1Id: true,
          user2Id: true,
          user1: { select: { name: true, streakDays: true } },
          user2: { select: { name: true, streakDays: true } },
        },
      });
    } catch (coupleErr) {
      console.error("[wrapped] couple query failed:", coupleErr);
      return apiError("Database error fetching couple", 500);
    }

    if (!couple) return apiError("Couple not found", 404);

    const myName      = couple.user1Id === prismaUserId ? couple.user1.name : couple.user2.name;
    const partnerName = couple.user1Id === prismaUserId ? couple.user2.name : couple.user1.name;
    const streakDays  = couple.user1Id === prismaUserId ? couple.user1.streakDays : couple.user2.streakDays;

    // ── Step 3: Week window ───────────────────────────────────────────────
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(now);

    const weekRange = `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

    // ── Step 4: Parallel data collection (resilient — allSettled) ─────────
    const [msgRes, pokeRes, memRes, moodRes, calRes] = await Promise.allSettled([
      prisma.message.count({ where: { coupleId, createdAt: { gte: weekStart, lte: weekEnd } } }),
      prisma.poke.findMany({
        where: { coupleId, createdAt: { gte: weekStart, lte: weekEnd } },
        select: { emoji: true },
      }),
      prisma.memory.count({ where: { coupleId, createdAt: { gte: weekStart, lte: weekEnd } } }),
      prisma.moodEntry.findMany({
        where: { coupleId, createdAt: { gte: weekStart, lte: weekEnd } },
        select: { mood: true, emoji: true },
      }),
      prisma.calendarEvent.findMany({
        where: { coupleId, date: { gte: weekStart, lte: new Date(now.getTime() + 30 * 86400000) } },
        select: { title: true, date: true },
        take: 5,
      }),
    ]);

    // Log any individual query failures for debugging
    if (msgRes.status  === "rejected") console.error("[wrapped] message count failed:", msgRes.reason);
    if (pokeRes.status === "rejected") console.error("[wrapped] poke query failed:", pokeRes.reason);
    if (memRes.status  === "rejected") console.error("[wrapped] memory count failed:", memRes.reason);
    if (moodRes.status === "rejected") console.error("[wrapped] mood query failed:", moodRes.reason);
    if (calRes.status  === "rejected") console.error("[wrapped] calendar query failed:", calRes.reason);

    const messageCount   = msgRes.status   === "fulfilled" ? (msgRes.value  as number) : 0;
    const pokes          = pokeRes.status  === "fulfilled" ? (pokeRes.value as { emoji: string }[]) : [];
    const memories       = memRes.status   === "fulfilled" ? (memRes.value  as number) : 0;
    const moods          = moodRes.status  === "fulfilled" ? (moodRes.value as { mood: string; emoji: string }[]) : [];
    const calendarEvents = calRes.status   === "fulfilled" ? (calRes.value  as { title: string; date: Date | string }[]) : [];

    // ── Step 5: Derive stats ──────────────────────────────────────────────
    const pokesCount = pokes.length;
    const emojiFreq: Record<string, number> = {};
    pokes.forEach((p) => { emojiFreq[p.emoji] = (emojiFreq[p.emoji] || 0) + 1; });
    const favoritePoke = Object.entries(emojiFreq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "👉";

    const moodSummary = moods.length > 0
      ? moods.map((m) => `${m.emoji} ${m.mood}`).join(", ")
      : "No mood check-ins this week";

    const specialEvents = calendarEvents.length > 0
      ? calendarEvents
          .map((e) => `${e.title} on ${new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`)
          .join(", ")
      : "None logged";

    // Most active day — query separately with its own error handling
    let mostActiveDay = "every day";
    try {
      const messages7d = await prisma.message.findMany({
        where: { coupleId, createdAt: { gte: weekStart, lte: weekEnd } },
        select: { createdAt: true },
      });
      const dayCount: Record<string, number> = {};
      const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      messages7d.forEach((m) => {
        const d = DAYS[new Date(m.createdAt).getDay()];
        dayCount[d] = (dayCount[d] || 0) + 1;
      });
      const top = Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0];
      if (top) mostActiveDay = top[0];
    } catch (err) {
      console.error("[wrapped] most-active-day query failed:", err);
    }

    // ── Step 6: Build fallback or call Gemini ─────────────────────────────
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!geminiKey) {
      console.log("[wrapped] No GEMINI_API_KEY — returning static fallback");
      return apiSuccess({
        wrapped: buildFallback(myName, partnerName, messageCount, pokesCount, memories, favoritePoke),
        weekRange,
        coupleName: `${myName} & ${partnerName}`,
        fallback: true,
      });
    }

    // ── Step 7: Call Gemini ───────────────────────────────────────────────
    const prompt = WRAPPED_PROMPT
      .replace("{{couple_name}}",        `${myName} & ${partnerName}`)
      .replace("{{week_range}}",         weekRange)
      .replace("{{pokes_sent}}",         String(pokesCount))
      .replace("{{messages_exchanged}}", String(messageCount))
      .replace("{{memories_added}}",     String(memories))
      .replace("{{mood_data}}",          moodSummary)
      .replace("{{streak}}",             `${streakDays} days`)
      .replace("{{most_active_day}}",    mostActiveDay)
      .replace("{{favorite_poke}}",      favoritePoke)
      .replace("{{special_events}}",     specialEvents);

    let geminiRes: Response;
    try {
      geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.8, maxOutputTokens: 600, responseMimeType: "application/json" },
          }),
        }
      );
    } catch (fetchErr) {
      console.error("[wrapped] Gemini fetch failed:", fetchErr);
      // Graceful fallback — don't 500 just because Gemini is unreachable
      return apiSuccess({
        wrapped: buildFallback(myName, partnerName, messageCount, pokesCount, memories, favoritePoke),
        weekRange,
        coupleName: `${myName} & ${partnerName}`,
        fallback: true,
      });
    }

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("[wrapped] Gemini non-OK response:", geminiRes.status, errText);
      return apiSuccess({
        wrapped: buildFallback(myName, partnerName, messageCount, pokesCount, memories, favoritePoke),
        weekRange,
        coupleName: `${myName} & ${partnerName}`,
        fallback: true,
      });
    }

    const geminiData = await geminiRes.json();
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";

    let wrapped: Record<string, unknown>;
    try {
      wrapped = JSON.parse(rawText);
    } catch (parseErr) {
      console.error("[wrapped] Failed to parse Gemini JSON:", rawText, parseErr);
      return apiSuccess({
        wrapped: buildFallback(myName, partnerName, messageCount, pokesCount, memories, favoritePoke),
        weekRange,
        coupleName: `${myName} & ${partnerName}`,
        fallback: true,
      });
    }

    return apiSuccess({ wrapped, weekRange, coupleName: `${myName} & ${partnerName}` });

  } catch (error) {
    // Log the full stack so it appears in Render logs
    console.error("[wrapped] Unhandled error:", error instanceof Error ? error.stack : error);
    return apiError(
      `Internal error: ${error instanceof Error ? error.message : "unknown"}`,
      500
    );
  }
}
