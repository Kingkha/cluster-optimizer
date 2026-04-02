import type { ProjectWithRelations, ClusterNodeData } from "./types";

function buildTree(nodes: ClusterNodeData[]): ClusterNodeData[] {
  const map = new Map<string, ClusterNodeData & { children: ClusterNodeData[] }>();
  const roots: ClusterNodeData[] = [];

  for (const node of nodes) {
    map.set(node.id, { ...node, children: [] });
  }

  for (const node of nodes) {
    const mapped = map.get(node.id)!;
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.children.push(mapped);
    } else {
      roots.push(mapped);
    }
  }

  return roots;
}

function renderTreeMarkdown(nodes: ClusterNodeData[], indent = 0): string {
  let md = "";
  for (const node of nodes) {
    const prefix = "  ".repeat(indent) + "-";
    md += `${prefix} **${node.title}** (${node.role}) — Priority: ${node.priorityScore}\n`;
    if (node.children && node.children.length > 0) {
      md += renderTreeMarkdown(node.children, indent + 1);
    }
  }
  return md;
}

export function exportMarkdown(project: ProjectWithRelations): string {
  const lines: string[] = [];
  lines.push(`# Cluster: ${project.topic}\n`);

  if (project.country) lines.push(`**Country:** ${project.country}`);
  if (project.niche) lines.push(`**Niche:** ${project.niche}`);
  lines.push("");

  // Cluster Map
  lines.push("## Cluster Map\n");
  const tree = buildTree(project.nodes);
  lines.push(renderTreeMarkdown(tree));

  // Publish Order
  lines.push("## Publish Order\n");
  lines.push("| # | Title | Role | Priority | Keyword |");
  lines.push("|---|-------|------|----------|---------|");
  const sorted = [...project.nodes].sort((a, b) => b.priorityScore - a.priorityScore);
  sorted.forEach((node, i) => {
    lines.push(
      `| ${i + 1} | ${node.title} | ${node.role} | ${node.priorityScore} | ${node.targetKeyword || "-"} |`
    );
  });
  lines.push("");

  // Internal Links
  lines.push("## Internal Link Plan\n");
  lines.push("| Source | Target | Anchor Text | Type |");
  lines.push("|--------|--------|-------------|------|");
  for (const link of project.links) {
    const src = link.source?.title || link.sourceId;
    const tgt = link.target?.title || link.targetId;
    lines.push(`| ${src} | ${tgt} | ${link.anchorText} | ${link.linkType} |`);
  }
  lines.push("");

  // Missing Nodes
  if (project.missingNodes.length > 0) {
    lines.push("## Missing Nodes\n");
    for (const mn of project.missingNodes) {
      lines.push(
        `- **${mn.suggestedTitle}** (${mn.suggestedRole}) — ${mn.reason} (confidence: ${Math.round(mn.confidenceScore * 100)}%)`
      );
    }
    lines.push("");
  }

  return lines.join("\n");
}

export function exportCSV(project: ProjectWithRelations): string {
  const headers = [
    "title",
    "slug",
    "role",
    "priority_score",
    "publish_order",
    "centrality",
    "support_value",
    "opportunity",
    "ease",
    "serp_clarity",
    "target_keyword",
    "search_intent",
    "parent_id",
  ];

  const rows = project.nodes.map((n) =>
    [
      `"${n.title}"`,
      n.slug,
      n.role,
      n.priorityScore,
      n.publishOrder,
      n.centrality,
      n.supportValue,
      n.opportunity,
      n.ease,
      n.serpClarity,
      n.targetKeyword || "",
      n.searchIntent || "",
      n.parentId || "",
    ].join(",")
  );

  return [headers.join(","), ...rows].join("\n");
}
