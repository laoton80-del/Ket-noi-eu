# VIONA Local no-charge — controlled pilot session 2 (Ops Audit UI)

**Pack:** `VIONA.LOCAL.NO_CHARGE.OPS_AUDIT_UI.PILOT_SESSION_2_USE.1`
**Playbook:** `docs/runbooks/VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_OPS_PLAYBOOK.md`
**Ops Audit UI plan:** `docs/runbooks/VIONA_LOCAL_NO_CHARGE_OPS_AUDIT_UI_PLAN.md`
**Master at evidence record:** `727cc38` — `feat(local): add read-only ops audit screen shell`
**Session date (UTC):** 2026-05-20
**Evidence class:** Preparation / use — **API corroboration + static UI audit** (interactive Expo UI **not run** in this pass)

---

## Session verdict

| Layer | Result |
|-------|--------|
| **Preconditions (agent-verified)** | **PARTIAL** — see §1 |
| **Public HTTPS ops API smoke** | **PASS** — exit 0 @ 2026-05-20 |
| **Interactive Expo Ops Audit UI** | **NOT RUN** — requires operator device with admin debug build |
| **Static UI implementation audit** | **PASS** @ `727cc38` |
| **Pause triggered** | **No** (API + shell ready; complete Expo attestation before pilot session 2 sign-off) |
| **Overall session 2 (Ops Audit UI)** | **PARTIAL** — do **not** treat as full operator UI PASS until §4 checklist is attested on device |

**Money law (unchanged):** `REQUEST_ONLY_NO_CHARGE`; `walletPhase` **NONE**; **confirmed does not mean paid**. Whole VIONA: pre-commercial / staging-pilot. Global Active / full commercial: **not yet**.

---

## 1. Preconditions

| # | Criterion | Agent check | Operator attestation |
|---|-----------|-------------|----------------------|
| 1 | `master` / `origin` = `727cc38` | **PASS** | — |
| 2 | `EXPO_PUBLIC_REST_API_BASE` → `https://viona-api-staging-eu.fly.dev` | **PASS** (smoke target) | Confirm on device |
| 3 | `EXPO_PUBLIC_DEV_REST_JWT` empty | **NOT VERIFIED** (`.env.local` not read) | Operator: length 0 |
| 4 | Admin debug: `EXPO_PUBLIC_ENABLE_ADMIN_DEBUG=1` + `adminDemoMetricsEnabled` | **NOT VERIFIED** on device | Required for route |
| 5 | Server `Role.ADMIN` login (no dev JWT) | **PASS** (smoke `opsAdmin` role=ADMIN) | Confirm UI login |
| 6 | Secrets printed in this doc | **No** | — |

---

## 2. Environment (privacy-safe)

| Field | Value |
|-------|--------|
| **Device / platform (this evidence pass)** | Docs-only / automated — **not** a physical Expo session |
| **API base** | `https://viona-api-staging-eu.fly.dev` |
| **Admin role (API)** | Confirmed `ADMIN` via paced public HTTPS smoke (`login: opsAdmin`) — **no phone/PIN/JWT logged** |
| **Screen shell commit** | `727cc38` |

---

## 3. Public HTTPS API corroboration (2026-05-20)

Command: `node scripts/smoke-public-staging-api.mjs` (exit **0**).

| Stage | Result | Notes |
|-------|--------|-------|
| `opsAuditUnauthed` | **PASS** | 401/403 without token |
| `opsAuditList` | **PASS** | `GET /api/local/ops/requests` |
| `opsAuditDetail` | **PASS** | `GET /api/local/ops/requests/:id` (first list row) |
| `opsAuditForbiddenB2c` | **PASS** | User A → 403 |
| `opsAuditForbiddenMerchant` | **PASS** | Merchant M → 403 |
| `opsAuditMutationSafe` | **PASS** | Read-only: status/`updatedAt` unchanged after reads |
| Redaction (`assertOpsResponseRedacted`) | **PASS** | List + detail bodies |
| Row safety | **PASS** | `walletMode` REQUEST_ONLY_NO_CHARGE, `walletPhase` NONE, `noPaymentCaptured` |

**Pagination (API):** smoke used `limit=10`; staging list non-empty at run time. UI `load-more` / `PAGE_SIZE=20` — **not exercised** in this pass.

---

## 4. Ops Audit UI walkthrough checklist

| Step | Requirement | Interactive Expo | Static @ `727cc38` | API smoke |
|------|-------------|-------------------|-------------------|-----------|
| 1 | Open app | **NOT RUN** | — | — |
| 2 | Reach Grand Admin Dashboard (debug/PIN path) | **NOT RUN** | Route gated `isAdminDebugSurfaceEnabled()` + `adminDemoMetricsEnabled` | — |
| 3 | Local Ops Audit row only on admin surface | **NOT RUN** | **PASS** — nav only in `AdminDashboardScreen` | — |
| 4 | Tap Local Ops Audit | **NOT RUN** | **PASS** — `navigate('LocalOpsAudit')` | — |
| 5 | Screen loads | **NOT RUN** | **PASS** — `LocalOpsAuditScreen` mounted via `GatedLocalOpsAuditScreen` | — |
| 6 | List `GET /api/local/ops/requests` | **NOT RUN** | **PASS** — `fetchOpsLocalServiceRequests` GET only | **PASS** |
| 7 | Pagination / load-more | **NOT RUN** | **PASS** — implemented (`PAGE_SIZE=20`, load-more) | Partial (`limit=10` only) |
| 8 | Select one request | **NOT RUN** | **PASS** — card `onPress` → `loadDetail` | — |
| 9 | Detail `GET …/:id` | **NOT RUN** | **PASS** — `fetchOpsLocalServiceRequestById` GET only | **PASS** |
| 10 | Safety chips (4) | **NOT RUN** | **PASS** — `LocalOpsAuditSafetyChips` + i18n | — |
| 11 | Limitation banner (4 lines) | **NOT RUN** | **PASS** — `LocalOpsAuditSafetyBanner` + i18n | — |
| 12 | No mutation buttons | **NOT RUN** | **PASS** — grep: no confirm/reject/cancel/refund/payout/settlement/wallet adjustment in ops UI | **PASS** mutation-safe reads |
| 13 | Consumer nav cannot reach route | **NOT RUN** | **PASS** — `LocalOpsAudit` only in admin-debug `Stack.Screen` block; no Home/Local/B2B links | **PASS** B2C/B2B 403 on API |
| 14 | No secrets / raw phone / PIN / JWT in UI | **NOT RUN** | **PASS** — DTO shows ids + role labels only; no token fields in client types | **PASS** redaction |

### Static forbidden-control scan (ops UI tree)

Scanned paths: `src/screens/local/LocalOpsAuditScreen.tsx`, `src/components/local/ops/*`, `src/services/localOpsAuditApi.ts`.

| Term / control | Found in ops audit UI? |
|----------------|------------------------|
| confirm / reject / cancel (action buttons) | **No** |
| refund / payout / settlement / wallet adjustment | **No** |
| POST / PATCH / DELETE in `localOpsAuditApi.ts` | **No** (GET only) |

Field labels `confirmedAt` / `rejectedAt` / `merchantDecision` are **read-only timestamps/labels**, not mutation actions.

---

## 5. Evidence summary (operator attestation template)

Copy and complete after **interactive** Expo pass:

| Check | PASS/FAIL | Notes |
|-------|-----------|-------|
| Admin debug enabled on build | | |
| Grand Admin Dashboard reached | | |
| Local Ops Audit row visible | | |
| Screen load | | |
| List fetch | | |
| Load-more (if ≥21 rows) | | |
| Detail fetch | | |
| Safety chips | | |
| Limitation banner | | |
| No mutation controls | | |
| Consumer route hidden | | |
| Redaction (no phone/PIN/JWT on screen) | | |

---

## 6. Issues / pause

| Item | Detail |
|------|--------|
| **Issues found** | Interactive Expo Ops Audit UI walkthrough **not executed** in automated docs pass; operator device attestation pending |
| **Pause decision** | **No** — API + shell remain safe; **do not** claim full session 2 UI PASS until §5 is completed |

---

## 7. Follow-up

1. Operator: `npx expo start -c` with admin debug env + staging HTTPS base; complete §5 on phone/tablet/web.
2. Optional: log one non-secret request id from UI for incident cross-reference.
3. Continue controlled no-charge pilot session 2 (user/merchant flows) per ops playbook when scheduled.
4. **Not in scope:** payment/wallet, production admin, audit-events drawer (future pack).

---

## 8. Validation (docs commit)

| Check | Result |
|-------|--------|
| `git diff --check` | Run at commit |
| `npx tsc --noEmit` | Run at commit |
| `npm run lint` | Run at commit |
| `npm run smoke` | Run at commit |
