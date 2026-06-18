/**
 * /api/monitors — Full CRUD for service monitors
 *
 * GET    /api/monitors          — list all monitors for the authenticated user
 * POST   /api/monitors          — create a new monitor (max 5 active per user)
 * PATCH  /api/monitors?id=xxx   — update a monitor (name, URL, interval, active)
 * DELETE /api/monitors?id=xxx   — delete a monitor
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, calculatePingCost } from "@/lib/auth-guard";
import prisma from "@/lib/db";

const MAX_ACTIVE_MONITORS = 5;

// ---------------------------------------------------------------------------
// GET — list all monitors for the current user
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const monitors = await prisma.monitor.findMany({
    where: { userId: auth.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      pingLogs: {
        orderBy: { checkedAt: "desc" },
        take: 1,
      },
    },
  });

  // Compute uptime % from last 30 days of ping logs for each monitor
  const monitorsWithUptime = await Promise.all(
    monitors.map(async (m) => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [total, successful] = await Promise.all([
        prisma.pingLog.count({
          where: { monitorId: m.id, checkedAt: { gte: thirtyDaysAgo } },
        }),
        prisma.pingLog.count({
          where: {
            monitorId: m.id,
            status: "success",
            checkedAt: { gte: thirtyDaysAgo },
          },
        }),
      ]);

      const uptime = total > 0 ? (successful / total) * 100 : 0;

      // Format last checked
      let lastChecked = "Never";
      if (m.lastPingedAt) {
        const diffMs = Date.now() - m.lastPingedAt.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) lastChecked = "Just now";
        else if (diffMins < 60) lastChecked = `${diffMins} min ago`;
        else if (diffMins < 1440)
          lastChecked = `${Math.floor(diffMins / 60)} hr ago`;
        else lastChecked = `${Math.floor(diffMins / 1440)} days ago`;
      }

      return {
        id: m.id,
        serviceName: m.serviceName,
        targetUrl: m.targetUrl,
        pingInterval: m.pingIntervalSecs,
        isActive: m.isActive,
        costPerPing:
          typeof m.costPerPing === "number"
            ? m.costPerPing
            : parseFloat(m.costPerPing.toString()),
        status: m.pingLogs[0]?.status || "unknown",
        lastChecked,
        uptime: Math.round(uptime * 10) / 10,
      };
    })
  );

  return NextResponse.json({ monitors: monitorsWithUptime });
}

// ---------------------------------------------------------------------------
// POST — create a new monitor
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { serviceName, targetUrl, pingInterval } = await req.json();

    // Validate
    if (!serviceName?.trim()) {
      return NextResponse.json(
        { error: "Service name is required" },
        { status: 400 }
      );
    }
    if (!targetUrl?.trim()) {
      return NextResponse.json(
        { error: "Target URL is required" },
        { status: 400 }
      );
    }
    try {
      new URL(targetUrl);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }
    const interval = Number(pingInterval);
    if (interval < 30 || interval > 3600) {
      return NextResponse.json(
        { error: "Ping interval must be between 30 and 3600 seconds" },
        { status: 400 }
      );
    }

    // Enforce max 5 active monitors
    const activeCount = await prisma.monitor.count({
      where: { userId: auth.user.id, isActive: true },
    });
    if (activeCount >= MAX_ACTIVE_MONITORS) {
      return NextResponse.json(
        {
          error: `Maximum of ${MAX_ACTIVE_MONITORS} active monitors reached. Pause or delete an existing monitor first.`,
        },
        { status: 403 }
      );
    }

    // Calculate dynamic cost per ping
    const costPerPing = calculatePingCost(interval);

    const monitor = await prisma.monitor.create({
      data: {
        userId: auth.user.id,
        serviceName: serviceName.trim(),
        targetUrl: targetUrl.trim(),
        pingIntervalSecs: interval,
        costPerPing,
        isActive: true,
      },
    });

    return NextResponse.json(
      {
        message: "Monitor created",
        monitor: {
          id: monitor.id,
          serviceName: monitor.serviceName,
          targetUrl: monitor.targetUrl,
          pingInterval: monitor.pingIntervalSecs,
          isActive: monitor.isActive,
          costPerPing: parseFloat(monitor.costPerPing.toString()),
          status: "unknown",
          lastChecked: "Never",
          uptime: 0,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create monitor error:", error.message);
    return NextResponse.json(
      { error: "Failed to create monitor" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH — update a monitor
// ---------------------------------------------------------------------------
export async function PATCH(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const monitorId = searchParams.get("id");

  if (!monitorId) {
    return NextResponse.json(
      { error: "Monitor ID is required" },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();

    // Verify ownership
    const existing = await prisma.monitor.findFirst({
      where: { id: monitorId, userId: auth.user.id },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Monitor not found" },
        { status: 404 }
      );
    }

    const updateData: Record<string, any> = {};

    if (body.serviceName !== undefined) updateData.serviceName = body.serviceName.trim();
    if (body.targetUrl !== undefined) {
      try {
        new URL(body.targetUrl);
      } catch {
        return NextResponse.json(
          { error: "Invalid URL format" },
          { status: 400 }
        );
      }
      updateData.targetUrl = body.targetUrl.trim();
    }
    if (body.pingInterval !== undefined) {
      const interval = Number(body.pingInterval);
      if (interval < 30 || interval > 3600) {
        return NextResponse.json(
          { error: "Ping interval must be between 30 and 3600 seconds" },
          { status: 400 }
        );
      }
      updateData.pingIntervalSecs = interval;
      // Recalculate cost when interval changes
      updateData.costPerPing = calculatePingCost(interval);
    }
    if (body.isActive !== undefined) updateData.isActive = Boolean(body.isActive);

    const updated = await prisma.monitor.update({
      where: { id: monitorId },
      data: updateData,
    });

    return NextResponse.json({
      message: "Monitor updated",
      monitor: {
        id: updated.id,
        serviceName: updated.serviceName,
        targetUrl: updated.targetUrl,
        pingInterval: updated.pingIntervalSecs,
        isActive: updated.isActive,
        costPerPing: parseFloat(updated.costPerPing.toString()),
      },
    });
  } catch (error: any) {
    console.error("Update monitor error:", error.message);
    return NextResponse.json(
      { error: "Failed to update monitor" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE — remove a monitor
// ---------------------------------------------------------------------------
export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const monitorId = searchParams.get("id");

  if (!monitorId) {
    return NextResponse.json(
      { error: "Monitor ID is required" },
      { status: 400 }
    );
  }

  try {
    // Verify ownership
    const existing = await prisma.monitor.findFirst({
      where: { id: monitorId, userId: auth.user.id },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Monitor not found" },
        { status: 404 }
      );
    }

    await prisma.monitor.delete({ where: { id: monitorId } });

    return NextResponse.json({ message: "Monitor deleted" });
  } catch (error: any) {
    console.error("Delete monitor error:", error.message);
    return NextResponse.json(
      { error: "Failed to delete monitor" },
      { status: 500 }
    );
  }
}
