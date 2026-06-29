/**
 * GET /api/auth/me
 *
 * Returns the current authenticated user's profile and credit balance.
 * Requires a valid session cookie.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { fluxGetMe } from "@/lib/flux";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // 1. Get session token from cookie
    const token = await getSession();

    if (!token) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // 2. Verify token with Flux and get user details
    const fluxUser = await fluxGetMe(token);

    const fluxUserId = String(fluxUser.id);

    // 3. Get local user data (credit balance, etc.)
    const localUser = await prisma.user.findUnique({
      where: { fluxUserId },
    });

    if (!localUser) {
      return NextResponse.json(
        { error: "User not found locally" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        id: localUser.id,
        fluxUserId: localUser.fluxUserId,
        creditBalance: localUser.creditBalance,
        streakCount: localUser.streakCount,
        lastClaimedAt: localUser.lastClaimedAt,
        monitorSlots: localUser.monitorSlots,
        role: localUser.role,
        email: fluxUser.email,
        username: fluxUser.username,
        fullName: fluxUser.full_name,
        isActive: fluxUser.is_active,
      },
    });
  } catch (error: any) {
    console.error("Auth check error:", error.message);

    if (
      error.message.toLowerCase().includes("unauthorized") ||
      error.message.toLowerCase().includes("invalid token") ||
      error.message.toLowerCase().includes("expired")
    ) {
      return NextResponse.json(
        { error: "Session expired" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Authentication check failed" },
      { status: 500 }
    );
  }
}
