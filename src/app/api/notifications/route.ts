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
    const notifications = await prisma.notification.findMany({
      where: { userId: auth.user.id },
    });

    await Promise.all(
      notifications.map((notification) =>
        prisma.notification.update({
          where: { id: notification.id },
          data: {
            readBy: Array.from(new Set([...(notification.readBy || []), auth.user.id])),
          },
        })
      )
    );

    return NextResponse.json({ message: "All notifications marked as read" });
  }

  if (action === "markRead" && body.notificationId) {
    const notification = await prisma.notification.findFirst({
      where: { id: body.notificationId, userId: auth.user.id },
    });

    if (!notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    await prisma.notification.update({
      where: { id: notification.id },
      data: {
        readBy: Array.from(new Set([...(notification.readBy || []), auth.user.id])),
      },
    });

    return NextResponse.json({ message: "Notification marked as read" });
  }

  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}
