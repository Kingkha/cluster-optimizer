import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { exportMarkdown, exportCSV } from "@/lib/export";
import type { ProjectWithRelations } from "@/lib/types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const format = req.nextUrl.searchParams.get("format") || "md";

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      nodes: { orderBy: { publishOrder: "asc" } },
      links: {
        include: {
          source: { select: { title: true, slug: true } },
          target: { select: { title: true, slug: true } },
        },
      },
      missingNodes: { orderBy: { confidenceScore: "desc" } },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data = {
    ...project,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  } as unknown as ProjectWithRelations;

  if (format === "csv") {
    return new NextResponse(exportCSV(data), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${project.topic}.csv"`,
      },
    });
  }

  const md = exportMarkdown(data);
  return new NextResponse(md, {
    headers: {
      "Content-Type": "text/markdown",
      "Content-Disposition": `attachment; filename="${project.topic}.md"`,
    },
  });
}
