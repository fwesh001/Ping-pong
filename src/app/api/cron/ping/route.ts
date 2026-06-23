/**
 * POST /api/cron/ping
 *
 * Secured background ping engine triggered by an external cron worker.
 *
 * Handles:
 *   - Recurring monitors: ping when due (lastPingedAt + interval <= now)
 *   - Scheduled monitors: ping on selected days at specified time
 *   - One-off monitors: ping once, deduct flat 25 credits, mark completed
 *   - Smart retry verification: retry failed pings up to maxRetries times
 *   - Metered credit deduction: each retry consumes an additional credit
 *   - Auto-pause all monitors when user balance <= 0
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

const BATCH_SIZE = 5;
const CRON_SECRET = process.env.CRON_SECRET || "dev_cron_secret";
const ONE_OFF_FLAT_COST = 25.0;
const RETRY_DELAY_MS = 2000;

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

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function processMonitor(monitor: {
  id: string;
  userId: string;
  targetUrl: string;
  timeoutMs: number;
  costPerPing: number;
  scheduleMode: string;
  maxRetries: number;
  activeDays?: string | null;
  executeTime?: string | null;
  executeDate?: Date | null;
}) {
  const now = new Date();

  // ── Initial ping attempt ──
  let pingResult = await pingTarget(monitor.targetUrl, monitor.timeoutMs);

  // ── Success path: deduct credit, log success, update monitor ──
  if (pingResult.status === "success") {
    await prisma.$transaction(async (tx) => {
      await tx.pingLog.create({
        data: {
          monitorId: monitor.id, userId: monitor.userId, status: "success",
          statusCode: pingResult.statusCode, responseTimeMs: pingResult.responseTimeMs,
          errorMessage: null, checkedAt: now,
        },
      });
      const updateData: any = { lastPingedAt: now };
      if (monitor.scheduleMode === "ONEOFF") {
        updateData.isActive = false;
        updateData.isCompleted = true;
      }
      await tx.monitor.update({ where: { id: monitor.id }, data: updateData });
      await tx.user.update({
        where: { id: monitor.userId },
        data: { creditBalance: { decrement: monitor.costPerPing } },
      });
    });
    return { monitorId: monitor.id, userId: monitor.userId, success: true, retriesUsed: 0 };
  }

  // ── Failure path: enter retry state machine ──
  let retriesUsed = 0;

  if (monitor.maxRetries > 0) {
    for (let attempt = 1; attempt <= monitor.maxRetries; attempt++) {
      // Wait before retrying
      await delay(RETRY_DELAY_MS);

      // Deduct additional credit for this retry attempt
      await prisma.user.update({
        where: { id: monitor.userId },
        data: { creditBalance: { decrement: monitor.costPerPing } },
      });

      // Execute retry ping
      pingResult = await pingTarget(monitor.targetUrl, monitor.timeoutMs);
      retriesUsed = attempt;

      // If retry succeeds: break immediately (Invisible Defenses — no intermediate failure logs)
      if (pingResult.status === "success") {
        break;
      }
    }
  }

  // ── Determine final outcome ──
  const finalSuccess = pingResult.status === "success";

  await prisma.$transaction(async (tx) => {
    // Log only the final result (single log entry — clean log management)
    await tx.pingLog.create({
      data: {
        monitorId: monitor.id,
        userId: monitor.userId,
        status: finalSuccess ? "success" : "failure",
        statusCode: pingResult.statusCode,
        responseTimeMs: pingResult.responseTimeMs,
        errorMessage: finalSuccess ? null : pingResult.errorMessage,
        checkedAt: now,
      },
    });

    // Update monitor status
    const updateData: any = { lastPingedAt: now };

    if (monitor.scheduleMode === "ONEOFF") {
      updateData.isActive = false;
      updateData.isCompleted = true;
    }

    // If all retries exhausted and still failing: mark monitor as DOWN
    if (!finalSuccess) {
      updateData.status = "DOWN";
    }

    await tx.monitor.update({ where: { id: monitor.id }, data: updateData });

    // Deduct credit for the initial attempt (retry credits already deducted in loop above)
    if (!finalSuccess) {
      await tx.user.update({
        where: { id: monitor.userId },
        data: { creditBalance: { decrement: monitor.costPerPing } },
      });
    }
  });

  return { monitorId: monitor.id, userId: monitor.userId, success: finalSuccess, retriesUsed };
}

async function pauseAllUserMonitors(userId: string) {
  await prisma.monitor.updateMany({ where: { userId, isActive: true }, data: { isActive: false } });
}

export async function POST(req: NextRequest) {
  if (!validateCronSecret(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const startTime = Date.now();
  const results = { totalDue: 0, processed: 0, succeeded: 0, failed: 0, timedOut: 0, pausedUsers: 0, retriesUsed: 0, durationMs: 0 };

  try {
    const now = new Date();

    const activeMonitors = await prisma.monitor.findMany({
      where: { isActive: true, isCompleted: false },
      include: { user: { select: { id: true, creditBalance: true } } },
    });

    const eligibleMonitors = activeMonitors.filter((m) => {
      const balance = Number(m.user.creditBalance);
      if (balance <= 0) return false;

      switch (m.scheduleMode) {
        case "RECURRING":
          if (!m.pingIntervalSecs) return false;
          if (!m.lastPingedAt) return true;
          const nextPingTime = new Date(m.lastPingedAt.getTime() + m.pingIntervalSecs * 1000);
          return now >= nextPingTime;

        case "SCHEDULED":
          if (!m.activeDays || !m.executeTime) return false;
          const currentDay = now.toLocaleDateString("en-US", { weekday: "long" });
          const daysArray = m.activeDays.split(",").map(d => d.trim());
          if (!daysArray.includes(currentDay)) return false;
          const [execHour, execMin] = m.executeTime.split(":").map(Number);
          const execTime = new Date(now);
          execTime.setHours(execHour, execMin, 0, 0);
          return now >= execTime;

        case "ONEOFF":
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
          id: monitor.id,
          userId: monitor.userId,
          targetUrl: monitor.targetUrl,
          timeoutMs: monitor.timeoutMs,
          costPerPing: Number(monitor.costPerPing),
          scheduleMode: monitor.scheduleMode,
          maxRetries: monitor.maxRetries,
          activeDays: monitor.activeDays,
          executeTime: monitor.executeTime,
          executeDate: monitor.executeDate,
        }))
      );

      for (const batchResult of batchResults) {
        if (batchResult.status === "fulfilled") {
          results.processed++;
          if (batchResult.value.success) {
            results.succeeded++;
          } else {
            results.failed++;
          }
          results.retriesUsed += batchResult.value.retriesUsed;
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
