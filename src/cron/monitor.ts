// Ping-Pong Background Worker
// Migrated from ping-pong_cron/src/worker.ts

// Core functionality:
// - Recurring monitors: ping when due (lastPingedAt + interval <= now)
// - Scheduled monitors: ping on selected days at specified time
// - One-off monitors: ping once, mark completed & inactive
// - Smart retry verification: retry failed pings up to maxRetries times
// - Metered credit deduction: each retry consumes costPerPing credits
// - Auto-pause all monitors when user balance <= 0
// - Only ping ACTIVE + not COMPLETED monitors with positive credit balance
// - Mark monitor DOWN when all retries exhausted

import process from "node:process";
import { performance } from "node:perf_hooks";
import axios, { AxiosError } from "axios";
import { prisma } from "@/lib/db";

const BATCH_SIZE = 5;
const DEFAULT_TIMEOUT_MS = 10000;
const DEFAULT_POLL_INTERVAL_MS = 1000;
const RETRY_DELAY_MS = 2000;

// ── Helpers ──

const getGlobalSettings = async () => {
  try {
    return await prisma.globalSettings.findFirst();
  } catch {
    return null;
  }
};

const getPollIntervalMs = async (): Promise<number> => {
  const settings = await getGlobalSettings();
  return settings?.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
};

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pingTarget(url: string, timeoutMs: number) {
  const start = performance.now();
  try {
    const response = await axios.get(url, {
      timeout: timeoutMs,
      validateStatus: () => true,
      headers: { "User-Agent": "ping-pong-cron/1.0" },
    });
    const responseTimeMs = Math.round(performance.now() - start);
    return {
      status: response.status >= 200 && response.status < 400 ? ("success" as const) : ("failure" as const),
      statusCode: response.status,
      responseTimeMs,
      errorMessage: response.status >= 200 && response.status < 400 ? null : `HTTP ${response.status}`,
    };
  } catch (err) {
    const responseTimeMs = Math.round(performance.now() - start);
    const axiosError = err as AxiosError;
    if (axiosError.name === "AbortError" || axiosError.code === "ECONNABORTED") {
      return { status: "timeout" as const, statusCode: null, responseTimeMs, errorMessage: `Timeout after ${timeoutMs}ms` };
    }
    return { status: "failure" as const, statusCode: null, responseTimeMs, errorMessage: axiosError.message || "Unknown error" };
  }
}

async function pauseAllUserMonitors(userId: string) {
  await prisma.monitor.updateMany({ where: { userId, isActive: true }, data: { isActive: false } });
}

// ── Core monitor processing (matches original cron logic exactly) ──

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
          monitorId: monitor.id,
          userId: monitor.userId,
          status: "success",
          statusCode: pingResult.statusCode,
          responseTimeMs: pingResult.responseTimeMs,
          errorMessage: null,
          checkedAt: now,
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
      await delay(RETRY_DELAY_MS);

      // Deduct additional credit for this retry attempt
      await prisma.user.update({
        where: { id: monitor.userId },
        data: { creditBalance: { decrement: monitor.costPerPing } },
      });

      pingResult = await pingTarget(monitor.targetUrl, monitor.timeoutMs);
      retriesUsed = attempt;

      if (pingResult.status === "success") {
        break;
      }
    }
  }

  // ── Determine final outcome ──
  const finalSuccess = pingResult.status === "success";

  await prisma.$transaction(async (tx) => {
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

    const updateData: any = { lastPingedAt: now };

    if (monitor.scheduleMode === "ONEOFF") {
      updateData.isActive = false;
      updateData.isCompleted = true;
    }

    if (!finalSuccess) {
      updateData.status = "DOWN";
    }

    await tx.monitor.update({ where: { id: monitor.id }, data: updateData });

    // Deduct credit for the initial attempt (retry credits already deducted above)
    if (!finalSuccess) {
      await tx.user.update({
        where: { id: monitor.userId },
        data: { creditBalance: { decrement: monitor.costPerPing } },
      });
    }
  });

  return { monitorId: monitor.id, userId: monitor.userId, success: finalSuccess, retriesUsed };
}

// ── Eligibility filter (matches original exactly) ──

function isMonitorEligible(monitor: {
  isActive: boolean;
  isCompleted: boolean;
  scheduleMode: string;
  pingIntervalSecs: number | null;
  lastPingedAt: Date | null;
  activeDays: string | null;
  executeTime: string | null;
  executeDate: Date | null;
  user: { creditBalance: number };
}): boolean {
  const now = new Date();

  // Must be active and not completed
  if (!monitor.isActive || monitor.isCompleted) return false;

  // Must have positive credit balance
  const balance = Number(monitor.user.creditBalance);
  if (balance <= 0) return false;

  switch (monitor.scheduleMode) {
    case "RECURRING":
      if (!monitor.pingIntervalSecs) return false;
      if (!monitor.lastPingedAt) return true;
      const nextPingTime = new Date(monitor.lastPingedAt.getTime() + monitor.pingIntervalSecs * 1000);
      return now >= nextPingTime;

    case "SCHEDULED":
      if (!monitor.activeDays || !monitor.executeTime) return false;
      const currentDay = now.toLocaleDateString("en-US", { weekday: "long" });
      const daysArray = monitor.activeDays.split(",").map((d) => d.trim());
      if (!daysArray.includes(currentDay)) return false;
      const [execHour, execMin] = monitor.executeTime.split(":").map(Number);
      const execTime = new Date(now);
      execTime.setHours(execHour, execMin, 0, 0);
      return now >= execTime;

    case "ONEOFF":
      if (!monitor.executeDate) return false;
      return now >= monitor.executeDate;

    default:
      return false;
  }
}

// ── Engine tick ──

const startEngineTick = async (): Promise<void> => {
  const tickStart = Date.now();
  console.log(`\n[${new Date(tickStart).toISOString()}] ── Engine Tick Started ──`);

  try {
    const settings = await getGlobalSettings();

    if (settings?.globalPause) {
      console.log(`[Tick] Engine paused by admin. Skipping cycle.`);
    } else {
      // Fetch all active, not-completed monitors with user data (matches original)
      const activeMonitors = await prisma.monitor.findMany({
        where: { isActive: true, isCompleted: false },
        include: { user: { select: { id: true, creditBalance: true } } },
      });

      // Filter eligible monitors (matches original eligibility logic)
      const eligibleMonitors = activeMonitors.filter(isMonitorEligible);

      console.log(`[Tick] Found ${eligibleMonitors.length} due monitors (${activeMonitors.length} total active)`);

      if (eligibleMonitors.length > 0) {
        const usersWithZeroBalance = new Set<string>();

        // Process in batches (BATCH_SIZE = 5, matches original)
        for (let i = 0; i < eligibleMonitors.length; i += BATCH_SIZE) {
          const batch = eligibleMonitors.slice(i, i + BATCH_SIZE);

          const batchResults = await Promise.allSettled(
            batch.map((monitor) =>
              processMonitor({
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
              })
            )
          );

          for (const batchResult of batchResults) {
            if (batchResult.status === "fulfilled") {
              const icon = batchResult.value.success ? "✓" : "✗";
              const retryInfo = batchResult.value.retriesUsed > 0 ? ` (retries: ${batchResult.value.retriesUsed})` : "";
              console.log(`  ${icon} Monitor [${batchResult.value.monitorId}] ${batchResult.value.success ? "UP" : "DOWN"}${retryInfo}`);
            } else {
              console.log(`  ✗ Monitor failed to process: ${batchResult.reason}`);
            }
          }

          // Check for zero-balance users after each batch
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

        // Auto-pause all monitors for users with zero balance (matches original)
        for (const userId of usersWithZeroBalance) {
          await pauseAllUserMonitors(userId);
          console.log(`  ⏸ Auto-paused all monitors for user [${userId}] (zero balance)`);
        }
      }
    }

    const tickDuration = Date.now() - tickStart;
    console.log(`[${new Date().toISOString()}] ── Engine Tick Completed in ${tickDuration}ms ──`);
  } catch (error) {
    console.error("[Tick] Fatal error during engine tick:", error);
  }

  const pollInterval = await getPollIntervalMs();
  setTimeout(() => void startEngineTick(), pollInterval);
};

// Start the background engine
startEngineTick().catch((err) => console.error("Fatal exception in cron engine:", err));