import Anthropic from "@anthropic-ai/sdk";
import { clusterGenerationPrompt } from "./prompts";
import { extractJSON } from "./parse-response";
import type { DataSourceContext, CrawledPageData } from "@/lib/data-sources/types";
import type { KeywordGroup } from "./group-keywords";

interface GeneratedNode {
  title: string;
  slug: string;
  role: string;
  parentSlug: string | null;
  groupName: string;
  targetKeyword: string;
  searchIntent: string;
}

interface GeneratedLink {
  sourceSlug: string;
  targetSlug: string;
  anchorText: string;
  context: string;
  linkType: string;
}

interface ClusterResult {
  nodes: GeneratedNode[];
  links: GeneratedLink[];
}

export async function generateClusterStructure(params: {
  topic: string;
  country?: string | null;
  language?: string | null;
  niche?: string | null;
  domain?: string | null;
  serpContext?: DataSourceContext | null;
  crawledPages?: CrawledPageData[] | null;
  keywordGroups?: KeywordGroup[] | null;
}): Promise<ClusterResult> {
  const client = new Anthropic();

  const prompt = clusterGenerationPrompt(params);

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  const result = extractJSON<ClusterResult>(text);

  // Validate basic structure
  if (!Array.isArray(result.nodes) || result.nodes.length === 0) {
    throw new Error("AI returned empty or invalid nodes array");
  }
  if (!Array.isArray(result.links)) {
    result.links = [];
  }

  // Ensure exactly one pillar
  const pillars = result.nodes.filter((n) => n.role === "pillar");
  if (pillars.length === 0) {
    result.nodes[0].role = "pillar";
    result.nodes[0].parentSlug = null;
  }

  return result;
}
