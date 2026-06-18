/**
 * POST /api/auth/signup
 *
 * Registers a new user via Flux, then creates a local user record
 * with an initial credit balance.
 *
 * Body: { email, username, fullName, password }
 */

import { NextRequest, NextResponse } from "next/server";
import { fluxSignup } from "@/lib/flux";
import { setSession } from "@/lib/session";
import prisma from "@/lib/db";

const INITIAL_CREDIT_BALANCE = parseInt(
  process.env.INITIAL_CREDIT_BALANCE || "100",
  10
);

export async function POST(req: NextRequest) {
  try {
    const { email, username, fullName, password } =
      await req.json();

    // Validate required fields
    if (!email || !username || !fullName || !password) {
      return NextResponse.json(
        { error: "All fields are required: email, username, fullName, password" },
        { status: 400 }
      );
    }

    // 1. Register user on Flux
    const fluxUser = await fluxSignup(email, username, fullName, password);

    // 2. Create local user with initial credit balance
    const localUser = await prisma.user.create({
      data: {
        fluxUserId: fluxUser.id,
        creditBalance: INITIAL_CREDIT_BALANCE,
      },
    });

    // 3. Auto-login: get access token by logging in to Flux
    const { fluxLogin } = await import("@/lib/flux");
    const loginResult = await fluxLogin(email, password);

    // 4. Set session cookie
    await setSession(loginResult.access_token);

    return NextResponse.json(
      {
        message: "Registration successful",
        user: {
          id: localUser.id,
          fluxUserId: localUser.fluxUserId,
          creditBalance: localUser.creditBalance,
          email: fluxUser.email,
          username: fluxUser.username,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Signup error:", error.message);

    // Handle duplicate user errors from Flux
    if (
      error.message.toLowerCase().includes("already exists") ||
      error.message.toLowerCase().includes("duplicate") ||
      error.message.toLowerCase().includes("already registered")
    ) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Registration failed" },
      { status: 500 }
    );
  }
}
