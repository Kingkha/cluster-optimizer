"use client";

import { useProject } from "../layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const roleColors: Record<string, string> = {
  pillar: "bg-indigo-100 text-indigo-800",
  "sub-pillar": "bg-blue-100 text-blue-800",
  support: "bg-green-100 text-green-800",
  comparison: "bg-amber-100 text-amber-800",
  list: "bg-purple-100 text-purple-800",
  informational: "bg-gray-100 text-gray-800",
};

export default function MissingNodesPage() {
  const { project, refresh } = useProject();

  if (!project || project.missingNodes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No missing nodes detected.</p>
        <p className="text-sm text-muted-foreground mt-1">
          Your cluster looks comprehensive!
        </p>
      </div>
    );
  }

  async function addToCluster(mn: {
    id: string;
    suggestedTitle: string;
    suggestedRole: string;
    parentNodeId: string | null;
  }) {
    await fetch("/api/nodes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: project!.id,
        title: mn.suggestedTitle,
        role: mn.suggestedRole,
        parentId: mn.parentNodeId,
      }),
    });
    refresh();
  }

  const parentMap = new Map(
    project.nodes.map((n) => [n.id, n.title])
  );

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">
        Missing Nodes ({project.missingNodes.length} gaps)
      </h2>
      <div className="grid gap-3">
        {project.missingNodes.map((mn) => (
          <Card key={mn.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">
                      {mn.suggestedTitle}
                    </span>
                    <Badge
                      variant="secondary"
                      className={`text-xs ${roleColors[mn.suggestedRole] || ""}`}
                    >
                      {mn.suggestedRole}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(mn.confidenceScore * 100)}% confidence
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{mn.reason}</p>
                  {mn.parentNodeId && parentMap.has(mn.parentNodeId) && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Attaches to: {parentMap.get(mn.parentNodeId)}
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addToCluster(mn)}
                >
                  Add to Cluster
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
