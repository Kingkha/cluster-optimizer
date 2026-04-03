import Anthropic from "@anthropic-ai/sdk";
import { extractJSON } from "./parse-response";
import type { RelatedKeyword } from "@/lib/data-sources/types";

export interface KeywordGroup {
  group: string;
  keywords: { keyword: string; volume: number; difficulty: number | null }[];
}

/**
 * Groups related keywords into subtopic clusters using Claude.
 * Fast call (~1-2s) with haiku-level complexity.
 */
export async function groupKeywordsBySubtopic(
  seedTopic: string,
  keywords: RelatedKeyword[]
): Promise<KeywordGroup[]> {
  if (keywords.length === 0) return [];

  const client = new Anthropic();

  const kwList = keywords
    .map((k) => {
      const diff = k.difficulty != null ? `, diff: ${k.difficulty}` : "";
      return `- "${k.keyword}" (vol: ${k.volume}${diff})`;
    })
    .join("\n");

  const prompt = `Given the seed topic "${seedTopic}", group these related keywords into 4-8 subtopic clusters. Each group should represent a distinct content angle or user intent.

Keywords:
${kwList}

Rules:
- Group name should be a short descriptive label (e.g. "Buying Guides", "How-To", "Comparisons", "Types & Categories")
- Every keyword must be assigned to exactly one group
- Sort groups by total search volume (highest first)
- Sort keywords within each group by volume (highest first)

Return ONLY valid JSON (no markdown, no explanation):
[
  {
    "group": "Group Name",
    "keywords": [
      { "keyword": "...", "volume": 1000, "difficulty": 45 }
    ]
  }
]`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  const result = extractJSON<KeywordGroup[]>(text);

  if (!Array.isArray(result) || result.length === 0) {
    // Fallback: return all keywords in one group
    return [{ group: "Related", keywords }];
  }

  return result;
}
