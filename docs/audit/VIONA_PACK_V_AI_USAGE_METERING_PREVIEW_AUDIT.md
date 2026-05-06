# VIONA Pack V AI Usage Metering UI / Admin Evidence Preview Audit

## 1. Summary

**What was added**

- `src/components/admin/AiUsageMeteringPreview.tsx` — read-only evidence panel rendering `AI_USAGE_AUDIT_FIXTURES` through `evaluateAiUsageFixtureForAudit`, joined with `getAiCostGuard` for guard status and `productionReady`.
- Wired into `AdminDashboardScreen` immediately after the existing **AI Fintech Scanner** card (no new routes, no navigation param changes).
- i18n keys under `aiUsage.preview.*` in `en.json` and `vi.json`.
- `scripts/ai-usage-metering-preview-check.mjs` and npm script `ai:usage-preview-readiness`.

**Why preview / evidence matters before DB-backed metering**

- Reviewers and ops can **see** cap semantics, margin estimates, and verdicts (`allow` / `warn` / `autoPause` / `blocked`) on real fixture rows without enabling providers or persistence.
- Mismatch between **expected** and **actual** verdict surfaces in UI as a yellow warning line — useful regression signal when the meter or registry drifts.

**Discovery note (Windows)**

- `rg` was not assumed on PATH; equivalent discovery used repository reads plus `Select-String` / editor search where needed, aligned with the intent of the requested `rg` patterns over `src/`, `docs/`, `package.json`, and `scripts/`.

## 2. Current Evidence Gaps

| Area | Current evidence visibility | Gap | Risk | Fix |
|------|----------------------------|-----|------|-----|
| Admin dashboard | Mock finance, omni, AI fintech scanner, tourism KPIs | No AI usage meter evidence | Reviewers cannot eyeball Pack U caps/verdicts | `AiUsageMeteringPreview` card after AI scanner |
| AI Receptionist pilot | B2B screens + cost copy elsewhere | No fixture table in admin | Misalignment vs registry | This preview uses registry-backed fixtures |
| Cost firewall | Registry + runbooks | Not visual in-app | Ops assumes code-only | Preview links policy to visible rows |
| Usage metering fixtures | Code + Pack U audit only | Not exposed in UI | Low trust in QA sign-off | Fixtures rendered with expected vs actual |
| Twilio readiness | Separate runbooks / checks | Not shown here | N/A for this UI | Keep telephony packs separate |
| Commercial ops evidence | Mixed mock + live tourism fetch | Context overload | Wrong conclusions | Panel disclaimers: evidence-only, no provider calls |
| Navigation exposure | Existing admin route only | — | Accidental new public route | No new routes |

## 3. UI Surface

| Item | Detail |
|------|--------|
| Component | `AiUsageMeteringPreview` |
| Wired? | **Yes** — embedded in `AdminDashboardScreen` |
| Why safe | Uses only frozen fixtures and pure functions; no `fetch`, no env, no mutations; does not alter existing admin handlers |

## 4. Evidence Model

| Element | Source |
|---------|--------|
| Fixtures | `AI_USAGE_AUDIT_FIXTURES` |
| Expected verdict | `fixture.expectedVerdict` |
| Actual verdict | `evaluateAiUsageFixtureForAudit(fixture).verdict` |
| Margin | `result.estimatedMarginMinor` (event-level billed − provider) |
| Cap / used / remaining | Fixture snapshot + meter `remaining` |
| Auto-pause | `result.autoPauseRecommended` |
| Production readiness | `getAiCostGuard(featureId).productionReady` |

## 5. What This Does Not Do

- No **provider** calls (OpenAI / Gemini).
- No **Twilio** calls.
- No **payment**, Stripe, wallet, or ledger.
- No **booking** or broker payout changes.
- No **DB** writes or **Prisma** migrations.
- No **production enforcement** of auto-pause (display only).
- No **AI production tool** actions triggered by this panel.

## 6. Safety

| Question | Answer |
|----------|--------|
| Payment touched? | **no** |
| Booking touched? | **no** |
| Wallet touched? | **no** |
| DB / Prisma touched? | **no** |
| AI production touched? | **no** |
| Twilio touched? | **no** |
| Route names changed? | **no** |
| Feature flags changed? | **no** |

## 7. Validation

Executed on branch `pack-v-ai-usage-metering-admin-preview` (2026-05-06):

- `npm ci` — pass
- `npm run ai:usage-preview-readiness` — pass
- `npm run typecheck` — pass
- `npm run lint` — pass (0 errors; existing repo warnings only)
- `npm run ci:release-discipline` — pass (includes `ci:expo-readiness`, `preflight:with-functions`, `ai:cost-readiness`, `twilio:sandbox-readiness`, nested `typecheck` + `smoke`)
- `npm run ai:cost-readiness` / `npm run twilio:sandbox-readiness` / `npm run ai:usage-readiness` — covered inside `ci:release-discipline` for this run

Also run locally before merge if `node_modules` was reset: `npm ci`, then repeat the commands above.

## 8. Next Pack Recommendation

- Broader **admin evidence dashboard** (filters, export) after tenant IDs exist.
- **DB-backed usage log** only after legal + finance approval.
- **Auto-pause enforcement** on server gateway aligned with meter verdicts.
- **Twilio sandbox smoke** only after explicit user consent and ops runbook step.
