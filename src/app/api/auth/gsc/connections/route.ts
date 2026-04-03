import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const connections = await prisma.gscConnection.findMany({
    where: { userId: session.user.id },
    select: { id: true, propertyUrl: true, expiresAt: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(connections);
}
