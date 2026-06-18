/**
 * POST /api/credits/claim
 *
 * Allows a user to claim their daily credit reward once per 24-hour period.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import prisma from "@/lib/db";

const DAILY_REWARD = parseInt(
  process.env.DAILY_CREDIT_REWARD || "10",
  10
);

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    // Check if already claimed today (UTC day boundary)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const existingClaim = await prisma.dailyCreditClaim.findUnique({
      where: {
        userId_claimedAt: {
          userId: auth.user.id,
          claimedAt: today,
        },
      },
    });

    if (existingClaim) {
      return NextResponse.json(
        { error: "Already claimed today. Come back tomorrow!" },
        { status: 429 }
      );
    }

    // Create claim record and atomically increment balance
    const [_, updatedUser] = await prisma.$transaction([
      prisma.dailyCreditClaim.create({
        data: {
          userId: auth.user.id,
          claimedAt: today,
        },
      }),
      prisma.user.update({
        where: { id: auth.user.id },
        data: {
          creditBalance: {
            increment: DAILY_REWARD,
          },
        },
      }),
    ]);

    return NextResponse.json({
      message: `Successfully claimed ${DAILY_REWARD} credits`,
      creditBalance: parseFloat(updatedUser.creditBalance.toString()),
      claimedAt: today.toISOString(),
    });
  } catch (error: any) {
    console.error("Credit claim error:", error.message);
    return NextResponse.json(
      { error: "Failed to claim credits" },
      { status: 500 }
    );
  }
}
