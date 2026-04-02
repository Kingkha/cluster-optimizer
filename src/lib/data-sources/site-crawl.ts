import { load } from "cheerio";
import { XMLParser } from "fast-xml-parser";
import type { CrawledPageData } from "./types";

export async function crawlSitemap(domain: string): Promise<string[]> {
  const baseUrl = domain.startsWith("http") ? domain : `https://${domain}`;
  const urls: string[] = [];

  try {
    const res = await fetch(`${baseUrl}/sitemap.xml`, {
      headers: { "User-Agent": "ClusterOptimizer/1.0" },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return urls;

    const xml = await res.text();
    const parser = new XMLParser();
    const parsed = parser.parse(xml);

    // Handle sitemap index or regular sitemap
    const urlset = parsed?.urlset?.url;
    if (Array.isArray(urlset)) {
      for (const entry of urlset) {
        if (entry.loc) urls.push(entry.loc);
      }
    } else if (urlset?.loc) {
      urls.push(urlset.loc);
    }

    // Handle sitemap index
    const sitemapIndex = parsed?.sitemapindex?.sitemap;
    if (Array.isArray(sitemapIndex)) {
      // Fetch first 3 sub-sitemaps
      for (const sm of sitemapIndex.slice(0, 3)) {
        if (sm.loc) {
          try {
            const subRes = await fetch(sm.loc, {
              headers: { "User-Agent": "ClusterOptimizer/1.0" },
              signal: AbortSignal.timeout(10000),
            });
            if (subRes.ok) {
              const subXml = await subRes.text();
              const subParsed = parser.parse(subXml);
              const subUrls = subParsed?.urlset?.url;
              if (Array.isArray(subUrls)) {
                for (const entry of subUrls) {
                  if (entry.loc) urls.push(entry.loc);
                }
              }
            }
          } catch {
            // Skip failed sub-sitemaps
          }
        }
      }
    }
  } catch (e) {
    console.warn("Sitemap crawl failed:", e);
  }

  return urls;
}

export async function crawlPage(url: string): Promise<CrawledPageData | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "ClusterOptimizer/1.0" },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) return null;

    const html = await res.text();
    const $ = load(html);

    const title = $("title").first().text().trim() || null;
    const metaDescription =
      $('meta[name="description"]').attr("content")?.trim() || null;
    const h1 = $("h1").first().text().trim() || null;

    const headings: string[] = [];
    $("h2").each((_, el) => {
      const text = $(el).text().trim();
      if (text) headings.push(text);
    });

    // Rough word count from body text
    const bodyText = $("body").text().replace(/\s+/g, " ").trim();
    const wordCount = bodyText.split(" ").length;

    const path = new URL(url).pathname;

    return { url, path, title, metaDescription, h1, headings, wordCount };
  } catch {
    return null;
  }
}

export async function crawlSite(
  domain: string,
  maxPages = 50
): Promise<CrawledPageData[]> {
  const sitemapUrls = await crawlSitemap(domain);

  // If no sitemap, try crawling the homepage for links
  const urlsToCrawl = sitemapUrls.length > 0
    ? sitemapUrls.slice(0, maxPages)
    : [`https://${domain.replace(/^https?:\/\//, "")}`];

  const results: CrawledPageData[] = [];
  const concurrency = 3;

  for (let i = 0; i < urlsToCrawl.length; i += concurrency) {
    const batch = urlsToCrawl.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(crawlPage));
    for (const r of batchResults) {
      if (r) results.push(r);
    }
  }

  return results;
}
