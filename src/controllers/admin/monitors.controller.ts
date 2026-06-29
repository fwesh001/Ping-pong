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

function getParamId(req: Request): string | undefined {
  const id = req.params.id;
  return Array.isArray(id) ? id[0] : id;
}

export async function listMonitors(req: Request, res: Response) {
  const search = getString(req, "search");
  const status = getString(req, "status");
  const startDate = getString(req, "startDate");
  const endDate = getString(req, "endDate");
  const page = Math.max(getNumber(req, "page") ?? 1, 1);
  const limit = Math.min(getNumber(req, "limit") ?? 20, 100);
  const skip = (page - 1) * limit;

  const where: any = {};

  if (search) {
    where.OR = [
      { serviceName: { contains: search, mode: "insensitive" } },
      { targetUrl: { contains: search, mode: "insensitive" } },
    ];
  }

  if (status) {
    where.status = status;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const [monitors, total] = await Promise.all([
    prisma.monitor.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fluxUserId: true,
          },
        },
      },
    }),
    prisma.monitor.count({ where }),
  ]);

  return res.json({
    monitors,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function getMonitor(req: Request, res: Response) {
  const id = getParamId(req);
  if (!id) {
    return res.status(400).json({ error: "Monitor ID is required" });
  }

  const monitor = await prisma.monitor.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true, fluxUserId: true } },
      pingLogs: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });

  if (!monitor) {
    return res.status(404).json({ error: "Monitor not found" });
  }

  return res.json({ monitor });
}

export async function updateMonitor(req: Request, res: Response) {
  const id = getParamId(req);
  if (!id) {
    return res.status(400).json({ error: "Monitor ID is required" });
  }

  const body = req.body as Record<string, unknown>;
  const existingMonitor = await prisma.monitor.findUnique({ where: { id } });
  if (!existingMonitor) {
    return res.status(404).json({ error: "Monitor not found" });
  }

  const updateData: Record<string, unknown> = {};
  if (typeof body.serviceName === "string") updateData.serviceName = body.serviceName;
  if (typeof body.targetUrl === "string") updateData.targetUrl = body.targetUrl;
  if (typeof body.isActive === "boolean") updateData.isActive = body.isActive;
  if (typeof body.status === "string") updateData.status = body.status;
  if (typeof body.timeoutMs === "number") updateData.timeoutMs = body.timeoutMs;
  if (typeof body.maxRetries === "number") updateData.maxRetries = body.maxRetries;

  const updatedMonitor = await prisma.monitor.update({
    where: { id },
    data: updateData,
  });

  await logAdminAction(
    getActingUserId(req),
    "MON_ACT",
    "MONITOR_UPDATE",
    `Updated monitor ${id} (${existingMonitor.serviceName}): ${Object.keys(updateData).join(", ")}`
  );

  return res.json({ monitor: updatedMonitor });
}

export async function deleteMonitor(req: Request, res: Response) {
  const id = getParamId(req);
  if (!id) {
    return res.status(400).json({ error: "Monitor ID is required" });
  }

  const existingMonitor = await prisma.monitor.findUnique({ where: { id } });
  if (!existingMonitor) {
    return res.status(404).json({ error: "Monitor not found" });
  }

  await prisma.monitor.delete({ where: { id } });
  await logAdminAction(
    getActingUserId(req),
    "MON_ACT",
    "MONITOR_DELETE",
    `Deleted monitor ${id} (${existingMonitor.serviceName}) owned by user ${existingMonitor.userId}`
  );

  return res.json({ message: "Monitor permanently deleted" });
}

export async function toggleMonitorStatus(req: Request, res: Response) {
  const id = getParamId(req);
  if (!id) {
    return res.status(400).json({ error: "Monitor ID is required" });
  }

  const existingMonitor = await prisma.monitor.findUnique({ where: { id } });
  if (!existingMonitor) {
    return res.status(404).json({ error: "Monitor not found" });
  }

  const newIsActive = !existingMonitor.isActive;
  const newStatus = newIsActive ? "ACTIVE" : "PAUSED";

  const updatedMonitor = await prisma.monitor.update({
    where: { id },
    data: { isActive: newIsActive, status: newStatus },
  });

  await logAdminAction(
    getActingUserId(req),
    "MON_ACT",
    "MONITOR_TOGGLE",
    `Toggled monitor ${id} (${existingMonitor.serviceName}): ${existingMonitor.isActive} → ${newIsActive}`
  );

  return res.json({ monitor: updatedMonitor });
}
