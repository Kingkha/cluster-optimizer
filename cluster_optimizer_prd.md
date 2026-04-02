# Cluster Optimizer MVP PRD

## Document Info
- **Product Name:** Cluster Optimizer
- **Version:** MVP v1
- **Document Type:** Product Requirements Document (PRD)
- **Status:** Draft
- **Primary Author:** OpenAI / ChatGPT
- **Target Build Window:** 30 days for internal MVP
- **Primary Use Case:** Turn one topic into a cluster the user can actually execute

---

## 1. Product Summary

Cluster Optimizer is a workflow product for content-heavy websites. It helps users turn one seed topic into a structured content cluster with:
- suggested cluster map
- page roles
- publish order
- internal linking plan
- missing node detection

The MVP is intentionally narrow. It is **not** a full SEO suite, and it is **not** an AI writer. The first version focuses on one core promise:

> Input a topic and get a cluster you can actually execute.

The product is designed to begin with travel and other entity-rich content networks, but the positioning is broader:
- affiliate publishers
- niche publishers
- content-heavy sites
- SEO/content operators

---

## 2. Why This Product Exists

Most SEO and content tools stop at:
- keyword lists
- topic ideas
- content optimization scores
- writing briefs

Operators still need to answer:
- What pages belong in this cluster?
- Which page should I publish first?
- What supporting pages are missing?
- How should these pages link together?
- What should I do next?

Cluster Optimizer exists to answer those questions clearly.

---

## 3. Problem Statement

Users managing content at scale often face these problems:

1. They can generate many topic ideas, but do not know how to structure them into a coherent cluster.
2. They do not know the right order to publish pages for the cluster to become useful quickly.
3. They do not know which supporting pages are missing.
4. They do not know how to design internal links at the cluster level.
5. Existing tools are often page-centric or keyword-centric, not cluster-centric.

This creates:
- wasted content production
- weak internal structure
- overlapping or missing pages
- poor prioritization
- slower growth

---

## 4. Product Vision

Build a cluster operating layer for content-heavy websites.

The long-term vision is to evolve from:
- cluster planning
into
- cluster execution
then
- cluster monitoring
then
- cluster action engine

But MVP v1 only covers:
- planning
- prioritization
- structure
- missing nodes

---

## 5. MVP Goal

### Primary Goal
Help a user go from one topic to one actionable cluster in under 10 minutes.

### Success Definition
A user can input a topic and walk away with:
- a structured cluster map
- recommended page roles
- a suggested publish order
- a basic internal link plan
- a list of missing supporting nodes

### Non-Goal for MVP
The MVP does **not** attempt to:
- write full articles
- provide backlink data
- provide rank tracking
- provide technical site audits
- become a broad SEO platform
- replace Semrush/Ahrefs/Surfer
- manage multi-user collaboration deeply

---

## 6. Target Users

### Primary ICP
Owners/operators of content-heavy websites, especially:
- affiliate sites
- niche publishers
- independent content operators
- content teams with 100–5,000 URLs
- SEO-led sites structured in clusters

### Secondary ICP
- agencies managing multiple content-heavy client sites
- in-house SEO/content operators at mid-sized publishers

### Anti-ICP
These are not ideal early users:
- total beginners with fewer than 30 pages
- enterprises needing permissions/workflows/compliance features
- users mainly seeking AI writing
- users mainly seeking raw keyword/backlink databases

---

## 7. Core Value Proposition

### Main Promise
Turn one topic into a structured cluster you can actually execute.

### Key Value
Instead of giving users a messy list of keywords, the product gives them:
- cluster structure
- role clarity
- execution order
- link structure
- coverage gaps

---

## 8. User Stories

### Core User Stories
1. As a content operator, I want to input one topic and see the major pages that likely belong in the cluster.
2. As a publisher, I want to understand which page should act as the pillar and which pages should support it.
3. As a site owner, I want to know which pages I should publish first.
4. As an operator, I want to understand how pages in the cluster should link together.
5. As a team managing existing content, I want to know which supporting pages are missing.

### Nice-to-Have Later
1. As a user, I want to import existing URLs and map them into the cluster.
2. As a user, I want to see weak/strong cluster nodes visually.
3. As a user, I want a weekly action queue after the cluster is live.

---

## 9. MVP Scope

### In Scope
- Topic input flow
- Cluster map generation
- Suggested page roles
- Suggested publish order
- Basic internal linking plan
- Missing node suggestions
- Export/copy action list

### Out of Scope
- AI article writer
- content briefs
- technical SEO audit
- backlink explorer
- keyword volume database
- rank tracker
- multi-tenant enterprise admin
- team permissions
- billing sophistication
- advanced automations

---

## 10. Functional Requirements

## 10.1 Topic Input Screen
### User Inputs
- seed topic (required)
- country (optional but recommended)
- language (optional but recommended)
- domain / site URL (optional)
- niche / site type (optional)

### System Behavior
- validate seed topic is non-empty
- normalize topic format
- store project/session
- send topic into cluster generation pipeline

### Output
- project created
- cluster generation initiated

---

## 10.2 Cluster Map Screen
### Purpose
Show a structured map of the content cluster rather than a flat list.

### Output Elements
- cluster title
- pillar topic
- subtopics
- supporting topics
- grouped intent/entity buckets
- suggested page role for each node:
  - pillar
  - sub-pillar
  - support
  - comparison
  - list
  - informational

### User Actions
- accept suggested cluster
- rename nodes
- delete irrelevant nodes
- manually add node
- export cluster

### Functional Requirement
The system must generate a cluster that is meaningfully grouped, not just a flat keyword dump.

---

## 10.3 Publish Order Screen
### Purpose
Help user know what to publish first.

### Output Elements
For each node:
- priority score
- recommended sequence number
- reason for priority
- optional opportunity/difficulty note

### Example Reasons
- foundational page for the cluster
- required support for pillar relevance
- strong supporting intent
- easier to build and connect early
- fills an obvious gap in cluster coverage

### User Actions
- reorder manually
- lock certain nodes
- export publish plan

---

## 10.4 Internal Link Plan Screen
### Purpose
Suggest a coherent cluster-level linking structure.

### Output Elements
- page A should link to page B
- support pages that should link to pillar
- pages that should cross-link
- optional anchor direction suggestion

### User Actions
- approve link recommendation
- remove recommendation
- export link map

### MVP Constraint
Link plan can be rules-based and simple. It does not need a highly sophisticated graph engine in v1.

---

## 10.5 Missing Nodes Screen
### Purpose
Show coverage gaps in the cluster.

### Output Elements
- missing supporting pages
- missing comparison/list pages where appropriate
- weak coverage areas
- optional confidence score

### If Domain Is Provided
The system should attempt to:
- compare current known pages vs suggested cluster
- identify obvious missing nodes
- flag possible overlap or weak coverage

### User Actions
- add to publish queue
- dismiss suggestion
- export missing nodes list

---

## 10.6 Export / Action List
### Purpose
Allow users to take action immediately.

### Output Types
- copy to clipboard
- markdown export
- CSV export (optional)
- plain action checklist

### Minimum Export Content
- cluster nodes
- page roles
- publish order
- internal links
- missing nodes

---

## 11. UX Requirements

### UX Principles
1. Show structure, not noise.
2. Prioritize clarity over breadth.
3. Make outputs actionable in minutes.
4. Avoid overwhelming the user with too many metrics.
5. The tool should feel like a decision product, not a raw data product.

### UX Success Criteria
- user understands product in under 30 seconds
- user can get first useful output in under 3 minutes
- user sees a clear difference between this and generic SEO keyword tools

---

## 12. Scoring / Decision Logic (MVP)

The MVP should start rules-based.

### 12.1 Page Role Logic
Role assignment may use:
- query breadth
- SERP pattern
- topical centrality
- relationship to seed topic
- informational vs comparison vs supporting intent

### 12.2 Priority Score Logic
Suggested priority score may include:
- cluster centrality
- ability to support multiple other nodes
- SERP competitiveness
- user intent closeness to seed topic
- foundational role in link structure
- opportunity estimate

### Example Priority Heuristic
Priority score can be weighted from:
- centrality: 30%
- support value to cluster: 25%
- opportunity: 20%
- ease/difficulty: 10%
- SERP clarity: 15%

These are placeholders and should be tuned through real use.

### 12.3 Missing Node Logic
Missing nodes may be inferred from:
- absent intent buckets
- absent entity relationships
- absent support pages around the pillar
- weak breadth vs comparable SERP structures

### 12.4 Internal Link Logic
Rules-based first:
- all support pages should link to pillar where relevant
- sub-pillars should link to pillar
- sibling pages cross-link when intent/entity relationship is strong
- comparison/list pages link to both pillar and referenced nodes if useful

---

## 13. Data Requirements

### Required Internal Objects
- project
- seed topic
- cluster
- node
- page role
- publish priority
- internal link suggestion
- missing node suggestion

### Suggested Data Model
#### Project
- id
- seed_topic
- country
- language
- domain
- niche
- created_at

#### ClusterNode
- id
- project_id
- title
- normalized_topic
- role
- group_name
- priority_score
- publish_order
- rationale

#### LinkSuggestion
- id
- project_id
- source_node_id
- target_node_id
- link_type
- rationale

#### MissingNode
- id
- project_id
- suggested_title
- related_group
- rationale
- confidence_score

---

## 14. System Inputs and Sources

The PRD intentionally does not lock the team into one data provider.

Possible inputs later may include:
- SERP snapshots
- related queries
- site URL inventory
- internal content database
- entity extraction/modeling
- basic content metadata

For MVP, the priority is output usefulness, not maximum data coverage.

---

## 15. Constraints

### Product Constraints
- narrow scope
- clear output
- fast usage
- low complexity at first

### Founder Constraints
- should be buildable alongside an existing website business
- should be testable on owned properties first
- should avoid competing directly with large SEO suites

---

## 16. Key Differentiation

This product is different because it is not primarily:
- a keyword tool
- a content score editor
- an AI writer
- a backlink tool
- a technical audit suite

It is a **cluster action product**.

### Core Difference
Others often answer:
- what topics exist
- how to optimize this article

Cluster Optimizer answers:
- how should this cluster be structured
- what should be published first
- what is missing
- how should it link together

---

## 17. Success Metrics

### Product Validation Metrics
- % of users who complete a cluster generation
- % of users who export the action plan
- time to first useful output
- qualitative feedback: “Would you use this again?”

### Internal Adoption Metrics
- how often the founder/team uses it on owned sites
- whether outputs actually change publishing decisions
- whether publish order/link plan is followed

### Early Beta Metrics
- beta signups
- activation rate
- repeat usage
- requests to import existing site data
- willingness to pay

### Strong Validation Signal
At least 5–10 real users say the product is meaningfully different from generic keyword/SEO tools.

---

## 18. MVP Success Criteria

The MVP is successful if, within the first test cycle:
1. the output is usable on the founder's own sites
2. at least 5 external users understand it quickly
3. at least 3 users say they would actively try it on a real cluster
4. the publish order and missing-node logic produce believable recommendations
5. users perceive it as a cluster workflow tool, not just a keyword suggestion tool

---

## 19. Risks

### Risk 1
Users perceive the product as just another keyword clustering tool.

**Mitigation:** emphasize structure, publish order, links, and missing nodes.

### Risk 2
Output quality is too generic.

**Mitigation:** test on real clusters from owned sites before external rollout.

### Risk 3
Scope expands into generic SEO suite territory.

**Mitigation:** maintain strict non-goals.

### Risk 4
Users ask for too many broad SEO features too early.

**Mitigation:** keep core promise narrow and clear.

---

## 20. Product Positioning

### Positioning Statement
Cluster Optimizer helps content-heavy websites turn one topic into a structured, actionable cluster with clear page roles, publish order, internal links, and coverage gaps.

### Category
Possible category labels:
- cluster operating system
- entity-driven cluster optimizer
- content cluster workflow tool

### Recommended External Message
> Turn one topic into a cluster you can actually execute.

---

## 21. Landing Page Draft

### Headline
Build content around topics, not just keywords

### Subheadline
Turn one topic into a structured cluster with clear page roles, publish order, internal links, and missing-page suggestions.

### Benefits
- See the full cluster instead of a messy keyword list
- Know what to publish first
- Strengthen structure with a suggested internal linking plan

### CTA
- Get early access
- Try a sample cluster

---

## 22. 30-Day Build Plan

### Week 1
Define output logic manually.
- choose 5–10 real topics
- create cluster examples by hand
- define page roles
- define publish order rules
- define basic link rules

### Week 2
Build basic prototype.
- input screen
- cluster generation
- page role output
- publish order output
- missing nodes output

### Week 3
Test on owned sites.
- run on real clusters
- compare with existing content
- refine outputs
- remove unhelpful logic

### Week 4
Package into early demo.
- simple landing page
- example projects
- export flow
- beta interest form

---

## 23. Future Roadmap (Post-MVP)

### Phase 2
- import existing URLs
- map URLs into cluster nodes
- detect weak nodes
- identify overlap/cannibalization candidates

### Phase 3
- cluster health score
- refresh/decay detection
- weekly action queue
- merge/prune suggestions

### Phase 4
- team workflows
- collaboration
- recurring monitoring
- niche/vertical-specific templates

---

## 24. Open Questions

1. Should the first visible framing be “cluster optimizer” or “entity-driven cluster optimizer”?
2. How much of the initial output should be editable vs fixed?
3. Should domain input remain optional or become a core step?
4. Should early beta users be limited to publishers/affiliate operators only?
5. How much should travel be used as case-study positioning versus hidden internal wedge?

---

## 25. Final MVP Recommendation

Build the smallest useful product that gives:
- cluster map
- page roles
- publish order
- internal link suggestions
- missing nodes

Avoid everything else for the first release.

If the product is useful internally and makes cluster decisions meaningfully easier, then it has earned the right to become a SaaS.
