import { NextRequest } from "next/server";
import prisma from "@/backend/lib/db";
import { verifyAccessToken } from "@/backend/lib/auth";
import { sendInviteEmail } from "@/backend/lib/email";
import { apiError, apiSuccess } from "@/backend/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("access_token")?.value;
    if (!token) return apiError("Unauthorized", 401);
    
    // Instead of using verifyAccessToken which uses jsonwebtoken, let's use jose to match profile route
    // Or just use verifyAccessToken if it's safe. It's safer to use jose since we know it works.
    let payload;
    try {
      const { jwtVerify } = await import("jose");
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload: decoded } = await jwtVerify(token, secret);
      payload = decoded;
    } catch {
      return apiError("Unauthorized", 401);
    }

    const { receiverEmail } = await request.json();
    if (!receiverEmail) return apiError("Partner email is required", 400);
    if (receiverEmail === payload.email) return apiError("You can't invite yourself", 400);

    const existingCouple = await prisma.couple.findFirst({
      where: { OR: [{ user1Id: payload.userId as string }, { user2Id: payload.userId as string }] },
    });
    if (existingCouple) return apiError("You're already paired with a partner", 409);

    const existingInvite = await prisma.coupleInvite.findFirst({
      where: { senderId: payload.userId as string, status: "PENDING" },
    });
    if (existingInvite) return apiError("You already have a pending invite", 409);

    const invite = await prisma.coupleInvite.create({
      data: {
        senderId: payload.userId as string,
        receiverEmail,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const sender = await prisma.user.findUnique({ where: { id: payload.userId as string } });
    
    try {
      await sendInviteEmail(receiverEmail, sender!.name, invite.code);
    } catch (e) {
      console.warn("Could not send email, returning code in response for local testing", e);
    }

    return apiSuccess({ 
      message: "Invitation created!", 
      inviteCode: invite.code,
      inviteUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${invite.code}`
    });
  } catch (error) {
    console.error("Invite error:", error);
    return apiError("Something went wrong", 500);
  }
}

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

    const user = await prisma.user.findUnique({ where: { id: payload.userId as string } });
    if (!user) return apiError("User not found", 404);

    const pendingInvites = await prisma.coupleInvite.findMany({
      where: { receiverEmail: user.email, status: "PENDING" },
      include: { sender: { select: { id: true, name: true, avatar: true, email: true } } },
    });

    // Auto-cleanup: If the sender of a pending invite is already in a couple, invalidate the invite
    const validInvites = [];
    for (const invite of pendingInvites) {
      const senderInCouple = await prisma.couple.findFirst({
        where: { OR: [{ user1Id: invite.senderId }, { user2Id: invite.senderId }] }
      });

      if (senderInCouple) {
        // Silently mark as rejected so it doesn't linger on the receiver's dashboard
        await prisma.coupleInvite.update({
          where: { id: invite.id },
          data: { status: "REJECTED" }
        });
      } else {
        validInvites.push(invite);
      }
    }

    return apiSuccess({ invites: validInvites });
  } catch (error) {
    console.error("Get invites error:", error);
    return apiError("Something went wrong", 500);
  }
}
