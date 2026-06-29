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

export async function listTickets(req: Request, res: Response) {
  const type = getString(req, "type");
  const status = getString(req, "status");
  const startDate = getString(req, "startDate");
  const endDate = getString(req, "endDate");
  const page = Math.max(getNumber(req, "page") ?? 1, 1);
  const limit = Math.min(getNumber(req, "limit") ?? 20, 100);
  const skip = (page - 1) * limit;

  const where: any = {};
  if (type) where.type = type;
  if (status) where.status = status;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const [tickets, total] = await Promise.all([
    prisma.supportTicket.findMany({
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
    prisma.supportTicket.count({ where }),
  ]);

  return res.json({
    tickets,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function getTicket(req: Request, res: Response) {
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({ error: "Ticket ID is required" });
  }

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true, fluxUserId: true } },
    },
  });

  if (!ticket) {
    return res.status(404).json({ error: "Ticket not found" });
  }

  return res.json({ ticket });
}

export async function updateTicketStatus(req: Request, res: Response) {
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({ error: "Ticket ID is required" });
  }

  const body = req.body as Record<string, unknown>;
  const status = typeof body.status === "string" ? body.status : undefined;
  const reply = typeof body.reply === "string" ? body.reply : undefined;

  const existingTicket = await prisma.supportTicket.findUnique({ where: { id } });
  if (!existingTicket) {
    return res.status(404).json({ error: "Ticket not found" });
  }

  const updateData: Record<string, unknown> = {};
  if (status) updateData.status = status;

  const updatedTicket = await prisma.supportTicket.update({
    where: { id },
    data: updateData,
  });

  if (reply) {
    await prisma.notification.create({
      data: {
        userId: existingTicket.userId,
        type: "ALERT",
        title: "Support Update",
        message: `Admin response to your ${existingTicket.type} ticket: ${reply}`,
        targetAudience: "INDIVIDUAL",
      },
    });
  }

  await logAdminAction(
    getActingUserId(req),
    "SYS_EVNT",
    "TICKET_UPDATE",
    `Updated ticket ${id}: status ${existingTicket.status} → ${status}${reply ? " (with reply)" : ""}`
  );

  return res.json({ ticket: updatedTicket });
}

export async function deleteTicket(req: Request, res: Response) {
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({ error: "Ticket ID is required" });
  }

  const existingTicket = await prisma.supportTicket.findUnique({ where: { id } });
  if (!existingTicket) {
    return res.status(404).json({ error: "Ticket not found" });
  }

  await prisma.supportTicket.delete({ where: { id } });
  await logAdminAction(
    getActingUserId(req),
    "SYS_EVNT",
    "TICKET_DELETE",
    `Deleted ticket ${id} (type: ${existingTicket.type}, user: ${existingTicket.userId})`
  );

  return res.json({ message: "Ticket permanently deleted" });
}
