"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface GscQuery {
  id: string;
  query: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
}

function positionColor(pos: number): string {
  if (pos <= 3) return "text-green-600 font-semibold";
  if (pos <= 10) return "text-yellow-600";
  if (pos <= 20) return "text-orange-600";
  return "text-red-600";
}

export default function GscPage() {
  const { id } = useParams<{ id: string }>();
  const [queries, setQueries] = useState<GscQuery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setQueries(data.gscQueries || []);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <p className="text-muted-foreground">Loading...</p>;

  if (queries.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No GSC data available.</p>
        <p className="text-sm text-muted-foreground mt-1">
          Connect Google Search Console in Settings to see real performance data.
        </p>
      </div>
    );
  }

  const sorted = [...queries].sort((a, b) => b.impressions - a.impressions);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">
        Search Performance ({queries.length} queries)
      </h2>
      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Query</TableHead>
              <TableHead className="w-28 text-right">Impressions</TableHead>
              <TableHead className="w-20 text-right">Clicks</TableHead>
              <TableHead className="w-20 text-right">CTR</TableHead>
              <TableHead className="w-20 text-right">Position</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((q) => (
              <TableRow key={q.id}>
                <TableCell className="font-medium text-sm">{q.query}</TableCell>
                <TableCell className="text-right">
                  {q.impressions.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  {q.clicks.toLocaleString()}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {(q.ctr * 100).toFixed(1)}%
                </TableCell>
                <TableCell className={`text-right ${positionColor(q.position)}`}>
                  {q.position.toFixed(1)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
