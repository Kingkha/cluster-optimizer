import { google } from "googleapis";

export function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/auth/gsc/callback"
  );
}

export function getAuthUrl(): string {
  const client = getOAuth2Client();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/webmasters.readonly"],
  });
}

export async function exchangeCode(code: string) {
  const client = getOAuth2Client();
  const { tokens } = await client.getToken(code);
  return tokens;
}

export async function getSearchAnalytics(
  accessToken: string,
  refreshToken: string,
  siteUrl: string,
  days = 28
): Promise<{ query: string; impressions: number; clicks: number; ctr: number; position: number }[]> {
  const client = getOAuth2Client();
  client.setCredentials({ access_token: accessToken, refresh_token: refreshToken });

  const webmasters = google.webmasters({ version: "v3", auth: client });

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  const res = await webmasters.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
      dimensions: ["query"],
      rowLimit: 500,
    },
  });

  return (res.data.rows || []).map((row) => ({
    query: row.keys?.[0] || "",
    impressions: row.impressions || 0,
    clicks: row.clicks || 0,
    ctr: row.ctr || 0,
    position: row.position || 0,
  }));
}

export async function listProperties(
  accessToken: string,
  refreshToken: string
): Promise<string[]> {
  const client = getOAuth2Client();
  client.setCredentials({ access_token: accessToken, refresh_token: refreshToken });

  const webmasters = google.webmasters({ version: "v3", auth: client });
  const res = await webmasters.sites.list();

  return (res.data.siteEntry || [])
    .map((s) => s.siteUrl || "")
    .filter(Boolean);
}
