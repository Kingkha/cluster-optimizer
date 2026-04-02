import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateClusterStructure } from "@/lib/ai/generate-cluster";
import { scoreAndEnrich } from "@/lib/ai/score-and-enrich";
import { calculatePriorityScore } from "@/lib/scoring";

export const maxDuration = 120;

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Clear existing data if regenerating
  await prisma.missingNode.deleteMany({ where: { projectId: id } });
  await prisma.linkSuggestion.deleteMany({ where: { projectId: id } });
  await prisma.clusterNode.deleteMany({ where: { projectId: id } });

  try {
    // Step 1: Generate cluster structure
    await prisma.project.update({
      where: { id },
      data: { status: "generating", errorMsg: null },
    });

    const cluster = await generateClusterStructure({
      topic: project.topic,
      country: project.country,
      language: project.language,
      niche: project.niche,
      domain: project.domain,
    });

    // Save nodes
    const slugToId = new Map<string, string>();

    // First pass: create all nodes without parent references
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

    // Second pass: set parent references
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

    // Step 2: Score and find missing nodes
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
      }))
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

    // Set publish order based on priority score
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
