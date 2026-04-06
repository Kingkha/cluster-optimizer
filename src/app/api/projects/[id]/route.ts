import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { devAuth } from "@/lib/dev-auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await devAuth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const statusOnly = req.nextUrl.searchParams.get("status") === "1";

  // Lightweight poll: only fetch status + error during generation
  if (statusOnly) {
    const project = await prisma.project.findUnique({
      where: { id, userId: session.user.id },
      select: { id: true, status: true, errorMsg: true, topic: true, updatedAt: true },
    });
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Stale detection: if stuck in a generating state for >2 minutes, mark as error
    const STALE_TIMEOUT = 2 * 60 * 1000;
    const generatingStates = ["pending", "fetching-data", "generating", "enriching", "briefing"];
    if (
      generatingStates.includes(project.status) &&
      Date.now() - project.updatedAt.getTime() > STALE_TIMEOUT
    ) {
      const updated = await prisma.project.update({
        where: { id },
        data: {
          status: "error",
          errorMsg: "Generation timed out — the process may have crashed. Please retry.",
        },
        select: { id: true, status: true, errorMsg: true, topic: true },
      });
      return NextResponse.json(updated);
    }

    return NextResponse.json(project);
  }

  // Full fetch: all relations (only when status is ready/error)
  const project = await prisma.project.findUnique({
    where: { id, userId: session.user.id },
    include: {
      nodes: {
        orderBy: [{ publishOrder: "asc" }, { sortOrder: "asc" }],
        include: { children: true },
      },
      links: {
        include: {
          source: { select: { title: true, slug: true } },
          target: { select: { title: true, slug: true } },
        },
      },
      missingNodes: { orderBy: { confidenceScore: "desc" } },
      crawledPages: { orderBy: { path: "asc" } },
      gscQueries: { orderBy: { impressions: "desc" }, take: 100 },
      briefs: true,
      serpData: { orderBy: { fetchedAt: "desc" } },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(project);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await devAuth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { topic, country, language, domain, niche } = body;

  const project = await prisma.project.update({
    where: { id, userId: session.user.id },
    data: {
      ...(topic !== undefined && { topic }),
      ...(country !== undefined && { country }),
      ...(language !== undefined && { language }),
      ...(domain !== undefined && { domain }),
      ...(niche !== undefined && { niche }),
    },
  });

  return NextResponse.json(project);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await devAuth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.project.delete({ where: { id, userId: session.user.id } });
  return NextResponse.json({ ok: true });
}
