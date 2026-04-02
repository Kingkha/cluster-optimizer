export interface SerpKeywordData {
  keyword: string;
  volume: number | null;
  difficulty: number | null;
  cpc: number | null;
  competition: number | null;
  intent: string | null;
}

export interface SerpResult {
  position: number;
  url: string;
  title: string;
  domain: string;
  snippet: string;
}

export interface RelatedKeyword {
  keyword: string;
  volume: number;
  difficulty: number | null;
}

export interface DataSourceContext {
  seedKeyword: SerpKeywordData | null;
  relatedKeywords: RelatedKeyword[];
  topCompetitors: SerpResult[];
  serpFeatures: string[];
}

export interface CrawledPageData {
  url: string;
  path: string;
  title: string | null;
  metaDescription: string | null;
  h1: string | null;
  headings: string[];
  wordCount: number;
}
