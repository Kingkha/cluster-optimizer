"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function NewProject() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

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
      // Trigger generation in background
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
              <Input
                id="topic"
                name="topic"
                placeholder="e.g. best things to do in Tokyo"
                required
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  name="country"
                  placeholder="e.g. Japan"
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
