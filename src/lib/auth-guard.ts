/**
 * Shared Auth Guard Helper
 *
 * Provides `requireAuth()` — a reusable server-side guard that:
 *   1. Reads the `flux_token` cookie
 *   2. Validates it against Flux (/users/me)
 *   3. Looks up the local Prisma user
 *
 * Returns `{ user, fluxUser }` on success, or a `NextResponse` error on failure.
 * API routes should check the return type and return the response early if it's
 * an error.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { fluxGetMe, FluxUser } from "@/lib/flux";
import prisma from "@/lib/db";

export interface AuthUser {
  id: string;
  fluxUserId: string;
  creditBalance: number;
  email: string;
  username: string;
  role: string;
  monitorSlots: number;
}

export interface AuthResult {
  user: AuthUser;
  fluxUser: FluxUser;
}

/**
 * Require authentication for an API route or server component.
 * Returns either the auth data or a NextResponse error.
 */
export async function requireAuth(
  req?: NextRequest
): Promise<AuthResult | NextResponse> {
  const token = await getSession();
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let fluxUser: FluxUser;
  try {
    fluxUser = await fluxGetMe(token);
  } catch {
    return NextResponse.json(
      { error: "Session expired or invalid" },
      { status: 401 }
    );
  }

  const fluxUserId = String(fluxUser.id);

  const localUser = await prisma.user.findUnique({
    where: { fluxUserId },
  });

  if (!localUser) {
    return NextResponse.json(
      { error: "User not found locally" },
      { status: 404 }
    );
  }

  return {
    user: {
      id: localUser.id,
      fluxUserId: localUser.fluxUserId,
      creditBalance: Number(localUser.creditBalance),
      email: fluxUser.email,
      username: fluxUser.username,
      role: localUser.role,
      monitorSlots: localUser.monitorSlots,
    },
    fluxUser,
  };
}

export async function requireAdmin(
  req?: NextRequest
): Promise<AuthResult | NextResponse> {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  if (auth.user.role !== "ADMIN" && auth.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  return auth;
}

/**
 * Calculate the cost per ping for a given interval.
 * Formula: Cost = (0.8333 * interval_in_seconds) / 3600
 * This ensures 100 credits last exactly 5 days for a single active monitor.
 */
export function calculatePingCost(intervalSecs: number): number {
  return (0.8333 * intervalSecs) / 3600;
}

/**
 * Format a credit value for display (4 decimal places max, trimmed).
 */
export function formatCredits(value: number): string {
  return value.toFixed(4).replace(/\.?0+$/, "");
}
