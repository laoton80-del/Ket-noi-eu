# VIONA Request Engine — Pack25 Live QA Staging API Viona Requests 404 Evidence

**Document type:** Live QA staging API route/deployment blocked evidence (docs-only — no code changes).
**Baseline:** `origin/master @ ba42112` — `docs(pack25): record live QA sandbox auth access blocked evidence (#147)`.
**Related:** `docs/product/VIONA_REQUEST_PACK25_LIVE_QA_SANDBOX_AUTH_ACCESS_BLOCKED_EVIDENCE.md`, `docs/product/VIONA_REQUEST_PACK16_READ_ONLY_REQUEST_API_IMPLEMENTATION_RESULT.md`, `docs/product/VIONA_REQUEST_PACK17_LIVE_READ_ONLY_REQUEST_INBOX_IMPLEMENTATION_RESULT.md`, `docs/product/VIONA_REQUEST_PACK24_FIRST_NOTE_INPUT_WRITE_UI_IMPLEMENTATION_RESULT.md`

---

## 1. Evidence summary

| Field | Value |
| --- | --- |
| Operating Protocol read | **YES** |
| Docs-only evidence | **YES** |
| Verified master checkout used | **YES** — `ket-noi-eu-master-sync @ ba42112` |
| **Live QA status** | **BLOCKED** |
| **Block type** | Staging API route / deployment / config |
| Frontend route reached | **YES** |
| Correct web path | `/viona-requests-live-inbox` |
| REST base active (observed) | **YES** — browser issued requests to staging REST host |
| Auth failure on this screen | **NO** — not the observed blocker |
| Pack24 note input reached/tested | **NO** |
| Pack24 failed | **NO** |
| Pack26 opened | **NO** |
| Live operator attestation | **Pending** |
| All non-note write/actions remain blocked | **YES** |

---

## 2. Operator-observed live QA state

| Step | Result |
| --- | --- |
| Stopped old Expo checkout (`ket-noi-eu` pre-Pack17) | **Done** |
| Ran current `ket-noi-eu-master-sync` | **Done** |
| Pilot phone + PIN REST login | **Success** |
| Opened Pack17/24 route `/viona-requests-live-inbox` | **Success** |
| Pack17 UI banner references `GET /api/viona/requests` | **Observed** |
| Browser network: `GET /api/viona/requests?limit=50&skip=0` | **HTTP 404** |
| Browser network: `GET /api/wallet/balance` | **HTTP 404** (secondary signal — staging API surface may be outdated) |
| Pack24 note submit UI exercised | **Not reached** — inbox list load blocked |

**Interpretation:** Frontend route, REST client configuration, and authenticated session are active enough to call the staging API. The blocker is **staging backend missing or not serving Pack16 list route**, not Pack24 UI failure and not auth denial on this screen.

---

## 3. API observations (no secrets recorded)

| Request | Observed result | Notes |
| --- | --- | --- |
| `GET /api/viona/requests?limit=50&skip=0` | **404** | Pack17 list load path |
| `GET /api/wallet/balance` | **404** | Separate endpoint; suggests broader staging deployment gap |
| Authorization header values | **Not recorded** | Operator saw authenticated calls; no token printed in this evidence |
| Staging REST host URL | **Not printed** | Host name documented separately in public staging runbooks only |

---

## 4. Likely causes (hypothesis — not verified in this pack)

| # | Hypothesis |
| --- | --- |
| H1 | Staging API deployment predates Pack16 `GET /api/viona/requests` routes |
| H2 | `EXPO_PUBLIC_REST_API_BASE` points to a staging host whose deployed build lacks `/api/viona` router mount |
| H3 | Staging API not redeployed after Pack16/Pack20 server merges |
| H4 | Wrong/outdated backend target (host reachable but route table stale) |

This evidence pack does **not** perform deployment, restart, or server inspection.

---

## 5. What is NOT blocked (clarifications)

| Item | Status |
| --- | --- |
| Pack24 note input/write UI on master | **Not failed** — not reached |
| Pack17 frontend route registration | **Working** — route opened |
| Operator login | **Working** — for this session |
| Pack26 UI hardening | **Not opened** |
| Production readiness | **Not claimed** |

---

## 6. Safe next steps (no deployment in this pack)

1. **Read-only staging API deployment/version audit** — verify whether public staging deployment includes Pack16 `vionaRoutes` and Pack20 note action route files (no secrets).
2. Compare staging deploy commit/tag vs master Pack16 green commit (`6ddbc59` / PR #135).
3. Confirm `/api/viona/requests` exists on staging when deployment is updated — **only after separate deployment authorization**.
4. Do **not** deploy, restart Fly app, or run DB commands from this evidence pack.
5. After staging serves `GET /api/viona/requests` with scoped data, retry Pack25 live QA: open inbox → select request → Pack24 note submit → timeline refresh.

---

## 7. Prior Pack25 gate progression

| Prior evidence | Status |
| --- | --- |
| Sandbox/auth access BLOCKED (PR #147) | Superseded for frontend checkout — operator now on correct master-sync |
| Entry route missing (old checkout) | **Resolved** — `/viona-requests-live-inbox` reached |
| **Current blocker** | Staging API 404 on Pack16 list route |

---

## 8. Explicit non-scope (this evidence pack)

| Item | State |
| --- | --- |
| Code implemented | **NO** |
| Frontend modified | **NO** |
| Server/API modified | **NO** |
| Deployment performed | **NO** |
| Fly restart performed | **NO** |
| DB/Prisma/Supabase/SQL commands run | **NO** |
| Secrets inspected or printed | **NO** |
| `.env*` modified | **NO** |
| Pack26 opened | **NO** |

---

## 9. Status flags

| Flag | Value |
| --- | --- |
| `pack25LiveQaStatus` | `blocked` |
| `pack25LiveQaBlockType` | `staging_api_route_deployment_config` |
| `pack25LiveQaFrontendRouteReached` | `true` |
| `pack25LiveQaVionaRequestsList404Observed` | `true` |
| `pack24Failed` | `false` |
| `pack26NoteWriteUiHardeningOpened` | `false` |
| `pack25LiveOperatorAttestationPending` | `true` |
| `allNonNoteWriteActionsBlocked` | `true` |

---

## 10. Recommendation

| Recommendation | Status |
| --- | --- |
| **A) Safe to open PR** for docs-only staging 404 blocked evidence | **YES** |
| Treat as Pack24 failure | **NO** |
| Proceed with Pack24 note live QA now | **NO** — unblock staging API first |
| Open Pack26 | **NO** |
| Next authorized action | Read-only staging API deployment/version audit; deploy only with separate authorization |

---

**Evidence:** `docs/design/evidence/cursor-pack25-live-qa-staging-api-viona-requests-404-evidence/README.md`
