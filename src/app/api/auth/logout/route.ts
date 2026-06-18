/**
 * POST /api/auth/logout
 *
 * Clears the session cookie to log the user out.
 */

import { NextResponse } from "next/server";
import { clearSession } from "@/lib/session";

export async function POST() {
  try {
    await clearSession();

    return NextResponse.json({ message: "Logged out successfully" });
  } catch (error: any) {
    console.error("Logout error:", error.message);
    return NextResponse.json(
      { error: "Logout failed" },
      { status: 500 }
    );
  }
}
