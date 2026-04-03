"use client";

import { useProject } from "../layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface SerpResult {
  position: number;
  url: string;
  title: string;
  domain: string;
  snippet: string;
}

export default function SerpAnalysisPage() {
  const { project } = useProject();

  if (!project?.serpData || project.serpData.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-12">
        No SERP data available. SERP analysis requires DataForSEO credentials.
      </p>
    );
  }

  const serp = project.serpData[0];
  const topResults: SerpResult[] = serp.topResults
    ? JSON.parse(serp.topResults)
    : [];
  const serpFeatures: string[] = serp.serpFeatures
    ? JSON.parse(serp.serpFeatures)
    : [];

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">
        SERP Analysis: &ldquo;{serp.keyword}&rdquo;
      </h2>

      {/* Keyword metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Search Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">
              {serp.volume != null ? serp.volume.toLocaleString() : "N/A"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">monthly searches</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Keyword Difficulty
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold tabular-nums ${
                serp.difficulty == null
                  ? ""
                  : serp.difficulty < 30
                  ? "text-green-600"
                  : serp.difficulty < 60
                  ? "text-yellow-600"
                  : "text-red-600"
              }`}
            >
              {serp.difficulty != null ? serp.difficulty.toFixed(0) : "N/A"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">out of 100</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              CPC
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">
              {serp.cpc != null ? `$${serp.cpc.toFixed(2)}` : "N/A"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">cost per click</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Competition
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">
              {serp.competition != null
                ? (serp.competition * 100).toFixed(0) + "%"
                : "N/A"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">advertiser competition</p>
          </CardContent>
        </Card>
      </div>

      {/* SERP Features */}
      {serpFeatures.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">SERP Features Present</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {serpFeatures.map((feature) => (
                <Badge key={feature} variant="secondary" className="text-sm">
                  {feature}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top 10 Competitors */}
      {topResults.length > 0 && (
        <div>
          <h3 className="text-base font-semibold mb-3">
            Top {topResults.length} Organic Results
          </h3>
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Page</TableHead>
                  <TableHead className="w-48">Domain</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topResults.map((result) => (
                  <TableRow key={result.position}>
                    <TableCell className="font-semibold tabular-nums">
                      {result.position}
                    </TableCell>
                    <TableCell>
                      <div>
                        <a
                          href={result.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-sm text-primary hover:underline"
                        >
                          {result.title}
                        </a>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {result.snippet}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {result.domain}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Data fetched{" "}
        {new Date(serp.fetchedAt).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
        {" "}via DataForSEO
      </p>
    </div>
  );
}
