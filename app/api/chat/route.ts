import { NextRequest } from "next/server";
import prisma from "@/backend/lib/db";
import { apiError, apiSuccess } from "@/backend/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("access_token")?.value;
    if (!token) return apiError("Unauthorized", 401);

    let payload;
    try {
      const { jwtVerify } = await import("jose");
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload: decoded } = await jwtVerify(token, secret);
      payload = decoded;
    } catch {
      return apiError("Unauthorized", 401);
    }

    if (!payload.coupleId) {
      return apiError("Not in a couple", 400);
    }

    const messages = await prisma.message.findMany({
      where: { coupleId: payload.coupleId as string },
      orderBy: { createdAt: "asc" },
      take: 100, // Fetch the last 100 messages initially
    });

    return apiSuccess({ messages });
  } catch (error) {
    console.error("Fetch messages error:", error);
    return apiError("Something went wrong", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("access_token")?.value;
    if (!token) return apiError("Unauthorized", 401);

    let payload;
    try {
      const { jwtVerify } = await import("jose");
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload: decoded } = await jwtVerify(token, secret);
      payload = decoded;
    } catch {
      return apiError("Unauthorized", 401);
    }

    if (!payload.coupleId) {
      return apiError("Not in a couple", 400);
    }

    const body = await request.json();
    const { content, type = "TEXT", replyToId, mediaUrl } = body;

    if (!content && !mediaUrl) return apiError("Message content or media is required", 400);

    const message = await prisma.message.create({
      data: {
        content: content || "",
        type,
        replyToId,
        mediaUrl: mediaUrl || null,
        senderId: payload.userId as string,
        coupleId: payload.coupleId as string,
      }
    });

    // Award XP for sending a message and run badges check asynchronously
    const { awardXP, checkAndAwardBadges } = await import("@/backend/services/gamification");
    awardXP(payload.userId as string, 5, "Sent a chat message 💬")
      .then(() => checkAndAwardBadges(payload.userId as string))
      .catch((err) => console.error("Chat gamification error:", err));

    // Send asynchronous Push Notifications to the recipient partner
    prisma.couple.findUnique({
      where: { id: payload.coupleId as string },
      include: {
        user1: { select: { id: true, name: true } },
        user2: { select: { id: true, name: true } },
      }
    }).then(async (couple) => {
      if (!couple) return;

      const sender = couple.user1.id === payload.userId ? couple.user1 : couple.user2;
      const recipient = couple.user1.id === payload.userId ? couple.user2 : couple.user1;

      // Find all push subscriptions for the partner
      const subscriptions = await prisma.pushSubscription.findMany({
        where: { userId: recipient.id }
      });

      if (subscriptions.length === 0) return;

      const webpush = require("web-push");
      webpush.setVapidDetails(
        "mailto:support@pokeus.dev",
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string,
        process.env.VAPID_PRIVATE_KEY as string
      );

      const notificationPayload = JSON.stringify({
        title: `Message from ${sender.name} 💜`,
        body: type === "IMAGE" ? "📷 Sent a photo" : content,
        url: "/chat",
      });

      const pushPromises = subscriptions.map((sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        return webpush.sendNotification(pushSubscription, notificationPayload)
          .catch((err: any) => {
            console.error("Failed to send push notification to endpoint:", sub.endpoint, err);
            // Delete expired or obsolete endpoints automatically
            if (err.statusCode === 410 || err.statusCode === 404) {
              return prisma.pushSubscription.delete({
                where: { id: sub.id }
              }).catch(() => {});
            }
          });
      });

      await Promise.all(pushPromises);
    }).catch(err => console.error("Push dispatch error:", err));

    return apiSuccess({ message });
  } catch (error) {
    console.error("Send message error:", error);
    return apiError("Something went wrong", 500);
  }
}
