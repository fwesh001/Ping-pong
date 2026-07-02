import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  const packages = await prisma.creditPackage.findMany({
    orderBy: { price: "asc" },
  });

  return NextResponse.json({ packages });
}
