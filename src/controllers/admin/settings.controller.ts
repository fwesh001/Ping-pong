import { type Request, type Response } from "express";
import prisma from "@/lib/db";
import { logAdminAction } from "@/utils/audit";

function getString(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

function getNumber(req: Request, key: string): number | undefined {
  const value = req.query[key];
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function getActingUserId(req: Request): string | null {
  const value = req.headers["x-admin-user-id"];
  return typeof value === "string" ? value : null;
}

export async function getSettings(_req: Request, res: Response) {
  let settings = await prisma.globalSettings.findFirst();
  if (!settings) {
    settings = await prisma.globalSettings.create({
      data: {
        creditCostPerPing: 0.01389,
        globalPause: false,
        pollIntervalMs: 1000,
        maintenanceMode: false,
        maintenanceMessage: "",
        lockdownNewAccounts: false,
        lockdownNewMonitors: false,
        lockdownMessage: "",
      },
    });
  }

  return res.json({ settings });
}

export async function updateSettings(req: Request, res: Response) {
  const body = req.body as Record<string, unknown>;
  const creditCostPerPing = typeof body.creditCostPerPing === "number" ? body.creditCostPerPing : undefined;
  const globalPause = typeof body.globalPause === "boolean" ? body.globalPause : undefined;
  const pollIntervalMs = typeof body.pollIntervalMs === "number" ? body.pollIntervalMs : undefined;
  const maintenanceMode = typeof body.maintenanceMode === "boolean" ? body.maintenanceMode : undefined;
  const maintenanceMessage = typeof body.maintenanceMessage === "string" ? body.maintenanceMessage : undefined;
  const maintenanceStart = typeof body.maintenanceStart === "string" ? new Date(body.maintenanceStart) : undefined;
  const maintenanceEnd = typeof body.maintenanceEnd === "string" ? new Date(body.maintenanceEnd) : undefined;
  const lockdownNewAccounts = typeof body.lockdownNewAccounts === "boolean" ? body.lockdownNewAccounts : undefined;
  const lockdownNewMonitors = typeof body.lockdownNewMonitors === "boolean" ? body.lockdownNewMonitors : undefined;
  const lockdownMessage = typeof body.lockdownMessage === "string" ? body.lockdownMessage : undefined;

  let settings = await prisma.globalSettings.findFirst();
  const updateData: Record<string, unknown> = {};
  if (typeof creditCostPerPing === "number") updateData.creditCostPerPing = creditCostPerPing;
  if (typeof globalPause === "boolean") updateData.globalPause = globalPause;
  if (typeof pollIntervalMs === "number") updateData.pollIntervalMs = pollIntervalMs;
  if (typeof maintenanceMode === "boolean") updateData.maintenanceMode = maintenanceMode;
  if (typeof maintenanceMessage === "string") updateData.maintenanceMessage = maintenanceMessage;
  if (maintenanceStart) updateData.maintenanceStart = maintenanceStart;
  if (maintenanceEnd) updateData.maintenanceEnd = maintenanceEnd;
  if (typeof lockdownNewAccounts === "boolean") updateData.lockdownNewAccounts = lockdownNewAccounts;
  if (typeof lockdownNewMonitors === "boolean") updateData.lockdownNewMonitors = lockdownNewMonitors;
  if (typeof lockdownMessage === "string") updateData.lockdownMessage = lockdownMessage;

  if (!settings) {
    settings = await prisma.globalSettings.create({
      data: {
        creditCostPerPing: creditCostPerPing ?? 0.01389,
        globalPause: globalPause ?? false,
        pollIntervalMs: pollIntervalMs ?? 1000,
        maintenanceMode: maintenanceMode ?? false,
        maintenanceMessage: maintenanceMessage ?? "",
        maintenanceStart: maintenanceStart ?? null,
        maintenanceEnd: maintenanceEnd ?? null,
        lockdownNewAccounts: lockdownNewAccounts ?? false,
        lockdownNewMonitors: lockdownNewMonitors ?? false,
        lockdownMessage: lockdownMessage ?? "",
      },
    });
  } else {
    settings = await prisma.globalSettings.update({
      where: { id: settings.id },
      data: updateData,
    });
  }

  await logAdminAction(
    getActingUserId(req),
    "SYS_EVNT",
    "SETTINGS_UPDATE",
    `Updated global settings: ${Object.keys(updateData).join(", ")}`
  );

  return res.json({ settings });
}

export async function toggleMaintenanceMode(req: Request, res: Response) {
  const body = req.body as Record<string, unknown>;
  const maintenanceMode = typeof body.maintenanceMode === "boolean" ? body.maintenanceMode : undefined;
  const maintenanceMessage = typeof body.maintenanceMessage === "string" ? body.maintenanceMessage : undefined;
  const maintenanceStart = typeof body.maintenanceStart === "string" ? new Date(body.maintenanceStart) : undefined;
  const maintenanceEnd = typeof body.maintenanceEnd === "string" ? new Date(body.maintenanceEnd) : undefined;

  let settings = await prisma.globalSettings.findFirst();
  const newMode = maintenanceMode ?? !(settings?.maintenanceMode ?? false);
  const updateData: Record<string, unknown> = { maintenanceMode: newMode };
  if (typeof maintenanceMessage === "string") updateData.maintenanceMessage = maintenanceMessage;
  if (maintenanceStart) updateData.maintenanceStart = maintenanceStart;
  if (maintenanceEnd) updateData.maintenanceEnd = maintenanceEnd;

  if (!settings) {
    settings = await prisma.globalSettings.create({
      data: {
        creditCostPerPing: 0.01389,
        globalPause: false,
        pollIntervalMs: 1000,
        ...updateData,
      },
    });
  } else {
    settings = await prisma.globalSettings.update({
      where: { id: settings.id },
      data: updateData,
    });
  }

  await logAdminAction(
    getActingUserId(req),
    "SYS_EVNT",
    "MAINTENANCE_TOGGLE",
    `Maintenance mode ${newMode ? "ENABLED" : "DISABLED"}`
  );

  return res.json({ settings });
}

export async function toggleLockdown(req: Request, res: Response) {
  const body = req.body as Record<string, unknown>;
  const lockdownNewAccounts = typeof body.lockdownNewAccounts === "boolean" ? body.lockdownNewAccounts : undefined;
  const lockdownNewMonitors = typeof body.lockdownNewMonitors === "boolean" ? body.lockdownNewMonitors : undefined;
  const lockdownMessage = typeof body.lockdownMessage === "string" ? body.lockdownMessage : undefined;

  let settings = await prisma.globalSettings.findFirst();
  const updateData: Record<string, unknown> = {};
  if (typeof lockdownNewAccounts === "boolean") updateData.lockdownNewAccounts = lockdownNewAccounts;
  if (typeof lockdownNewMonitors === "boolean") updateData.lockdownNewMonitors = lockdownNewMonitors;
  if (typeof lockdownMessage === "string") updateData.lockdownMessage = lockdownMessage;

  if (!settings) {
    settings = await prisma.globalSettings.create({
      data: {
        creditCostPerPing: 0.01389,
        globalPause: false,
        pollIntervalMs: 1000,
        ...updateData,
      },
    });
  } else {
    settings = await prisma.globalSettings.update({
      where: { id: settings.id },
      data: updateData,
    });
  }

  await logAdminAction(
    getActingUserId(req),
    "SYS_EVNT",
    "LOCKDOWN_TOGGLE",
    `Lockdown settings updated: accounts=${settings.lockdownNewAccounts}, monitors=${settings.lockdownNewMonitors}`
  );

  return res.json({ settings });
}

export async function listAuditLogs(req: Request, res: Response) {
  const logType = getString(req, "logType");
  const userId = getString(req, "userId");
  const startDate = getString(req, "startDate");
  const endDate = getString(req, "endDate");
  const page = Math.max(getNumber(req, "page") ?? 1, 1);
  const limit = Math.min(getNumber(req, "limit") ?? 50, 200);
  const skip = (page - 1) * limit;

  const where: any = {};
  if (logType) where.logType = logType;
  if (userId) where.userId = userId;
  if (startDate || endDate) {
    where.timestamp = {};
    if (startDate) where.timestamp.gte = new Date(startDate);
    if (endDate) where.timestamp.lte = new Date(endDate);
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: "desc" },
      skip,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return res.json({
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
