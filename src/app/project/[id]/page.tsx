"use client";

import { useProject } from "./layout";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { NodeEditor } from "@/components/node-editor";
import type { ClusterNodeData } from "@/lib/types";

const roleColors: Record<string, string> = {
  pillar: "bg-indigo-100 text-indigo-800",
  "sub-pillar": "bg-blue-100 text-blue-800",
  support: "bg-green-100 text-green-800",
  comparison: "bg-amber-100 text-amber-800",
  list: "bg-purple-100 text-purple-800",
  informational: "bg-gray-100 text-gray-800",
};

function buildTree(nodes: ClusterNodeData[]): (ClusterNodeData & { children: ClusterNodeData[] })[] {
  const map = new Map<string, ClusterNodeData & { children: ClusterNodeData[] }>();
  const roots: (ClusterNodeData & { children: ClusterNodeData[] })[] = [];

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

function TreeNode({
  node,
  depth,
  onEdit,
}: {
  node: ClusterNodeData & { children: ClusterNodeData[] };
  depth: number;
  onEdit: (node: ClusterNodeData) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className={depth > 0 ? "ml-6 border-l pl-4" : ""}>
      <div
        className="flex items-center gap-2 py-2 px-3 rounded-md hover:bg-muted/50 cursor-pointer group"
        onClick={() => onEdit(node)}
      >
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="text-muted-foreground hover:text-foreground w-5 h-5 flex items-center justify-center"
          >
            {expanded ? "▾" : "▸"}
          </button>
        )}
        {!hasChildren && <span className="w-5" />}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{node.title}</span>
            <Badge variant="secondary" className={`text-xs ${roleColors[node.role] || ""}`}>
              {node.role}
            </Badge>
            {node.priorityScore > 0 && (
              <span className="text-xs text-muted-foreground">
                Score: {node.priorityScore}
              </span>
            )}
          </div>
          {node.targetKeyword && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {node.targetKeyword}
            </p>
          )}
        </div>

        <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100">
          Edit
        </span>
      </div>

      {expanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child as ClusterNodeData & { children: ClusterNodeData[] }}
              depth={depth + 1}
              onEdit={onEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ClusterMapPage() {
  const { project, refresh } = useProject();
  const [editingNode, setEditingNode] = useState<ClusterNodeData | null>(null);

  if (!project || project.nodes.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-12">
        No cluster data yet.
      </p>
    );
  }

  const tree = buildTree(project.nodes);

  // Group by groupName for a secondary view
  const groups = new Map<string, ClusterNodeData[]>();
  for (const node of project.nodes) {
    const group = node.groupName || "Ungrouped";
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group)!.push(node);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">
          Cluster Map ({project.nodes.length} pages)
        </h2>
        <div className="flex gap-2 flex-wrap">
          {Object.entries(roleColors).map(([role, color]) => {
            const count = project.nodes.filter((n) => n.role === role).length;
            if (count === 0) return null;
            return (
              <Badge key={role} variant="secondary" className={`text-xs ${color}`}>
                {role} ({count})
              </Badge>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4">
        {tree.map((node) => (
          <TreeNode
            key={node.id}
            node={node}
            depth={0}
            onEdit={setEditingNode}
          />
        ))}
      </div>

      {/* Group summary */}
      <h3 className="text-base font-semibold mt-8 mb-3">By Topic Group</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from(groups.entries()).map(([group, nodes]) => (
          <div key={group} className="rounded-lg border bg-card p-3">
            <h4 className="font-medium text-sm mb-2">{group}</h4>
            <ul className="space-y-1">
              {nodes.map((n) => (
                <li
                  key={n.id}
                  className="text-xs text-muted-foreground flex items-center gap-1"
                >
                  <Badge
                    variant="secondary"
                    className={`text-[10px] px-1 py-0 ${roleColors[n.role] || ""}`}
                  >
                    {n.role}
                  </Badge>
                  <span className="truncate">{n.title}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {editingNode && (
        <NodeEditor
          node={editingNode}
          allNodes={project.nodes}
          onClose={() => setEditingNode(null)}
          onSaved={() => {
            setEditingNode(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}
