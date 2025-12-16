# NamifyAI — 10/10 Project Review & Roadmap

_Last updated: 2025-12-15_

This document is a **full review** of the current NamifyAI codebase and a **prioritized roadmap** of improvements to make it feel like a polished, production-grade “10/10” SaaS.

---

## 1) Current snapshot (what you already have)

### Product
- AI name generation (OpenAI chat completion)
- Domain “likely available” checks via DNS
- Save names + favorite names
- Dashboard overview with usage + weekly activity chart
- Auth: email/password + Google
- Stripe subscription upgrade + portal + webhooks

### Tech stack
- Next.js App Router (`next@16`), React 19
- Prisma + Postgres
- NextAuth v5 beta (JWT session)
- React Query
- Tailwind + shadcn-style UI primitives

### Data model (Prisma)
- `user`, `session`, `account` (NextAuth)
- `GeneratedName`, `Favorite`
- `Subscription` (Stripe) + `UsageTracking` (monthly counter)

---

## 2) High-level scorecard

### Strengths
- **Clean, modern stack** (Next App Router + Prisma + Stripe + NextAuth)
- **Real SaaS essentials** are present (billing, portal, webhooks)
- **Good UX direction** (glass UI, dashboard, loading skeletons)

### Biggest gaps preventing “10/10”
- **Usage & analytics model is too limited** (monthly counter only; no event history for true charts)
- **Security hardening** is not complete (rate-limiting, abuse protections, webhook safety edges)
- **Reliability/observability** (logs, tracing, error monitoring) is minimal
- **Testing** is missing (unit/integration/e2e)
- **DX & docs** are minimal (README, env setup, deployment guides)

---

## 3) Roadmap: P0 / P1 / P2 (prioritized)

### P0 — Must-have (production readiness)

#### P0.1 Add API rate limiting + abuse protection (critical)
- **Where**: `/api/ai/generate`, `/api/auth/register`, `/api/auth/forgot-password`.
- **Why**: Prevent brute force / spam / cost blowups.
- **How**:
  - Add a per-IP + per-user limiter (Upstash Redis, or in-db fallback).
  - Return `429` with retry hints.

#### P0.2 Harden OpenAI usage accounting (make it consistent & auditable)
- **Problem**: `UsageTracking.usedCredits` increments before the OpenAI request; failures still consume credits.
- **Fix options**:
  - **Option A (simple)**: increment after a successful completion.
  - **Option B (best)**: add a `UsageEvent` table and record per request with status.

#### P0.3 Stripe billing edge cases
- Ensure you handle:
  - subscription paused/unpaid/past_due behaviors in UI
  - plan mapping by `priceId` instead of “ACTIVE/TRIALING => PRO”
  - multiple subscriptions / item changes
- Add idempotency protection & safe handling for webhook retries.

#### P0.4 Auth security / account linking
- `allowDangerousEmailAccountLinking: true` is risky.
- Recommended:
  - disable dangerous linking OR
  - add explicit account linking flow with verification.

#### P0.5 Centralize API error format
- Standardize API JSON shape: `{ ok: false, error: { code, message, details? } }`.
- Helps UI display consistent messages.

---

### P1 — Should-have (polish, quality, strong SaaS feel)

#### P1.1 Real usage analytics + dashboards
Right now the weekly chart is derived from `GeneratedName.createdAt` (saved names), which is “activity” not “credits used”.

**Add a `UsageEvent` model**:
- Fields: `id`, `userId`, `type` (GENERATE, SAVE, FAVORITE), `creditsDelta`, `createdAt`, `meta` (JSON)
- Record events in:
  - `/api/ai/generate` (creditsDelta = 1)
  - `/api/names/save`
  - `/api/names/favorite`

Then charts can show:
- credits used per day
- saves per day
- conversion rates (generated → saved → favorited)

#### P1.2 Improve generation UX (pro-level)
- Add **regenerate** per suggestion
- Add “Generate more like this”
- Add “Tone presets” and “Industry templates”
- Save user’s last inputs (localStorage) + “Start from last prompt”

#### P1.3 Domain checking improvements
Current DNS approach is a heuristic.
- Consider:
  - parallelization with tighter timeouts
  - caching domain results per label
  - optionally integrate a registrar API (paid feature)

#### P1.4 Favorites & saved management
- Add a dedicated page:
  - Search, filters, sorting
  - Tagging / notes
  - Export CSV

#### P1.5 Email verification & password reset UX
You already have `PasswordResetToken` and auth routes.
- Ensure:
  - Email verification on signup
  - Clear “check your email” screens
  - Resend verification

---


## 4) UI/UX polish checklist

### Make UI consistent across pages
- Consolidate brand colors into a theme token file instead of inline hex.
- Create shared “PageShell” / “AuthShell” components.

### Empty states and onboarding
- Add first-run onboarding in dashboard:
  - “Start your first brainstorm”
  - “Save 3 names to unlock insights”

### Accessibility
- Ensure focus states are visible but subtle.
- Add aria labels for icon-only controls.

---

## 5) Performance

- Cache static assets and consider server components for read-heavy views.
- Reduce client JS on dashboard by moving some read operations server-side.
- Add `revalidate` where appropriate.

---

## 6) Reliability & Observability

- Add structured logging (pino) for API routes.
- Add error monitoring (Sentry).
- Add audit trail for billing + usage changes.

---

## 7) Testing strategy (minimum to feel “real”)

### Unit
- Zod schema validation tests
- Utility functions (domain label, alternative names)

### Integration
- API route tests for:
  - register/login
  - generate
  - billing checkout/portal

### E2E (Playwright)
- Signup/login
- Generate → save → favorite
- Upgrade → verify plan badge

---

## 8) Security checklist

- Rate limiting
- CSRF/headers review
- Secure cookies/session settings
- Webhook signature verification already exists (good)
- Avoid dangerous Google account linking
- Validate all user inputs (mostly good via Zod)

---

## 9) Documentation & DX

### README overhaul
Include:
- what NamifyAI is
- setup steps
- env variables explained
- Stripe setup instructions
- how to run migrations

### Add scripts
- `db:seed`
- `test`
- `e2e`

---

## 10) Suggested 4-week execution plan

### Week 1 (P0)
- Rate limit + abuse protection
- Fix usage accounting correctness
- Stripe webhook hardening

### Week 2 (P1)
- Add `UsageEvent` and true analytics
- Upgrade dashboard charts + insights

### Week 3 (P1)
- Improve generation UX (regenerate, presets, save last prompt)
- Saved/favorites management page

### Week 4 (P2 + polish)
- Accessibility pass
- Testing + CI
- Docs + deployment guide

---

## 11) Quick wins you can do today (highest ROI)

- Add rate limiting to `/api/ai/generate`
- Move usage increment to after successful OpenAI response
- Add a simple “Saved/Favorites” management page with search
- Improve README + env documentation

---

## Appendix: Notable implementation notes from the code

- **Auth**: NextAuth v5 beta with JWT session; Google creates DB user & account.
- **Stripe**: Checkout uses metadata userId; webhook maps status to plan.
- **Usage**: `UsageTracking` is monthly only; no event-level history.
- **AI**: Model response is parsed from JSON; good use of Zod schema.
