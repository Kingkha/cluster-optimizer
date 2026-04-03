import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function Home() {
  // Use real auth (not devAuth) so landing page is visible in dev
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Cluster Optimizer",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "description": "AI-powered topic cluster generator that turns a single seed keyword into a structured content strategy with publish order, internal link plan, content briefs, and SERP analysis.",
    "offers": {
      "@type": "AggregateOffer",
      "lowPrice": "9",
      "highPrice": "129",
      "priceCurrency": "USD",
    },
    "featureList": [
      "Topic cluster generation",
      "Prioritized publish order",
      "Internal link plan with anchor text",
      "AI content briefs",
      "SERP analysis with DataForSEO",
      "Content gap detection",
    ],
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <NavBar />
      <main>
        <HeroSection />
        <TrustBar />
        <PainPoints />
        <ExampleOutput />
        <HowItWorks />
        <FeatureGrid />
        <WhoItsFor />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}

/* ─── Nav Bar ─── */
function NavBar() {
  return (
    <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <img src="/images/logo.png" alt="Cluster Optimizer" className="h-7 w-7 rounded-lg" />
          <span className="font-semibold tracking-tight">Cluster Optimizer</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
            Sign in
          </Link>
          <Link
            href="/login"
            className="inline-flex h-8 items-center rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
          >
            Get Started Free
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ─── Hero ─── */
function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-indigo-100/60 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-blue-100/50 blur-3xl" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full bg-purple-100/40 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 py-20 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <Badge className="mb-6 border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-50">
              Powered by Claude AI + DataForSEO
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight lg:text-5xl xl:text-6xl leading-[1.1]">
              AI Topic Cluster Generator:{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                keyword to content strategy in 60 seconds
              </span>
            </h1>
            <p className="mt-6 text-lg text-zinc-500 leading-relaxed max-w-lg">
              Turn a single seed keyword into a complete content cluster with pillar pages, supporting articles, publish order, internal linking plan, and SEO content briefs — powered by real SERP data from DataForSEO and Claude AI.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="inline-flex h-11 items-center rounded-lg bg-indigo-600 px-6 text-sm font-medium text-white transition-all hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/25"
              >
                Start Free — 5 credits included
              </Link>
              <a
                href="#example"
                className="inline-flex h-11 items-center rounded-lg border border-zinc-300 px-6 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
              >
                See example output
              </a>
            </div>
            <p className="mt-4 text-xs text-zinc-400">
              No credit card required. 5 free clusters on signup.
            </p>
          </div>

          {/* Static cluster tree visual */}
          <div className="rounded-xl border bg-white p-6 shadow-xl shadow-indigo-500/5">
            <p className="text-xs font-medium text-zinc-400 mb-4 uppercase tracking-wider">Example cluster</p>
            <ClusterTreeDemo />
          </div>
        </div>

        {/* Hero illustration */}
        <div className="mt-16 flex justify-center">
          <img
            src="/images/hero.webp"
            alt="Content cluster network visualization"
            className="w-full max-w-3xl rounded-xl"
          />
        </div>
      </div>
    </section>
  );
}

/* ─── Cluster Tree Demo ─── */
const demoNodes = [
  { title: "Best Things to Do in Tokyo", role: "pillar", children: [
    { title: "Tokyo Neighborhoods Guide", role: "sub-pillar", children: [
      { title: "Shibuya Travel Guide", role: "support", children: [] },
      { title: "Shinjuku Nightlife Guide", role: "support", children: [] },
    ]},
    { title: "Tokyo Food & Dining Guide", role: "sub-pillar", children: [
      { title: "15 Best Ramen Shops in Tokyo", role: "list", children: [] },
      { title: "Street Food vs Fine Dining", role: "comparison", children: [] },
    ]},
    { title: "When to Visit Tokyo", role: "informational", children: [] },
  ]},
];

const roleColors: Record<string, string> = {
  pillar: "bg-indigo-100 text-indigo-800",
  "sub-pillar": "bg-blue-100 text-blue-800",
  support: "bg-green-100 text-green-800",
  comparison: "bg-amber-100 text-amber-800",
  list: "bg-purple-100 text-purple-800",
  informational: "bg-gray-100 text-gray-800",
};

function ClusterTreeDemo() {
  return (
    <div>
      {demoNodes.map((node) => (
        <TreeNodeDemo key={node.title} node={node} depth={0} />
      ))}
    </div>
  );
}

function TreeNodeDemo({ node, depth }: { node: typeof demoNodes[0]; depth: number }) {
  return (
    <div className={depth > 0 ? "ml-5 border-l border-zinc-200 pl-3" : ""}>
      <div className="flex items-center gap-2 py-1.5">
        <span className="text-sm font-medium truncate">{node.title}</span>
        <Badge variant="secondary" className={`text-[10px] shrink-0 ${roleColors[node.role] || ""}`}>
          {node.role}
        </Badge>
      </div>
      {node.children?.map((child) => (
        <TreeNodeDemo key={child.title} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

/* ─── Trust Bar ─── */
function TrustBar() {
  return (
    <section className="border-b bg-indigo-50/30">
      <div className="mx-auto max-w-6xl px-6 py-5">
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-2 text-sm">
          <span className="text-zinc-400">Built with</span>
          <span className="font-semibold text-indigo-700">Claude AI</span>
          <span className="font-semibold text-blue-700">DataForSEO</span>
          <span className="font-semibold text-green-700">Google Search Console</span>
        </div>
      </div>
    </section>
  );
}

/* ─── Pain Points ─── */
function PainPoints() {
  const pains = [
    {
      title: "No content publishing roadmap",
      desc: "You have 50 keyword ideas but no prioritized publishing order. Without a structured content plan, you publish randomly and miss topical authority signals Google rewards.",
      icon: <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>,
      color: "text-indigo-600 bg-indigo-50",
    },
    {
      title: "Internal linking is an afterthought",
      desc: "Most sites add internal links after publishing. Without a pre-planned internal linking strategy, your cluster structure fractures and link equity gets wasted.",
      icon: <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>,
      color: "text-blue-600 bg-blue-50",
    },
    {
      title: "Invisible content gaps hurt rankings",
      desc: "Missing supporting content weakens your pillar page. Competitors fill these topical gaps first, and Google rewards their more comprehensive coverage.",
      icon: <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>,
      color: "text-purple-600 bg-purple-50",
    },
  ];

  return (
    <section className="mx-auto max-w-6xl px-6 py-16 lg:py-24">
      <h2 className="text-center text-2xl font-bold mb-3">
        Why most content strategies fail to build topical authority
      </h2>
      <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">
        Keyword research tools give you lists. You need a structured topic cluster strategy with clear page hierarchy, publishing order, and internal linking architecture.
      </p>
      <div className="grid gap-6 sm:grid-cols-3">
        {pains.map((p) => (
          <div key={p.title} className="rounded-xl border bg-card p-6 hover:shadow-md transition-shadow">
            <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg mb-4 ${p.color}`}>
              {p.icon}
            </div>
            <h3 className="font-semibold mb-2">{p.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Example Output ─── */
function ExampleOutput() {
  return (
    <section id="example" className="bg-gradient-to-b from-indigo-50/50 to-white border-y border-indigo-100/50">
      <div className="mx-auto max-w-6xl px-6 py-16 lg:py-24">
        <div className="text-center mb-12">
          <Badge className="mb-4 border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-50">
            Live Example
          </Badge>
          <h2 className="text-2xl font-bold mb-2">
            Complete topic cluster output from a single keyword
          </h2>
          <p className="text-zinc-500">
            Seed keyword: &ldquo;best things to do in Tokyo&rdquo;
          </p>
        </div>

        <div className="space-y-8">
          {/* Publish Order Table */}
          <div>
            <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">Publish Order</h3>
            <div className="rounded-xl border bg-white shadow-sm overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead className="w-28">Role</TableHead>
                    <TableHead className="w-20 text-right">Priority</TableHead>
                    <TableHead className="w-24 text-right">Volume</TableHead>
                    <TableHead className="w-20 text-right">Diff.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { n: 1, title: "Best Things to Do in Tokyo", role: "pillar", score: 92, vol: "74,000", diff: 45 },
                    { n: 2, title: "Tokyo Neighborhoods Guide", role: "sub-pillar", score: 78, vol: "12,100", diff: 32 },
                    { n: 3, title: "Tokyo Food & Dining Guide", role: "sub-pillar", score: 75, vol: "8,400", diff: 28 },
                    { n: 4, title: "Shibuya Travel Guide", role: "support", score: 65, vol: "5,200", diff: 22 },
                    { n: 5, title: "15 Best Ramen Shops in Tokyo", role: "list", score: 61, vol: "9,800", diff: 35 },
                    { n: 6, title: "When to Visit Tokyo", role: "support", score: 48, vol: "6,300", diff: 20 },
                  ].map((r) => (
                    <TableRow key={r.n}>
                      <TableCell className="font-medium">{r.n}</TableCell>
                      <TableCell className="font-medium text-sm">{r.title}</TableCell>
                      <TableCell><Badge variant="secondary" className={`text-xs ${roleColors[r.role] || ""}`}>{r.role}</Badge></TableCell>
                      <TableCell className="text-right font-semibold text-indigo-600">{r.score}</TableCell>
                      <TableCell className="text-right">{r.vol}</TableCell>
                      <TableCell className="text-right">
                        <span className={r.diff < 30 ? "text-green-600" : r.diff < 60 ? "text-yellow-600" : "text-red-600"}>
                          {r.diff}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Link Plan + SERP side by side */}
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Link Plan */}
            <div>
              <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">Internal Link Plan</h3>
              <div className="rounded-xl border bg-white shadow-sm divide-y">
                {[
                  { from: "Shibuya Travel Guide", to: "Tokyo Neighborhoods Guide", anchor: "Tokyo neighborhoods", type: "navigational" },
                  { from: "15 Best Ramen Shops", to: "Tokyo Food & Dining Guide", anchor: "Tokyo dining guide", type: "contextual" },
                  { from: "Street Food vs Fine Dining", to: "Budget Calculator", anchor: "budget calculator", type: "related-reading" },
                  { from: "When to Visit Tokyo", to: "Best Things to Do in Tokyo", anchor: "things to do in Tokyo", type: "contextual" },
                ].map((l, i) => (
                  <div key={i} className="px-4 py-3">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium truncate">{l.from}</span>
                      <span className="text-indigo-400 shrink-0">→</span>
                      <span className="font-medium truncate">{l.to}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-indigo-600">&ldquo;{l.anchor}&rdquo;</span>
                      <Badge variant="outline" className="text-[10px]">{l.type}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SERP Metrics */}
            <div>
              <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">SERP Analysis</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Search Volume", value: "74,000", sub: "monthly", color: "text-indigo-600" },
                  { label: "Difficulty", value: "45", sub: "out of 100", color: "text-yellow-600" },
                  { label: "CPC", value: "$1.42", sub: "per click", color: "text-green-600" },
                  { label: "Competition", value: "87%", sub: "advertiser", color: "text-orange-600" },
                ].map((m) => (
                  <div key={m.label} className="rounded-xl border bg-white shadow-sm p-4">
                    <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">{m.label}</p>
                    <p className={`text-xl font-bold tabular-nums mt-1 ${m.color}`}>{m.value}</p>
                    <p className="text-xs text-zinc-400">{m.sub}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {["Featured Snippet", "People Also Ask", "Images"].map((f) => (
                  <Badge key={f} variant="secondary" className="text-xs">{f}</Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Content Brief */}
          <div>
            <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">Content Brief</h3>
            <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b bg-gradient-to-r from-purple-50 to-indigo-50">
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold">15 Best Ramen Shops in Tokyo</span>
                  <Badge variant="secondary" className={`text-xs ${roleColors.list}`}>list</Badge>
                </div>
                <div className="flex gap-4 text-xs text-zinc-500 mt-1">
                  <span>Target: &ldquo;best ramen in tokyo&rdquo;</span>
                  <span>1,500-2,500 words</span>
                  <span>Intent: commercial</span>
                </div>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Keywords</p>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge className="bg-indigo-600 text-white hover:bg-indigo-600">best ramen in tokyo</Badge>
                    {["tokyo ramen guide", "ramen shops shibuya", "best tonkotsu tokyo", "cheap ramen tokyo"].map((kw) => (
                      <Badge key={kw} variant="outline" className="text-xs">{kw}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Article Outline</p>
                  <div className="rounded-lg border divide-y text-sm">
                    {[
                      { h: "Why Tokyo Is the Ramen Capital", level: "h2" },
                      { h: "How We Chose These Shops", level: "h2" },
                      { h: "The 15 Best Ramen Shops", level: "h2" },
                      { h: "By Neighborhood", level: "h3" },
                      { h: "By Ramen Style", level: "h3" },
                      { h: "Tips for First-Time Visitors", level: "h2" },
                    ].map((item, i) => (
                      <div key={i} className={`px-4 py-2 ${item.level === "h3" ? "pl-8" : ""}`}>
                        <span className="text-[10px] font-mono text-indigo-400 uppercase mr-2">{item.level}</span>
                        <span className="font-medium">{item.h}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── How It Works ─── */
function HowItWorks() {
  const steps = [
    {
      n: "1",
      title: "Enter your seed keyword",
      desc: "Type any topic or keyword. Optionally add target country, niche, or your domain for competitor-aware clustering.",
      color: "bg-indigo-600",
    },
    {
      n: "2",
      title: "AI generates your content cluster",
      desc: "Claude AI analyzes real SERP data, groups keywords by subtopic, and structures 8-20 pages with pillar/sub-pillar hierarchy and internal links.",
      color: "bg-blue-600",
    },
    {
      n: "3",
      title: "Execute your content strategy",
      desc: "Get a prioritized publish order, detailed content briefs, and complete internal link plan. Export as Markdown or CSV and start writing.",
      color: "bg-purple-600",
    },
  ];

  return (
    <section className="mx-auto max-w-6xl px-6 py-16 lg:py-24">
      <h2 className="text-center text-2xl font-bold mb-12">How to build a topic cluster in 3 steps</h2>
      <div className="grid gap-8 sm:grid-cols-3">
        {steps.map((s) => (
          <div key={s.n} className="text-center">
            <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${s.color} text-white text-lg font-bold mb-4 shadow-lg`}>
              {s.n}
            </div>
            <h3 className="font-semibold mb-2">{s.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Feature Grid ─── */
function FeatureGrid() {
  const features = [
    { title: "Topic Cluster Map", desc: "Visualize your content hierarchy with pillar pages, sub-pillars, and supporting articles organized by topical groups. See how every page connects.", color: "text-indigo-600 bg-indigo-50" },
    { title: "Prioritized Publish Order", desc: "Each page scored on centrality, search opportunity, ease of creation, and SERP clarity. Publish in the order that builds topical authority fastest.", color: "text-blue-600 bg-blue-50" },
    { title: "Internal Link Architecture", desc: "Pre-planned contextual, navigational, and related-reading links with anchor text suggestions. Build your internal linking structure before you write.", color: "text-green-600 bg-green-50" },
    { title: "SEO Content Briefs", desc: "Detailed writing briefs with target keywords, H2/H3 outlines, word count targets, key points to cover, and competitor content analysis.", color: "text-purple-600 bg-purple-50" },
    { title: "SERP & Keyword Analysis", desc: "Real search volume, keyword difficulty, CPC, and top 10 competitor analysis from DataForSEO. Ground your content strategy in real search data.", color: "text-amber-600 bg-amber-50" },
    { title: "Content Gap Detection", desc: "AI identifies 3-7 missing pages in your cluster with confidence scores. Find and fill topical gaps before competitors rank for them.", color: "text-rose-600 bg-rose-50" },
  ];

  const icons = [
    <svg key="1" viewBox="0 0 24 24" fill="none" className="h-5 w-5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>,
    <svg key="2" viewBox="0 0 24 24" fill="none" className="h-5 w-5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M12 11v6M9 14h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>,
    <svg key="3" viewBox="0 0 24 24" fill="none" className="h-5 w-5"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>,
    <svg key="4" viewBox="0 0 24 24" fill="none" className="h-5 w-5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>,
    <svg key="5" viewBox="0 0 24 24" fill="none" className="h-5 w-5"><path d="M18 20V10M12 20V4M6 20v-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>,
    <svg key="6" viewBox="0 0 24 24" fill="none" className="h-5 w-5"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6M7 10h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  ];

  return (
    <section className="bg-zinc-50 border-y">
      <div className="mx-auto max-w-6xl px-6 py-16 lg:py-24">
        <h2 className="text-center text-2xl font-bold mb-12">Content cluster planning features</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <div key={f.title} className="rounded-xl border bg-white p-6 hover:shadow-md transition-shadow">
              <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg mb-4 ${f.color}`}>
                {icons[i]}
              </div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Who It's For ─── */
function WhoItsFor() {
  const personas = [
    { title: "SEO Freelancers & Agencies", desc: "Deliver data-driven content cluster strategies to clients in minutes instead of days. Export professional deliverables as Markdown or CSV.", emoji: "🎯" },
    { title: "In-House Content Teams", desc: "Give your writers a structured publish order, linking roadmap, and detailed briefs. Everyone knows what to write, when to publish, and how pages connect.", emoji: "👥" },
    { title: "Affiliate & Niche Site Owners", desc: "Build topical authority systematically with comprehensive clusters. Cover every comparison, listicle, and informational keyword in your niche.", emoji: "📈" },
  ];

  return (
    <section className="mx-auto max-w-6xl px-6 py-16 lg:py-24">
      <h2 className="text-center text-2xl font-bold mb-12">Who uses Cluster Optimizer</h2>
      <div className="grid gap-6 sm:grid-cols-3">
        {personas.map((p) => (
          <div key={p.title} className="rounded-xl border bg-card p-6 text-center hover:shadow-md transition-shadow">
            <span className="text-3xl mb-4 block">{p.emoji}</span>
            <h3 className="font-semibold mb-2">{p.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Pricing ─── */
function Pricing() {
  const packs = [
    { label: "Starter", credits: 10, price: "$9", per: "$0.90" },
    { label: "Growth", credits: 50, price: "$39", per: "$0.78", popular: true },
    { label: "Scale", credits: 200, price: "$129", per: "$0.65" },
  ];

  return (
    <section className="bg-zinc-50 border-y">
      <div className="mx-auto max-w-6xl px-6 py-16 lg:py-24">
        <h2 className="text-center text-2xl font-bold mb-2">Topic cluster generator pricing</h2>
        <p className="text-center text-muted-foreground mb-10">
          1 credit = 1 complete content cluster with SERP data, content briefs, internal link plan, and gap analysis.
        </p>
        <div className="grid gap-4 sm:grid-cols-3 max-w-3xl mx-auto">
          {packs.map((p) => (
            <div key={p.label} className={`rounded-xl border bg-white p-6 text-center transition-shadow hover:shadow-md ${p.popular ? "ring-2 ring-indigo-600 relative" : ""}`}>
              {p.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center rounded-full bg-indigo-600 px-3 py-0.5 text-xs font-medium text-white">
                  Most popular
                </span>
              )}
              <h3 className="font-semibold text-lg">{p.label}</h3>
              <p className="text-4xl font-bold mt-3">{p.price}</p>
              <p className="text-sm text-muted-foreground mt-1">{p.credits} credits</p>
              <p className="text-xs text-muted-foreground">{p.per} / credit</p>
              <Link
                href="/login"
                className={`mt-5 inline-flex h-10 w-full items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                  p.popular
                    ? "bg-indigo-600 text-white hover:bg-indigo-500"
                    : "bg-zinc-900 text-white hover:bg-zinc-800"
                }`}
              >
                Get Started
              </Link>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-6">
          Every account starts with 5 free credits. No credit card required.
        </p>
      </div>
    </section>
  );
}

/* ─── FAQ ─── */
function FAQ() {
  const faqs = [
    {
      q: "What is a topic cluster?",
      a: "A topic cluster is a group of interlinked pages organized around a central pillar page. It includes sub-pillar pages for major subtopics and supporting articles that target long-tail keywords. This structure helps search engines understand your topical authority and improves rankings across the entire cluster.",
    },
    {
      q: "How does the AI generate content clusters?",
      a: "Cluster Optimizer uses Claude AI combined with real SERP data from DataForSEO. It fetches search volume, keyword difficulty, and competitor data for your seed keyword, groups related keywords into subtopics, then generates a structured cluster with page roles, hierarchy, internal links, and content briefs.",
    },
    {
      q: "What's included in each content brief?",
      a: "Each brief includes: target keyword and secondary keywords, search intent, recommended word count, a full H2/H3 article outline, key points to cover based on competitor analysis, suggested internal links with anchor text, and competitor content insights.",
    },
    {
      q: "How is this different from keyword research tools like Ahrefs or Semrush?",
      a: "Keyword research tools give you keyword lists and metrics. Cluster Optimizer takes a keyword and generates a complete content execution plan: which pages to create, in what order, how they should link together, and what each article should cover. It bridges the gap between keyword research and content production.",
    },
    {
      q: "How many pages does each cluster generate?",
      a: "Cluster size adapts automatically based on your keyword. Niche long-tail keywords generate 5-8 focused pages, while broader head terms generate up to 20 pages. The AI uses real search volume data and keyword grouping to determine the optimal cluster size.",
    },
    {
      q: "Can I connect Google Search Console?",
      a: "Yes. Connect your GSC account to pull real impressions, clicks, CTR, and position data. This data is used to identify high-opportunity keywords you already rank for and informs the AI's prioritization of your cluster pages.",
    },
  ];

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((f) => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": { "@type": "Answer", "text": f.a },
    })),
  };

  return (
    <section className="mx-auto max-w-3xl px-6 py-16 lg:py-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <h2 className="text-center text-2xl font-bold mb-10">Frequently asked questions</h2>
      <div className="divide-y">
        {faqs.map((f) => (
          <div key={f.q} className="py-5">
            <h3 className="font-semibold mb-2">{f.q}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{f.a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Final CTA ─── */
function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-blue-700 text-white">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
      </div>
      <div className="relative mx-auto max-w-6xl px-6 py-20 lg:py-28 text-center">
        <h2 className="text-3xl font-bold mb-3">
          Your next content cluster is 60 seconds away
        </h2>
        <p className="text-indigo-100 mb-8 max-w-md mx-auto">
          Sign up free. Get 5 credits. Build your first cluster.
        </p>
        <Link
          href="/login"
          className="inline-flex h-12 items-center rounded-lg bg-white px-8 text-sm font-semibold text-indigo-700 transition-all hover:bg-indigo-50 hover:shadow-lg"
        >
          Get Started Free
        </Link>
      </div>
    </section>
  );
}

/* ─── Footer ─── */
function Footer() {
  return (
    <footer className="border-t bg-zinc-50">
      <div className="mx-auto max-w-6xl px-6 py-6 flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-medium">Cluster Optimizer</span>
        <span>&copy; {new Date().getFullYear()}</span>
      </div>
    </footer>
  );
}
