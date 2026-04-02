export function extractJSON<T>(text: string): T {
  // Try direct parse first
  try {
    return JSON.parse(text) as T;
  } catch {
    // Try extracting from markdown code fences
    const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (fenceMatch) {
      return JSON.parse(fenceMatch[1]) as T;
    }

    // Try finding first { to last }
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1) {
      return JSON.parse(text.slice(firstBrace, lastBrace + 1)) as T;
    }

    throw new Error("Could not extract JSON from AI response");
  }
}
