import type { SerpKeywordData, SerpResult, RelatedKeyword, DataSourceContext } from "./types";

export class DataForSEOClient {
  private authHeader: string;

  constructor(login: string, password: string) {
    this.authHeader = "Basic " + Buffer.from(`${login}:${password}`).toString("base64");
  }

  private async post<T>(endpoint: string, body: unknown[]): Promise<T> {
    const res = await fetch(`https://api.dataforseo.com${endpoint}`, {
      method: "POST",
      headers: {
        Authorization: this.authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`DataForSEO API error: ${res.status} ${res.statusText}`);
    }

    return res.json() as Promise<T>;
  }

  async getKeywordData(
    keywords: string[],
    locationCode = 2840, // US
    languageCode = "en"
  ): Promise<Map<string, SerpKeywordData>> {
    const result = new Map<string, SerpKeywordData>();

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = await this.post<any>("/v3/keywords_data/google_ads/search_volume/live", [
        { keywords, location_code: locationCode, language_code: languageCode },
      ]);

      const items = data?.tasks?.[0]?.result || [];
      for (const item of items) {
        // competition_index is numeric (0-100); competition is a string ("LOW"/"MEDIUM"/"HIGH")
        const compIndex = item.competition_index ?? null;
        const competition = typeof compIndex === "number" ? compIndex / 100 : null;
        result.set(item.keyword, {
          keyword: item.keyword,
          volume: item.search_volume ?? null,
          difficulty: null, // Not available from this endpoint
          cpc: item.cpc ?? null,
          competition,
          intent: null,
        });
      }
    } catch (e) {
      console.warn("DataForSEO keyword data failed:", e);
    }

    return result;
  }

  async getSerpResults(
    keyword: string,
    locationCode = 2840,
    languageCode = "en"
  ): Promise<{ results: SerpResult[]; features: string[] }> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = await this.post<any>("/v3/serp/google/organic/live/regular", [
        {
          keyword,
          location_code: locationCode,
          language_code: languageCode,
          depth: 10,
        },
      ]);

      const items = data?.tasks?.[0]?.result?.[0]?.items || [];
      const features: string[] = [];

      // Extract SERP features
      const itemTypes = new Set(items.map((i: { type: string }) => i.type));
      if (itemTypes.has("featured_snippet")) features.push("Featured Snippet");
      if (itemTypes.has("people_also_ask")) features.push("People Also Ask");
      if (itemTypes.has("local_pack")) features.push("Local Pack");
      if (itemTypes.has("knowledge_graph")) features.push("Knowledge Graph");
      if (itemTypes.has("video")) features.push("Video");
      if (itemTypes.has("images")) features.push("Images");

      const results: SerpResult[] = items
        .filter((i: { type: string }) => i.type === "organic")
        .slice(0, 10)
        .map((i: { rank_absolute: number; url: string; title: string; domain: string; description: string }) => ({
          position: i.rank_absolute,
          url: i.url,
          title: i.title || "",
          domain: i.domain || "",
          snippet: i.description || "",
        }));

      return { results, features };
    } catch (e) {
      console.warn("DataForSEO SERP results failed:", e);
      return { results: [], features: [] };
    }
  }

  async getKeywordDifficulty(
    keywords: string[],
    locationCode = 2840,
    languageCode = "en"
  ): Promise<Map<string, number>> {
    const result = new Map<string, number>();

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = await this.post<any>("/v3/dataforseo_labs/google/bulk_keyword_difficulty/live", [
        { keywords, location_code: locationCode, language_code: languageCode },
      ]);

      const items = data?.tasks?.[0]?.result?.[0]?.items || [];
      for (const item of items) {
        if (item.keyword && item.keyword_difficulty != null) {
          result.set(item.keyword, item.keyword_difficulty);
        }
      }
    } catch (e) {
      console.warn("DataForSEO keyword difficulty failed:", e);
    }

    return result;
  }

  /**
   * Get keyword suggestions — variations of the seed keyword with volume + difficulty
   * in a single call. Uses DataForSEO Labs endpoint which returns richer data than
   * the Google Ads keywords_for_keywords endpoint.
   */
  async getKeywordSuggestions(
    keyword: string,
    locationCode = 2840,
    languageCode = "en",
    limit = 50
  ): Promise<{ keyword: string; volume: number; difficulty: number | null; cpc: number | null }[]> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = await this.post<any>("/v3/dataforseo_labs/google/keyword_suggestions/live", [
        {
          keyword,
          location_code: locationCode,
          language_code: languageCode,
          limit,
          include_seed_keyword: true,
        },
      ]);

      const items = data?.tasks?.[0]?.result?.[0]?.items || [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return items
        .filter((i: { keyword_info?: { search_volume?: number } }) =>
          i.keyword_info?.search_volume != null && i.keyword_info.search_volume > 0
        )
        .map((i: {
          keyword: string;
          keyword_info: { search_volume: number; cpc: number | null };
          keyword_properties?: { keyword_difficulty?: number | null };
        }) => ({
          keyword: i.keyword,
          volume: i.keyword_info.search_volume,
          difficulty: i.keyword_properties?.keyword_difficulty ?? null,
          cpc: i.keyword_info.cpc ?? null,
        }));
    } catch (e) {
      console.warn("DataForSEO keyword suggestions failed:", e);
      return [];
    }
  }

  /**
   * Get related keywords from SERP "searches related to" data.
   * Returns keywords with volume + KD in one call.
   */
  async getRelatedKeywordsLabs(
    keyword: string,
    locationCode = 2840,
    languageCode = "en",
    limit = 50
  ): Promise<{ keyword: string; volume: number; difficulty: number | null; cpc: number | null }[]> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = await this.post<any>("/v3/dataforseo_labs/google/related_keywords/live", [
        {
          keyword,
          location_code: locationCode,
          language_code: languageCode,
          limit,
          depth: 2,
        },
      ]);

      const items = data?.tasks?.[0]?.result?.[0]?.items || [];
      return items
        .filter((i: { keyword_data?: { keyword_info?: { search_volume?: number } } }) =>
          i.keyword_data?.keyword_info?.search_volume != null &&
          i.keyword_data.keyword_info.search_volume > 0
        )
        .map((i: {
          keyword_data: {
            keyword: string;
            keyword_info: { search_volume: number; cpc: number | null };
            keyword_properties?: { keyword_difficulty?: number | null };
          };
        }) => ({
          keyword: i.keyword_data.keyword,
          volume: i.keyword_data.keyword_info.search_volume,
          difficulty: i.keyword_data.keyword_properties?.keyword_difficulty ?? null,
          cpc: i.keyword_data.keyword_info.cpc ?? null,
        }));
    } catch (e) {
      console.warn("DataForSEO related keywords (labs) failed:", e);
      return [];
    }
  }

  async getRelatedKeywords(
    keyword: string,
    locationCode = 2840,
    languageCode = "en"
  ): Promise<RelatedKeyword[]> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = await this.post<any>("/v3/keywords_data/google_ads/keywords_for_keywords/live", [
        {
          keywords: [keyword],
          location_code: locationCode,
          language_code: languageCode,
        },
      ]);

      const items = data?.tasks?.[0]?.result || [];
      return items
        .filter((i: { search_volume: number }) => i.search_volume > 0)
        .slice(0, 30)
        .map((i: { keyword: string; search_volume: number; competition: number | null }) => ({
          keyword: i.keyword,
          volume: i.search_volume,
          difficulty: i.competition != null ? Math.round(i.competition * 100) : null,
        }));
    } catch (e) {
      console.warn("DataForSEO related keywords failed:", e);
      return [];
    }
  }
}

// Labs endpoints only support certain location+language combos for "en"
export const LABS_ENGLISH_LOCATIONS = new Set([2840, 2826, 2124, 2036, 2356, 2702, 2608]);

export async function fetchSerpContext(
  topic: string,
  login: string,
  password: string,
  country?: string | null
): Promise<DataSourceContext> {
  const client = new DataForSEOClient(login, password);

  const locationCode = getLocationCode(country);
  const labsLocationCode = LABS_ENGLISH_LOCATIONS.has(locationCode) ? locationCode : 2840;

  // SERP + keyword suggestions in parallel (~$0.06 total)
  // keyword_suggestions returns seed data + related keywords + KD in one call
  const [serpResults, suggestions] = await Promise.all([
    client.getSerpResults(topic, locationCode),
    client.getKeywordSuggestions(topic, labsLocationCode, "en", 50),
  ]);

  // Extract seed keyword data from suggestions
  const topicLower = topic.toLowerCase();
  const seedFromSuggestions = suggestions.find((s) => s.keyword.toLowerCase() === topicLower);

  let seedKeyword: SerpKeywordData | null = null;
  if (seedFromSuggestions && seedFromSuggestions.volume > 0) {
    seedKeyword = {
      keyword: topic,
      volume: seedFromSuggestions.volume,
      difficulty: seedFromSuggestions.difficulty,
      cpc: seedFromSuggestions.cpc,
      competition: null,
      intent: null,
    };
  }

  // Convert suggestions to RelatedKeyword format (exclude seed)
  let relatedKeywords: RelatedKeyword[] = suggestions
    .filter((s) => s.keyword.toLowerCase() !== topicLower && s.volume > 0)
    .map((s) => ({ keyword: s.keyword, volume: s.volume, difficulty: s.difficulty }));

  // Fallback: if suggestions returned no seed data or <3 related keywords,
  // call Google Ads endpoints (~$0.05-0.10 extra, only for niche keywords)
  if (!seedKeyword || relatedKeywords.length < 3) {
    const [adsData, adsKeywords] = await Promise.all([
      !seedKeyword ? client.getKeywordData([topic], locationCode) : Promise.resolve(null),
      relatedKeywords.length < 3 ? client.getRelatedKeywords(topic, locationCode) : Promise.resolve(null),
    ]);

    if (!seedKeyword && adsData) {
      const adsSeed = adsData.get(topic);
      if (adsSeed) {
        seedKeyword = adsSeed;
      }
    }

    if (adsKeywords && adsKeywords.length > relatedKeywords.length) {
      relatedKeywords = adsKeywords;
    }
  }

  return {
    seedKeyword,
    relatedKeywords,
    topCompetitors: serpResults.results,
    serpFeatures: serpResults.features,
  };
}

export function getLocationCode(country?: string | null): number {
  if (!country) return 2840; // US default
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
  };
  return map[country.toLowerCase()] || 2840;
}
