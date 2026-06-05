import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import prisma from "@/backend/lib/db";
import { NextResponse } from "next/server";

/**
 * POST /api/auth/clerk-webhook
 *
 * Clerk calls this endpoint when auth events occur (user.created, user.deleted, etc.).
 * This is how we keep our Prisma User table in sync with Clerk's user registry.
 *
 * Setup in Clerk Dashboard → Webhooks → Add endpoint:
 *   URL: https://yourdomain.com/api/auth/clerk-webhook
 *   Events: user.created, user.updated, user.deleted
 */
export async function POST(request: Request) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("CLERK_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  // Verify webhook signature using svix
  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing webhook headers" }, { status: 400 });
  }

  const body = await request.text();
  const wh = new Webhook(webhookSecret);
  let event: WebhookEvent;

  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  const { type, data } = event;

  try {
    if (type === "user.created") {
      const { id, email_addresses, first_name, last_name, image_url } = data as {
        id: string;
        email_addresses: { email_address: string; id: string }[];
        first_name: string | null;
        last_name: string | null;
        image_url: string | null;
      };

      const email = email_addresses[0]?.email_address ?? "";
      const name =
        `${first_name ?? ""} ${last_name ?? ""}`.trim() || email.split("@")[0];

      // Upsert: create or update (handles race conditions with auto-provision in /me)
      await prisma.user.upsert({
        where: { email },
        create: {
          clerkId: id,
          email,
          name,
          avatar: image_url || undefined,
          isVerified: true,
        },
        update: {
          clerkId: id,
          name,
          avatar: image_url || undefined,
          isVerified: true,
        },
      });

      // Award 50 XP for email verification
      const user = await prisma.user.findUnique({ where: { clerkId: id } });
      if (user) {
        const existing = await prisma.xPLog.findFirst({
          where: { userId: user.id, reason: "Email verified" },
        });
        if (!existing) {
          await prisma.xPLog.create({
            data: { userId: user.id, amount: 50, reason: "Email verified" },
          });
          await prisma.user.update({
            where: { id: user.id },
            data: { xpPoints: { increment: 50 } },
          });
        }
      }
    }

    if (type === "user.updated") {
      const { id, email_addresses, first_name, last_name, image_url } = data as {
        id: string;
        email_addresses: { email_address: string }[];
        first_name: string | null;
        last_name: string | null;
        image_url: string | null;
      };

      const email = email_addresses[0]?.email_address ?? "";
      const name = `${first_name ?? ""} ${last_name ?? ""}`.trim();

      await prisma.user.updateMany({
        where: { clerkId: id },
        data: {
          email: email || undefined,
          name: name || undefined,
          avatar: image_url || undefined,
        },
      });
    }

    if (type === "user.deleted") {
      const { id } = data as { id: string };

      // Find and cascade-delete the Prisma user (Prisma handles relations)
      const user = await prisma.user.findUnique({ where: { clerkId: id } });
      if (user) {
        // Find if they are in a couple and delete the couple
        const userCouple = await prisma.couple.findFirst({
          where: {
            OR: [
              { user1Id: user.id },
              { user2Id: user.id }
            ]
          }
        });
        
        if (userCouple) {
          await prisma.couple.delete({ where: { id: userCouple.id } });
        }

        // Delete invites
        await prisma.coupleInvite.deleteMany({
          where: {
            OR: [
              { senderId: user.id },
              { receiverId: user.id }
            ]
          }
        });

        // Delete user and remaining relations
        await prisma.$transaction([
          prisma.xPLog.deleteMany({ where: { userId: user.id } }),
          prisma.moodEntry.deleteMany({ where: { userId: user.id } }),
          prisma.userBadge.deleteMany({ where: { userId: user.id } }),
          prisma.pushSubscription.deleteMany({ where: { userId: user.id } }),
          prisma.user.delete({ where: { id: user.id } }),
        ]);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
