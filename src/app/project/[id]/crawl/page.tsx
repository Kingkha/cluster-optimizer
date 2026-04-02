"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface CrawledPage {
  id: string;
  url: string;
  path: string;
  title: string | null;
  h1: string | null;
  wordCount: number | null;
  matchedNodeId: string | null;
}

export default function CrawlPage() {
  const { id } = useParams<{ id: string }>();
  const [pages, setPages] = useState<CrawledPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [crawling, setCrawling] = useState(false);

  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setPages(data.crawledPages || []);
        setLoading(false);
      });
  }, [id]);

  async function triggerCrawl() {
    setCrawling(true);
    const res = await fetch(`/api/projects/${id}/crawl`, { method: "POST" });
    if (res.ok) {
      // Refresh data
      const data = await fetch(`/api/projects/${id}`).then((r) => r.json());
      setPages(data.crawledPages || []);
    }
    setCrawling(false);
  }

  if (loading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">
          Site Audit ({pages.length} pages)
        </h2>
        <Button variant="outline" size="sm" onClick={triggerCrawl} disabled={crawling}>
          {crawling ? "Crawling..." : "Re-crawl Site"}
        </Button>
      </div>

      {pages.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No crawled pages yet.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Add a domain to your project and crawl it to see existing content.
          </p>
          <Button className="mt-4" onClick={triggerCrawl} disabled={crawling}>
            {crawling ? "Crawling..." : "Crawl Site"}
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Path</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>H1</TableHead>
                <TableHead className="w-20 text-right">Words</TableHead>
                <TableHead className="w-28">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pages.map((page) => (
                <TableRow key={page.id}>
                  <TableCell className="font-mono text-xs">
                    {page.path}
                  </TableCell>
                  <TableCell className="text-sm max-w-xs truncate">
                    {page.title || "-"}
                  </TableCell>
                  <TableCell className="text-sm max-w-xs truncate text-muted-foreground">
                    {page.h1 || "-"}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {page.wordCount || "-"}
                  </TableCell>
                  <TableCell>
                    {page.matchedNodeId ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                        Matched
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        Unmatched
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
