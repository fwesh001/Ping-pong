import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  const where: any = { userId: auth.user.id };
  if (type) {
    where.type = type;
  }

  const notifications = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ notifications });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const action = body.action;

  if (action === "markAllRead") {
    const result = await prisma.notification.updateMany({
      where: { userId: auth.user.id, isRead: false },
      data: { isRead: true },
    });
    return NextResponse.json({ message: "All notifications marked as read", updated: result.count });
  }

  if (action === "markRead" && body.notificationId) {
    const notification = await prisma.notification.updateMany({
      where: { id: body.notificationId, userId: auth.user.id },
      data: { isRead: true },
    });
    return NextResponse.json({ message: "Notification marked as read", updated: notification.count });
  }

  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}
