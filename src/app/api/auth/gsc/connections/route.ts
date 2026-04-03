import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { devAuth } from "@/lib/dev-auth";

export async function GET() {
  const session = await devAuth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const connections = await prisma.gscConnection.findMany({
    where: { userId: session.user.id },
    select: { id: true, propertyUrl: true, expiresAt: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(connections);
}
