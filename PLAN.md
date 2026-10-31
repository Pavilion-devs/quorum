# PLAN.md — Road to winning

Hackathon: **Fri 30 Oct – Sat 31 Oct 2026** (submissions close Sat 20:00 CET). Team: The Intersect. Track: **Freestyle**.

Before kickoff we only did research and wrote planning docs (RESEARCH, PRODUCT, ARCHITECTURE, UI references) and set up accounts. All code was written during the event.

Guiding rules
1. **Concurrency is the product.** Every feature must make "agents running together" more visible or more real.
2. Real everything: real STT, real LLMs, real search, real auth, real DB. No mocked data or fake UI states. (Scripted inference runner exists **only** in CI tests.)
3. Judges score from the repo: it must run from the README with as few keys as possible.

Freestyle scoring: useful & original 30 · Mozaik use (parallel agents, shared state) 30 · runs from README 25 · README clarity 15.

---

## Prep (before 30 Oct) — no code
- [x] Research hackathon, judges, Mozaik (RESEARCH.md)
- [x] Product, architecture, UI, setup, plan docs
- [x] Register, join Discord
- [x] Create accounts & keys (SETUP.md §1), set spend caps

## Day 1 — Engine (Fri 30 Oct)
- [x] Monorepo scaffold (pnpm + turbo, packages/engine)
- [x] `createRoom` = one isolated Mozaik runtime per room; 2 concurrent rooms proven isolated (integration test)
- [x] RoomState + LockTable + Semaphore + WorkQueue + TokenBudget + ApprovalBroker (unit tested)
- [x] 5 agents: Scribe, Fact-Checker (Tavily), Decision Tracker, Action Owner, Devil's Advocate — concurrency proven (≥3 loops in flight)
- [x] State-based spec (Devil's Advocate: consensus without dissent) + human-approval interception + **agent-to-agent veto** (refuted claim auto-rejects dependent proposal)
- [x] Resilience: retries/fallback/timeouts, failures contained per agent, budget hard-stop, forged-approval protection
- [x] Auditor → JSONL trace in `.audit/`
- [x] Ran the engine with real keys (OpenAI + Tavily) on a sample transcript; fixed quality bugs found live (claim recall, duplicate actions, dissent streak, new-vs-context lines)
- [x] Measured token cost per meeting-minute

## Day 1–2 — Product (Fri 30 – Sat 31 Oct)
- [x] packages/protocol (zod wire contract) · apps/rooms (Fastify+ws, JWT tickets, rate limits, replay, presence, drain)
- [x] packages/db (Drizzle, Better Auth tables, rooms + snapshots) · local Postgres via embedded-postgres
- [x] apps/web: Next 16 + Better Auth (email + anonymous guests), landing, dashboard, live room, Web Speech mic
- [x] Playwright e2e with real models: sign-up → room → guest joins → fact-check → decision → approval → action
- [x] Room snapshots + recap page (copy as Markdown) · host-only end-meeting
- [x] Visual QA: dark/light, phone (390px)
- [x] Memory Keeper + Archivist (mem0)

## Day 2 — Submission (Sat 31 Oct)
- [ ] `pnpm demo`: one command, one model key — replays a real transcript through the real engine, prints the concurrent timeline + trace
- [ ] Pair Mozaik Cloud (`npx @mozaik-ai/cloud-sdk pair`) → run link + screenshot in README
- [ ] README top rewritten for judges: what it does → how agents run concurrently → 3-line quickstart
- [ ] Submission form: description + "how do the agents run concurrently"
- [ ] Optional: deployed URL / short video

## Cut list (drop in this order if behind)
1. Deploy → judges run `pnpm demo` locally
2. Video
3. Light theme polish
**Never cut:** `pnpm demo`, concurrency section in README, Mozaik Cloud link.

## Risks
| Risk | Mitigation |
|---|---|
| Judges can't run the full app (Postgres, auth, mic, 3 terminals) | `pnpm demo` needs Node + one model key |
| No Tavily key | Fact-Checker disables itself and says so; other agents still run |
| Cost blow-up | Per-room budget, semaphore, spend caps |
