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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />
      <HeroSection />
      <TrustBar />
      <section className="mx-auto max-w-4xl px-6 py-8">
        <img
          src="/images/hero.webp"
          alt="Content cluster network visualization"
          className="w-full rounded-xl"
        />
      </section>
      <PainPoints />
      <ExampleOutput />
      <HowItWorks />
      <FeatureGrid />
      <WhoItsFor />
      <Pricing />
      <FinalCTA />
      <Footer />
    </div>
  );
}

/* ─── Nav Bar ─── */
function NavBar() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <img src="/images/logo.png" alt="Cluster Optimizer" className="h-7 w-7 rounded-lg" />
          <span className="font-semibold tracking-tight">Cluster Optimizer</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Sign in
          </Link>
          <Link
            href="/login"
            className="inline-flex h-8 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
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
    <section className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <Badge variant="secondary" className="mb-4 text-xs">
            Powered by Claude AI + DataForSEO
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
            Turn one keyword into a content cluster you can actually execute
          </h1>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
            Stop guessing what to publish next. Get a structured cluster map, prioritized publish order, internal link plan, content briefs, and SERP analysis — all from a single seed keyword.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="inline-flex h-10 items-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Start Free — 5 credits included
            </Link>
            <a
              href="#example"
              className="inline-flex h-10 items-center rounded-lg border px-6 text-sm font-medium transition-colors hover:bg-muted"
            >
              See example output
            </a>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            No credit card required. 5 free clusters on signup.
          </p>
        </div>

        {/* Static cluster tree visual */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground mb-4 uppercase tracking-wider">Example cluster</p>
          <ClusterTreeDemo />
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
    <div className={depth > 0 ? "ml-5 border-l pl-3" : ""}>
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
    <section className="border-y bg-muted/30">
      <div className="mx-auto max-w-6xl px-6 py-6">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-muted-foreground">
          <span>Built with</span>
          <span className="font-medium text-foreground">Claude AI</span>
          <span className="hidden sm:inline text-border">|</span>
          <span className="font-medium text-foreground">DataForSEO</span>
          <span className="hidden sm:inline text-border">|</span>
          <span className="font-medium text-foreground">Google Search Console</span>
        </div>
      </div>
    </section>
  );
}

/* ─── Pain Points ─── */
function PainPoints() {
  const pains = [
    {
      title: "No publishing roadmap",
      desc: "You have 50 keyword ideas but no order. Which page do you write first? Which supports the others?",
      icon: <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>,
    },
    {
      title: "Links are an afterthought",
      desc: "Most sites bolt on internal links after publishing. By then, the cluster structure is already fractured.",
      icon: <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>,
    },
    {
      title: "Invisible coverage gaps",
      desc: "Missing pages are invisible until a competitor fills them. You need a systematic way to find what's missing.",
      icon: <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>,
    },
  ];

  return (
    <section className="mx-auto max-w-6xl px-6 py-16 lg:py-24">
      <h2 className="text-center text-2xl font-bold mb-3">
        You know what to write about. The question is how to structure it.
      </h2>
      <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">
        Keyword lists and spreadsheets don&apos;t give you a content plan. You need structure.
      </p>
      <div className="grid gap-6 sm:grid-cols-3">
        {pains.map((p) => (
          <Card key={p.title} className="bg-muted/30">
            <CardContent className="pt-6">
              <div className="text-muted-foreground mb-3">{p.icon}</div>
              <h3 className="font-semibold mb-1">{p.title}</h3>
              <p className="text-sm text-muted-foreground">{p.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

/* ─── Example Output ─── */
function ExampleOutput() {
  return (
    <section id="example" className="border-y bg-muted/20">
      <div className="mx-auto max-w-6xl px-6 py-16 lg:py-24">
        <h2 className="text-center text-2xl font-bold mb-2">
          Here&apos;s what you get from one keyword
        </h2>
        <p className="text-center text-muted-foreground mb-10">
          Example: &ldquo;best things to do in Tokyo&rdquo;
        </p>

        <div className="space-y-8">
          {/* Publish Order Table */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Publish Order</h3>
            <div className="rounded-lg border bg-card overflow-x-auto">
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
                      <TableCell className="text-right font-semibold">{r.score}</TableCell>
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
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Internal Link Plan</h3>
              <div className="rounded-lg border bg-card divide-y">
                {[
                  { from: "Shibuya Travel Guide", to: "Tokyo Neighborhoods Guide", anchor: "Tokyo neighborhoods", type: "navigational" },
                  { from: "15 Best Ramen Shops", to: "Tokyo Food & Dining Guide", anchor: "Tokyo dining guide", type: "contextual" },
                  { from: "Street Food vs Fine Dining", to: "Budget Calculator", anchor: "budget calculator", type: "related-reading" },
                  { from: "When to Visit Tokyo", to: "Best Things to Do in Tokyo", anchor: "things to do in Tokyo", type: "contextual" },
                ].map((l, i) => (
                  <div key={i} className="px-4 py-3">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium truncate">{l.from}</span>
                      <span className="text-muted-foreground shrink-0">→</span>
                      <span className="font-medium truncate">{l.to}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-primary">&ldquo;{l.anchor}&rdquo;</span>
                      <Badge variant="outline" className="text-[10px]">{l.type}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SERP Metrics */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">SERP Analysis</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Search Volume", value: "74,000", sub: "monthly" },
                  { label: "Difficulty", value: "45", sub: "out of 100", color: "text-yellow-600" },
                  { label: "CPC", value: "$1.42", sub: "per click" },
                  { label: "Competition", value: "87%", sub: "advertiser" },
                ].map((m) => (
                  <Card key={m.label}>
                    <CardContent className="pt-4 pb-3">
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{m.label}</p>
                      <p className={`text-xl font-bold tabular-nums mt-1 ${m.color || ""}`}>{m.value}</p>
                      <p className="text-xs text-muted-foreground">{m.sub}</p>
                    </CardContent>
                  </Card>
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
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Content Brief</h3>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">15 Best Ramen Shops in Tokyo</CardTitle>
                  <Badge variant="secondary" className={`text-xs ${roleColors.list}`}>list</Badge>
                </div>
                <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                  <span>Target: &ldquo;best ramen in tokyo&rdquo;</span>
                  <span>1,500-2,500 words</span>
                  <span>Intent: commercial</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Keywords</p>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge>best ramen in tokyo</Badge>
                    {["tokyo ramen guide", "ramen shops shibuya", "best tonkotsu tokyo", "cheap ramen tokyo"].map((kw) => (
                      <Badge key={kw} variant="outline" className="text-xs">{kw}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Article Outline</p>
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
                        <span className="text-[10px] font-mono text-muted-foreground uppercase mr-2">{item.level}</span>
                        <span className="font-medium">{item.h}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Key Points</p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>- Include price range and nearest station for each shop</li>
                    <li>- Cover different ramen styles (tonkotsu, shoyu, miso, tsukemen)</li>
                    <li>- Mention peak hours and wait times</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
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
      title: "Enter a seed keyword",
      desc: "Type any topic. Add optional context like country, niche, or your domain.",
      icon: <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>,
    },
    {
      n: "2",
      title: "AI builds your cluster",
      desc: "Claude AI analyzes SERP data, groups keywords, and structures 8-20 pages with roles, hierarchy, and links.",
      icon: <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6"><path d="M13 10V3L4 14h7v7l9-11h-7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>,
    },
    {
      n: "3",
      title: "Execute with confidence",
      desc: "Get your publish order, content briefs, and link plan. Export as Markdown or CSV and start writing.",
      icon: <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>,
    },
  ];

  return (
    <section className="mx-auto max-w-6xl px-6 py-16 lg:py-24">
      <h2 className="text-center text-2xl font-bold mb-10">How it works</h2>
      <div className="grid gap-8 sm:grid-cols-3">
        {steps.map((s) => (
          <div key={s.n} className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-bold mb-4">
              {s.n}
            </div>
            <div className="text-muted-foreground mb-3">{s.icon}</div>
            <h3 className="font-semibold mb-1">{s.title}</h3>
            <p className="text-sm text-muted-foreground">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Feature Grid ─── */
function FeatureGrid() {
  const features = [
    { title: "Structured Cluster Map", desc: "A hierarchical cluster with pillar, sub-pillars, and support pages organized by topic groups." },
    { title: "Prioritized Publish Order", desc: "Each page scored on centrality, opportunity, ease, and SERP clarity. Know what to write first." },
    { title: "Internal Link Plan", desc: "Contextual and navigational links with suggested anchor text. Pages connect from day one." },
    { title: "Content Briefs", desc: "Full writing briefs with outlines, word counts, key points, and competitor insights per page." },
    { title: "SERP Analysis", desc: "Real search volume, keyword difficulty, CPC, and competitor data from DataForSEO." },
    { title: "Gap Detection", desc: "AI identifies 3-7 missing pages with confidence scores. Fill coverage gaps before competitors." },
  ];

  return (
    <section className="border-t bg-muted/20">
      <div className="mx-auto max-w-6xl px-6 py-16 lg:py-24">
        <h2 className="text-center text-2xl font-bold mb-10">Everything you need to plan content clusters</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="bg-card">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Who It's For ─── */
function WhoItsFor() {
  const personas = [
    { title: "SEO Freelancers", desc: "Deliver structured content strategies to clients in minutes, not days. Export cluster plans as professional deliverables." },
    { title: "Content Teams", desc: "Align writers around a clear publish order and linking structure. Everyone knows what to write and how it connects." },
    { title: "Affiliate Marketers", desc: "Build topical authority faster with comprehensive clusters. Cover every comparison, list, and informational angle." },
  ];

  return (
    <section className="mx-auto max-w-6xl px-6 py-16 lg:py-24">
      <h2 className="text-center text-2xl font-bold mb-10">Built for people who publish</h2>
      <div className="grid gap-6 sm:grid-cols-3">
        {personas.map((p) => (
          <Card key={p.title}>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-1">{p.title}</h3>
              <p className="text-sm text-muted-foreground">{p.desc}</p>
            </CardContent>
          </Card>
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
    <section className="border-t bg-muted/20">
      <div className="mx-auto max-w-6xl px-6 py-16 lg:py-24">
        <h2 className="text-center text-2xl font-bold mb-2">Simple credit-based pricing</h2>
        <p className="text-center text-muted-foreground mb-10">
          1 credit = 1 full cluster with SERP data, content briefs, and link plan.
        </p>
        <div className="grid gap-4 sm:grid-cols-3 max-w-3xl mx-auto">
          {packs.map((p) => (
            <Card key={p.label} className={p.popular ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20" : ""}>
              <CardContent className="pt-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <h3 className="font-semibold">{p.label}</h3>
                  {p.popular && <Badge variant="secondary" className="text-[10px]">Most popular</Badge>}
                </div>
                <p className="text-3xl font-bold mt-2">{p.price}</p>
                <p className="text-sm text-muted-foreground">{p.credits} credits</p>
                <p className="text-xs text-muted-foreground mt-1">{p.per} / credit</p>
                <Link
                  href="/login"
                  className="mt-4 inline-flex h-9 w-full items-center justify-center rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Get Started
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-6">
          Every account starts with 5 free credits. No credit card required.
        </p>
      </div>
    </section>
  );
}

/* ─── Final CTA ─── */
function FinalCTA() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20 lg:py-28 text-center">
      <h2 className="text-3xl font-bold mb-3">
        Your next content cluster is 60 seconds away
      </h2>
      <p className="text-muted-foreground mb-8">
        Sign up free. Get 5 credits. Build your first cluster.
      </p>
      <Link
        href="/login"
        className="inline-flex h-11 items-center rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Get Started Free
      </Link>
    </section>
  );
}

/* ─── Footer ─── */
function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto max-w-6xl px-6 py-6 flex items-center justify-between text-xs text-muted-foreground">
        <span>Cluster Optimizer</span>
        <span>&copy; {new Date().getFullYear()}</span>
      </div>
    </footer>
  );
}
