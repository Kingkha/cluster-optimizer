import Anthropic from "@anthropic-ai/sdk";
import { extractJSON } from "./parse-response";

interface BriefInput {
  title: string;
  slug: string;
  role: string;
  targetKeyword: string | null;
  searchIntent: string | null;
  realVolume: number | null;
  realDifficulty: number | null;
  incomingLinks: { sourceTitle: string; sourceSlug: string; anchorText: string }[];
  outgoingLinks: { targetTitle: string; targetSlug: string; anchorText: string }[];
}

interface BriefOutput {
  slug: string;
  targetKeyword: string;
  secondaryKeywords: string[];
  searchIntent: string;
  wordCountMin: number;
  wordCountMax: number;
  outline: { heading: string; level: "h2" | "h3"; notes?: string }[];
  keyPoints: string[];
  competitorAngles: string[];
}

interface GenerateBriefsParams {
  topic: string;
  nodes: BriefInput[];
  serpCompetitors: { position: number; title: string; domain: string; snippet: string }[];
  serpFeatures: string[];
  keywordGroups: { group: string; keywords: { keyword: string; volume: number }[] }[];
}

/**
 * Generate content briefs for a batch of nodes using existing SERP data.
 * Batches 5-6 nodes per Claude call to keep costs low.
 */
export async function generateBriefs(params: GenerateBriefsParams): Promise<Map<string, BriefOutput>> {
  const client = new Anthropic();
  const results = new Map<string, BriefOutput>();

  // Batch nodes into groups of 5
  const batches: BriefInput[][] = [];
  for (let i = 0; i < params.nodes.length; i += 5) {
    batches.push(params.nodes.slice(i, i + 5));
  }

  // Build shared context once
  const sharedContext = buildSharedContext(params);

  for (const batch of batches) {
    const prompt = buildBatchPrompt(batch, sharedContext, params.topic);

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";

    try {
      const parsed = extractJSON<Record<string, BriefOutput>>(text);
      for (const [slug, brief] of Object.entries(parsed)) {
        results.set(slug, brief);
      }
    } catch (e) {
      console.warn("Brief batch parse failed, skipping batch:", e);
    }
  }

  return results;
}

function buildSharedContext(params: GenerateBriefsParams): string {
  const parts: string[] = [];

  if (params.serpCompetitors.length > 0) {
    parts.push(`## What Currently Ranks for "${params.topic}"`);
    for (const r of params.serpCompetitors) {
      parts.push(`${r.position}. "${r.title}" (${r.domain})`);
      if (r.snippet) parts.push(`   ${r.snippet}`);
    }
  }

  if (params.serpFeatures.length > 0) {
    parts.push(``, `SERP Features: ${params.serpFeatures.join(", ")}`);
  }

  if (params.keywordGroups.length > 0) {
    parts.push(``, `## Keyword Subtopics (real search volume)`);
    for (const g of params.keywordGroups) {
      const totalVol = g.keywords.reduce((s, k) => s + k.volume, 0);
      parts.push(`**${g.group}** (${totalVol.toLocaleString()} total vol):`);
      for (const k of g.keywords.slice(0, 5)) {
        parts.push(`  - "${k.keyword}" (${k.volume.toLocaleString()})`);
      }
    }
  }

  return parts.join("\n");
}

function buildBatchPrompt(batch: BriefInput[], sharedContext: string, topic: string): string {
  const nodeDescriptions = batch.map((node) => {
    const parts = [
      `### "${node.title}" (slug: ${node.slug})`,
      `- Role: ${node.role}`,
      `- Target keyword: ${node.targetKeyword || "TBD"}`,
      `- Search intent: ${node.searchIntent || "informational"}`,
    ];
    if (node.realVolume != null) {
      parts.push(`- Real search volume: ${node.realVolume.toLocaleString()}`);
    }
    if (node.realDifficulty != null) {
      parts.push(`- Keyword difficulty: ${node.realDifficulty.toFixed(0)}/100`);
    }
    if (node.incomingLinks.length > 0) {
      parts.push(`- Incoming links from: ${node.incomingLinks.map((l) => `"${l.sourceTitle}" (anchor: "${l.anchorText}")`).join(", ")}`);
    }
    if (node.outgoingLinks.length > 0) {
      parts.push(`- Should link to: ${node.outgoingLinks.map((l) => `"${l.targetTitle}" (anchor: "${l.anchorText}")`).join(", ")}`);
    }
    return parts.join("\n");
  }).join("\n\n");

  return `You are an expert SEO content strategist creating content briefs for a cluster about "${topic}".

${sharedContext}

## Nodes to Brief

${nodeDescriptions}

For each node, create a detailed content brief. Consider:
- What competitors cover (from SERP data above) — match their depth, find unique angles
- Real search volume data — prioritize high-volume secondary keywords
- The node's role in the cluster — pillar pages need comprehensive coverage, support pages should be focused
- Internal linking context — mention linked pages naturally in the content

Word count guidelines by role:
- pillar: 2500-4000 words
- sub-pillar: 1800-2500 words
- support/informational: 1200-1800 words
- comparison: 1500-2000 words
- list: 1500-2500 words

Return ONLY valid JSON (no markdown, no explanation) as an object keyed by slug:
{
  "slug-here": {
    "targetKeyword": "primary keyword",
    "secondaryKeywords": ["kw1", "kw2", "kw3"],
    "searchIntent": "informational|commercial|transactional|navigational",
    "wordCountMin": 1200,
    "wordCountMax": 1800,
    "outline": [
      { "heading": "H2 Heading Text", "level": "h2", "notes": "What to cover in this section" },
      { "heading": "H3 Sub-heading", "level": "h3", "notes": "Specific angle" }
    ],
    "keyPoints": [
      "Must cover X because competitors all mention it",
      "Include data/stats about Y",
      "Address common question Z"
    ],
    "competitorAngles": [
      "NYTimes focuses on expert reviews — differentiate with hands-on testing",
      "Wirecutter uses comparison tables — include one for scannability"
    ]
  }
}`;
}
