import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { nodes: true, links: true, missingNodes: true } },
    },
  });
  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { topic, country, language, domain, niche } = body;

  if (!topic || typeof topic !== "string" || !topic.trim()) {
    return NextResponse.json({ error: "Topic is required" }, { status: 400 });
  }

  const project = await prisma.project.create({
    data: {
      userId: session.user.id,
      topic: topic.trim(),
      country: country || null,
      language: language || "en",
      domain: domain || null,
      niche: niche || null,
    },
  });

  return NextResponse.json(project, { status: 201 });
}
