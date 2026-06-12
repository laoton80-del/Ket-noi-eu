# VIONA Capability Matrix

## Purpose

This document defines the first formal VIONA capability and readiness matrix. It lets every universe keep its strategic place in the Global Vietnamese Companion OS while clearly separating active, request-only, preview, and disabled behavior.

This matrix is not wired into live UI in Job A. Future implementation packs may import the config after product, safety, and architecture review.

## Capability status types

| Status | Meaning | Product rule |
| --- | --- | --- |
| active | Safe non-protected behavior can run now. | Keep labels honest and avoid protected-domain completion claims. |
| requestOnly | User intent may be collected or drafted, then handled by a person or gated workflow. | Submission is not final execution. |
| preview | Surface can explain, demonstrate, or prepare future behavior. | Show as preview, pilot, demo, or gated as appropriate. |
| disabled | Capability is present in the platform map but blocked for this build. | Gate instead of delete. |

## Safety flags

| Flag | Meaning |
| --- | --- |
| requiresHumanConfirmation | A person must explicitly confirm before any protected or externally visible action. |
| requiresOpsReadiness | Manual or automated operations must have an owner, runbook, fallback, and audit trail. |
| requiresPaymentReadiness | Money movement requires verified rails, ledger source of truth, reconciliation, and rollback plan. |
| requiresLegalReadiness | Legal, privacy, regulated advice, market, or safety review is required before promotion. |
| requiresMarketReadiness | Country, language, provider, supplier, and local operating conditions must be reviewed. |
| prohibitsAutonomousAction | AI or automation may explain, classify, draft, or suggest, but may not execute protected action alone. |

## Universe readiness matrix

| Universe | Status | Required flags | Current safe state | Not live in this pack |
| --- | --- | --- | --- | --- |
| Home | active | human confirmation, no autonomous action | Global command center, navigation, onboarding, and safe status explanation. | No protected-domain completion claim. |
| Local | requestOnly | human confirmation, ops, market, no autonomous action | Service discovery, request drafts, translation support, and manual triage. | No guaranteed provider outcome or autonomous partner message. |
| Travel | preview | human confirmation, ops, payment, market, no autonomous action | Travel education, phrase help, comparison support, and request drafts. | No final itinerary, reservation change, or commerce success claim. |
| Academy | preview | human confirmation, legal, no autonomous action | Practice, learning guidance, lesson drafting, and safe coaching. | No credential or official assessment authority. |
| Business | preview | human confirmation, ops, payment, legal, market, no autonomous action | Merchant dashboard previews, catalog/order-ticket planning, draft responses, and analytics explanation. | No autonomous merchant operation, supplier guarantee, or final ledger outcome. |
| Account | preview | human confirmation, payment, legal, no autonomous action | Profile guidance, language preference support, profile-update drafts, and rewards explanation. | No balance-affecting action or autonomous profile mutation. |
| SOS | requestOnly | human confirmation, ops, legal, market, no autonomous action | Safety guidance, consent profile draft, trusted contact preparation, and local emergency education. | No emergency authority action, background location sharing, recording, or live response claim. |

## How future features must use this map

1. Keep the capability in the map even when it is not ready for live execution.
2. Gate behavior that needs payment, booking, SOS, wallet, tenant, auth, legal, market, or AI safety readiness.
3. Use `requestOnly` when VIONA can safely collect intent but cannot execute the outcome.
4. Use `preview` for demo, pilot, comparison, education, and planning surfaces.
5. Use `disabled` only when the capability belongs to VIONA but the current build must block entry.
6. Require `requiresHumanConfirmation` and `prohibitsAutonomousAction` for any future AI-assisted protected workflow.
7. Do not use this config to bypass feature flags, owner review, runbooks, or source-of-truth requirements.

## Current safe notes

Home remains the UI standard and universe launcher. Local and SOS are request/guidance-first. Travel, Academy, Business, and Account are preview-forward until their protected workflows have source-of-truth and owner readiness.

B2B Wholesale / E-shop Import is covered under Business for Job A. It must remain visible as strategic platform scope, but supplier data, catalog import, order flow, ledger movement, and compliance need separate gates before active execution.

## Import guidance

Allowed Job A import files:

- `src/config/vionaCapabilityReadiness.ts`
- `docs/product/VIONA_CAPABILITY_MATRIX.md`
- `scripts/viona-capability-readiness-check.mjs`
- `docs/design/evidence/codex-capability-readiness-job-a/README.md`

Do not wire this config into `App.tsx`, navigation, Home, Local, Travel, payments, auth, booking, DB, SOS, wallet, AI runtime, or assets in this pack.
