# MAINMARKET.L5.1 — Automation level and market capability foundation

**Document type:** Engineering foundation note  
**Status:** Types and config only — no runtime wiring  
**Doctrine:** `docs/strategy/VIONA_MAIN_MARKET_LEVEL5_LAUNCH_DOCTRINE.md`

## Why this exists

VIONA builds automation maturity internally from Level 0 through Level 5, but **EU, US, and Canada** must not receive a main-market **commercial** launch framed as production AI business autopilot until **Level 5** is production-ready. **Global Lite** may remain available worldwide with honest demo, preview, pilot, or lite labeling.

This slice adds typed constants and pure helpers so future product, GTM, and platform code can share one gate definition without enabling AI runtime, payments, or UI changes.

## Level 5 doctrine (summary)

- **Level 5** means governed AI business autopilot: outcomes pass Policy Engine, Tool Gateway, tenant isolation, audit, finance gates, cost firewall, human fallback, and monitoring.
- **Levels 0–4** are internal build milestones; they are not main-market commercial launch eligibility.
- Only **Level 5** sets `mainMarketLaunchEligible` in `src/config/automationLevelConfig.ts`.

## Global Lite vs main-market commercial launch

| Market group | Foundation mode | Main-market commercial launch |
|---|---|---|
| `GLOBAL` (and aliases) | `GLOBAL_LITE` | Not applicable — separate from EU/US/CA commercial gate |
| `EU`, `US`, `CA` below Level 5 | `MAIN_MARKET_LOCKED` or `MAIN_MARKET_PILOT` | Blocked |
| `EU`, `US`, `CA` at Level 5 | `MAIN_MARKET_COMMERCIAL_READY` | Allowed by config gate only |

Helpers live in `src/config/marketCapabilityConfig.ts`.

## Safe readiness labels

`src/types/marketCapability.ts` defines copy-safe labels (`demo`, `preview`, `pilot`, `internal`, `global_lite`, `commercial_ready`, `production_ready`) for future UI and messaging. They are not wired into screens in this task.

## Intentionally not implemented

- No AI runtime, telephony, or model execution
- No backend, API, auth, payment, database, or Prisma changes
- No wallet, pricing, checkout, or route changes
- No Home, Auth, Identity, or mini-app UI wiring

## Validation

Run `npm run typecheck` and `npm run lint` after edits. No new test packages were added; the repo has no lightweight config test harness at this slice.
