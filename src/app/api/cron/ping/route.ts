/**
 * POST /api/cron/ping
 *
 * Secured background ping engine triggered by an external cron worker.
 *
 * Handles:
 *   - Recurring monitors: ping when due (lastPingedAt + interval <= now)
 *   - Scheduled monitors: skip until current_time >= startsAt
 *   - One-off monitors: ping once, deduct flat 25 credits, mark completed
 *   - Auto-pause all monitors when user balance <= 0
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

const BATCH_SIZE = 5;
const CRON_SECRET = process.env.CRON_SECRET || "dev_cron_secret";
const ONE_OFF_FLAT_COST = 25.0;

function validateCronSecret(req: NextRequest): boolean {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return false;
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
  return token === CRON_SECRET;
}

async function pingTarget(url: string, timeoutMs: number) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const start = Date.now();
  try {
    const res = await fetch(url, { method: "GET", signal: controller.signal, headers: { "User-Agent": "ping-pong-cron/1.0" } });
    const responseTimeMs = Date.now() - start;
    clearTimeout(timeoutId);
    return { status: res.ok ? "success" as const : "failure" as const, statusCode: res.status, responseTimeMs, errorMessage: res.ok ? null : `HTTP ${res.status}` };
  } catch (err: any) {
    const responseTimeMs = Date.now() - start;
    clearTimeout(timeoutId);
    if (err.name === "AbortError") return { status: "timeout" as const, statusCode: null, responseTimeMs, errorMessage: `Timeout after ${timeoutMs}ms` };
    return { status: "failure" as const, statusCode: null, responseTimeMs, errorMessage: err.message || "Unknown error" };
  }
}

async function processMonitor(monitor: { id: string; userId: string; targetUrl: string; timeoutMs: number; costPerPing: number; isOneOff: boolean; scheduleMode: string; activeDays?: string | null; executeTime?: string | null; executeDate?: Date | null }) {
  const pingResult = await pingTarget(monitor.targetUrl, monitor.timeoutMs);
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.pingLog.create({
      data: {
        monitorId: monitor.id, userId: monitor.userId, status: pingResult.status,
        statusCode: pingResult.statusCode, responseTimeMs: pingResult.responseTimeMs,
        errorMessage: pingResult.errorMessage, checkedAt: now,
      },
    });
    
    // Update monitor based on schedule mode
    const updateData: any = { lastPingedAt: now };
    
    if (monitor.isOneOff) {
      updateData.isActive = false;
      updateData.isCompleted = true;
    } else {
      // For recurring monitors, update lastPingedAt
      // For scheduled monitors, we might want to track the last execution
      // For one-off monitors, already handled above
    }
    
    await tx.monitor.update({
      where: { id: monitor.id },
      data: updateData,
    });
    
    await tx.user.update({
      where: { id: monitor.userId },
      data: { creditBalance: { decrement: monitor.costPerPing } },
    });
  });

  return { monitorId: monitor.id, userId: monitor.userId, success: pingResult.status === "success" };
}

async function pauseAllUserMonitors(userId: string) {
  await prisma.monitor.updateMany({ where: { userId, isActive: true }, data: { isActive: false } });
}

export async function POST(req: NextRequest) {
  if (!validateCronSecret(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const startTime = Date.now();
  const results = { totalDue: 0, processed: 0, succeeded: 0, failed: 0, timedOut: 0, pausedUsers: 0, durationMs: 0 };

  try {
    const now = new Date();

    const activeMonitors = await prisma.monitor.findMany({
      where: { isActive: true, isCompleted: false },
      include: { user: { select: { id: true, creditBalance: true } } },
    });

    const eligibleMonitors = activeMonitors.filter((m) => {
      const balance = Number(m.user.creditBalance);
      if (balance <= 0) return false;
      
      // Handle different schedule modes
      switch (m.scheduleMode) {
        case "RECURRING":
          // Recurring monitors: check if due based on interval
          if (!m.pingIntervalSecs) return false;
          if (!m.lastPingedAt) return true;
          const nextPingTime = new Date(m.lastPingedAt.getTime() + m.pingIntervalSecs * 1000);
          return now >= nextPingTime;
        
        case "SCHEDULED":
          // Scheduled monitors: check if current day is in activeDays and time matches
          if (!m.activeDays || !m.executeTime) return false;
          const currentDay = now.toLocaleDateString("en-US", { weekday: "long" });
          const daysArray = m.activeDays.split(",").map(d => d.trim());
          if (!daysArray.includes(currentDay)) return false;
          
          // Check if scheduled time has passed today
          const [execHour, execMin] = m.executeTime.split(":").map(Number);
          const execTime = new Date(now);
          execTime.setHours(execHour, execMin, 0, 0);
          return now >= execTime;
        
        case "ONEOFF":
          // One-off monitors: check if executeDate has passed
          if (!m.executeDate) return false;
          return now >= m.executeDate;
        
        default:
          return false;
      }
    });

    results.totalDue = eligibleMonitors.length;
    if (eligibleMonitors.length === 0) {
      results.durationMs = Date.now() - startTime;
      return NextResponse.json({ message: "No monitors due for pinging", ...results });
    }

    const usersWithZeroBalance = new Set<string>();

    for (let i = 0; i < eligibleMonitors.length; i += BATCH_SIZE) {
      const batch = eligibleMonitors.slice(i, i + BATCH_SIZE);

      const batchResults = await Promise.allSettled(
        batch.map((monitor) => processMonitor({
          id: monitor.id, userId: monitor.userId, targetUrl: monitor.targetUrl,
          timeoutMs: monitor.timeoutMs, costPerPing: Number(monitor.costPerPing),
          isOneOff: monitor.isOneOff,
          scheduleMode: monitor.scheduleMode,
          activeDays: monitor.activeDays,
          executeTime: monitor.executeTime,
          executeDate: monitor.executeDate,
        }))
      );

      for (const batchResult of batchResults) {
        if (batchResult.status === "fulfilled") {
          results.processed++;
          if (batchResult.value.success) results.succeeded++;
          else results.failed++;
        } else {
          results.failed++;
        }
      }

      for (const monitor of batch) {
        const user = await prisma.user.findUnique({ where: { id: monitor.userId }, select: { creditBalance: true } });
        if (user && Number(user.creditBalance) <= 0) usersWithZeroBalance.add(monitor.userId);
      }
    }

    for (const userId of usersWithZeroBalance) {
      await pauseAllUserMonitors(userId);
      results.pausedUsers++;
    }

    results.durationMs = Date.now() - startTime;
    return NextResponse.json({ message: "Ping cycle completed", ...results });
  } catch (error: any) {
    console.error("Cron ping engine error:", error.message);
    results.durationMs = Date.now() - startTime;
    return NextResponse.json({ error: "Ping engine failed", details: error.message, ...results }, { status: 500 });
  }
}
