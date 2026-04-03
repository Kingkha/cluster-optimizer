"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface GscConnection {
  id: string;
  propertyUrl: string;
  expiresAt: string;
  createdAt: string;
}

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsContent />
    </Suspense>
  );
}

function SettingsContent() {
  const searchParams = useSearchParams();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [connections, setConnections] = useState<GscConnection[]>([]);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then(setSettings);
    fetchConnections();
  }, []);

  function fetchConnections() {
    fetch("/api/auth/gsc/connections")
      .then((r) => r.json())
      .then(setConnections)
      .catch(() => setConnections([]));
  }

  async function handleSave() {
    setSaving(true);
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleDisconnect(id: string) {
    setDisconnecting(id);
    await fetch("/api/auth/gsc/disconnect", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setDisconnecting(null);
    fetchConnections();
  }

  const gscError = searchParams.get("error");
  const gscConnected = searchParams.get("gsc") === "connected";
  const propertiesCount = searchParams.get("properties");

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      {gscConnected && (
        <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          Google Search Console connected — {propertiesCount} {Number(propertiesCount) === 1 ? "property" : "properties"} imported.
        </div>
      )}
      {gscError && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
          GSC connection failed ({gscError}). Please try again.
        </div>
      )}

      {/* DataForSEO */}
      <Card>
        <CardHeader>
          <CardTitle>DataForSEO</CardTitle>
          <CardDescription>
            Connect DataForSEO for real keyword volume, difficulty, CPC, and SERP
            competitor data. Get credentials at dataforseo.com.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Login (email)</Label>
            <Input
              value={settings.dataforseo_login || ""}
              onChange={(e) =>
                setSettings((s) => ({ ...s, dataforseo_login: e.target.value }))
              }
              placeholder="your@email.com"
            />
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <Input
              type="password"
              value={settings.dataforseo_password || ""}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  dataforseo_password: e.target.value,
                }))
              }
              placeholder="API password"
            />
          </div>
        </CardContent>
      </Card>

      {/* Google Search Console */}
      <Card>
        <CardHeader>
          <CardTitle>Google Search Console</CardTitle>
          <CardDescription>
            Connect your GSC account to pull real impressions, clicks, CTR, and
            position data for your domains.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/api/auth/gsc")}
          >
            Connect Google Search Console
          </Button>

          {connections.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Connected properties</p>
              <div className="space-y-2">
                {connections.map((conn) => (
                  <div
                    key={conn.id}
                    className="flex items-center justify-between rounded-md border px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">GSC</Badge>
                      <span className="text-sm">{conn.propertyUrl}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      disabled={disconnecting === conn.id}
                      onClick={() => handleDisconnect(conn.id)}
                    >
                      {disconnecting === conn.id ? "Removing..." : "Disconnect"}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Settings"}
        </Button>
        {saved && (
          <span className="text-sm text-green-600">Settings saved!</span>
        )}
      </div>
    </div>
  );
}
