import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";

// DELETE /api/admin/monitors/[id]
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id: monitorId } = params;

  const monitor = await prisma.monitor.findUnique({ where: { id: monitorId } });
  if (!monitor) {
    return NextResponse.json({ error: "Monitor not found" }, { status: 404 });
  }

  await prisma.monitor.delete({ where: { id: monitorId } });
  return NextResponse.json({ message: "Monitor permanently deleted" });
}

// PUT /api/admin/monitors/[id] — update status/isActive
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id: monitorId } = params;
  const body = await req.json();
  const { isActive, status } = body;

  const monitor = await prisma.monitor.findUnique({ where: { id: monitorId } });
  if (!monitor) {
    return NextResponse.json({ error: "Monitor not found" }, { status: 404 });
  }

  const updateData: any = {};
  if (typeof isActive === "boolean") updateData.isActive = isActive;
  if (typeof status === "string") updateData.status = status;

  const updatedMonitor = await prisma.monitor.update({
    where: { id: monitorId },
    data: updateData,
  });

  return NextResponse.json({ monitor: updatedMonitor });
}
