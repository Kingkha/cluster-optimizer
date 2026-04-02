import Anthropic from "@anthropic-ai/sdk";
import { scoringPrompt } from "./prompts";
import { extractJSON } from "./parse-response";

interface ScoreData {
  centrality: number;
  supportValue: number;
  opportunity: number;
  ease: number;
  serpClarity: number;
}

interface MissingNodeData {
  suggestedTitle: string;
  suggestedRole: string;
  reason: string;
  confidenceScore: number;
  parentSlug: string;
}

interface EnrichmentResult {
  scores: Record<string, ScoreData>;
  missingNodes: MissingNodeData[];
}

export async function scoreAndEnrich(
  topic: string,
  nodes: { title: string; slug: string; role: string; parentSlug: string | null }[],
  realKeywordData?: Map<string, { volume: number; difficulty: number | null }> | null,
  gscData?: { query: string; impressions: number; clicks: number; position: number }[] | null
): Promise<EnrichmentResult> {
  const client = new Anthropic();

  const nodesJson = JSON.stringify(
    nodes.map((n) => ({ title: n.title, slug: n.slug, role: n.role, parentSlug: n.parentSlug })),
    null,
    2
  );

  const prompt = scoringPrompt(topic, nodesJson, realKeywordData, gscData);

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  const result = extractJSON<EnrichmentResult>(text);

  if (!result.scores || typeof result.scores !== "object") {
    result.scores = {};
  }
  if (!Array.isArray(result.missingNodes)) {
    result.missingNodes = [];
  }

  return result;
}
