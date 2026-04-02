"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then(setSettings);
  }, []);

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

  const hasGoogleEnv = Boolean(
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  );

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

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

      {/* GSC */}
      <Card>
        <CardHeader>
          <CardTitle>Google Search Console</CardTitle>
          <CardDescription>
            Connect your GSC account to pull real impressions, clicks, CTR, and
            position data for your domains.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasGoogleEnv ? (
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/api/auth/gsc")}
            >
              Connect Google Search Console
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">
              Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and
              GOOGLE_REDIRECT_URI in your .env file to enable GSC integration.
            </p>
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
