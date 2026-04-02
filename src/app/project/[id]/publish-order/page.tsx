"use client";

import { useProject } from "../layout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const roleColors: Record<string, string> = {
  pillar: "bg-indigo-100 text-indigo-800",
  "sub-pillar": "bg-blue-100 text-blue-800",
  support: "bg-green-100 text-green-800",
  comparison: "bg-amber-100 text-amber-800",
  list: "bg-purple-100 text-purple-800",
  informational: "bg-gray-100 text-gray-800",
};

export default function PublishOrderPage() {
  const { project } = useProject();

  if (!project || project.nodes.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-12">
        No cluster data yet.
      </p>
    );
  }

  const sorted = [...project.nodes].sort(
    (a, b) => b.priorityScore - a.priorityScore
  );

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">
        Publish Order ({sorted.length} pages)
      </h2>
      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="w-28">Role</TableHead>
              <TableHead className="w-20 text-right">Priority</TableHead>
              <TableHead className="w-20 text-right">Central.</TableHead>
              <TableHead className="w-20 text-right">Support</TableHead>
              <TableHead className="w-20 text-right">Opport.</TableHead>
              <TableHead className="w-20 text-right">Ease</TableHead>
              <TableHead className="w-20 text-right">SERP</TableHead>
              <TableHead>Keyword</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((node, i) => (
              <TableRow key={node.id}>
                <TableCell className="font-medium">{i + 1}</TableCell>
                <TableCell>
                  <div className="font-medium text-sm">{node.title}</div>
                  <div className="text-xs text-muted-foreground">
                    /{node.slug}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={`text-xs ${roleColors[node.role] || ""}`}
                  >
                    {node.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {node.priorityScore}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {node.centrality}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {node.supportValue}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {node.opportunity}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {node.ease}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {node.serpClarity}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {node.targetKeyword || "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
