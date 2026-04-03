import type { DataSourceContext, CrawledPageData } from "@/lib/data-sources/types";
import type { KeywordGroup } from "./group-keywords";

/**
 * Determine ideal cluster size based on available data signals.
 *
 * Signals used (in priority order):
 * 1. Number of keyword groups — each group needs at least 1-2 pages
 * 2. Total unique related keywords — more keywords = broader topic
 * 3. Seed keyword volume — higher volume usually = broader topic
 *
 * Returns { min, max, subPillarRange } for the prompt.
 */
function estimateClusterSize(params: {
  keywordGroups?: KeywordGroup[] | null;
  serpContext?: DataSourceContext | null;
}): { min: number; max: number; subPillars: string } {
  const groups = params.keywordGroups?.length ?? 0;
  const relatedCount = params.serpContext?.relatedKeywords?.length ?? 0;
  const seedVolume = params.serpContext?.seedKeyword?.volume ?? 0;

  // If we have grouped keywords, use them as primary signal
  if (groups > 0) {
    if (groups <= 3) return { min: 5, max: 8, subPillars: "2-3" };
    if (groups <= 5) return { min: 8, max: 14, subPillars: "3-4" };
    if (groups <= 7) return { min: 12, max: 18, subPillars: "4-5" };
    return { min: 15, max: 20, subPillars: "5-7" };
  }

  // Fallback: use related keyword count + volume
  if (relatedCount <= 5 || seedVolume < 1000) {
    return { min: 5, max: 8, subPillars: "2-3" };
  }
  if (relatedCount <= 15 || seedVolume < 10000) {
    return { min: 8, max: 14, subPillars: "3-4" };
  }
  if (relatedCount <= 25 || seedVolume < 50000) {
    return { min: 12, max: 18, subPillars: "4-5" };
  }
  return { min: 15, max: 20, subPillars: "5-7" };
}

export function clusterGenerationPrompt(params: {
  topic: string;
  country?: string | null;
  language?: string | null;
  niche?: string | null;
  domain?: string | null;
  serpContext?: DataSourceContext | null;
  crawledPages?: CrawledPageData[] | null;
  keywordGroups?: KeywordGroup[] | null;
}): string {
  const parts = [
    `You are an expert SEO content strategist. Given a seed topic, generate a complete content cluster structure.`,
    ``,
    `Seed topic: ${params.topic}`,
  ];

  if (params.country) parts.push(`Target country: ${params.country}`);
  if (params.language && params.language !== "en")
    parts.push(`Language: ${params.language}`);
  if (params.niche) parts.push(`Niche/site type: ${params.niche}`);
  if (params.domain) parts.push(`Domain: ${params.domain}`);

  // Inject real SERP data when available
  if (params.serpContext) {
    const ctx = params.serpContext;
    parts.push(``, `## Real Keyword Data (from DataForSEO)`);

    if (ctx.seedKeyword) {
      const sk = ctx.seedKeyword;
      parts.push(`Seed keyword "${params.topic}":`);
      if (sk.volume != null) parts.push(`- Monthly search volume: ${sk.volume.toLocaleString()}`);
      if (sk.difficulty != null) parts.push(`- Keyword difficulty: ${sk.difficulty}/100`);
      if (sk.cpc != null) parts.push(`- CPC: $${sk.cpc.toFixed(2)}`);
    }

    if (params.keywordGroups && params.keywordGroups.length > 0) {
      parts.push(``, `### Related keywords grouped by subtopic:`);
      for (const group of params.keywordGroups) {
        const totalVol = group.keywords.reduce((sum, k) => sum + k.volume, 0);
        parts.push(``, `**${group.group}** (total volume: ${totalVol.toLocaleString()}):`);
        for (const k of group.keywords) {
          const diff = k.difficulty != null ? `, diff: ${k.difficulty}` : "";
          parts.push(`  - "${k.keyword}" (vol: ${k.volume.toLocaleString()}${diff})`);
        }
      }
    } else if (ctx.relatedKeywords.length > 0) {
      parts.push(``, `### Related keywords with real search volume:`);
      for (const k of ctx.relatedKeywords.slice(0, 25)) {
        const diff = k.difficulty != null ? `, diff: ${k.difficulty}` : "";
        parts.push(`- "${k.keyword}" (vol: ${k.volume.toLocaleString()}${diff})`);
      }
    }

    if (ctx.topCompetitors.length > 0) {
      parts.push(``, `### Current top 10 organic results for "${params.topic}":`);
      for (const r of ctx.topCompetitors) {
        parts.push(`${r.position}. ${r.title} (${r.domain})`);
      }
    }

    if (ctx.serpFeatures.length > 0) {
      parts.push(``, `### SERP features present: ${ctx.serpFeatures.join(", ")}`);
    }

    if (params.keywordGroups && params.keywordGroups.length > 0) {
      parts.push(
        ``,
        `IMPORTANT: Your cluster MUST cover every keyword subtopic group listed above. Each group should map to at least one node in the cluster. Use the real keywords as target keywords — do not invent keywords when real ones with search volume exist. Prioritize groups with higher total search volume.`
      );
    } else {
      parts.push(
        ``,
        `IMPORTANT: Use the real keyword data above to inform your cluster. Prefer keywords with actual search volume. Target keywords should come from or be closely related to the real keyword list.`
      );
    }
  }

  // Inject crawled pages when available
  if (params.crawledPages && params.crawledPages.length > 0) {
    parts.push(``, `## Existing Pages on ${params.domain} (from site crawl)`);
    for (const p of params.crawledPages.slice(0, 50)) {
      parts.push(`- ${p.path}: "${p.title || "No title"}" (${p.wordCount} words${p.h1 ? `, H1: "${p.h1}"` : ""})`);
    }
    parts.push(
      ``,
      `IMPORTANT: Check if any of your suggested cluster pages already exist on this site. For pages that match existing content, use the same slug/path. Focus new suggestions on genuine gaps not covered by existing pages.`
    );
  }

  const clusterSize = estimateClusterSize({
    keywordGroups: params.keywordGroups,
    serpContext: params.serpContext,
  });

  parts.push(
    ``,
    `Generate a content cluster with ${clusterSize.min}-${clusterSize.max} pages. For each page provide:`,
    `- title: SEO-optimized page title`,
    `- slug: URL-friendly slug (lowercase, hyphens, no special chars)`,
    `- role: one of [pillar, sub-pillar, support, comparison, list, informational]`,
    `- parentSlug: slug of parent node (null for the pillar page)`,
    `- groupName: thematic group this page belongs to (e.g. "Planning", "Activities", "Practical Info")`,
    `- targetKeyword: primary keyword to target`,
    `- searchIntent: one of [informational, commercial, transactional, navigational]`,
    ``,
    `Rules:`,
    `- Exactly 1 pillar page`,
    `- ${clusterSize.subPillars} sub-pillar pages that cover major subtopics`,
    `- Remaining pages are support/comparison/list/informational`,
    `- Every non-pillar page must have a parentSlug pointing to its parent`,
    `- Sub-pillars point to the pillar; support pages point to their sub-pillar or pillar`,
    `- Think about what a real content team would actually publish`,
    `- Titles should be compelling and SEO-optimized`,
    ``,
    `Also generate internal link suggestions:`,
    `- Each link has sourceSlug, targetSlug, anchorText, context (brief reason)`,
    `- Aim for 2-4 outgoing links per page`,
    `- All support pages should link to their parent`,
    `- Sub-pillars should link to pillar`,
    `- Sibling pages should cross-link when topically related`,
    `- Include linkType: one of [contextual, navigational, related-reading]`,
    ``,
    `Return ONLY valid JSON (no markdown fences, no explanation) in this exact schema:`,
    `{`,
    `  "nodes": [`,
    `    {`,
    `      "title": "string",`,
    `      "slug": "string",`,
    `      "role": "pillar|sub-pillar|support|comparison|list|informational",`,
    `      "parentSlug": "string|null",`,
    `      "groupName": "string",`,
    `      "targetKeyword": "string",`,
    `      "searchIntent": "informational|commercial|transactional|navigational"`,
    `    }`,
    `  ],`,
    `  "links": [`,
    `    {`,
    `      "sourceSlug": "string",`,
    `      "targetSlug": "string",`,
    `      "anchorText": "string",`,
    `      "context": "string",`,
    `      "linkType": "contextual|navigational|related-reading"`,
    `    }`,
    `  ]`,
    `}`
  );

  return parts.join("\n");
}

export function scoringPrompt(
  topic: string,
  nodesJson: string,
  realKeywordData?: Map<string, { volume: number; difficulty: number | null }> | null,
  gscData?: { query: string; impressions: number; clicks: number; position: number }[] | null
): string {
  const parts = [
    `You are an expert SEO content strategist. Analyze this content cluster about "${topic}" and provide scoring data and missing node suggestions.`,
    ``,
    `Current cluster structure:`,
    nodesJson,
  ];

  if (realKeywordData && realKeywordData.size > 0) {
    parts.push(``, `## Real Keyword Metrics (from DataForSEO)`);
    for (const [kw, data] of realKeywordData) {
      const diff = data.difficulty != null ? `, difficulty: ${data.difficulty}/100` : "";
      parts.push(`- "${kw}": volume ${data.volume.toLocaleString()}${diff}`);
    }
    parts.push(
      ``,
      `Use these real metrics to inform your opportunity and serpClarity scores. Keywords with high volume and low difficulty should score higher on opportunity.`
    );
  }

  if (gscData && gscData.length > 0) {
    parts.push(``, `## Real Google Search Console Data`);
    for (const q of gscData.slice(0, 30)) {
      parts.push(`- "${q.query}": ${q.impressions} impr, ${q.clicks} clicks, pos ${q.position.toFixed(1)}`);
    }
    parts.push(
      ``,
      `Use GSC data to validate opportunity. Queries with high impressions but low clicks or poor position are high-opportunity targets.`
    );
  }

  parts.push(
    ``,
    `For each node (identified by slug), estimate these scoring factors on a 0-100 scale:`,
    `- centrality: how central is this to the overall topic? (pillar should be ~95-100, direct sub-pillars 60-80, support pages 20-50)`,
    `- supportValue: how much does publishing this page support other pages in the cluster via internal linking and topical authority? (foundational pages = high)`,
    `- opportunity: estimated relative search opportunity considering volume and competition (high volume + low competition = high score)`,
    `- ease: how easy is it to create high-quality, comprehensive content for this topic? (straightforward topics = high)`,
    `- serpClarity: how clear and unambiguous is the search intent? (clear single intent = high, mixed intent = low)`,
    ``,
    `Also identify 3-7 missing content pieces that would strengthen this cluster. For each:`,
    `- suggestedTitle: SEO-optimized title`,
    `- suggestedRole: one of [sub-pillar, support, comparison, list, informational]`,
    `- reason: why this page is needed`,
    `- confidenceScore: 0.0 to 1.0 (how confident you are this is truly missing and valuable)`,
    `- parentSlug: slug of the existing node this would attach to`,
    ``,
    `Return ONLY valid JSON (no markdown fences, no explanation):`,
    `{`,
    `  "scores": {`,
    `    "slug-here": { "centrality": 90, "supportValue": 80, "opportunity": 70, "ease": 60, "serpClarity": 85 }`,
    `  },`,
    `  "missingNodes": [`,
    `    {`,
    `      "suggestedTitle": "string",`,
    `      "suggestedRole": "string",`,
    `      "reason": "string",`,
    `      "confidenceScore": 0.8,`,
    `      "parentSlug": "string"`,
    `    }`,
    `  ]`,
    `}`
  );

  return parts.join("\n");
}
