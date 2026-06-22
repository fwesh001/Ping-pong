/**
 * GET /api/logs — Global logs endpoint with filtering and pagination
 *
 * Query params:
 *   monitorId  — filter by specific monitor
 *   status     — filter by status (success, failure, timeout)
 *   limit      — page size (default 20, max 100)
 *   offset     — pagination offset (default 0)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const monitorId = searchParams.get("monitorId");
  const status = searchParams.get("status");
  const limit = Math.min(Number(searchParams.get("limit") || 20), 100);
  const offset = Number(searchParams.get("offset") || 0);

  try {
    const where: Record<string, any> = { userId: auth.user.id };
    if (monitorId) where.monitorId = monitorId;
    if (status && status !== "all") where.status = status;

    const [logs, total] = await Promise.all([
      prisma.pingLog.findMany({
        where,
        orderBy: { checkedAt: "desc" },
        take: limit,
        skip: offset,
        include: {
          monitor: { select: { id: true, serviceName: true, targetUrl: true } },
        },
      }),
      prisma.pingLog.count({ where }),
    ]);

    return NextResponse.json({
      logs: logs.map((log) => ({
        id: log.id,
        monitorId: log.monitorId,
        monitorName: log.monitor.serviceName,
        targetUrl: log.monitor.targetUrl,
        status: log.status,
        statusCode: log.statusCode,
        responseTimeMs: log.responseTimeMs,
        errorMessage: log.errorMessage,
        checkedAt: log.checkedAt.toISOString(),
      })),
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    });
  } catch (error: any) {
    console.error("Logs fetch error:", error.message);
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
  }
}
