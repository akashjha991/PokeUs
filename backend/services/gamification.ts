import prisma from "@/backend/lib/db";
import { getXPLevel } from "@/backend/lib/utils";

// Define the system's static badge definitions
export const SYSTEM_BADGES = [
  {
    name: "First Spark ⚡",
    description: "Successfully connected with your partner in PokeUs!",
    icon: "⚡",
    rarity: "COMMON" as const,
    xpReward: 100,
  },
  {
    name: "Chatterbox 💬",
    description: "Sent at least 25 messages in your private chat.",
    icon: "💬",
    rarity: "COMMON" as const,
    xpReward: 150,
  },
  {
    name: "Memory Maker 📷",
    description: "Uploaded 5 or more shared memories on your photo timeline.",
    icon: "📷",
    rarity: "RARE" as const,
    xpReward: 200,
  },
  {
    name: "Daily Anchor ☀️",
    description: "Logged 7 daily mood entries to share with your partner.",
    icon: "☀️",
    rarity: "RARE" as const,
    xpReward: 200,
  },
  {
    name: "Financial Partners 💸",
    description: "Tracked 10 or more joint expenses in your mutual ledger.",
    icon: "💸",
    rarity: "COMMON" as const,
    xpReward: 150,
  },
  {
    name: "Lovebirds 🐦",
    description: "Maintained a daily active streak of 7 days!",
    icon: "🐦",
    rarity: "EPIC" as const,
    xpReward: 300,
  },
  {
    name: "Unbreakable Bond 🔥",
    description: "Reached a magnificent 30-day active streak!",
    icon: "🔥",
    rarity: "LEGENDARY" as const,
    xpReward: 600,
  },
];

/**
 * Ensures system badges exist in the database.
 * Seeds badges if they are missing.
 */
export async function ensureBadgesSeeded() {
  try {
    for (const badge of SYSTEM_BADGES) {
      await prisma.badge.upsert({
        where: { name: badge.name },
        update: {
          description: badge.description,
          icon: badge.icon,
          rarity: badge.rarity,
          xpReward: badge.xpReward,
        },
        create: {
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
          rarity: badge.rarity,
          xpReward: badge.xpReward,
        },
      });
    }
  } catch (err) {
    console.error("Failed to seed badges:", err);
  }
}

/**
 * Awards experience points (XP) to a user, logs the transaction,
 * and checks if they leveled up.
 */
export async function awardXP(
  userId: string,
  amount: number,
  reason: string
): Promise<{ leveledUp: boolean; oldLevel: number; newLevel: number; xpPoints: number }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { xpPoints: true },
    });

    if (!user) throw new Error("User not found");

    const oldXP = user.xpPoints;
    const newXP = oldXP + amount;

    const oldLevelInfo = getXPLevel(oldXP);
    const newLevelInfo = getXPLevel(newXP);

    // Update user XP and create an XP log entry
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { xpPoints: newXP },
      }),
      prisma.xPLog.create({
        data: {
          userId,
          amount,
          reason,
        },
      }),
    ]);

    const leveledUp = newLevelInfo.level > oldLevelInfo.level;

    return {
      leveledUp,
      oldLevel: oldLevelInfo.level,
      newLevel: newLevelInfo.level,
      xpPoints: newXP,
    };
  } catch (error) {
    console.error(`Error awarding XP to user ${userId}:`, error);
    return { leveledUp: false, oldLevel: 1, newLevel: 1, xpPoints: 0 };
  }
}

/**
 * Updates a user's active connection streak.
 * Streaks increment if active in consecutive calendar days (12h to 36h since last active).
 * Resets to 1 if inactive for > 36 hours.
 * Does nothing if active within the last 12 hours (prevents spamming).
 */
export async function updateActiveStreak(
  userId: string
): Promise<{ streakDays: number; streakIncremented: boolean }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { lastActiveAt: true, streakDays: true },
    });

    if (!user) throw new Error("User not found");

    const now = new Date();
    const lastActive = new Date(user.lastActiveAt);
    const timeDiff = now.getTime() - lastActive.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    let newStreak = user.streakDays;
    let streakIncremented = false;

    if (hoursDiff >= 12 && hoursDiff <= 36) {
      // Consecutive active day! Increment streak
      newStreak = user.streakDays + 1;
      streakIncremented = true;

      await prisma.user.update({
        where: { id: userId },
        data: {
          streakDays: newStreak,
          lastActiveAt: now,
        },
      });

      // Award XP for daily active streak maintaining
      await awardXP(userId, 15, `Maintained daily active streak! (${newStreak} days)`);
    } else if (hoursDiff > 36) {
      // Streak broken. Reset to 1.
      newStreak = 1;
      streakIncremented = true;

      await prisma.user.update({
        where: { id: userId },
        data: {
          streakDays: newStreak,
          lastActiveAt: now,
        },
      });

      await awardXP(userId, 10, "Started a new connection streak!");
    } else {
      // Active within 12 hours: just update last active stamp to now without editing streak
      await prisma.user.update({
        where: { id: userId },
        data: { lastActiveAt: now },
      });
    }

    // Always run a badge evaluation after activity updates
    if (streakIncremented) {
      await checkAndAwardBadges(userId);
    }

    return { streakDays: newStreak, streakIncremented };
  } catch (error) {
    console.error(`Error updating streak for user ${userId}:`, error);
    return { streakDays: 0, streakIncremented: false };
  }
}

/**
 * Analyzes database records to evaluate and unlock eligible badges for a user.
 */
export async function checkAndAwardBadges(
  userId: string
): Promise<{ unlockedBadges: string[] }> {
  const unlockedBadges: string[] = [];

  try {
    // 1. Ensure system badges are populated
    await ensureBadgesSeeded();

    // 2. Fetch user activity counts & already earned badges
    const [user, messagesCount, memoriesCount, moodCount, expensesCount] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        include: { badges: { include: { badge: true } } },
      }),
      prisma.message.count({ where: { senderId: userId } }),
      prisma.memory.count({ where: { createdById: userId } }),
      prisma.moodEntry.count({ where: { userId } }),
      prisma.expense.count({ where: { paidById: userId } }),
    ]);

    if (!user) return { unlockedBadges };

    const earnedBadgeNames = new Set(user.badges.map((ub) => ub.badge.name));

    // Helper: secure award linkage
    const linkBadge = async (badgeName: string) => {
      if (earnedBadgeNames.has(badgeName)) return;

      const badge = await prisma.badge.findUnique({ where: { name: badgeName } });
      if (!badge) return;

      await prisma.userBadge.create({
        data: {
          userId,
          badgeId: badge.id,
        },
      });

      unlockedBadges.push(badgeName);
      // Award the badge's built-in XP reward
      await awardXP(userId, badge.xpReward, `Unlocked Badge: ${badge.name}`);
    };

    // 3. Evaluate criteria for each badge
    
    // BADGE: First Spark (Connected to partner)
    const hasCouple = await prisma.couple.findFirst({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
    });
    if (hasCouple) {
      await linkBadge("First Spark ⚡");
    }

    // BADGE: Chatterbox (25 messages sent)
    if (messagesCount >= 25) {
      await linkBadge("Chatterbox 💬");
    }

    // BADGE: Memory Maker (5 memories created)
    if (memoriesCount >= 5) {
      await linkBadge("Memory Maker 📷");
    }

    // BADGE: Daily Anchor (7 mood logs)
    if (moodCount >= 7) {
      await linkBadge("Daily Anchor ☀️");
    }

    // BADGE: Financial Partners (10 expenses tracked)
    if (expensesCount >= 10) {
      await linkBadge("Financial Partners 💸");
    }

    // BADGE: Lovebirds (7-day streak)
    if (user.streakDays >= 7) {
      await linkBadge("Lovebirds 🐦");
    }

    // BADGE: Unbreakable Bond (30-day streak)
    if (user.streakDays >= 30) {
      await linkBadge("Unbreakable Bond 🔥");
    }

  } catch (error) {
    console.error(`Error checking badges for user ${userId}:`, error);
  }

  return { unlockedBadges };
}
