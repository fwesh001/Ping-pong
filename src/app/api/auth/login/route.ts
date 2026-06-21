/**
 * POST /api/auth/login
 *
 * Authenticates a user via Flux using email/username + password,
 * then sets a secure HTTP-only session cookie.
 *
 * Body: { email, password }
 */

import { NextRequest, NextResponse } from "next/server";
import { fluxLogin, fluxGetMe } from "@/lib/flux";
import { setSession } from "@/lib/session";
import prisma from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // 1. Authenticate with Flux
    const loginResult = await fluxLogin(email, password);

    // 2. Get user details from Flux
    const fluxUser = await fluxGetMe(loginResult.access_token);

    const fluxUserId = String(fluxUser.id);

    // 3. Sync local user (create if first time, or verify exists)
    let localUser = await prisma.user.findUnique({
      where: { fluxUserId },
    });

    if (!localUser) {
      // First-time login via Flux – create local record
      localUser = await prisma.user.create({
        data: {
          fluxUserId,
          creditBalance: parseInt(
            process.env.INITIAL_CREDIT_BALANCE || "100",
            10
          ),
        },
      });
    }

    // 4. Set session cookie
    await setSession(loginResult.access_token);

    return NextResponse.json({
      message: "Login successful",
      user: {
        id: localUser.id,
        fluxUserId: localUser.fluxUserId,
        creditBalance: localUser.creditBalance,
        email: fluxUser.email,
        username: fluxUser.username,
      },
    });
  } catch (error: any) {
    console.error("Login error:", error.message);

    if (
      error.message.toLowerCase().includes("invalid") ||
      error.message.toLowerCase().includes("credential") ||
      error.message.toLowerCase().includes("unauthorized")
    ) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Login failed" },
      { status: 500 }
    );
  }
}
