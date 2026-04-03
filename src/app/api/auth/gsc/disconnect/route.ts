import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { devAuth } from "@/lib/dev-auth";

export async function DELETE(req: NextRequest) {
  const session = await devAuth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  await prisma.gscConnection.delete({
    where: { id, userId: session.user.id },
  });
  return NextResponse.json({ ok: true });
}
