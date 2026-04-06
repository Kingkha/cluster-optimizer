"use client";

import { useEffect, useState, useCallback, useRef, createContext, useContext } from "react";
import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ProjectWithRelations } from "@/lib/types";

interface ProjectContextValue {
  project: ProjectWithRelations | null;
  loading: boolean;
  refresh: () => void;
}

const ProjectContext = createContext<ProjectContextValue>({
  project: null,
  loading: true,
  refresh: () => {},
});

export function useProject() {
  return useContext(ProjectContext);
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  "fetching-data": "bg-cyan-100 text-cyan-800",
  generating: "bg-blue-100 text-blue-800",
  enriching: "bg-purple-100 text-purple-800",
  briefing: "bg-teal-100 text-teal-800",
  ready: "bg-green-100 text-green-800",
  error: "bg-red-100 text-red-800",
};

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { id } = useParams<{ id: string }>();
  const pathname = usePathname();
  const [project, setProject] = useState<ProjectWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [pollStart] = useState(() => Date.now());

  const isGenerating = project &&
    ["pending", "fetching-data", "generating", "enriching", "briefing"].includes(project.status);

  const fetchProject = useCallback((statusOnly = false) => {
    const url = statusOnly
      ? `/api/projects/${id}?status=1`
      : `/api/projects/${id}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (statusOnly) {
          // Merge status into existing project data
          setProject((prev) => prev ? { ...prev, ...data } : data);
        } else {
          setProject(data);
        }
        setLoading(false);
      });
  }, [id]);

  // Initial full fetch
  useEffect(() => {
    fetchProject(false);
  }, [fetchProject]);

  // Lightweight poll while generating (status only), with 3-min timeout
  useEffect(() => {
    if (!isGenerating) return;

    const POLL_TIMEOUT = 3 * 60 * 1000; // 3 minutes
    const interval = setInterval(() => {
      if (Date.now() - pollStart > POLL_TIMEOUT) {
        clearInterval(interval);
        setProject((p) => p ? { ...p, status: "error", errorMsg: "Generation timed out. Try again." } : p);
        return;
      }
      fetchProject(true);
    }, 2000);
    return () => clearInterval(interval);
  }, [isGenerating, fetchProject, pollStart]);

  // Full refetch when generation completes
  const prevStatus = useRef(project?.status);
  useEffect(() => {
    if (prevStatus.current && prevStatus.current !== "ready" && project?.status === "ready") {
      fetchProject(false);
    }
    prevStatus.current = project?.status;
  }, [project?.status, fetchProject]);

  const basePath = `/project/${id}`;

  return (
    <ProjectContext value={{ project, loading, refresh: fetchProject }}>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">
              {project?.topic || "Loading..."}
            </h1>
            {project && (
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                {project.country && <span>{project.country}</span>}
                {project.niche && <span>· {project.niche}</span>}
                <Badge
                  variant="secondary"
                  className={statusColors[project.status] || ""}
                >
                  {project.status}
                </Badge>
              </div>
            )}
          </div>
          {project?.status === "ready" && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  fetch(`/api/projects/${id}/generate`, { method: "POST" });
                  setProject((p) =>
                    p ? { ...p, status: "generating" } : p
                  );
                }}
              >
                Regenerate
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  window.open(`/api/export/${id}?format=md`, "_blank")
                }
              >
                Export MD
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  window.open(`/api/export/${id}?format=csv`, "_blank")
                }
              >
                Export CSV
              </Button>
            </div>
          )}
        </div>

        {/* Generation progress */}
        {project &&
          (project.status === "pending" ||
            project.status === "generating" ||
            project.status === "enriching" ||
            project.status === "briefing") && (
            <div className="rounded-lg border bg-card p-6 mb-6">
              <div className="flex items-center gap-3">
                <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
                <div>
                  <p className="font-medium">
                    {({ pending: "Preparing...", "fetching-data": "Fetching keyword & SERP data...", generating: "Generating cluster structure...", enriching: "Scoring and detecting gaps...", briefing: "Writing content briefs..." } as Record<string, string>)[project.status] || "Processing..."}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    This usually takes 30-60 seconds.
                  </p>
                </div>
              </div>
            </div>
          )}

        {project?.status === "error" && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4 mb-6">
            <p className="font-medium text-destructive">Generation failed</p>
            <p className="text-sm text-muted-foreground mt-1">
              {project.errorMsg}
            </p>
            <div className="flex gap-2 mt-2">
              {project.errorMsg?.includes("credits") ? (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => (window.location.href = "/credits")}
                >
                  Get Credits
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    fetch(`/api/projects/${id}/generate`, { method: "POST" });
                    setProject((p) =>
                      p ? { ...p, status: "generating", errorMsg: null } : p
                    );
                  }}
                >
                  Retry
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Tabs */}
        {project?.status === "ready" && (() => {
          const tabs = [
            { href: "", label: "Cluster Map" },
            { href: "/publish-order", label: "Publish Order" },
            { href: "/links", label: "Link Plan" },
            { href: "/missing", label: "Missing Nodes" },
            { href: "/briefs", label: "Content Briefs" },
          ];
          if (project.serpData && project.serpData.length > 0) {
            tabs.push({ href: "/serp", label: "SERP Analysis" });
          }
          if (project.crawledPages && project.crawledPages.length > 0) {
            tabs.push({ href: "/crawl", label: "Site Audit" });
          }
          if (project.gscQueries && project.gscQueries.length > 0) {
            tabs.push({ href: "/gsc", label: "Search Performance" });
          }
          return (
            <>
              <nav className="flex gap-1 border-b mb-6 overflow-x-auto">
                {tabs.map((tab) => {
                  const fullHref = basePath + tab.href;
                  const isActive = pathname === fullHref;
                  return (
                    <Link
                      key={tab.href}
                      href={fullHref}
                      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                        isActive
                          ? "border-primary text-primary"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {tab.label}
                    </Link>
                  );
                })}
              </nav>
              {children}
            </>
          );
        })()}
      </div>
    </ProjectContext>
  );
}
