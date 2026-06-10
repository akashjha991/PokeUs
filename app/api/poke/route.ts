import { NextRequest } from "next/server";
import prisma from "@/backend/lib/db";
import { requireCouple } from "@/backend/lib/requireAuth";
import { apiError, apiSuccess } from "@/backend/lib/utils";

// POST /api/poke — send a poke
export async function POST(request: NextRequest) {
  const auth = await requireCouple(request);
  if (auth.error) return auth.error;
  const { prismaUserId, coupleId } = auth.context;

  try {
    const { emoji = "👉", message } = await request.json();

    // Resolve partner ID
    const couple = await prisma.couple.findUnique({
      where: { id: coupleId },
      select: { user1Id: true, user2Id: true },
    });
    if (!couple) return apiError("Couple not found", 404);

    const toId = couple.user1Id === prismaUserId ? couple.user2Id : couple.user1Id;

    const poke = await prisma.poke.create({
      data: { coupleId, fromId: prismaUserId, toId, emoji, message },
      include: { from: { select: { id: true, name: true, avatar: true } } },
    });

    // Award XP asynchronously
    const { awardXP, checkAndAwardBadges } = await import("@/backend/services/gamification");
    awardXP(prismaUserId, 2, `Sent a poke ${emoji}`)
      .then(() => checkAndAwardBadges(prismaUserId))
      .catch((err) => console.error("Poke gamification error:", err));

    // Send push notification — async, non-blocking
    sendPushNotification(coupleId, prismaUserId, emoji, message ?? undefined).catch((err) =>
      console.error("Poke push dispatch error:", err)
    );

    return apiSuccess({ poke }, 201);
  } catch (error) {
    console.error("Send poke error:", error);
    return apiError("Something went wrong", 500);
  }
}

// GET /api/poke — get unseen pokes for the current user
export async function GET(request: NextRequest) {
  const auth = await requireCouple(request);
  if (auth.error) return auth.error;
  const { prismaUserId } = auth.context;

  try {
    const pokes = await prisma.poke.findMany({
      where: { toId: prismaUserId, seenAt: null },
      orderBy: { createdAt: "desc" },
      include: { from: { select: { id: true, name: true, avatar: true } } },
      take: 20,
    });

    // Mark as seen
    await prisma.poke.updateMany({
      where: { toId: prismaUserId, seenAt: null },
      data: { seenAt: new Date() },
    });

    return apiSuccess({ pokes });
  } catch (error) {
    console.error("Get pokes error:", error);
    return apiError("Something went wrong", 500);
  }
}

async function sendPushNotification(
  coupleId: string,
  senderId: string,
  emoji: string,
  message?: string
) {
  const couple = await prisma.couple.findUnique({
    where: { id: coupleId },
    include: {
      user1: { select: { id: true, name: true } },
      user2: { select: { id: true, name: true } },
    },
  });
  if (!couple) return;

  const sender = couple.user1.id === senderId ? couple.user1 : couple.user2;
  const recipient = couple.user1.id === senderId ? couple.user2 : couple.user1;

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId: recipient.id },
  });
  if (subscriptions.length === 0) return;

  const webpush = require("web-push");
  webpush.setVapidDetails(
    "mailto:support@pokeus.dev",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string,
    process.env.VAPID_PRIVATE_KEY as string
  );

  const notificationPayload = JSON.stringify({
    title: `${sender.name} poked you! ${emoji} 💜`,
    body: message || `Hey! ${sender.name} sent you a ${emoji} poke!`,
    url: "/dashboard",
  });

  await Promise.all(
    subscriptions.map((sub) =>
      webpush
        .sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          notificationPayload
        )
        .catch((err: any) => {
          if (err.statusCode === 410 || err.statusCode === 404) {
            return prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
          }
        })
    )
  );
}
