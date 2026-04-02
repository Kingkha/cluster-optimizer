export function clusterGenerationPrompt(params: {
  topic: string;
  country?: string | null;
  language?: string | null;
  niche?: string | null;
  domain?: string | null;
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

  parts.push(
    ``,
    `Generate a content cluster with 12-20 pages. For each page provide:`,
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
    `- 2-4 sub-pillar pages that cover major subtopics`,
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
  nodesJson: string
): string {
  return [
    `You are an expert SEO content strategist. Analyze this content cluster about "${topic}" and provide scoring data and missing node suggestions.`,
    ``,
    `Current cluster structure:`,
    nodesJson,
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
    `}`,
  ].join("\n");
}
