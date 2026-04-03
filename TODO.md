# TODO — Cluster Optimizer

## Next Up

### 1. Validate on own sites (Week 1-2)
- [ ] Run on tourismattractions.net — generate cluster for 3 seed topics
- [ ] Run on itimaker.com — generate cluster for 3 seed topics
- [ ] Compare AI-generated clusters vs manually planned ones
- [ ] Check if DataForSEO data meaningfully improves keyword targeting
- [ ] Track: did the tool change any publishing decisions?

### 2. Cluster Health Dashboard (retention hook)
- [ ] Weekly GSC re-check per project — auto-pull fresh impressions/clicks/position
- [ ] Flag declining pages (position dropped >3 in 7d)
- [ ] Suggest refreshes for pages with high impressions but dropping CTR
- [ ] Weekly email/notification digest: "3 pages need attention"
- [ ] This is what turns a one-time tool into a subscription product

### 3. Auth + Postgres (multi-tenant)
- [ ] Add NextAuth or Clerk for user authentication
- [ ] Migrate SQLite → Postgres (Supabase or Neon)
- [ ] Per-user projects, settings, and GSC connections
- [ ] Stripe integration for billing ($39/mo and $79/mo tiers)

### 4. Landing page + waitlist
- [ ] Landing page with 3 example clusters (travel, affiliate, SaaS)
- [ ] "Try a sample cluster" interactive demo
- [ ] Waitlist form (email capture)
- [ ] Post on Indie Hackers, SEO Twitter, r/SEO with real before/after data

### 5. Competitor SERP Intelligence (research)
- [ ] Use DataForSEO On-Page API to extract H2/H3 headings from top 10 ranking pages
- [ ] Map competitor subtopics → identify angles our cluster should cover
- [ ] Use DataForSEO "Related Pages" to find sibling content on competitor domains
- [ ] Feed competitor topical structure into Claude for gap-aware cluster generation
- [ ] Goal: clusters that match or exceed competitor topical coverage
- [ ] Estimate: ~$0.10-0.15 extra per cluster, adds ~10s to pipeline

### 6. Post-MVP features (from PRD Phase 2-4)
- [ ] Import existing URLs and map into cluster nodes
- [ ] Detect weak/thin nodes via content analysis
- [ ] Cluster health score (0-100)
- [ ] Refresh/decay detection
- [ ] Weekly action queue
- [ ] Merge/prune suggestions for cannibalization
- [ ] Team workflows and collaboration
