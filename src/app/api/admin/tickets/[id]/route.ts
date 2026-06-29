import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id: ticketId } = params;
  const body = await req.json();
  const { status, reply } = body;

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

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id: ticketId } = params;

  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  await prisma.supportTicket.delete({ where: { id: ticketId } });
  return NextResponse.json({ message: "Ticket deleted" });
}
