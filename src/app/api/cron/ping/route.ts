/**
 * POST /api/cron/ping
 *
 * Secured background ping engine triggered by an external cron worker.
 *
 * Flow:
 *   1. Validate CRON_SECRET header
 *   2. Fetch all active monitors that are due for a ping
 *   3. Process in batches of 5 using Promise.allSettled
 *   4. For each monitor: ping target, log result, deduct credits
 *   5. If user balance ≤ 0, pause all their monitors
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

const BATCH_SIZE = 5;
const CRON_SECRET = process.env.CRON_SECRET || "dev_cron_secret";

// ---------------------------------------------------------------------------
// Security guard
// ---------------------------------------------------------------------------
function validateCronSecret(req: NextRequest): boolean {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return false;
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader;
  return token === CRON_SECRET;
}

// ---------------------------------------------------------------------------
// Ping a single target URL with timeout
// ---------------------------------------------------------------------------
async function pingTarget(
  url: string,
  timeoutMs: number
): Promise<{
  status: "success" | "failure" | "timeout";
  statusCode: number | null;
  responseTimeMs: number;
  errorMessage: string | null;
}> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const start = Date.now();

  try {
    const res = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: { "User-Agent": "ping-pong-cron/1.0" },
    });

    const responseTimeMs = Date.now() - start;
    clearTimeout(timeoutId);

    return {
      status: res.ok ? "success" : "failure",
      statusCode: res.status,
      responseTimeMs,
      errorMessage: res.ok ? null : `HTTP ${res.status}`,
    };
  } catch (err: any) {
    const responseTimeMs = Date.now() - start;
    clearTimeout(timeoutId);

    if (err.name === "AbortError") {
      return {
        status: "timeout",
        statusCode: null,
        responseTimeMs,
        errorMessage: `Timeout after ${timeoutMs}ms`,
      };
    }

    return {
      status: "failure",
      statusCode: null,
      responseTimeMs,
      errorMessage: err.message || "Unknown error",
    };
  }
}

// ---------------------------------------------------------------------------
// Process a single monitor ping
// ---------------------------------------------------------------------------
async function processMonitor(monitor: {
  id: string;
  userId: string;
  targetUrl: string;
  timeoutMs: number;
  pingIntervalSecs: number;
  costPerPing: number;
}): Promise<{ monitorId: string; userId: string; success: boolean }> {
  const pingResult = await pingTarget(monitor.targetUrl, monitor.timeoutMs);
  const now = new Date();

  // Create ping log and update monitor in a transaction
  await prisma.$transaction(async (tx) => {
    // 1. Create the ping log
    await tx.pingLog.create({
      data: {
        monitorId: monitor.id,
        userId: monitor.userId,
        status: pingResult.status,
        statusCode: pingResult.statusCode,
        responseTimeMs: pingResult.responseTimeMs,
        errorMessage: pingResult.errorMessage,
        checkedAt: now,
      },
    });

    // 2. Update the monitor's lastPingedAt
    await tx.monitor.update({
      where: { id: monitor.id },
      data: { lastPingedAt: now },
    });

    // 3. Deduct credits from the user
    await tx.user.update({
      where: { id: monitor.userId },
      data: {
        creditBalance: {
          decrement: monitor.costPerPing,
        },
      },
    });
  });

  return {
    monitorId: monitor.id,
    userId: monitor.userId,
    success: pingResult.status === "success",
  };
}

// ---------------------------------------------------------------------------
// Pause all monitors for a user (when balance ≤ 0)
// ---------------------------------------------------------------------------
async function pauseAllUserMonitors(userId: string): Promise<void> {
  await prisma.monitor.updateMany({
    where: { userId, isActive: true },
    data: { isActive: false },
  });
}

// ---------------------------------------------------------------------------
// Main cron handler
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  // 1. Validate cron secret
  if (!validateCronSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  const results: {
    totalDue: number;
    processed: number;
    succeeded: number;
    failed: number;
    timedOut: number;
    pausedUsers: number;
    durationMs: number;
  } = {
    totalDue: 0,
    processed: 0,
    succeeded: 0,
    failed: 0,
    timedOut: 0,
    pausedUsers: 0,
    durationMs: 0,
  };

  try {
    const now = new Date();

    // 2. Fetch all active monitors that are due for a ping
    //    A monitor is due if: lastPingedAt + pingIntervalSecs <= now
    //    (or if lastPingedAt is null — never pinged)
    // Fetch all active monitors. We filter by interval in JS since
    // SQLite doesn't support date arithmetic in Prisma where clauses.
    const activeMonitors = await prisma.monitor.findMany({
      where: {
        isActive: true,
      },
      include: {
        user: {
          select: { id: true, creditBalance: true },
        },
      },
    });

    // Filter to only monitors that are actually due and whose users
    // have a positive credit balance
    const eligibleMonitors = activeMonitors.filter((m) => {
      const balance = Number(m.user.creditBalance);
      if (balance <= 0) return false;
      if (!m.lastPingedAt) return true;
      const nextPingTime = new Date(
        m.lastPingedAt.getTime() + m.pingIntervalSecs * 1000
      );
      return now >= nextPingTime;
    });

    results.totalDue = eligibleMonitors.length;

    if (eligibleMonitors.length === 0) {
      results.durationMs = Date.now() - startTime;
      return NextResponse.json({
        message: "No monitors due for pinging",
        ...results,
      });
    }

    // 3. Process in batches
    const usersWithZeroBalance = new Set<string>();

    for (let i = 0; i < eligibleMonitors.length; i += BATCH_SIZE) {
      const batch = eligibleMonitors.slice(i, i + BATCH_SIZE);

      const batchResults = await Promise.allSettled(
        batch.map((monitor) =>
          processMonitor({
            id: monitor.id,
            userId: monitor.userId,
            targetUrl: monitor.targetUrl,
            timeoutMs: monitor.timeoutMs,
            pingIntervalSecs: monitor.pingIntervalSecs,
            costPerPing: Number(monitor.costPerPing),
          })
        )
      );

      // Tally results
      for (const batchResult of batchResults) {
        if (batchResult.status === "fulfilled") {
          results.processed++;
          if (batchResult.value.success) {
            results.succeeded++;
          } else {
            results.failed++;
          }
        } else {
          results.failed++;
        }
      }

      // 4. Check for users whose balance dropped to ≤ 0
      //    We check after each batch to catch mid-batch depletions
      for (const monitor of batch) {
        const user = await prisma.user.findUnique({
          where: { id: monitor.userId },
          select: { creditBalance: true },
        });
        if (user && Number(user.creditBalance) <= 0) {
          usersWithZeroBalance.add(monitor.userId);
        }
      }
    }

    // 5. Pause all monitors for users with zero/negative balance
    for (const userId of usersWithZeroBalance) {
      await pauseAllUserMonitors(userId);
      results.pausedUsers++;
    }

    results.durationMs = Date.now() - startTime;

    return NextResponse.json({
      message: "Ping cycle completed",
      ...results,
    });
  } catch (error: any) {
    console.error("Cron ping engine error:", error.message);
    results.durationMs = Date.now() - startTime;
    return NextResponse.json(
      {
        error: "Ping engine failed",
        details: error.message,
        ...results,
      },
      { status: 500 }
    );
  }
}
