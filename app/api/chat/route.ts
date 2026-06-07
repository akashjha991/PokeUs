import { NextRequest } from "next/server";
import prisma from "@/backend/lib/db";
import { requireCouple } from "@/backend/lib/requireAuth";
import { apiError, apiSuccess } from "@/backend/lib/utils";
import { messageSchema } from "@/backend/validations";
import { uploadImage } from "@/backend/lib/cloudinary";

export async function GET(request: NextRequest) {
  const auth = await requireCouple(request);
  if (auth.error) return auth.error;

  const { prismaUserId, coupleId } = auth.context;

  try {
    const messages = await prisma.message.findMany({
      where: { coupleId },
      orderBy: { createdAt: "asc" },
      take: 100,
    });

    return apiSuccess({ messages });
  } catch (error) {
    console.error("Fetch messages error:", error);
    return apiError("Something went wrong", 500);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireCouple(request);
  if (auth.error) return auth.error;

  const { prismaUserId, coupleId } = auth.context;

  try {
    const body = await request.json();

    // Validate message schema — prevents XSS payload storage
    const parsed = messageSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.errors[0].message, 400);
    }

    const { content, type = "TEXT", replyToId } = parsed.data;
    const { mediaUrl } = body;

    // Validate mediaUrl is a HTTPS Cloudinary URL if provided
    let finalMediaUrl = mediaUrl;
    if (mediaUrl) {
      if (mediaUrl.startsWith("data:")) {
        try {
          let resourceType: "image" | "video" | "raw" | "auto" = "auto";
          if (mediaUrl.startsWith("data:image/")) {
            resourceType = "image";
          } else if (mediaUrl.startsWith("data:audio/")) {
            resourceType = "video";
          } else if (mediaUrl.startsWith("data:video/")) {
            resourceType = "video";
          } else {
            resourceType = "raw";
          }

          const uploadResult = await uploadImage(mediaUrl, "chat", resourceType);
          finalMediaUrl = uploadResult.url;
        } catch (uploadError) {
          console.error("Cloudinary chat upload error:", uploadError);
          return apiError("Failed to upload file to cloud storage", 500);
        }
      } else {
        try {
          const url = new URL(mediaUrl);
          if (url.protocol !== "https:" || !url.hostname.includes("cloudinary.com")) {
            return apiError("Invalid media URL", 400);
          }
        } catch {
          return apiError("Invalid media URL", 400);
        }
      }
    }

    if (!content && !finalMediaUrl) return apiError("Message content or media is required", 400);

    const message = await prisma.message.create({
      data: {
        content: content || "",
        type,
        replyToId,
        mediaUrl: finalMediaUrl || null,
        senderId: prismaUserId,
        coupleId,
      },
    });

    // Award XP + badges asynchronously
    const { awardXP, checkAndAwardBadges } = await import("@/backend/services/gamification");
    awardXP(prismaUserId, 5, "Sent a chat message 💬")
      .then(() => checkAndAwardBadges(prismaUserId))
      .catch((err) => console.error("Chat gamification error:", err));

    // Push notifications — async, non-blocking
    sendPushNotification(coupleId, prismaUserId, content, type).catch((err) =>
      console.error("Push dispatch error:", err)
    );

    return apiSuccess({ message });
  } catch (error) {
    console.error("Send message error:", error);
    return apiError("Something went wrong", 500);
  }
}

async function sendPushNotification(
  coupleId: string,
  senderId: string,
  content: string,
  type: string
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
    title: `Message from ${sender.name} 💜`,
    body: type === "IMAGE" ? "📷 Sent a photo" : content,
    url: "/chat",
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
