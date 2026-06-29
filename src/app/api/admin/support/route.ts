import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const status = searchParams.get("status");

  const where: any = {};
  if (type) where.type = type;
  if (status) where.status = status;

  const tickets = await prisma.supportTicket.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          email: true,
          fluxUserId: true,
        },
      },
    },
  });

  return NextResponse.json({ tickets });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const { ticketId, status, reply } = body;

  if (!ticketId) {
    return NextResponse.json({ error: "Ticket ID is required" }, { status: 400 });
  }

  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  const updateData: any = {};
  if (typeof status === "string") updateData.status = status;

  const updatedTicket = await prisma.supportTicket.update({
    where: { id: ticketId },
    data: updateData,
  });

  if (reply) {
    await prisma.notification.create({
      data: {
        userId: ticket.userId,
        type: "ALERT",
        title: "Support Update",
        message: `Admin response: ${reply}`,
        targetAudience: "INDIVIDUAL",
        readBy: [],
      },
    });
  }

  return NextResponse.json({ ticket: updatedTicket });
}
