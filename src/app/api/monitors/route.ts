/**
 * /api/monitors — Full CRUD for service monitors
 *
 * GET    /api/monitors          — list all monitors with analytics
 * GET    /api/monitors?id=xxx   — get single monitor details + analytics
 * POST   /api/monitors          — create (max 5 active, 60s min, one-off pricing)
 * PATCH  /api/monitors?id=xxx   — update a monitor
 * DELETE /api/monitors?id=xxx   — delete a monitor
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, calculatePingCost } from "@/lib/auth-guard";
import prisma from "@/lib/db";

const MAX_ACTIVE_MONITORS = 5;
const MIN_INTERVAL_SECS = 60;
const ONE_OFF_FLAT_COST = 25.0;

// ---------------------------------------------------------------------------
// GET — list all monitors or get single monitor details
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const monitorId = searchParams.get("id");

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Single monitor detail view
  if (monitorId) {
    const monitor = await prisma.monitor.findFirst({
      where: { id: monitorId, userId: auth.user.id },
    });

    if (!monitor) {
      return NextResponse.json({ error: "Monitor not found" }, { status: 404 });
    }

    const [totalLogs, successLogs, avgResponseTime, failureLogs] = await Promise.all([
      prisma.pingLog.count({
        where: { monitorId, checkedAt: { gte: thirtyDaysAgo } },
      }),
      prisma.pingLog.count({
        where: { monitorId, status: "success", checkedAt: { gte: thirtyDaysAgo } },
      }),
      prisma.pingLog.aggregate({
        where: { monitorId, checkedAt: { gte: thirtyDaysAgo }, responseTimeMs: { not: null } },
        _avg: { responseTimeMs: true },
      }),
      prisma.pingLog.findMany({
        where: { monitorId, status: { in: ["failure", "timeout"] }, checkedAt: { gte: thirtyDaysAgo } },
        orderBy: { checkedAt: "desc" },
        take: 50,
        select: {
          id: true,
          status: true,
          statusCode: true,
          responseTimeMs: true,
          errorMessage: true,
          checkedAt: true,
        },
      }),
    ]);

    const uptime = totalLogs > 0 ? (successLogs / totalLogs) * 100 : 0;

    let lastChecked = "Never";
    if (monitor.lastPingedAt) {
      const diffMs = Date.now() - monitor.lastPingedAt.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) lastChecked = "Just now";
      else if (diffMins < 60) lastChecked = `${diffMins} min ago`;
      else if (diffMins < 1440) lastChecked = `${Math.floor(diffMins / 60)} hr ago`;
      else lastChecked = `${Math.floor(diffMins / 1440)} days ago`;
    }

    return NextResponse.json({
      monitor: {
        id: monitor.id,
        serviceName: monitor.serviceName,
        targetUrl: monitor.targetUrl,
        pingInterval: monitor.pingIntervalSecs,
        timeoutMs: monitor.timeoutMs,
        isActive: monitor.isActive,
        isOneOff: monitor.isOneOff,
        isCompleted: monitor.isCompleted,
        startsAt: monitor.startsAt?.toISOString() || null,
        endsAt: monitor.endsAt?.toISOString() || null,
        costPerPing: Number(monitor.costPerPing),
        lastChecked,
        uptime: Math.round(uptime * 10) / 10,
        createdAt: monitor.createdAt.toISOString(),
      },
      analytics: {
        avgResponseTimeMs: avgResponseTime._avg.responseTimeMs
          ? Math.round(avgResponseTime._avg.responseTimeMs)
          : null,
        totalPings30d: totalLogs,
        successPings30d: successLogs,
        failurePings30d: totalLogs - successLogs,
      },
      recentIncidents: failureLogs.map((log) => ({
        id: log.id,
        status: log.status,
        statusCode: log.statusCode,
        responseTimeMs: log.responseTimeMs,
        errorMessage: log.errorMessage,
        checkedAt: log.checkedAt.toISOString(),
      })),
    });
  }

  // List all monitors
  const monitors = await prisma.monitor.findMany({
    where: { userId: auth.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      pingLogs: { orderBy: { checkedAt: "desc" }, take: 1 },
    },
  });

  const monitorsWithAnalytics = await Promise.all(
    monitors.map(async (m) => {
      const [total, successful, avgResp] = await Promise.all([
        prisma.pingLog.count({ where: { monitorId: m.id, checkedAt: { gte: thirtyDaysAgo } } }),
        prisma.pingLog.count({ where: { monitorId: m.id, status: "success", checkedAt: { gte: thirtyDaysAgo } } }),
        prisma.pingLog.aggregate({
          where: { monitorId: m.id, checkedAt: { gte: thirtyDaysAgo }, responseTimeMs: { not: null } },
          _avg: { responseTimeMs: true },
        }),
      ]);

      const uptime = total > 0 ? (successful / total) * 100 : 0;

      let lastChecked = "Never";
      if (m.lastPingedAt) {
        const diffMs = Date.now() - m.lastPingedAt.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) lastChecked = "Just now";
        else if (diffMins < 60) lastChecked = `${diffMins} min ago`;
        else if (diffMins < 1440) lastChecked = `${Math.floor(diffMins / 60)} hr ago`;
        else lastChecked = `${Math.floor(diffMins / 1440)} days ago`;
      }

      return {
        id: m.id,
        serviceName: m.serviceName,
        targetUrl: m.targetUrl,
        pingInterval: m.pingIntervalSecs,
        isActive: m.isActive,
        isOneOff: m.isOneOff,
        isCompleted: m.isCompleted,
        startsAt: m.startsAt?.toISOString() || null,
        endsAt: m.endsAt?.toISOString() || null,
        costPerPing: Number(m.costPerPing),
        avgResponseTimeMs: avgResp._avg.responseTimeMs ? Math.round(avgResp._avg.responseTimeMs) : null,
        status: m.pingLogs[0]?.status || "unknown",
        lastChecked,
        uptime: Math.round(uptime * 10) / 10,
        createdAt: m.createdAt.toISOString(),
      };
    })
  );

  return NextResponse.json({ monitors: monitorsWithAnalytics });
}

// ---------------------------------------------------------------------------
// POST — create a new monitor
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { serviceName, targetUrl, pingInterval, timeoutMs, isOneOff = false, startsAt, endsAt } = body;

    if (!serviceName?.trim()) {
      return NextResponse.json({ error: "Service name is required" }, { status: 400 });
    }
    if (!targetUrl?.trim()) {
      return NextResponse.json({ error: "Target URL is required" }, { status: 400 });
    }
    try { new URL(targetUrl); } catch { return NextResponse.json({ error: "Invalid URL format" }, { status: 400 }); }

    const interval = Number(pingInterval);
    if (interval < MIN_INTERVAL_SECS || interval > 3600) {
      return NextResponse.json({ error: `Ping interval must be between ${MIN_INTERVAL_SECS} and 3600 seconds` }, { status: 400 });
    }

    const activeCount = await prisma.monitor.count({
      where: { userId: auth.user.id, isActive: true, isCompleted: false },
    });
    if (activeCount >= MAX_ACTIVE_MONITORS) {
      return NextResponse.json({ error: `Maximum of ${MAX_ACTIVE_MONITORS} active monitors reached.` }, { status: 403 });
    }

    const costPerPing = isOneOff ? ONE_OFF_FLAT_COST : calculatePingCost(interval);

    const monitor = await prisma.monitor.create({
      data: {
        userId: auth.user.id,
        serviceName: serviceName.trim(),
        targetUrl: targetUrl.trim(),
        pingIntervalSecs: interval,
        timeoutMs: timeoutMs ? Number(timeoutMs) : 10000,
        costPerPing,
        isActive: true,
        isOneOff: Boolean(isOneOff),
        isCompleted: false,
        startsAt: startsAt ? new Date(startsAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null,
      },
    });

    return NextResponse.json({
      message: "Monitor created",
      monitor: {
        id: monitor.id,
        serviceName: monitor.serviceName,
        targetUrl: monitor.targetUrl,
        pingInterval: monitor.pingIntervalSecs,
        isActive: monitor.isActive,
        isOneOff: monitor.isOneOff,
        costPerPing: Number(monitor.costPerPing),
        startsAt: monitor.startsAt?.toISOString() || null,
        endsAt: monitor.endsAt?.toISOString() || null,
        status: "unknown",
        lastChecked: "Never",
        uptime: 0,
        createdAt: monitor.createdAt.toISOString(),
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error("Create monitor error:", error.message);
    return NextResponse.json({ error: "Failed to create monitor" }, { status: 500 });
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
  if (!monitorId) return NextResponse.json({ error: "Monitor ID is required" }, { status: 400 });

  try {
    const body = await req.json();
    const existing = await prisma.monitor.findFirst({ where: { id: monitorId, userId: auth.user.id } });
    if (!existing) return NextResponse.json({ error: "Monitor not found" }, { status: 404 });

    const updateData: Record<string, any> = {};
    if (body.serviceName !== undefined) updateData.serviceName = body.serviceName.trim();
    if (body.targetUrl !== undefined) {
      try { new URL(body.targetUrl); } catch { return NextResponse.json({ error: "Invalid URL format" }, { status: 400 }); }
      updateData.targetUrl = body.targetUrl.trim();
    }
    if (body.pingInterval !== undefined) {
      const interval = Number(body.pingInterval);
      if (interval < MIN_INTERVAL_SECS || interval > 3600) {
        return NextResponse.json({ error: `Ping interval must be between ${MIN_INTERVAL_SECS} and 3600 seconds` }, { status: 400 });
      }
      updateData.pingIntervalSecs = interval;
      if (!existing.isOneOff) updateData.costPerPing = calculatePingCost(interval);
    }
    if (body.timeoutMs !== undefined) updateData.timeoutMs = Number(body.timeoutMs);
    if (body.isActive !== undefined) updateData.isActive = Boolean(body.isActive);
    if (body.startsAt !== undefined) updateData.startsAt = body.startsAt ? new Date(body.startsAt) : null;
    if (body.endsAt !== undefined) updateData.endsAt = body.endsAt ? new Date(body.endsAt) : null;

    const updated = await prisma.monitor.update({ where: { id: monitorId }, data: updateData });
    return NextResponse.json({
      message: "Monitor updated",
      monitor: {
        id: updated.id, serviceName: updated.serviceName, targetUrl: updated.targetUrl,
        pingInterval: updated.pingIntervalSecs, isActive: updated.isActive, isOneOff: updated.isOneOff,
        costPerPing: Number(updated.costPerPing),
        startsAt: updated.startsAt?.toISOString() || null, endsAt: updated.endsAt?.toISOString() || null,
      },
    });
  } catch (error: any) {
    console.error("Update monitor error:", error.message);
    return NextResponse.json({ error: "Failed to update monitor" }, { status: 500 });
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
  if (!monitorId) return NextResponse.json({ error: "Monitor ID is required" }, { status: 400 });

  try {
    const existing = await prisma.monitor.findFirst({ where: { id: monitorId, userId: auth.user.id } });
    if (!existing) return NextResponse.json({ error: "Monitor not found" }, { status: 404 });
    await prisma.monitor.delete({ where: { id: monitorId } });
    return NextResponse.json({ message: "Monitor deleted" });
  } catch (error: any) {
    console.error("Delete monitor error:", error.message);
    return NextResponse.json({ error: "Failed to delete monitor" }, { status: 500 });
  }
}
