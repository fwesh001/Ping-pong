/**
 * GET /api/auth/callback
 *
 * Receives the OAuth redirect from Flux after Google authentication.
 * Flux redirects here with ?token=...&oauth=success
 *
 * This route:
 *   1. Extracts the access_token from query parameters
 *   2. Verifies the user via Flux (/users/me)
 *   3. Syncs the user to the local Prisma database (100 starting credits if new)
 *   4. Sets the HTTP-only session cookie
 *   5. Redirects to /dashboard
 */

import { NextRequest, NextResponse } from "next/server";
import { fluxGetMe } from "@/lib/flux";
import { setSession } from "@/lib/session";
import prisma from "@/lib/db";

const INITIAL_CREDIT_BALANCE = parseInt(
  process.env.INITIAL_CREDIT_BALANCE || "100",
  10
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const oauthStatus = searchParams.get("oauth");
  const oauthError = searchParams.get("oauth_error");

  // Handle OAuth errors
  if (oauthError) {
    const loginUrl = new URL("/login", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
    loginUrl.searchParams.set("error", oauthError);
    return NextResponse.redirect(loginUrl);
  }

  // Validate token presence
  if (!token || oauthStatus !== "success") {
    const loginUrl = new URL("/login", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
    loginUrl.searchParams.set("error", "invalid_oauth_callback");
    return NextResponse.redirect(loginUrl);
  }

  try {
    // 1. Verify the token with Flux and get user details
    const fluxUser = await fluxGetMe(token);

    const fluxUserId = String(fluxUser.id);

    // 2. Sync local user (create if first time)
    let localUser = await prisma.user.findUnique({
      where: { fluxUserId },
    });

    if (!localUser) {
      localUser = await prisma.user.create({
        data: {
          fluxUserId,
          creditBalance: INITIAL_CREDIT_BALANCE,
        },
      });
    }

    // 3. Set session cookie
    await setSession(token);

    // 4. Redirect to dashboard
    const dashboardUrl = new URL("/dashboard", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
    return NextResponse.redirect(dashboardUrl);
  } catch (error: any) {
    console.error("OAuth callback error:", error.message);
    const loginUrl = new URL("/login", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
    loginUrl.searchParams.set("error", "oauth_verification_failed");
    return NextResponse.redirect(loginUrl);
  }
}
