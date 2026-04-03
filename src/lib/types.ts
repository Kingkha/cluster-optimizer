export type ProjectStatus = "pending" | "fetching-data" | "generating" | "enriching" | "ready" | "error";

export type NodeRole = "pillar" | "sub-pillar" | "support" | "comparison" | "list" | "informational";

export type SearchIntent = "informational" | "commercial" | "transactional" | "navigational";

export type LinkType = "contextual" | "navigational" | "related-reading";

export interface ProjectWithRelations {
  id: string;
  topic: string;
  country: string | null;
  language: string | null;
  domain: string | null;
  niche: string | null;
  status: string;
  errorMsg: string | null;
  createdAt: string;
  updatedAt: string;
  nodes: ClusterNodeData[];
  links: LinkSuggestionData[];
  missingNodes: MissingNodeData[];
  crawledPages?: CrawledPageRecord[];
  gscQueries?: GscQueryRecord[];
  serpData?: SerpDataRecord[];
}

export interface CrawledPageRecord {
  id: string;
  url: string;
  path: string;
  title: string | null;
  h1: string | null;
  wordCount: number | null;
  matchedNodeId: string | null;
}

export interface GscQueryRecord {
  id: string;
  query: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
}

export interface SerpDataRecord {
  id: string;
  keyword: string;
  volume: number | null;
  difficulty: number | null;
  cpc: number | null;
  competition: number | null;
  intent: string | null;
  serpFeatures: string | null; // JSON string
  topResults: string | null; // JSON string
  fetchedAt: string;
}

export interface ClusterNodeData {
  id: string;
  projectId: string;
  title: string;
  slug: string;
  role: string;
  groupName: string | null;
  parentId: string | null;
  sortOrder: number;
  priorityScore: number;
  publishOrder: number;
  centrality: number;
  supportValue: number;
  opportunity: number;
  ease: number;
  serpClarity: number;
  targetKeyword: string | null;
  searchIntent: string | null;
  notes: string | null;
  realVolume: number | null;
  realDifficulty: number | null;
  realCpc: number | null;
  dataSource: string | null;
  children?: ClusterNodeData[];
}

export interface LinkSuggestionData {
  id: string;
  projectId: string;
  sourceId: string;
  targetId: string;
  anchorText: string;
  context: string | null;
  linkType: string;
  source?: { title: string; slug: string };
  target?: { title: string; slug: string };
}

export interface MissingNodeData {
  id: string;
  projectId: string;
  suggestedTitle: string;
  suggestedRole: string;
  reason: string;
  confidenceScore: number;
  parentNodeId: string | null;
}
