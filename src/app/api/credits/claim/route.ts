/**
 * POST /api/credits/claim
 *
 * Gamified daily credit claim with 7-day streak tracking.
 *
 * Streak logic:
 *   - < 24h since last claim → reject (400)
 *   - 24h–48h → streak continues, increment streakCount
 *     - If streakCount hits 7 → grant 25 bonus credits, reset to 1
 *   - > 48h → streak broken, reset to 1, baseline 10 credits
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import prisma from "@/lib/db";

const DAILY_REWARD = 10;
const STREAK_BONUS = 25;
const STREAK_CYCLE = 7;
const HOURS_24 = 24 * 60 * 60 * 1000;
const HOURS_48 = 48 * 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const now = new Date();
    const lastClaimed = user.lastClaimedAt;
    const hoursSinceLastClaim = lastClaimed
      ? (now.getTime() - lastClaimed.getTime()) / (60 * 60 * 1000)
      : null;

    // Less than 24 hours → reject
    if (hoursSinceLastClaim !== null && hoursSinceLastClaim < 24) {
      const nextClaimAt = new Date(lastClaimed.getTime() + HOURS_24);
      return NextResponse.json(
        {
          error: "Already claimed. Come back in " + Math.ceil(24 - hoursSinceLastClaim) + " hours.",
          nextClaimAt: nextClaimAt.toISOString(),
          streakCount: user.streakCount,
        },
        { status: 400 }
      );
    }

    // Determine streak and reward
    let newStreak: number;
    let reward: number;
    let isBonus = false;

    if (hoursSinceLastClaim === null || hoursSinceLastClaim > 48) {
      // First claim ever, or streak broken (> 48h)
      newStreak = 1;
      reward = DAILY_REWARD;
    } else {
      // Streak continues (24h–48h)
      newStreak = user.streakCount + 1;
      if (newStreak >= STREAK_CYCLE) {
        // Day 7 achieved! Grant bonus and reset cycle
        newStreak = 1;
        reward = STREAK_BONUS;
        isBonus = true;
      } else {
        reward = DAILY_REWARD;
      }
    }

    // Atomic update: claim record + user balance + streak
    const [_, updatedUser] = await prisma.$transaction([
      prisma.dailyCreditClaim.create({
        data: {
          userId: auth.user.id,
          claimedAt: now,
        },
      }),
      prisma.user.update({
        where: { id: auth.user.id },
        data: {
          creditBalance: { increment: reward },
          streakCount: newStreak,
          lastClaimedAt: now,
        },
      }),
    ]);

    return NextResponse.json({
      message: isBonus
        ? `🎉 Day 7 bonus! You earned ${STREAK_BONUS} credits!`
        : `Successfully claimed ${reward} credits!`,
      creditBalance: Number(updatedUser.creditBalance),
      streakCount: newStreak,
      isBonus,
      reward,
    });
  } catch (error: any) {
    console.error("Credit claim error:", error.message);
    return NextResponse.json({ error: "Failed to claim credits" }, { status: 500 });
  }
}
