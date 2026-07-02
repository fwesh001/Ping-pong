import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;

    const { id } = params;
    const body = await req.json();
    const { name, credits, price } = body;

    const pkg = await prisma.creditPackage.findUnique({ where: { id } });
    if (!pkg) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    const updatedPkg = await prisma.creditPackage.update({
      where: { id },
      data: {
        name: typeof name === "string" ? name : pkg.name,
        credits: typeof credits === "number" ? credits : pkg.credits,
        price: typeof price === "number" ? price : pkg.price,
      },
    });

    return NextResponse.json({ package: updatedPkg });
  } catch (err: any) {
    console.error(`/api/admin/packages/[id] PUT error for id=${params?.id}:`, err);
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;

    const { id } = params;

    const pkg = await prisma.creditPackage.findUnique({ where: { id } });
    if (!pkg) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    await prisma.creditPackage.delete({ where: { id } });
    return NextResponse.json({ message: "Package deleted" });
  } catch (err: any) {
    console.error(`/api/admin/packages/[id] DELETE error for id=${params?.id}:`, err);
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}
