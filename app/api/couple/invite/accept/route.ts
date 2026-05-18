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

    const { inviteId } = await request.json();
    if (!inviteId) return apiError("Invite ID is required", 400);

    const user = await prisma.user.findUnique({ where: { id: payload.userId as string } });
    if (!user) return apiError("User not found", 404);

    const invite = await prisma.coupleInvite.findUnique({
      where: { id: inviteId }
    });

    if (!invite) return apiError("Invite not found", 404);
    if (invite.status !== "PENDING") return apiError("Invite is no longer pending", 400);
    if (invite.receiverEmail !== user.email) return apiError("You are not the intended recipient", 403);
    
    // Check if either user is already in a couple
    const existingCouple = await prisma.couple.findFirst({
      where: {
        OR: [
          { user1Id: invite.senderId },
          { user2Id: invite.senderId },
          { user1Id: user.id },
          { user2Id: user.id },
        ]
      }
    });

    if (existingCouple) {
      await prisma.coupleInvite.update({
        where: { id: inviteId },
        data: { status: "REJECTED" }
      });
      return apiError("One of the users is already in a relationship. This invite has been cancelled.", 409);
    }

    // Create the couple and update the invite status
    const result = await prisma.$transaction(async (tx) => {
      await tx.coupleInvite.update({
        where: { id: inviteId },
        data: { status: "ACCEPTED", receiverId: user.id }
      });

      return tx.couple.create({
        data: {
          user1Id: invite.senderId,
          user2Id: user.id,
        },
        include: {
          user1: { select: { id: true, name: true, avatar: true, email: true } },
          user2: { select: { id: true, name: true, avatar: true, email: true } }
        }
      });
    });

    return apiSuccess({ message: "Invitation accepted!", couple: result });
  } catch (error) {
    console.error("Accept invite error:", error);
    return apiError("Something went wrong", 500);
  }
}
