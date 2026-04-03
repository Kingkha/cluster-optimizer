"use client";

import { useState } from "react";
import { useProject } from "../layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ContentBriefRecord } from "@/lib/types";

const roleColors: Record<string, string> = {
  pillar: "bg-indigo-100 text-indigo-800",
  "sub-pillar": "bg-blue-100 text-blue-800",
  support: "bg-green-100 text-green-800",
  comparison: "bg-amber-100 text-amber-800",
  list: "bg-purple-100 text-purple-800",
  informational: "bg-gray-100 text-gray-800",
};

interface OutlineItem {
  heading: string;
  level: "h2" | "h3";
  notes?: string;
}

export default function BriefsPage() {
  const { project } = useProject();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!project?.briefs || project.briefs.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-12">
        No content briefs available yet.
      </p>
    );
  }

  // Map nodeId → node for easy lookup
  const nodeMap = new Map(project.nodes.map((n) => [n.id, n]));

  // Sort briefs by publish order
  const sortedBriefs = [...project.briefs].sort((a, b) => {
    const nodeA = nodeMap.get(a.nodeId);
    const nodeB = nodeMap.get(b.nodeId);
    return (nodeA?.publishOrder ?? 99) - (nodeB?.publishOrder ?? 99);
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">
          Content Briefs ({sortedBriefs.length})
        </h2>
        <p className="text-sm text-muted-foreground">
          Click a brief to expand
        </p>
      </div>

      <div className="space-y-3">
        {sortedBriefs.map((brief) => {
          const node = nodeMap.get(brief.nodeId);
          if (!node) return null;
          const isExpanded = expandedId === brief.id;

          return (
            <BriefCard
              key={brief.id}
              brief={brief}
              node={node}
              isExpanded={isExpanded}
              onToggle={() => setExpandedId(isExpanded ? null : brief.id)}
            />
          );
        })}
      </div>
    </div>
  );
}

function BriefCard({
  brief,
  node,
  isExpanded,
  onToggle,
}: {
  brief: ContentBriefRecord;
  node: { title: string; role: string; publishOrder: number; slug: string };
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const outline: OutlineItem[] = safeParseJSON(brief.outline, []);
  const keyPoints: string[] = safeParseJSON(brief.keyPoints, []);
  const secondaryKws: string[] = safeParseJSON(brief.secondaryKeywords, []);
  const competitorAngles: string[] = safeParseJSON(brief.competitorAngles, []);
  const internalLinks: { title: string; slug: string; anchorText: string }[] = safeParseJSON(brief.internalLinks, []);

  return (
    <Card
      className={`transition-all ${isExpanded ? "ring-1 ring-primary/20" : "hover:shadow-sm cursor-pointer"}`}
    >
      {/* Collapsed header — always visible */}
      <div
        className="flex items-center gap-3 px-6 py-4 cursor-pointer"
        onClick={onToggle}
      >
        <span className="text-sm font-medium text-muted-foreground w-6 tabular-nums">
          #{node.publishOrder}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{node.title}</span>
            <Badge variant="secondary" className={`text-xs shrink-0 ${roleColors[node.role] || ""}`}>
              {node.role}
            </Badge>
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
            <span>{brief.targetKeyword}</span>
            <span>{brief.wordCountMin}-{brief.wordCountMax} words</span>
            <span>{outline.length} sections</span>
          </div>
        </div>
        <span className="text-muted-foreground text-sm">
          {isExpanded ? "▾" : "▸"}
        </span>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <CardContent className="pt-0 pb-6 space-y-5 border-t">
          {/* Keywords */}
          <div className="pt-4">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Keywords
            </h4>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="default" className="text-xs">
                {brief.targetKeyword}
              </Badge>
              {secondaryKws.map((kw) => (
                <Badge key={kw} variant="outline" className="text-xs">
                  {kw}
                </Badge>
              ))}
            </div>
            <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
              <span>Intent: {brief.searchIntent}</span>
              <span>Target: {brief.wordCountMin}-{brief.wordCountMax} words</span>
            </div>
          </div>

          {/* Outline */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Article Outline
            </h4>
            <div className="rounded-lg border divide-y">
              {outline.map((item, i) => (
                <div
                  key={i}
                  className={`px-4 py-2.5 ${item.level === "h3" ? "pl-8" : ""}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">
                      {item.level}
                    </span>
                    <span className="text-sm font-medium">{item.heading}</span>
                  </div>
                  {item.notes && (
                    <p className="text-xs text-muted-foreground mt-0.5 ml-8">
                      {item.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Key Points */}
          {keyPoints.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Key Points to Cover
              </h4>
              <ul className="space-y-1.5">
                {keyPoints.map((point, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span className="text-muted-foreground shrink-0">-</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Internal Links */}
          {internalLinks.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Internal Links to Include
              </h4>
              <div className="space-y-1.5">
                {internalLinks.map((link, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">→</span>
                    <span className="font-medium">{link.title}</span>
                    <span className="text-xs text-muted-foreground">
                      (anchor: &ldquo;{link.anchorText}&rdquo;)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Competitor Angles */}
          {competitorAngles.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Competitor Insights
              </h4>
              <ul className="space-y-1.5">
                {competitorAngles.map((angle, i) => (
                  <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                    <span className="shrink-0">-</span>
                    <span>{angle}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

function safeParseJSON<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
