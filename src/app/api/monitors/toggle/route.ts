/**
 * /api/monitors/toggle — Flip monitor status between ACTIVE and PAUSED
 *
 * POST /api/monitors/toggle?id=xxx
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import prisma from "@/lib/db";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const monitorId = searchParams.get("id");
  if (!monitorId) {
    return NextResponse.json({ error: "Monitor ID is required" }, { status: 400 });
  }

  try {
    const existing = await prisma.monitor.findFirst({
      where: { id: monitorId, userId: auth.user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Monitor not found" }, { status: 404 });
    }

    // Determine new states
    const wasActive = existing.isActive;
    const newActive = !wasActive;
    const newStatus = newActive ? "ACTIVE" : "PAUSED";

    const updated = await prisma.monitor.update({
      where: { id: monitorId },
      data: {
        isActive: newActive,
        status: newStatus,
      },
    });

    return NextResponse.json({
      message: `Monitor ${newActive ? "resumed" : "paused"}`,
      monitor: {
        id: updated.id,
        isActive: updated.isActive,
        status: updated.status,
      },
    });
  } catch (error: any) {
    console.error("Toggle monitor error:", error.message);
    return NextResponse.json({ error: "Failed to toggle monitor" }, { status: 500 });
  }
}
