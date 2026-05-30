import { NextRequest } from "next/server";
import prisma from "@/backend/lib/db";
import { requireAuth } from "@/backend/lib/requireAuth";
import { apiError, apiSuccess } from "@/backend/lib/utils";

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const { prismaUserId } = auth.context;

  try {
    const body = await request.json();
    const { action, subscription, endpoint } = body;

    if (action === "unsubscribe") {
      const targetEndpoint = endpoint || subscription?.endpoint;
      if (!targetEndpoint) {
        return apiError("Endpoint is required for unsubscription", 400);
      }

      await prisma.pushSubscription.deleteMany({
        where: {
          endpoint: targetEndpoint,
          userId: prismaUserId, // Ensure the user can only delete their own subscription
        },
      });

      return apiSuccess({ message: "Successfully unsubscribed" });
    }

    // Default action: Subscribe
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return apiError("Valid subscription payload is required", 400);
    }

    const { endpoint: subEndpoint, keys } = subscription;
    const { p256dh, auth: subAuth } = keys;

    if (!p256dh || !subAuth) {
      return apiError("Subscription public key and auth token are required", 400);
    }

    // Upsert subscription
    await prisma.pushSubscription.upsert({
      where: { endpoint: subEndpoint },
      update: {
        userId: prismaUserId,
        p256dh,
        auth: subAuth,
      },
      create: {
        userId: prismaUserId,
        endpoint: subEndpoint,
        p256dh,
        auth: subAuth,
      },
    });

    return apiSuccess({ message: "Successfully subscribed to push notifications" });
  } catch (error) {
    console.error("Notification subscription error:", error);
    return apiError("Something went wrong", 500);
  }
}
