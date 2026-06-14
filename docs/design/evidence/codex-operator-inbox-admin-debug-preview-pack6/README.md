# VIONA Operator Inbox Admin Debug Preview Pack6 Evidence

Scope: add gated Admin Debug read-only Operator Inbox preview route with minimal App.tsx wiring.

Current baseline: `origin/master @ baa15b9` (PR #60 — Pack5 readiness contract).

Allowed files:
- src/config/vionaOperatorInboxAdminDebugGate.ts
- src/screens/admin/VionaAdminDebugOperatorInboxPreviewScreen.tsx
- docs/product/VIONA_OPERATOR_INBOX_ADMIN_DEBUG_PREVIEW.md
- scripts/viona-operator-inbox-admin-debug-preview-check.mjs
- docs/design/evidence/codex-operator-inbox-admin-debug-preview-pack6/README.md
- App.tsx (minimal Stack.Screen + linking only)
- src/navigation/routes.ts (route type only)
- src/config/vionaOperatorInboxAdminReadiness.ts (Pack6 maturity update)

Safety boundaries:
- Admin Debug preview route only behind `isAdminDebugSurfaceEnabled()` + dedicated preview flag.
- Screen-level `serverRole === 'ADMIN'` guard.
- Separate conditional from `adminDemoMetricsEnabled` / `omniDemoEnabled`.
- Fixture-only Pack2 components/selectors; no ReferenceLab route mount.
- No MainTabNavigator, ReferenceLab stack/linking, merchant inbox, API, DB, payment, booking, SOS, wallet, live AI, or mutations.

Gate script refinement:
- Pack6 files added to allowlists in Pack2/Pack3/Pack4/Pack5 inbox check scripts.
- Pack5 readiness check narrowed to historical Pack5 doc contract validation only.

Gates run:
- node scripts/viona-operator-inbox-admin-debug-preview-check.mjs
- node scripts/viona-operator-inbox-admin-route-readiness-check.mjs
- node scripts/viona-request-inbox-operator-reference-lab-check.mjs
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
- PASS in the isolated Pack6 branch.
