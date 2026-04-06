import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { devAuth } from "@/lib/dev-auth";
import { generateClusterStructure } from "@/lib/ai/generate-cluster";
import { groupKeywordsBySubtopic, type KeywordGroup } from "@/lib/ai/group-keywords";
import { scoreAndEnrich } from "@/lib/ai/score-and-enrich";
import { calculatePriorityScore } from "@/lib/scoring";
import { fetchSerpContext, DataForSEOClient, getLocationCode, LABS_ENGLISH_LOCATIONS } from "@/lib/data-sources/dataforseo";
import { crawlSite } from "@/lib/data-sources/site-crawl";

import { generateBriefs } from "@/lib/ai/generate-briefs";
import type { DataSourceContext, CrawledPageData } from "@/lib/data-sources/types";

export const maxDuration = 60; // Vercel Pro max; upgrade to Fluid Compute for longer

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await devAuth();
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

  // Clear existing data if regenerating (order matters for FK constraints)
  await prisma.$transaction([
    prisma.contentBrief.deleteMany({ where: { projectId: id } }),
    prisma.missingNode.deleteMany({ where: { projectId: id } }),
    prisma.linkSuggestion.deleteMany({ where: { projectId: id } }),
    prisma.clusterNode.deleteMany({ where: { projectId: id } }),
    prisma.serpData.deleteMany({ where: { projectId: id } }),
  ]);

  try {
    // ── Step 0: Fetch real data (optional, graceful) ──
    await prisma.project.update({
      where: { id },
      data: { status: "fetching-data", errorMsg: null },
    });

    let serpContext: DataSourceContext | null = null;
    let crawledPages: CrawledPageData[] | null = null;
    // DataForSEO
    const dfLogin = process.env.DATAFORSEO_LOGIN;
    const dfPassword = process.env.DATAFORSEO_PASSWORD;
    const locationCode = getLocationCode(project.country);

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
          await prisma.crawledPage.createMany({
            data: crawledPages.map((page) => ({
              projectId: id,
              url: page.url,
              path: page.path,
              title: page.title,
              metaDescription: page.metaDescription,
              h1: page.h1,
              headings: JSON.stringify(page.headings),
              wordCount: page.wordCount,
            })),
          });
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

    // ── Step 0.5: Group related keywords by subtopic ──
    let keywordGroups: KeywordGroup[] | null = null;
    if (serpContext && serpContext.relatedKeywords.length > 0) {
      try {
        keywordGroups = await groupKeywordsBySubtopic(
          project.topic,
          serpContext.relatedKeywords
        );
      } catch (e) {
        console.warn("Keyword grouping failed, continuing with flat list:", e);
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
      keywordGroups,
    });

    // Save nodes (batch create, get IDs back)
    const createdNodes = await prisma.clusterNode.createManyAndReturn({
      data: cluster.nodes.map((n, i) => ({
        projectId: id,
        title: n.title,
        slug: n.slug,
        role: n.role,
        groupName: n.groupName || null,
        targetKeyword: n.targetKeyword || null,
        searchIntent: n.searchIntent || null,
        sortOrder: i,
        publishOrder: i,
      })),
    });

    const slugToId = new Map<string, string>();
    for (const node of createdNodes) {
      slugToId.set(node.slug, node.id);
    }

    // Set parent references (batch via transaction)
    const parentUpdates = cluster.nodes
      .filter((n) => n.parentSlug && slugToId.has(n.parentSlug))
      .map((n) =>
        prisma.clusterNode.update({
          where: { id: slugToId.get(n.slug)! },
          data: { parentId: slugToId.get(n.parentSlug!)! },
        })
      );
    if (parentUpdates.length > 0) {
      await prisma.$transaction(parentUpdates);
    }

    // Save links (batch)
    const linkData = cluster.links
      .filter((link) => slugToId.has(link.sourceSlug) && slugToId.has(link.targetSlug))
      .map((link) => ({
        projectId: id,
        sourceId: slugToId.get(link.sourceSlug)!,
        targetId: slugToId.get(link.targetSlug)!,
        anchorText: link.anchorText,
        context: link.context || null,
        linkType: link.linkType || "contextual",
      }));
    if (linkData.length > 0) {
      await prisma.linkSuggestion.createMany({ data: linkData });
    }

    // Fetch keyword difficulty for generated target keywords (Labs, ~$0.01)
    let realKeywordData: Map<string, { volume: number; difficulty: number | null }> | null = null;

    if (dfLogin && dfPassword) {
      try {
        const targetKeywords = cluster.nodes
          .map((n) => n.targetKeyword)
          .filter((kw): kw is string => Boolean(kw));

        if (targetKeywords.length > 0) {
          const client = new DataForSEOClient(dfLogin, dfPassword);
          const labsLocationCode = LABS_ENGLISH_LOCATIONS.has(locationCode) ? locationCode : 2840;
          const kwDifficulty = await client.getKeywordDifficulty(targetKeywords, labsLocationCode);

          // Build realKeywordData from KD + any volume we already have from serpContext
          realKeywordData = new Map();
          const existingVolumes = new Map<string, number>();
          if (serpContext?.relatedKeywords) {
            for (const rk of serpContext.relatedKeywords) {
              existingVolumes.set(rk.keyword.toLowerCase(), rk.volume);
            }
          }
          if (serpContext?.seedKeyword?.volume != null) {
            existingVolumes.set(project.topic.toLowerCase(), serpContext.seedKeyword.volume);
          }

          for (const kw of targetKeywords) {
            const difficulty = kwDifficulty.get(kw) ?? null;
            const volume = existingVolumes.get(kw.toLowerCase()) ?? null;
            if (difficulty != null || volume != null) {
              realKeywordData.set(kw, { volume: volume ?? 0, difficulty });
            }
          }

          // Save KD to nodes (batch via transaction)
          const metricUpdates = cluster.nodes
            .filter((n) => n.targetKeyword && kwDifficulty.has(n.targetKeyword) && slugToId.has(n.slug))
            .map((n) => {
              const difficulty = kwDifficulty.get(n.targetKeyword!)!;
              const volume = existingVolumes.get(n.targetKeyword!.toLowerCase()) ?? null;
              return prisma.clusterNode.update({
                where: { id: slugToId.get(n.slug)! },
                data: {
                  realDifficulty: difficulty,
                  ...(volume != null && { realVolume: volume }),
                  dataSource: "dataforseo",
                },
              });
            });
          if (metricUpdates.length > 0) {
            await prisma.$transaction(metricUpdates);
          }
        }
      } catch (e) {
        console.warn("DataForSEO keyword difficulty failed:", e);
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
    );

    // Apply scores + publish order (single transaction)
    const scoredNodes = Object.entries(enrichment.scores)
      .filter(([slug]) => slugToId.has(slug))
      .map(([slug, scores]) => ({
        id: slugToId.get(slug)!,
        priorityScore: calculatePriorityScore(scores),
        scores,
      }))
      .sort((a, b) => b.priorityScore - a.priorityScore);

    const scoreAndOrderUpdates = scoredNodes.map((node, i) =>
      prisma.clusterNode.update({
        where: { id: node.id },
        data: {
          centrality: node.scores.centrality,
          supportValue: node.scores.supportValue,
          opportunity: node.scores.opportunity,
          ease: node.scores.ease,
          serpClarity: node.scores.serpClarity,
          priorityScore: node.priorityScore,
          publishOrder: i + 1,
        },
      })
    );
    if (scoreAndOrderUpdates.length > 0) {
      await prisma.$transaction(scoreAndOrderUpdates);
    }

    // Save missing nodes (batch)
    if (enrichment.missingNodes.length > 0) {
      await prisma.missingNode.createMany({
        data: enrichment.missingNodes.map((mn) => ({
          projectId: id,
          suggestedTitle: mn.suggestedTitle,
          suggestedRole: mn.suggestedRole,
          reason: mn.reason,
          confidenceScore: mn.confidenceScore,
          parentNodeId: mn.parentSlug ? slugToId.get(mn.parentSlug) || null : null,
        })),
      });
    }

    // ── Step 3: Generate content briefs ──
    await prisma.project.update({
      where: { id },
      data: { status: "briefing" },
    });

    try {
      // Build node inputs with link context
      const allLinksForBriefs = await prisma.linkSuggestion.findMany({
        where: { projectId: id },
        include: {
          source: { select: { title: true, slug: true } },
          target: { select: { title: true, slug: true } },
        },
      });

      // Re-fetch nodes with updated scores for brief generation
      const allNodes = await prisma.clusterNode.findMany({
        where: { projectId: id },
        orderBy: { priorityScore: "desc" },
      });

      const briefNodes = allNodes.map((node) => ({
        title: node.title,
        slug: node.slug,
        role: node.role,
        targetKeyword: node.targetKeyword,
        searchIntent: node.searchIntent,
        realVolume: node.realVolume,
        realDifficulty: node.realDifficulty,
        incomingLinks: allLinksForBriefs
          .filter((l) => l.targetId === node.id)
          .map((l) => ({ sourceTitle: l.source.title, sourceSlug: l.source.slug, anchorText: l.anchorText })),
        outgoingLinks: allLinksForBriefs
          .filter((l) => l.sourceId === node.id)
          .map((l) => ({ targetTitle: l.target.title, targetSlug: l.target.slug, anchorText: l.anchorText })),
      }));

      // Parse SERP data for competitor context
      const serpRecord = await prisma.serpData.findFirst({ where: { projectId: id } });
      const serpCompetitors = serpRecord?.topResults ? JSON.parse(serpRecord.topResults) : [];
      const serpFeats = serpRecord?.serpFeatures ? JSON.parse(serpRecord.serpFeatures) : [];

      const briefResults = await generateBriefs({
        topic: project.topic,
        nodes: briefNodes,
        serpCompetitors,
        serpFeatures: serpFeats,
        keywordGroups: keywordGroups || [],
      });

      // Save briefs (batch)
      const briefData = [...briefResults.entries()]
        .filter(([slug]) => slugToId.has(slug))
        .map(([slug, brief]) => {
          const nodeId = slugToId.get(slug)!;
          return {
            projectId: id,
            nodeId,
            targetKeyword: brief.targetKeyword,
            secondaryKeywords: JSON.stringify(brief.secondaryKeywords),
            searchIntent: brief.searchIntent,
            wordCountMin: brief.wordCountMin,
            wordCountMax: brief.wordCountMax,
            outline: JSON.stringify(brief.outline),
            keyPoints: JSON.stringify(brief.keyPoints),
            internalLinks: JSON.stringify(
              allLinksForBriefs
                .filter((l) => l.sourceId === nodeId)
                .map((l) => ({ title: l.target.title, slug: l.target.slug, anchorText: l.anchorText }))
            ),
            competitorAngles: JSON.stringify(brief.competitorAngles),
          };
        });
      if (briefData.length > 0) {
        await prisma.contentBrief.createMany({ data: briefData });
      }
    } catch (e) {
      console.warn("Brief generation failed, continuing without:", e);
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
