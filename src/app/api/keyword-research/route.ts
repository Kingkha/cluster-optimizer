import { NextRequest, NextResponse } from "next/server";
import { devAuth } from "@/lib/dev-auth";
import { DataForSEOClient } from "@/lib/data-sources/dataforseo";

function getLocationCode(country?: string | null): number {
  if (!country) return 2840;
  const map: Record<string, number> = {
    us: 2840, "united states": 2840,
    uk: 2826, "united kingdom": 2826, gb: 2826,
    canada: 2124, ca: 2124,
    australia: 2036, au: 2036,
    germany: 2276, de: 2276,
    france: 2250, fr: 2250,
    japan: 2392, jp: 2392,
    india: 2356, in: 2356,
    brazil: 2076, br: 2076,
    spain: 2724, es: 2724,
    italy: 2380, it: 2380,
    netherlands: 2528, nl: 2528,
    mexico: 2484, mx: 2484,
    singapore: 2702, sg: 2702,
    thailand: 2764, th: 2764,
    vietnam: 2704, vn: 2704,
    indonesia: 2360, id: 2360,
    philippines: 2608, ph: 2608,
    norway: 2578, no: 2578,
  };
  return map[country.toLowerCase()] || 2840;
}

// DataForSEO Labs endpoints only support certain location+language combos.
// For locations without English support, fall back to US.
const LABS_ENGLISH_LOCATIONS = new Set([2840, 2826, 2124, 2036, 2356, 2702, 2608]);

interface KeywordResult {
  keyword: string;
  volume: number;
  difficulty: number | null;
  cpc: number | null;
}

export async function POST(req: NextRequest) {
  const session = await devAuth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { keyword, country } = await req.json();

  if (!keyword || typeof keyword !== "string") {
    return NextResponse.json({ error: "keyword is required" }, { status: 400 });
  }

  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;

  if (!login || !password) {
    return NextResponse.json(
      { error: "DataForSEO credentials not configured" },
      { status: 500 }
    );
  }

  const client = new DataForSEOClient(login, password);
  const rawLocationCode = getLocationCode(country);
  // Labs endpoints need a location that supports "en" — fall back to US
  const labsLocationCode = LABS_ENGLISH_LOCATIONS.has(rawLocationCode) ? rawLocationCode : 2840;
  const adsLocationCode = rawLocationCode;

  const seedLower = keyword.toLowerCase().trim();
  const seedWords = significantWords(seedLower);
  const MIN_RESULTS = 5;

  const seen = new Set<string>();
  const all: (KeywordResult & { isSeed: boolean })[] = [];

  function addResults(results: KeywordResult[]) {
    for (const r of results) {
      const lower = r.keyword.toLowerCase();
      if (seen.has(lower)) {
        // Update existing entry with difficulty if we didn't have it
        if (r.difficulty != null) {
          const existing = all.find((a) => a.keyword.toLowerCase() === lower);
          if (existing && existing.difficulty == null) {
            existing.difficulty = r.difficulty;
          }
        }
        continue;
      }
      if (!isRelevant(seedWords, lower)) continue;
      if (r.volume < 10) continue;
      seen.add(lower);
      all.push({ ...r, isSeed: lower === seedLower });
    }
  }

  // Cascading fallback: stop as soon as we have enough results

  // 1. Keyword suggestions — cheapest (~$0.01), best quality
  const suggestions = await client.getKeywordSuggestions(keyword, labsLocationCode, "en", 30);
  addResults(suggestions);

  // 2. Related keywords from SERP — cheap (~$0.01)
  if (all.length < MIN_RESULTS) {
    const related = await client.getRelatedKeywordsLabs(keyword, labsLocationCode, "en", 30);
    addResults(related);
  }

  // 3. Google Ads keywords — most expensive (~$0.075) but broadest, works for niche terms
  if (all.length < MIN_RESULTS) {
    const [adsKeywords, seedData] = await Promise.all([
      client.getRelatedKeywords(keyword, adsLocationCode, "en"),
      client.getKeywordData([keyword], adsLocationCode, "en"),
    ]);

    // Add seed keyword
    const seed = seedData.get(keyword);
    if (seed && seed.volume != null && !seen.has(seedLower)) {
      seen.add(seedLower);
      all.push({ keyword: seed.keyword, volume: seed.volume, difficulty: null, cpc: seed.cpc, isSeed: true });
    }

    addResults(
      adsKeywords.map((k) => ({
        keyword: k.keyword,
        volume: k.volume,
        difficulty: k.difficulty,
        cpc: null,
      }))
    );
  }

  // Backfill KD for candidates missing it (cheap ~$0.01)
  const needDifficulty = all.filter((a) => a.difficulty == null).slice(0, 30);
  if (needDifficulty.length > 0) {
    try {
      const diffMap = await client.getKeywordDifficulty(
        needDifficulty.map((a) => a.keyword),
        labsLocationCode,
        "en"
      );
      for (const a of all) {
        if (a.difficulty == null && diffMap.has(a.keyword)) {
          a.difficulty = diffMap.get(a.keyword)!;
        }
      }
    } catch {
      // Not critical — opportunity score will use default
    }
  }

  // Score and sort
  interface Candidate {
    keyword: string;
    volume: number;
    difficulty: number | null;
    cpc: number | null;
    opportunityScore: number;
    isSeed: boolean;
  }

  const candidates: Candidate[] = all.map((a) => ({
    ...a,
    opportunityScore: computeOpportunity(a.volume, a.difficulty),
  }));

  candidates.sort((a, b) => b.opportunityScore - a.opportunityScore);

  const seedCandidate = candidates.find((c) => c.isSeed);

  return NextResponse.json({
    seed: seedCandidate
      ? { keyword: seedCandidate.keyword, volume: seedCandidate.volume, difficulty: seedCandidate.difficulty, cpc: seedCandidate.cpc }
      : null,
    suggestions: candidates.slice(0, 20),
  });
}

function computeOpportunity(volume: number, difficulty: number | null): number {
  const diff = difficulty ?? 50;
  return Math.round(volume * Math.pow(1 - diff / 100, 2));
}

const STOP_WORDS = new Set([
  "a", "an", "the", "in", "on", "at", "to", "for", "of", "and", "or",
  "is", "are", "was", "were", "be", "been", "do", "does", "did",
  "how", "what", "where", "when", "why", "which", "who",
  "best", "top", "most", "vs", "with", "from", "by", "about",
]);

function significantWords(text: string): Set<string> {
  return new Set(
    text.split(/\s+/).filter((w) => w.length > 1 && !STOP_WORDS.has(w))
  );
}

function isRelevant(seedWords: Set<string>, candidate: string): boolean {
  const words = candidate.split(/\s+/);
  for (const w of words) {
    if (w.length > 1 && seedWords.has(w)) return true;
  }
  return false;
}
