"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface KeywordSuggestion {
  keyword: string;
  volume: number;
  difficulty: number | null;
  cpc: number | null;
  opportunityScore: number;
  isSeed: boolean;
}

export default function NewProject() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [researching, setResearching] = useState(false);
  const [suggestions, setSuggestions] = useState<KeywordSuggestion[] | null>(null);
  const [topic, setTopic] = useState("");
  const [country, setCountry] = useState("");

  async function handleResearch() {
    if (!topic.trim()) return;
    setResearching(true);
    setSuggestions(null);

    try {
      const res = await fetch("/api/keyword-research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: topic.trim(), country: country || undefined }),
      });

      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.suggestions || []);
      } else {
        alert("Keyword research failed");
      }
    } catch {
      alert("Keyword research failed");
    } finally {
      setResearching(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const body = {
      topic: form.get("topic") as string,
      country: form.get("country") as string || undefined,
      language: form.get("language") as string || "en",
      domain: form.get("domain") as string || undefined,
      niche: form.get("niche") as string || undefined,
    };

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const project = await res.json();
      fetch(`/api/projects/${project.id}/generate`, { method: "POST" });
      router.push(`/project/${project.id}`);
    } else {
      setLoading(false);
      alert("Failed to create project");
    }
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>New Content Cluster</CardTitle>
          <CardDescription>
            Enter a seed topic and we&apos;ll generate a complete cluster structure
            with page roles, publish order, and internal links.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="topic">Seed Topic *</Label>
              <div className="flex gap-2">
                <Input
                  id="topic"
                  name="topic"
                  placeholder="e.g. best things to do in Tokyo"
                  required
                  autoFocus
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResearch}
                  disabled={researching || !topic.trim()}
                  className="shrink-0"
                >
                  {researching ? "Searching..." : "Find Best Keyword"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Use &quot;Find Best Keyword&quot; to discover easier-to-rank alternatives
              </p>
            </div>

            {suggestions && (
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted px-3 py-2 text-sm font-medium">
                  Keyword Suggestions — ranked by opportunity
                </div>
                {suggestions.length === 0 ? (
                  <p className="px-3 py-4 text-sm text-muted-foreground">
                    No keyword data found. Try a different topic.
                  </p>
                ) : (
                  <div className="max-h-64 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 sticky top-0">
                        <tr>
                          <th className="text-left px-3 py-1.5 font-medium">Keyword</th>
                          <th className="text-right px-3 py-1.5 font-medium">Vol</th>
                          <th className="text-right px-3 py-1.5 font-medium">KD</th>
                          <th className="text-right px-3 py-1.5 font-medium">Score</th>
                          <th className="px-3 py-1.5"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {suggestions.map((s, i) => (
                          <tr
                            key={s.keyword}
                            className={`border-t hover:bg-muted/30 ${s.isSeed ? "bg-blue-50 dark:bg-blue-950/30" : ""}`}
                          >
                            <td className="px-3 py-1.5">
                              {s.keyword}
                              {s.isSeed && (
                                <span className="ml-1.5 text-xs text-muted-foreground">(current)</span>
                              )}
                              {i === 0 && !s.isSeed && (
                                <span className="ml-1.5 text-xs text-green-600 dark:text-green-400">best</span>
                              )}
                            </td>
                            <td className="text-right px-3 py-1.5 tabular-nums">
                              {s.volume.toLocaleString()}
                            </td>
                            <td className="text-right px-3 py-1.5 tabular-nums">
                              {s.difficulty != null
                                ? <span className={
                                    s.difficulty <= 30 ? "text-green-600 dark:text-green-400" :
                                    s.difficulty <= 60 ? "text-amber-600 dark:text-amber-400" :
                                    "text-red-600 dark:text-red-400"
                                  }>{s.difficulty}</span>
                                : "—"}
                            </td>
                            <td className="text-right px-3 py-1.5 tabular-nums font-medium">
                              {s.opportunityScore.toLocaleString()}
                            </td>
                            <td className="px-3 py-1.5">
                              {!s.isSeed && (
                                <button
                                  type="button"
                                  className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 font-medium"
                                  onClick={() => {
                                    setTopic(s.keyword);
                                    setSuggestions(null);
                                  }}
                                >
                                  Use
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  name="country"
                  placeholder="e.g. Japan"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Input
                  id="language"
                  name="language"
                  placeholder="en"
                  defaultValue="en"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="domain">Domain / Site URL</Label>
              <Input
                id="domain"
                name="domain"
                placeholder="e.g. example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="niche">Niche / Site Type</Label>
              <Input
                id="niche"
                name="niche"
                placeholder="e.g. travel, affiliate, tech"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating..." : "Generate Cluster"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
