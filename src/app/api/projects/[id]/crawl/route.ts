import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { crawlSite } from "@/lib/data-sources/site-crawl";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!project.domain) {
    return NextResponse.json({ error: "No domain set for this project" }, { status: 400 });
  }

  try {
    await prisma.project.update({
      where: { id },
      data: { crawlStatus: "crawling" },
    });

    // Clear old crawl data
    await prisma.crawledPage.deleteMany({ where: { projectId: id } });

    const pages = await crawlSite(project.domain, 50);

    for (const page of pages) {
      await prisma.crawledPage.create({
        data: {
          projectId: id,
          url: page.url,
          path: page.path,
          title: page.title,
          metaDescription: page.metaDescription,
          h1: page.h1,
          headings: JSON.stringify(page.headings),
          wordCount: page.wordCount,
        },
      });
    }

    await prisma.project.update({
      where: { id },
      data: { crawlStatus: "crawled" },
    });

    return NextResponse.json({ ok: true, pages: pages.length });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Crawl failed";
    await prisma.project.update({
      where: { id },
      data: { crawlStatus: "crawl-error" },
    });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
