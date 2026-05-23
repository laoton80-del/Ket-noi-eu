# VIONA Local no-charge — controlled pilot session 1

**Pack:** `VIONA.LOCAL.NO_CHARGE.CONTROLLED_PILOT_SESSION_1.1`
**Playbook:** `docs/runbooks/VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_OPS_PLAYBOOK.md`
**Master at session:** `151f0fb`
**Session date (UTC):** 2026-05-23
**Session type:** Pre-session checks + paced public HTTPS smoke (API verification)
**Operator:** automation + staging operator (initials not recorded in public doc)

---

## Session verdict

| Layer | Result |
|-------|--------|
| **Pre-session checks** | **PASS** |
| **Public HTTPS smoke (paced)** | **PASS** — exit 0 |
| **API flows (User A/B, Merchant M/N, isolation, confirm/decline)** | **PASS** (via smoke) |
| **Expo UI manual (same session)** | **NOT RUN** in this pack — re-run per playbook §4 when conducting live pilot |
| **Pause triggered** | **No** |
| **Overall session 1** | **PASS_WITH_LIMITATIONS** — API session complete; schedule Expo UI session log as session 1b or operator attestation |

Prior public HTTPS UI + device matrix proofs (`7d1439e` / `0b9ea8f`) remain valid baseline; this session adds **fresh** API verification at pilot start.

---

## 1. Pre-session checks

| Check | Result |
|-------|--------|
| `master` / `origin` | `151f0fb` |
| `.env.local` tracked | **No** |
| `EXPO_PUBLIC_REST_API_BASE` → public HTTPS | **PASS** (probe; value not logged) |
| `EXPO_PUBLIC_DEV_REST_JWT` empty | **PASS** (length 0) |
| Secrets printed | **No** |

---

## 2. Session log

| Field | Value |
|-------|--------|
| **Date/time** | 2026-05-23 (UTC) |
| **Master commit** | `151f0fb` |
| **API base** | `https://viona-api-staging-eu.fly.dev` |
| **Smoke result** | **PASS** (exit 0, `pacingMs` 500) |
| **Participants** | Pilot labels: User A, User B, Merchant M, Merchant N (staging accounts) |
| **User flow (API)** | **PASS** — login, list requests, create targets |
| **User flow (UI)** | **NOT RUN** this session |
| **Merchant flow (API)** | **PASS** — inbox, confirm, decline |
| **Merchant flow (UI)** | **NOT RUN** this session |
| **Isolation** | **PASS** — User B / Merchant N (smoke) |
| **No-charge** | **PASS** — `REQUEST_ONLY_NO_CHARGE`, `paymentCaptured: false` |
| **walletPhase** | **PASS** — `NONE` |
| **Forbidden wording** | **NOT RUN** (UI scan); API smoke only |
| **Issues found** | None from automated session |
| **Pause decision** | **No** |
| **Follow-up** | Operator: complete playbook §4 Expo checklist; file session 1b UI log or `SESSION_1.UI.OPERATOR_PASS_SYNC.1` |

---

## 3. Pilot checklist (mapped)

| # | Checklist item | API (smoke) | UI (Expo) |
|---|----------------|-------------|-----------|
| 1 | User A login / request visibility / logout | **PASS** / partial (no logout in smoke) | **NOT RUN** |
| 2 | User B login / isolation / logout | **PASS** isolation | **NOT RUN** |
| 3 | Merchant M login / inbox | **PASS** | **NOT RUN** |
| 4 | Merchant confirm (fresh request) | **PASS** | **NOT RUN** |
| 5 | Merchant decline (fresh request) | **PASS** | **NOT RUN** |
| 6 | Merchant N login / isolation | **PASS** | **NOT RUN** |
| 7 | No payment captured | **PASS** | — |
| 8 | `REQUEST_ONLY_NO_CHARGE` | **PASS** | — |
| 9 | `walletPhase` NONE | **PASS** | — |
| 10 | Forbidden commercial wording | — | **NOT RUN** |
| 11 | UX/ops friction | None observed (API path) | — |

**Safe request IDs (confirm/decline targets, this run only):**

- Confirm: `74965acb-ed9c-4036-839b-533a046f4030`
- Decline: `30b6e37c-c704-430a-87ef-a96aa3c868b2`

---

## 4. Smoke stage summary (non-secret)

| Stage | Status | HTTP |
|-------|--------|------|
| health | PASS | 200 |
| login User A / B / Merchant M / N | PASS | 200 |
| user lists + merchant inboxes | PASS | 200 |
| isolation user B / merchant N | PASS | — |
| local create (×2) | PASS | 201 |
| merchant confirm / decline | PASS | 200 |

---

## 5. Pause criteria review

| Trigger | Observed |
|---------|----------|
| Payment/wallet mutation | **No** |
| `walletPhase` ≠ NONE | **No** |
| Tenant isolation failure | **No** |
| Forbidden commercial wording | **Not checked** (UI) |
| Smoke repeated fail | **No** |
| Fly instability | **No** (health 200) |
| Auth regression | **No** |

**Pause decision:** **No**

---

## 6. UX / ops friction

| Item | Notes |
|------|--------|
| Rate limit | No 429 on this run (500ms pacing sufficient) |
| Fly / health | OK |
| Other | None recorded |

---

## Limitations

- Not production / commercial / payment certification.
- Session 1 automated path does not replace same-day Expo UI walkthrough per ops playbook.
- Not native iOS/Android unless separately tested.

---

## References

| Doc | Purpose |
|-----|---------|
| `VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_OPS_PLAYBOOK.md` | Daily checklist |
| `VIONA_LOCAL_NO_CHARGE_PILOT_SIGNOFF.md` | Pilot readiness |
| `VIONA_PUBLIC_STAGING_API_DEPLOY_EVIDENCE.md` | Deploy + smoke history |
