# VIONA Request Inbox ReferenceLab Pack3 Evidence

Scope: add a gated, read-only ReferenceLab preview route for the request inbox foundation.

Allowed files:
- src/components/viona/reference/VionaReferenceRequestInboxLab.tsx
- src/navigation/referenceLabStackScreens.tsx
- src/navigation/referenceLabLinking.ts
- src/navigation/routes.ts
- docs/product/VIONA_REQUEST_INBOX_REFERENCE_LAB.md
- scripts/viona-request-inbox-reference-lab-check.mjs
- docs/design/evidence/codex-request-inbox-reference-lab-pack3/README.md

Safety boundaries:
- Lab route only.
- No live UI wiring.
- No API, DB, payment, booking, SOS, wallet, merchant execution, or live AI behavior.
- Read-only fixtures and existing request foundation components only.
- Human confirmation remains required before any future protected action.

Gates run:
- node scripts/viona-request-inbox-reference-lab-check.mjs
- node scripts/viona-request-inbox-readonly-check.mjs
- node scripts/viona-capability-readiness-check.mjs
- node scripts/viona-request-domain-check.mjs
- node scripts/viona-automation-safety-gates-check.mjs
- node scripts/viona-forbidden-claims-check.mjs
- node scripts/viona-forbidden-claims-check.mjs --strict
- node scripts/viona-ai-safety-readiness-check.mjs
- node scripts/viona-ai-phase1-readiness-check.mjs
- node scripts/viona-route-capability-inventory.mjs
- git diff --check
- npx tsc --noEmit
- npm run smoke
- conflict-marker grep

Final result:
- PASS in the isolated Pack3 branch.

## Check script refinement

- Cursor review found a Pack2 check scope mismatch: `viona-request-inbox-readonly-check.mjs` false-failed Pack3 because ReferenceLab route files were treated as forbidden navigation drift.
- The check script was refined to allow only the known gated ReferenceLab preview route files listed above.
- Safety boundaries remain unchanged: App.tsx, live consumer UI, API, DB, payment, booking, SOS, wallet, merchant execution, and live AI runtime remain forbidden.
