"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ProjectSummary {
  id: string;
  topic: string;
  country: string | null;
  niche: string | null;
  status: string;
  createdAt: string;
  _count: { nodes: number; links: number; missingNodes: number };
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  generating: "bg-blue-100 text-blue-800",
  enriching: "bg-purple-100 text-purple-800",
  ready: "bg-green-100 text-green-800",
  error: "bg-red-100 text-red-800",
};

export default function Dashboard() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => {
        if (!r.ok) return [];
        return r.json();
      })
      .then((data) => setProjects(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">Loading...</div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <h2 className="text-2xl font-semibold">No clusters yet</h2>
        <p className="text-muted-foreground">
          Create your first content cluster to get started.
        </p>
        <Link href="/new">
          <Button size="lg">Create Cluster</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Your Clusters</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <Link key={p.id} href={`/project/${p.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base line-clamp-1">
                    {p.topic}
                  </CardTitle>
                  <Badge
                    variant="secondary"
                    className={statusColors[p.status] || ""}
                  >
                    {p.status}
                  </Badge>
                </div>
                <CardDescription>
                  {[p.country, p.niche].filter(Boolean).join(" · ") ||
                    "No details"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>{p._count.nodes} pages</span>
                  <span>{p._count.links} links</span>
                  <span>{p._count.missingNodes} gaps</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(p.createdAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
