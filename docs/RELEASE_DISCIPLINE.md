# Release discipline (Kết Nối Global / ket-noi-eu)

This document describes **what the repo can realistically verify** before a build or Functions deploy. It does **not** claim production certification or full QA coverage.

## Client (Expo app)

| Command | Purpose |
|---------|---------|
| `npm run typecheck` | `tsc --noEmit` for the app (`functions/**` excluded by root `tsconfig.json`). |
| `npm run smoke` | Typecheck plus **narrow** checks that key stack screens remain registered in `App.tsx` / `src/navigation/routes.ts`. **Not** E2E. |
| `npm run preflight` | `typecheck` + `smoke` — minimal gate before tagging a release candidate. |

**Does not run:** device tests, Detox, visual regression, or backend integration against live Firebase (add CI jobs if/when those exist).

## Cloud Functions

| Command | Purpose |
|---------|---------|
| `npm run functions:build` | Build `functions/lib` via esbuild. |
| `npm run functions:verify-bundle` | Rebuild + fail if build introduces new `functions/lib` drift versus pre-build git state (see `docs/FUNCTIONS_BUNDLE_PARITY.md`). |
| `npm run preflight:with-functions` (root) | App `preflight` then `functions:verify-bundle`. |
| `npm run trust:preflight` (root) | **G2/G3:** Static checks that runtime-trust / App Check wiring files exist (not E2E; see `docs/G2_RUNTIME_TRUST.md`). |
| `npm run preflight:release` (root) | **G3:** `preflight:with-functions` + `trust:preflight` — recommended gate before commercial candidate tagging (still not E2E). |
| `npm run preflight:commercial` (root) | **G5:** `preflight:release` + `commercial-release-gate.mjs` checklist; optional `COMMERCIAL_GATE_REQUIRE_TRUST_LIVE_STAMP=1`. |
| `npm run trust:live` (root) | **G3/G5:** Live HTTP smoke; success writes `.trust-live-stamp` (gitignored). Requires `TRUST_SMOKE_*` (see `docs/G3_APP_CHECK_AND_RELEASE.md`, `docs/G5_PLATFORM_TRUST.md`). |
| `npm run ci:release-discipline` (root) | CI aggregate gate: `expo config` + `expo-doctor` + `security:preflight` + **`commercial:preflight`** + strict native readiness + `preflight:release`. |

From `functions/`: `npm run typecheck` validates Functions TypeScript only.

## Environment and trust

- **`docs/PILOT_TRUST_ENV.md`** — admin debug flags, wallet URLs, App Check, bundle parity notes.
- **`docs/G2_RUNTIME_TRUST.md`** — sensitive Function surfaces, B2B fallback semantics, trust preflight scope.
- **`docs/G3_APP_CHECK_AND_RELEASE.md`** — App Check readiness (web vs native), live trust smoke, `preflight:release`.
- **`docs/G5_PLATFORM_TRUST.md`** — **G5** enforcement safety (native vs web), commercial gate, `.trust-live-stamp`.
- **`.env.example`** — template for client env vars; copy to `.env` locally (never commit secrets).

## Observability expectations

- Client: `src/utils/devLog.ts` — **development-only** prefixed logs (`__DEV__`). Release builds should not rely on these for incident response.
- Intentional **production** warnings (e.g. admin debug enabled on a release bundle) remain as explicit `console.warn` in `adminDebugGate.ts`.

## Honest scope statement

Passing `preflight` and `functions:verify-bundle` reduces **class A** footguns (type errors, stale Functions bundle, dropped routes). It does **not** prove pilot readiness, legal compliance, or payment correctness — those require your own release checklist and staging validation.

## CI enforcement in repo

- Workflow: `.github/workflows/release-discipline.yml`
- Trigger: all PRs + pushes to `main`
- Enforced command: `npm run ci:release-discipline`
