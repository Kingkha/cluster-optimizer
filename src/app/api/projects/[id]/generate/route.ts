import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { generateClusterStructure } from "@/lib/ai/generate-cluster";
import { scoreAndEnrich } from "@/lib/ai/score-and-enrich";
import { calculatePriorityScore } from "@/lib/scoring";
import { fetchSerpContext, DataForSEOClient } from "@/lib/data-sources/dataforseo";
import { crawlSite } from "@/lib/data-sources/site-crawl";
import { getSearchAnalytics } from "@/lib/data-sources/gsc-client";
import type { DataSourceContext, CrawledPageData } from "@/lib/data-sources/types";

export const maxDuration = 60; // Vercel Pro max; upgrade to Fluid Compute for longer

async function getSetting(key: string): Promise<string | null> {
  const row = await prisma.appSettings.findUnique({ where: { key } });
  return row?.value || null;
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const [project, user] = await Promise.all([
    prisma.project.findUnique({ where: { id, userId: session.user.id } }),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { credits: true } }),
  ]);

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!user || user.credits < 1) {
    await prisma.project.update({
      where: { id },
      data: { status: "error", errorMsg: "Insufficient credits. Purchase more to continue." },
    });
    return NextResponse.json({ error: "Insufficient credits", code: "NO_CREDITS" }, { status: 402 });
  }

  // Clear existing data if regenerating
  await prisma.missingNode.deleteMany({ where: { projectId: id } });
  await prisma.linkSuggestion.deleteMany({ where: { projectId: id } });
  await prisma.clusterNode.deleteMany({ where: { projectId: id } });
  await prisma.serpData.deleteMany({ where: { projectId: id } });

  try {
    // ── Step 0: Fetch real data (optional, graceful) ──
    await prisma.project.update({
      where: { id },
      data: { status: "fetching-data", errorMsg: null },
    });

    let serpContext: DataSourceContext | null = null;
    let crawledPages: CrawledPageData[] | null = null;
    let gscQueryRows: { query: string; impressions: number; clicks: number; ctr: number; position: number }[] | null = null;

    // DataForSEO
    const dfLogin = process.env.DATAFORSEO_LOGIN || await getSetting("dataforseo_login");
    const dfPassword = process.env.DATAFORSEO_PASSWORD || await getSetting("dataforseo_password");

    if (dfLogin && dfPassword) {
      try {
        serpContext = await fetchSerpContext(
          project.topic,
          dfLogin,
          dfPassword,
          project.country
        );

        // Cache SERP data
        if (serpContext.seedKeyword) {
          await prisma.serpData.upsert({
            where: { projectId_keyword: { projectId: id, keyword: project.topic } },
            create: {
              projectId: id,
              keyword: project.topic,
              volume: serpContext.seedKeyword.volume,
              difficulty: serpContext.seedKeyword.difficulty,
              cpc: serpContext.seedKeyword.cpc,
              competition: serpContext.seedKeyword.competition,
              intent: serpContext.seedKeyword.intent,
              serpFeatures: JSON.stringify(serpContext.serpFeatures),
              topResults: JSON.stringify(serpContext.topCompetitors),
            },
            update: {
              volume: serpContext.seedKeyword.volume,
              difficulty: serpContext.seedKeyword.difficulty,
              cpc: serpContext.seedKeyword.cpc,
              serpFeatures: JSON.stringify(serpContext.serpFeatures),
              topResults: JSON.stringify(serpContext.topCompetitors),
              fetchedAt: new Date(),
            },
          });
        }
      } catch (e) {
        console.warn("DataForSEO fetch failed, continuing with AI-only:", e);
      }
    }

    // Site crawl (if domain provided)
    if (project.domain) {
      try {
        const existing = await prisma.crawledPage.count({ where: { projectId: id } });
        if (existing === 0) {
          crawledPages = await crawlSite(project.domain, 50);
          for (const page of crawledPages) {
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
        } else {
          // Use cached crawled pages
          const cached = await prisma.crawledPage.findMany({ where: { projectId: id } });
          crawledPages = cached.map((p) => ({
            url: p.url,
            path: p.path,
            title: p.title,
            metaDescription: p.metaDescription,
            h1: p.h1,
            headings: p.headings ? JSON.parse(p.headings) : [],
            wordCount: p.wordCount || 0,
          }));
        }
      } catch (e) {
        console.warn("Site crawl failed, continuing without:", e);
      }
    }

    // GSC data (if connection exists for this domain)
    if (project.domain) {
      try {
        const domainClean = project.domain.replace(/^https?:\/\//, "").replace(/\/$/, "");
        const gscConn = await prisma.gscConnection.findFirst({
          where: {
            OR: [
              { propertyUrl: `sc-domain:${domainClean}` },
              { propertyUrl: `https://${domainClean}/` },
              { propertyUrl: { contains: domainClean } },
            ],
          },
        });

        if (gscConn) {
          gscQueryRows = await getSearchAnalytics(
            gscConn.accessToken,
            gscConn.refreshToken,
            gscConn.propertyUrl,
            28
          );

          // Cache GSC data
          await prisma.gscQueryData.deleteMany({ where: { projectId: id } });
          for (const q of gscQueryRows.slice(0, 500)) {
            await prisma.gscQueryData.create({
              data: {
                projectId: id,
                query: q.query,
                impressions: q.impressions,
                clicks: q.clicks,
                ctr: q.ctr,
                position: q.position,
              },
            });
          }
        }
      } catch (e) {
        console.warn("GSC fetch failed, continuing without:", e);
      }
    }

    // ── Step 1: Generate cluster structure ──
    await prisma.project.update({
      where: { id },
      data: { status: "generating" },
    });

    const cluster = await generateClusterStructure({
      topic: project.topic,
      country: project.country,
      language: project.language,
      niche: project.niche,
      domain: project.domain,
      serpContext,
      crawledPages,
    });

    // Save nodes
    const slugToId = new Map<string, string>();

    for (let i = 0; i < cluster.nodes.length; i++) {
      const n = cluster.nodes[i];
      const node = await prisma.clusterNode.create({
        data: {
          projectId: id,
          title: n.title,
          slug: n.slug,
          role: n.role,
          groupName: n.groupName || null,
          targetKeyword: n.targetKeyword || null,
          searchIntent: n.searchIntent || null,
          sortOrder: i,
          publishOrder: i,
        },
      });
      slugToId.set(n.slug, node.id);
    }

    // Set parent references
    for (const n of cluster.nodes) {
      if (n.parentSlug && slugToId.has(n.parentSlug)) {
        await prisma.clusterNode.update({
          where: { id: slugToId.get(n.slug)! },
          data: { parentId: slugToId.get(n.parentSlug)! },
        });
      }
    }

    // Save links
    for (const link of cluster.links) {
      const sourceId = slugToId.get(link.sourceSlug);
      const targetId = slugToId.get(link.targetSlug);
      if (sourceId && targetId) {
        await prisma.linkSuggestion.create({
          data: {
            projectId: id,
            sourceId,
            targetId,
            anchorText: link.anchorText,
            context: link.context || null,
            linkType: link.linkType || "contextual",
          },
        });
      }
    }

    // Fetch real keyword data for generated target keywords
    let realKeywordData: Map<string, { volume: number; difficulty: number | null }> | null = null;

    if (dfLogin && dfPassword) {
      try {
        const targetKeywords = cluster.nodes
          .map((n) => n.targetKeyword)
          .filter((kw): kw is string => Boolean(kw));

        if (targetKeywords.length > 0) {
          const client = new DataForSEOClient(dfLogin, dfPassword);
          const kwData = await client.getKeywordData(targetKeywords);

          realKeywordData = new Map();
          for (const [kw, data] of kwData) {
            if (data.volume != null) {
              realKeywordData.set(kw, {
                volume: data.volume,
                difficulty: data.difficulty,
              });
            }
          }

          // Save real metrics to nodes
          for (const n of cluster.nodes) {
            if (n.targetKeyword && kwData.has(n.targetKeyword)) {
              const kd = kwData.get(n.targetKeyword)!;
              const nodeId = slugToId.get(n.slug);
              if (nodeId) {
                await prisma.clusterNode.update({
                  where: { id: nodeId },
                  data: {
                    realVolume: kd.volume,
                    realDifficulty: kd.difficulty,
                    realCpc: kd.cpc,
                    dataSource: "dataforseo",
                  },
                });
              }
            }
          }
        }
      } catch (e) {
        console.warn("DataForSEO keyword batch failed:", e);
      }
    }

    // ── Step 2: Score and find missing nodes ──
    await prisma.project.update({
      where: { id },
      data: { status: "enriching" },
    });

    const enrichment = await scoreAndEnrich(
      project.topic,
      cluster.nodes.map((n) => ({
        title: n.title,
        slug: n.slug,
        role: n.role,
        parentSlug: n.parentSlug,
      })),
      realKeywordData,
      gscQueryRows
    );

    // Apply scores
    for (const [slug, scores] of Object.entries(enrichment.scores)) {
      const nodeId = slugToId.get(slug);
      if (nodeId) {
        const priorityScore = calculatePriorityScore(scores);
        await prisma.clusterNode.update({
          where: { id: nodeId },
          data: {
            centrality: scores.centrality,
            supportValue: scores.supportValue,
            opportunity: scores.opportunity,
            ease: scores.ease,
            serpClarity: scores.serpClarity,
            priorityScore,
          },
        });
      }
    }

    // Set publish order by priority
    const allNodes = await prisma.clusterNode.findMany({
      where: { projectId: id },
      orderBy: { priorityScore: "desc" },
    });
    for (let i = 0; i < allNodes.length; i++) {
      await prisma.clusterNode.update({
        where: { id: allNodes[i].id },
        data: { publishOrder: i + 1 },
      });
    }

    // Save missing nodes
    for (const mn of enrichment.missingNodes) {
      const parentNodeId = mn.parentSlug ? slugToId.get(mn.parentSlug) || null : null;
      await prisma.missingNode.create({
        data: {
          projectId: id,
          suggestedTitle: mn.suggestedTitle,
          suggestedRole: mn.suggestedRole,
          reason: mn.reason,
          confidenceScore: mn.confidenceScore,
          parentNodeId,
        },
      });
    }

    await prisma.project.update({
      where: { id },
      data: { status: "ready" },
    });

    // Deduct 1 credit
    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: { credits: { decrement: 1 } },
    });
    await prisma.creditTransaction.create({
      data: {
        userId: session.user.id,
        amount: -1,
        balance: updated.credits,
        type: "use",
        description: `Generated cluster: ${project.topic}`,
      },
    });

    return NextResponse.json({ ok: true, status: "ready" });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    await prisma.project.update({
      where: { id },
      data: { status: "error", errorMsg: msg },
    });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
