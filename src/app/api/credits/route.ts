import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { devAuth } from "@/lib/dev-auth";

export async function GET() {
  const session = await devAuth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user, transactions] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id }, select: { credits: true } }),
    prisma.creditTransaction.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return NextResponse.json({ balance: user?.credits ?? 0, transactions });
}
