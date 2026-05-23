# VIONA Local no-charge pilot — final sign-off

**Pack:** `VIONA.LOCAL.NO_CHARGE.PILOT_SIGNOFF.1`
**Master / origin:** `0b9ea8f`
**Date:** 2026-05-23
**Public API:** `https://viona-api-staging-eu.fly.dev`
**Classification:** `READY_FOR_CONTROLLED_NO_CHARGE_PILOT` (Local lane / public HTTPS web only)

---

## Sign-off classification

| Scope | Status |
|-------|--------|
| **Local no-charge public HTTPS web pilot** | **READY_FOR_CONTROLLED_NO_CHARGE_PILOT** |
| **Whole VIONA platform** | Pre-commercial / staging-pilot foundation |
| **Global Active / full commercial** | **Not yet** |

This sign-off does **not** authorize payment capture, payout, settlement, production launch, or unrestricted public rollout.

---

## 1. Current baseline

| Item | Evidence |
|------|----------|
| `master` / `origin` | `0b9ea8f` |
| Public HTTPS API | `https://viona-api-staging-eu.fly.dev` (Fly `fra`, app `viona-api-staging-eu`) |
| Public HTTPS smoke (paced) | **PASS** — `scripts/smoke-public-staging-api.mjs` @ `1daf006`+ |
| Public HTTPS REST UI | **PASS** — `docs/runbooks/VIONA_PUBLIC_HTTPS_REST_UI_WALKTHROUGH.md` |
| Device matrix (web/responsive) | **PASS** — 8/8 cells — `docs/runbooks/VIONA_PUBLIC_HTTPS_LOCAL_NO_CHARGE_DEVICE_MATRIX.md` |
| Local lane mode | `REQUEST_ONLY_NO_CHARGE` / `walletPhase` **NONE** |
| Deploy evidence | `docs/runbooks/VIONA_PUBLIC_STAGING_API_DEPLOY_EVIDENCE.md` |

---

## 2. Proven scope (public HTTPS staging)

| Area | Result | Primary evidence |
|------|--------|------------------|
| User A — UI login, request/status visibility, logout, fresh login | **PASS** | REST UI walkthrough + device matrix |
| User B — isolation (no User A private overlap) | **PASS** | REST UI + matrix + API smoke |
| Merchant M — login, inbox, Business M visible | **PASS** | REST UI + matrix |
| Merchant confirm UI | **PASS** | REST UI + matrix |
| Merchant decline UI | **PASS** | REST UI + matrix |
| Merchant N — isolation (no Business M rows/actions) | **PASS** | REST UI + matrix + API smoke |
| Public HTTPS REST auth (PIN; no dev JWT) | **PASS** | REST UI walkthrough |
| Public HTTPS Local no-charge API path | **PASS** | Paced HTTPS smoke |
| VI / EN responsive matrix (390×844, 768×1024, 1024×768, 1366×768) | **PASS** | Device matrix operator PASS sync |
| Forbidden commercial wording | **PASS** — not observed on Local surfaces | REST UI + matrix |

**Prior local-dev proofs** (`127.0.0.1`, `4d365bf`, `3cfea5e`) remain valid engineering history but are **not** substitutes for this public HTTPS sign-off.

**Not proven:** native iOS/Android store builds, production SLA, ops audit UI, Tourism/wallet commercial rails, SOS production dispatch.

---

## 3. Money safety

| Invariant | Status |
|-----------|--------|
| `walletMode` | `REQUEST_ONLY_NO_CHARGE` |
| `walletPhase` | `NONE` |
| Payment captured | **No** |
| Transaction delta (smoke / staging checks) | **0** when checked |
| Wallet row delta (smoke / staging checks) | **0** when checked |
| Wallet hold / debit / release / refund | **None** in Local lane |
| Settlement / provider payout / platform fee | **None** |
| Cash-out / withdraw / escrow | **None** in pilot scope |
| Copy: confirmed does not mean paid | **Required** on Local surfaces (observed in UI proof) |

---

## 4. Pilot readiness classification (detail)

**Ready for:** controlled staging pilot with **limited pilot users/merchants**, **public HTTPS web** (Expo), **request-only / no-charge** Local flows, **manual operator oversight**.

**Not ready for:** commercial go-live, payment pilot, payout/settlement automation, merchant production onboarding at scale, AI autonomous money actions, SOS production reliability claims, or whole-app “Global Active” commercial mode.

---

## 5. Operator playbook

### Required env (`.env.local` — **not committed**)

| Variable | Required value |
|----------|----------------|
| `EXPO_PUBLIC_REST_API_BASE` | `https://viona-api-staging-eu.fly.dev` |
| `EXPO_PUBLIC_DEV_REST_JWT` | Empty or removed |
| `VIONA_PILOT_PIN` | Set (length ≥ 6; **never** paste in docs/tickets) |
| `DATABASE_URL` / `DIRECT_URL` | Staging ref `euqbfanilcssjiwwtcby` (operator machine / Fly secrets only) |

### Run public HTTPS smoke

```powershell
cd c:\KNG\ket-noi-eu
node scripts/smoke-public-staging-api.mjs https://viona-api-staging-eu.fly.dev
```

Expect exit **0**; script uses **500ms** pacing on HTTPS (do not disable server rate limit).

### Restart Expo after env change

```powershell
npx expo start -c
```

### Verify user flow (User A)

1. Login: phone + PIN (pilot User A `+420910000001`).
2. Local → My Requests / status — rows load from API.
3. Logout — session cleared; login again.

### Verify merchant flow (Merchant M / N)

1. Merchant M (`+420920000001`): dashboard → Local merchant inbox; confirm one request; decline one request; logout.
2. Merchant N (`+420920000002`): inbox must **not** show Business M rows or actions; logout.

### Record issues

- Open GitHub issue or internal runbook note: viewport, language, role, step, **HTTP status only** (no PIN/JWT/body secrets).
- Attach screenshots with tokens/redacted PIN.
- Re-run smoke after API deploy.

### Stop pilot immediately if

- Unexpected payment captured or wallet balance change tied to Local actions.
- `walletPhase` ≠ `NONE` on new Local rows.
- Cross-tenant data visible (User B sees User A private requests; Merchant N sees Business M).
- Forbidden commercial wording appears on Local surfaces.

---

## 6. Pilot guardrails

- **Limited** pilot users/merchants only (provisioned staging accounts).
- **No payment**, payout, settlement, or escrow in this pilot lane.
- **No** merchant production onboarding automation.
- **No** AI autonomous money or SOS production claims.
- **Manual** operator review for each pilot session until ops playbook matures.
- **Privacy-safe** evidence — no secrets, JWT, PIN, or `DATABASE_URL` in docs/commits.
- **Rate limit** on staging API (5 req/s per IP) — use paced smoke; avoid burst scripts.
- Aborted background “Create R6” task is **not** evidence — use smoke or fresh operator runs.

---

## 7. Rollback

| Action | When |
|--------|------|
| Set `EXPO_PUBLIC_REST_API_BASE` → `http://127.0.0.1:8787` | Return app to local-dev API |
| Clear or restore dev JWT only for **local** dev (never commit) | Local debugging |
| `fly scale count 0` or destroy app `viona-api-staging-eu` | Disable public HTTPS API |
| **Do not** run new migrations on staging without explicit ops approval | DB safety |
| **Pause pilot** | Any payment/wallet/tenant inconsistency |

Staging DB should remain unchanged for rollback; pilot creates test requests only.

---

## 8. Next roadmap (after sign-off)

| Priority | Item |
|----------|------|
| Optional | Native iOS/Android spot-check on public HTTPS |
| Next | Controlled no-charge pilot with **limited participants** + support channel |
| Later | Ops audit UI exposure (internal) |
| Later | Operator support playbook refinements |
| Locked until finance architecture approval | Payment capture, wallet ledger, settlement, payout, Firebase VIP money bridge |

---

## Evidence index

| Document | Purpose |
|----------|---------|
| `VIONA_PUBLIC_STAGING_API_DEPLOY_EVIDENCE.md` | Fly deploy + HTTPS smoke |
| `VIONA_PUBLIC_HTTPS_REST_UI_WALKTHROUGH.md` | REST UI operator PASS |
| `VIONA_PUBLIC_HTTPS_LOCAL_NO_CHARGE_DEVICE_MATRIX.md` | 8/8 viewport×language PASS |
| `VIONA_LOCAL_NO_CHARGE_PILOT_READINESS_HANDOFF_1.md` | Historical engineering handoff |
| `VIONA_PROJECT_KERNEL.md` | Operating kernel sync |

---

## Limitations (preserved)

- Not production / commercial / payment readiness.
- Web/responsive matrix — not full native device certification unless separately recorded.
- Not merchant production onboarding at scale.
- Not AI autonomous actions.
- Not SOS production reliability or emergency dispatch claims.
