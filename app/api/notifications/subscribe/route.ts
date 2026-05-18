import { NextRequest } from "next/server";
import prisma from "@/backend/lib/db";
import { apiError, apiSuccess } from "@/backend/lib/utils";

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

    const userId = payload.userId as string;
    if (!userId) return apiError("Unauthorized", 401);

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
        },
      });

      return apiSuccess({ message: "Successfully unsubscribed" });
    }

    // Default action: Subscribe
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return apiError("Valid subscription payload is required", 400);
    }

    const { endpoint: subEndpoint, keys } = subscription;
    const { p256dh, auth } = keys;

    if (!p256dh || !auth) {
      return apiError("Subscription public key and auth token are required", 400);
    }

    // Upsert subscription
    await prisma.pushSubscription.upsert({
      where: { endpoint: subEndpoint },
      update: {
        userId,
        p256dh,
        auth,
      },
      create: {
        userId,
        endpoint: subEndpoint,
        p256dh,
        auth,
      },
    });

    return apiSuccess({ message: "Successfully subscribed to push notifications" });
  } catch (error) {
    console.error("Notification subscription error:", error);
    return apiError("Something went wrong", 500);
  }
}
