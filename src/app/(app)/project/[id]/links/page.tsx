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
import { Button } from "@/components/ui/button";

export default function LinksPage() {
  const { project, refresh } = useProject();

  if (!project || project.links.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-12">
        No link suggestions yet.
      </p>
    );
  }

  async function deleteLink(linkId: string) {
    await fetch(`/api/links/${linkId}`, { method: "DELETE" });
    refresh();
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">
        Internal Link Plan ({project.links.length} links)
      </h2>
      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source Page</TableHead>
              <TableHead>Target Page</TableHead>
              <TableHead>Anchor Text</TableHead>
              <TableHead className="w-28">Type</TableHead>
              <TableHead>Context</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {project.links.map((link) => (
              <TableRow key={link.id}>
                <TableCell className="font-medium text-sm">
                  {link.source?.title || link.sourceId}
                </TableCell>
                <TableCell className="text-sm">
                  {link.target?.title || link.targetId}
                </TableCell>
                <TableCell className="text-sm text-blue-600">
                  {link.anchorText}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {link.linkType}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                  {link.context || "-"}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => deleteLink(link.id)}
                  >
                    Remove
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
