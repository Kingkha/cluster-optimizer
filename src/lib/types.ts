export type ProjectStatus = "pending" | "generating" | "enriching" | "ready" | "error";

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
