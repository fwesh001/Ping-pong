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

export async function listUsers(req: Request, res: Response) {
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
      { email: { contains: search, mode: "insensitive" } },
      { fluxUserId: { contains: search, mode: "insensitive" } },
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

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        fluxUserId: true,
        email: true,
        role: true,
        creditBalance: true,
        monitorSlots: true,
        activeSlots: true,
        status: true,
        streakCount: true,
        lastClaimedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return res.json({
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function getUser(req: Request, res: Response) {
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({ error: "User ID is required" });
  }

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      monitors: { select: { id: true, serviceName: true, status: true, isActive: true } },
      transactions: { orderBy: { createdAt: "desc" }, take: 10 },
      supportTickets: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  return res.json({ user });
}

export async function updateUser(req: Request, res: Response) {
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({ error: "User ID is required" });
  }

  const body = req.body as Record<string, unknown>;
  const creditDelta = typeof body.creditDelta === "number" ? body.creditDelta : undefined;
  const slotDelta = typeof body.slotDelta === "number" ? body.slotDelta : undefined;
  const creditBalance = typeof body.creditBalance === "number" ? body.creditBalance : undefined;
  const monitorSlots = typeof body.monitorSlots === "number" ? body.monitorSlots : undefined;
  const role = typeof body.role === "string" ? body.role : undefined;

  const existingUser = await prisma.user.findUnique({ where: { id } });
  if (!existingUser) {
    return res.status(404).json({ error: "User not found" });
  }

  const updateData: Record<string, unknown> = {};
  if (typeof creditDelta === "number") updateData.creditBalance = Number(existingUser.creditBalance) + creditDelta;
  if (typeof creditBalance === "number") updateData.creditBalance = creditBalance;
  if (typeof slotDelta === "number") updateData.monitorSlots = existingUser.monitorSlots + slotDelta;
  if (typeof monitorSlots === "number") updateData.monitorSlots = monitorSlots;
  if (role) updateData.role = role;

  const updatedUser = await prisma.user.update({
    where: { id },
    data: updateData,
  });

  const actingUserId = getActingUserId(req);
  if (typeof creditDelta === "number" || typeof creditBalance === "number") {
    const delta = typeof creditDelta === "number"
      ? creditDelta
      : Number(updatedUser.creditBalance) - Number(existingUser.creditBalance);
    await logAdminAction(
      actingUserId,
      "USER_ACT",
      "CREDIT_ADJUST",
      `Adjusted credits for user ${id}: ${delta >= 0 ? "+" : ""}${delta} (new balance: ${updatedUser.creditBalance})`
    );
  }

  if (typeof slotDelta === "number" || typeof monitorSlots === "number") {
    const delta = typeof slotDelta === "number"
      ? slotDelta
      : Number(updatedUser.monitorSlots) - Number(existingUser.monitorSlots);
    await logAdminAction(
      actingUserId,
      "USER_ACT",
      "SLOT_ADJUST",
      `Adjusted monitor slots for user ${id}: ${delta >= 0 ? "+" : ""}${delta} (new total: ${updatedUser.monitorSlots})`
    );
  }

  if (role && role !== existingUser.role) {
    await logAdminAction(
      actingUserId,
      "USER_ACT",
      "ROLE_CHANGE",
      `Changed role for user ${id}: ${existingUser.role} → ${role}`
    );
  }

  return res.json({ user: updatedUser });
}

export async function deleteUser(req: Request, res: Response) {
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({ error: "User ID is required" });
  }

  const existingUser = await prisma.user.findUnique({ where: { id } });
  if (!existingUser) {
    return res.status(404).json({ error: "User not found" });
  }

  await prisma.user.delete({ where: { id } });
  await logAdminAction(
    getActingUserId(req),
    "USER_ACT",
    "USER_DELETE",
    `Deleted user ${id} (${existingUser.email ?? existingUser.fluxUserId})`
  );

  return res.json({ message: "User permanently deleted" });
}

export async function updateUserStatus(req: Request, res: Response) {
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({ error: "User ID is required" });
  }

  const body = req.body as Record<string, unknown>;
  const status = typeof body.status === "string" ? body.status : undefined;
  if (!status || !["ACTIVE", "PAUSED", "SUSPENDED"].includes(status)) {
    return res.status(400).json({ error: "Valid status required: ACTIVE, PAUSED, or SUSPENDED" });
  }

  const existingUser = await prisma.user.findUnique({ where: { id } });
  if (!existingUser) {
    return res.status(404).json({ error: "User not found" });
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: { status },
  });

  await logAdminAction(
    getActingUserId(req),
    "USER_ACT",
    "STATUS_CHANGE",
    `Changed status for user ${id}: ${existingUser.status} → ${status}`
  );

  return res.json({ user: updatedUser });
}
