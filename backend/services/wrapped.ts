import prisma from "@/backend/lib/db";
import { RelationshipData, AISummary } from "@/shared/types/wrapped";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const WRAPPED_AI_PROMPT = `You are the PokeUs Couple Wrapped AI.
Your job is to write a warm, romantic, emotional, scrapbook-like weekly summary for a couple based on their activity data.
The tone should feel like a cute love letter or page from a diary, suitable for sharing on Instagram.
Avoid dry analytics. Focus on celebrating their little moments and connection.

Input Data:
- Couple Name: {{couple_name}}
- Week Range: {{week_range}}
- Messages Exchanged: {{messages_count}}
- Playful Pokes Sent: {{pokes_count}}
- New Memories Captured: {{memories_count}}
- Longest Interaction Streak: {{streak}} days

Output Format:
Return ONLY a valid JSON object (no markdown, no code fences) matching this structure:
{
  "title": "A short poetic title for their week, e.g., 'Another Beautiful Chapter' or 'Midsummer Magic'",
  "subtitle": "A cute subtitle highlighting an activity, e.g., 'This week you exchanged 37 messages and created 4 new memories.'",
  "story": "A warm, 2-3 sentence diary-style paragraph summarizing their weekly bond, how they stayed close, and the warmth of their connection.",
  "achievement": "A fun, cute badge title they unlocked, e.g., 'Spark Champions' or 'Late Night Whisperers'",
  "insight": "A sweet, supportive piece of advice or connection insight, e.g., 'Your late night talks are keeping the flame bright. Keep it up!'"
}`;

function buildWeeklyFallback(
  partner1Name: string,
  partner2Name: string,
  messages: number,
  pokes: number,
  memories: number,
  streak: number
): AISummary {
  return {
    title: "Another Beautiful Chapter",
    subtitle: `This week you exchanged ${messages} messages and created ${memories} new memories.`,
    story: `From every morning greeting to every nightly poke, ${partner1Name} and ${partner2Name} walked hand in hand this week. Your small, daily connections continue to weave a beautiful story of love.`,
    achievement: "✨ Connection Champions",
    insight: "Your consistent daily check-ins are the heartbeat of your relationship. Try a cozy date night this week to celebrate!",
  };
}

export async function generateWeeklyWrapped(coupleId: string, prismaUserId: string): Promise<{
  data: RelationshipData;
  aiSummary: AISummary;
}> {
  // 1. Fetch couple details
  const couple = await prisma.couple.findUnique({
    where: { id: coupleId },
    select: {
      user1Id: true,
      user2Id: true,
      user1: { select: { name: true, avatar: true, streakDays: true } },
      user2: { select: { name: true, avatar: true, streakDays: true } },
    },
  });

  if (!couple) {
    throw new Error("Couple not found");
  }

  const p1 = couple.user1;
  const p2 = couple.user2;

  // 2. Week window
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(now);

  const weekRange = `${weekStart.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })} – ${weekEnd.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;

  // 3. Gather statistics using Promise.allSettled for safety
  const [msgRes, pokeRes, memRes] = await Promise.allSettled([
    prisma.message.count({
      where: { coupleId, createdAt: { gte: weekStart, lte: weekEnd } },
    }),
    prisma.poke.count({
      where: { coupleId, createdAt: { gte: weekStart, lte: weekEnd } },
    }),
    prisma.memory.count({
      where: { coupleId, createdAt: { gte: weekStart, lte: weekEnd } },
    }),
  ]);

  const messages = msgRes.status === "fulfilled" ? msgRes.value : 0;
  const pokes = pokeRes.status === "fulfilled" ? pokeRes.value : 0;
  const memories = memRes.status === "fulfilled" ? memRes.value : 0;
  const streak = Math.max(p1.streakDays, p2.streakDays);

  // Calculate a dynamic love score based on activity
  // Base 60, +1 per 5 messages (max 20), +1 per poke (max 10), +5 per memory (max 10)
  const scoreFromMessages = Math.min(20, Math.floor(messages / 5));
  const scoreFromPokes = Math.min(10, pokes);
  const scoreFromMemories = Math.min(10, memories * 5);
  const loveScore = Math.min(100, 60 + scoreFromMessages + scoreFromPokes + scoreFromMemories);

  const relationshipData: RelationshipData = {
    messages,
    pokes,
    memories,
    streak,
    loveScore,
    weekRange,
    partner1Name: p1.name,
    partner2Name: p2.name,
    partner1Image: p1.avatar,
    partner2Image: p2.avatar,
  };

  // 4. Generate AI summary
  if (!GEMINI_API_KEY) {
    console.log("[wrapped service] No GEMINI_API_KEY — using fallback summary");
    return {
      data: relationshipData,
      aiSummary: buildWeeklyFallback(p1.name, p2.name, messages, pokes, memories, streak),
    };
  }

  const prompt = WRAPPED_AI_PROMPT
    .replace("{{couple_name}}", `${p1.name} & ${p2.name}`)
    .replace("{{week_range}}", weekRange)
    .replace("{{messages_count}}", String(messages))
    .replace("{{pokes_count}}", String(pokes))
    .replace("{{memories_count}}", String(memories))
    .replace("{{streak}}", String(streak));

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 500,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!res.ok) {
      console.error("[wrapped service] Gemini API returned error status:", res.status);
      return {
        data: relationshipData,
        aiSummary: buildWeeklyFallback(p1.name, p2.name, messages, pokes, memories, streak),
      };
    }

    const json = await res.json();
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed: AISummary = JSON.parse(text);

    return {
      data: relationshipData,
      aiSummary: parsed,
    };
  } catch (err) {
    console.error("[wrapped service] Failed to generate AI summary:", err);
    return {
      data: relationshipData,
      aiSummary: buildWeeklyFallback(p1.name, p2.name, messages, pokes, memories, streak),
    };
  }
}
