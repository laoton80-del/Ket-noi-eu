# P4 — Execution board (wallet / receipt / money truth)

**Program reference (governing):** `docs/GLOBAL_V1_MASTER_BLUEPRINT_VI.md`, `docs/GLOBAL_V1_PROJECT_RULES_CURSOR.md`, `docs/GLOBAL_V1_COMMERCIAL_ARCHITECTURE_VI.md`, `docs/P0_DECISION_MEMO.md`, `docs/WAVE1_CLOSURE_EVIDENCE.md` (W1-04), `docs/RECEIPT_STRICTNESS.md`, `functions/RECEIPT_TRUTH.md`.

**Cách đọc trạng thái:** Cột **Status** trong bảng dưới phản ánh **bằng chứng đã ghi** tại thời điểm cập nhật board; **PASS** tại đây **không** tự động đóng W0/W1 nếu `docs/WAVE1_CLOSURE_EVIDENCE.md` / P0 thiếu sign-off hoặc thiếu log runtime cho hàng W1-04 tương ứng.

**Rule:** Status updates are evidence-driven; use **PASS** / **Done** only when **evidence needed** is satisfied and linked from the RC or this table (or the evidence subsection below).

| ID | Task | Owner | Evidence needed | Blocker | Dependency | Status |
|----|------|--------|-----------------|--------|------------|--------|
| **R1** | Confirm staging Functions env for receipt strictness vars (`WALLET_TOPUP_REQUIRE_PAYMENT_RECEIPT` et al. per receipt docs). | Backend / DevOps | Env reference (IaC or console) + deployed revision; which project is “staging”. | Staging access; policy to enable strict ON. | P0 commercial claim policy (aligned). | **PASS** — receipt strictness **on** for active `walletOps` revision, with deploy + runtime proof in [R1 evidence — walletOps receipt strict ON (2026-04-10)](#r1-evidence--walletops-receipt-strict-on-2026-04-10); [R1 staging receipt-strict prep](#r1-staging-receipt-strict-prep) remains the variable contract reference. |
| **R2** | Run receipt harness (`verify:receipt` / `verify-receipt-strictness.mjs`) for W1-04 scenarios; archive logs. | Backend + QA | Archived stdout for strict OFF duplicate, strict ON denial, optional seeded path per W1 doc. | `TRUST_SMOKE_*`, Firebase admin creds, backend base URL. | R1 (for strict ON scenario). | **In progress** — Scenario **A** strict-OFF **PASS** (historical; [evidence](#r2-scenario-a-evidence--strict-off-pass)). **B** (missing receipt → **409** strict ON) và **C** (`seeded-flow` + `seeded_success_and_duplicate`) có **bằng chứng runtime mới nhất** — [R2 runtime evidence — latest W1 session](#r2-runtime-evidence--latest-w1-session). **`trust:live` vẫn không full PASS** vì **aiProxy 500** `proxy_error` — [trust:live vs aiProxy (mở)](#trustlive-vs-aiproxy-mở). Links: [deployment reality](#p4-deployment-reality-walletops) · [runbook](#r2-staging-receipt-verification-runbook) · [Scenario A checklist](#r2-scenario-a-operator-checklist-run-now) · [Scenario A recorded](#r2-scenario-a-recorded-result) · [template](#r2-operator-evidence-template). |
| **R3** | Add “Receipt closed for RC” closure note (commit SHA + links to R2 logs) in PR or docs appendix. | Release manager | Single doc/PR section: date, commit SHA, env, scenarios passed. | R2 incomplete. | R2. | **Not started** |
| **L1** | Record product decision: Legal CTA credits = tiered Leona (`calculateCallCreditPrice`) **or** fixed bundle with explicit disclaimer. | Product | Written decision (ticket/ADR) with option A or B; **decision date** and **decided-by** recorded in that artifact. | Ambiguity until chosen. | P0 memo §3/§6. | **In progress** — formal ADR/ticket with date + owner not yet filed (engineering aligned to tiered Leona per L2/L3). |
| **L2** | Implement L1 in app: `deriveLifeOSPricing` / `LegalWidget` vs `LIFEOS_LEGAL_LEONA_CREDITS` / tier tables. | Mobile engineer | PR + screenshots T1 vs T2 profile. | L1. | L1. | **PASS** — [L2/L3 evidence — 2026-04-09](#l2l3-evidence--2026-04-09). |
| **L3** | Align all `LIFEOS_LEGAL_LEONA_CREDITS` call sites (predictive selling, orchestrator, etc.) with L2. | Mobile engineer | PR grep notes + brief test note. | L1/L2 sequencing. | L2. | **PASS** — same section. |
| **C1** | Approve UX copy: wallet unit row cannot be read as “debit currency = fiat” (Credits are debited). | Product + UX writer | Approved strings (vi + en minimum) for `unitPriceLine` or adjacent label, recorded below. | None once scheduled. | P0 commercial claim policy. | **PASS** — [C1 approved copy — 2026-04-09](#c1-approved-copy--2026-04-09) (strings shipped per [C2 evidence](#c2-evidence--2026-04-09)). |
| **C2** | Implement C1 in `strings.walletTopUp` (all locales) and/or `WalletTopUpScreen` layout. | Mobile engineer | PR + screenshots vi/en. | C1. | C1. | **PASS** — [C2 evidence — 2026-04-09](#c2-evidence--2026-04-09). |
| **C3** | Optional follow-up: ADR on single vs dual pricing display pipeline (fiat illustrative vs Credits-only). | Commercial PM + engineer | Short ADR; link from P4 or P3. | Scope contention with C2 if fiat removed later. | C2 shipped or explicitly deferred. | **Not started** |

### P4 deployment reality (walletOps)

**Source of truth:** repo config (`.firebaserc`, `google-services.json`, `GoogleService-Info.plist`, `firebase.json`, client callers) **and** live deploy / Cloud Logging for project **Kết Nối Global** / **`ket-noi-global`**.

1. **Current conclusion**
   - **`ket-noi-global`** is the **intended** Firebase project for this app and for CLI default deploy (`.firebaserc` default).
   - **`walletOps`** (Gen 2, **europe-west1**) is **deployed** and reachable at **`https://europe-west1-ket-noi-global.cloudfunctions.net/walletOps`** (HTTPS base without path: **`https://europe-west1-ket-noi-global.cloudfunctions.net`**). Evidence: successful **`firebase deploy --only functions:walletOps`** and post-deploy audit / logs (see [R1 evidence — walletOps receipt strict ON (2026-04-10)](#r1-evidence--walletops-receipt-strict-on-2026-04-10)).
   - **Receipt strictness is ON** on the **active revision** documented there (`WALLET_TOPUP_REQUIRE_PAYMENT_RECEIPT=1` via **`functions/.env`** loaded at deploy). **Scenario A (strict OFF)** in this board is a **historical** pass on a prior revision; **auto `verify:receipt` would no longer take the strict-OFF branch** against the current revision until strictness is turned off again or another environment is used.

2. **Two possible paths**
   - **Path A — Deploy here:** Run Firebase/GCP deploy so **`walletOps`** exists on **`ket-noi-global`** at the standard HTTPS URL shape (`https://<region>-ket-noi-global.cloudfunctions.net`, base **without** `/walletOps`; client appends `/walletOps`).
   - **Path B — Other backend:** Keep or point **`EXPO_PUBLIC_BACKEND_API_BASE`** / **`TRUST_SMOKE_BACKEND_BASE`** at whichever host **actually** serves **`POST …/walletOps`** today; document that host + project in R1/R2 evidence (repo today does **not** name an alternate project).

3. **Confirmation needed from backend / deploy owner**
   - Which path is active (**A** or **B**).
   - If **A:** confirmation that **`walletOps`** is deployed, **region**, **revision**, and the **exact HTTPS base** the app should use.
   - If **B:** written **canonical base URL**, GCP/Firestore project tied to that deployment, and whether Auth tokens from **`ket-noi-global`** are valid for that **`walletOps`** (must match server `verifyIdToken` / Firestore).

4. **What must be true before Scenario A can run honestly**
   - **`POST {BASE}/walletOps`** returns a **non-404** response for a real top-up probe (Functions **deployed** and route live).
   - Operators have a **correct `TRUST_SMOKE_BACKEND_BASE`** (or `EXPO_PUBLIC_BACKEND_API_BASE`) and a **valid Firebase ID token** for a wallet owner (and **App Check** if enforced on that deployment).
   - Logs are archived with the **R1-open** disclaimer unless R1 PASS is on file — **in addition** to the deployment truth above (wrong host / undeployed backend invalidates evidence regardless).

### Owner confirmation request (P4 deployment reality)

**1. Message to backend / deploy owner (copy-paste)**

> P4 / R2 receipt evidence is blocked until we know where **`walletOps`** actually runs. Firebase Console for **`ket-noi-global`** currently shows **no Functions deployed**. Please reply with **Path A** or **Path B** and fill **every field** for that path (this section in `docs/P4_EXECUTION_BOARD.md`).

**2. Fields you must provide**

**Path A — `walletOps` deployed on `ket-noi-global`**

| Field | Provide |
|--------|---------|
| **Deploy confirmation** | Yes/no + **when** (date) + optional ticket / pipeline link proving deploy. |
| **Region** | GCP region hosting **`walletOps`** (e.g. `europe-west1`). |
| **`walletOps` revision** | Deployed **revision / generation ID** (or equivalent) for that function. |
| **Canonical backend base URL** | HTTPS origin only, **no** trailing slash, **no** `/walletOps` suffix — e.g. `https://<region>-ket-noi-global.cloudfunctions.net`. |

**Path B — another host serves `walletOps`**

| Field | Provide |
|--------|---------|
| **Canonical backend base URL** | HTTPS origin such that **`POST {base}/walletOps`** is the **live** contract the app must use. |
| **Backing project / environment** | GCP/Firebase **project ID** + operator label (staging / prod / other). |
| **Firebase ID token validity** | Explicit confirmation: **yes** or **no** — Firebase **ID tokens** from the **`ket-noi-global`** client app (same project as `google-services.json` / plist) are **accepted** by this `walletOps` for `verifyIdToken` and wallet Firestore (if **no**, specify which Auth project must issue tokens). |

**3. Scenario A honesty (one line)**

**`POST {canonical base}/walletOps` must respond as a live endpoint (not 404), using that base plus a valid wallet-owner Firebase ID token and App Check only if the deployment enforces it, and the run archive must include the R1-open disclaimer unless R1 PASS is on file.**

### R1 staging receipt-strict prep

**1. Exact environment / config items (staging `walletOps` deployment)**

| Item | Purpose |
|------|--------|
| `WALLET_TOPUP_REQUIRE_PAYMENT_RECEIPT=1` | Require `platform_payment_receipts/{paymentEventId}` with `status: 'paid'` before top-up applies. |
| `WALLET_TOPUP_RECEIPT_REQUIRE_WALLET_UID=1` | (Optional but recommended with strict ON) Receipt `walletUid` must match caller. |
| `WALLET_TOPUP_RECEIPT_REQUIRE_CREDITS_GRANT=1` | (Optional but recommended) Receipt `creditsToGrant` must equal top-up `amount`. |

**2. Where each lives today**

| Item | Location |
|------|----------|
| Semantics / defaults / staging order | `docs/RECEIPT_STRICTNESS.md`, `functions/RECEIPT_TRUTH.md`, `functions/src/payments/paymentReceiptModel.ts` (comments). |
| Runtime reads | `functions/src/index.ts` (`receiptAllowsTopup`); cold-start booleans logged in `functions/src/trustRuntimeDiagnostics.ts` (`wallet_topup_receipt_*`). |
| Client → backend URL for probes | App / harness: `EXPO_PUBLIC_BACKEND_API_BASE` or `TRUST_SMOKE_BACKEND_BASE` (see `scripts/verify-receipt-strictness.mjs`, `docs/WAVE1_CLOSURE_EVIDENCE.md`). |
| Firebase **project** mapping | Repo: `.firebaserc` → `default` is `ket-noi-global` only; **no `staging` alias** committed. |
| **Deployed** Function env values | **Not in repo:** set in **Google Cloud Console** (Cloud Functions → `walletOps` → configuration / environment variables) or your **IaC / Secret Manager** pipeline if used. `firebase.json` has **no** embedded Functions env block. |
| Webhook → receipts | **Not in repo** as guaranteed staging artifact: must exist for honest strict ON (writes `platform_payment_receipts/*`); order in `docs/RECEIPT_STRICTNESS.md` §Staging order. |

**3. Already present vs missing (this repo snapshot)**

- **Present:** Full variable contract, implementation, verification scripts (`npm run verify:receipt` → `scripts/verify-receipt-strictness.mjs`), seed path docs, W1-04 evidence map.
- **On file for R1 PASS (2026-04-10):** Deploy + runtime proof for **`ket-noi-global`** / **`walletOps`** with **`WALLET_TOPUP_REQUIRE_PAYMENT_RECEIPT=1`** on the active revision — see [R1 evidence — walletOps receipt strict ON (2026-04-10)](#r1-evidence--walletops-receipt-strict-on-2026-04-10). Optional vars **`WALLET_TOPUP_RECEIPT_REQUIRE_WALLET_UID`**, **`WALLET_TOPUP_RECEIPT_REQUIRE_CREDITS_GRANT`** were **not** set (`false` at runtime per cold-start log).

**4. Smallest checklist to make R1 ready (operators)**

1. Name the **staging** Firebase/GCP project ID (document it next to R1 evidence when closing).  
2. Ensure **signature-verified** payment webhook on that project writes `platform_payment_receipts/{paymentEventId}` before enabling strict top-up (`docs/RECEIPT_STRICTNESS.md` staging order).  
3. Set the env block on **`walletOps`** (same revision R2 will hit): at minimum `WALLET_TOPUP_REQUIRE_PAYMENT_RECEIPT=1`; add the other two when ready for stronger tests.  
4. Redeploy / confirm the revision is active; optionally capture one cold-start log line `[trust_runtime] cold_start_posture` showing `wallet_topup_receipt_enforced: true` (and siblings if set).

**5. Exact evidence bar for R1 → PASS (attach to RC / this board)**

- **Staging project:** explicit project ID (and, if different from `.firebaserc` default, a one-line note that staging ≠ default).  
- **Deployment proof:** `walletOps` **revision / generation** (or deploy timestamp) for that project.  
- **Config proof:** IaC snippet, Parameter Manager reference, **or** redacted console export listing the three variables and values (`1` / unset as intended) on that revision.  
- **Met for `ket-noi-global` / `walletOps` (2026-04-10):** [R1 evidence — walletOps receipt strict ON (2026-04-10)](#r1-evidence--walletops-receipt-strict-on-2026-04-10) (project ID, active revision, deploy + cold-start runtime proof for strict flag and siblings). For **other** target environments, repeat the three bullets and link a new subsection.

<a id="r1-evidence--walletops-receipt-strict-on-2026-04-10"></a>

### R1 evidence — walletOps receipt strict ON (2026-04-10)

Recorded after enabling receipt strictness and redeploying **`walletOps`** for P4.

| Field | Value |
|--------|--------|
| **Project ID** | `ket-noi-global` |
| **Region** | `europe-west1` |
| **Function name** | `walletOps` (Gen 2) |
| **Active revision (Cloud Run)** | `walletops-00002-xir` |
| **Function `updateTime` (GCP audit)** | `2026-04-10T21:37:30.293794206Z` |
| **Deploy label `firebase-functions-hash`** | `a42131f47cca591fc33dd83a3ed208902bf1da28` |
| **Canonical backend base** | `https://europe-west1-ket-noi-global.cloudfunctions.net` |
| **Strict receipt env source** | `functions/.env` in repo (gitignored) with `WALLET_TOPUP_REQUIRE_PAYMENT_RECEIPT=1` |
| **Deploy-time proof (CLI)** | Firebase CLI logged `Loaded environment variables from .env` during `firebase deploy --only functions:walletOps --project ket-noi-global` |
| **Runtime proof (Cloud Logging)** | After `DEPLOYMENT_ROLLOUT`, `[trust_runtime] cold_start_posture` includes `wallet_topup_receipt_enforced`: **true**; `wallet_topup_receipt_require_wallet_uid`: **false**; `wallet_topup_receipt_require_credits_grant`: **false**; `app_check_enforced`: **false** |

**Operational workflow used:** standard Firebase Functions deploy from this repo (`firebase.json` → `functions` source): `npm install` + `npm run build` under `functions/`, then `firebase deploy --only functions:walletOps --project ket-noi-global` from repo root.

<a id="r2-strict-on-harness-status-2026-04-10"></a>

### R2 strict-ON harness status (2026-04-10)

| Scenario | Status | Notes |
|----------|--------|--------|
| **B — `missing-only`** | **Superseded by runtime session** | Bản ghi 2026-04-10 trước đây: blocked (thiếu token). **Cập nhật:** session vận hành mới — **409** `payment_receipt_missing` / nhánh strict ON đã quan sát; chi tiết [R2 runtime evidence — latest W1 session](#r2-runtime-evidence--latest-w1-session). |
| **C — `seeded-flow`** | **Superseded by runtime session** | Bản ghi 2026-04-10 trước đây: blocked. **Cập nhật:** `seed-payment-receipt` + **`seeded_success_and_duplicate`** thành công — [R2 runtime evidence — latest W1 session](#r2-runtime-evidence--latest-w1-session). |

<a id="r2-runtime-evidence--latest-w1-session"></a>

### R2 runtime evidence — latest W1 session

| Scenario | Operator result | Ghi chú |
|--------|-----------------|--------|
| **B — strict ON, missing receipt** | **PASS (evidence)** | HTTP **409**, `payment_receipt_missing` — **receipt strict ON** được chứng minh. |
| **C — seeded full path** | **PASS (evidence)** | Seed receipt thành công; **`seeded_success_and_duplicate`** thành công (topup + replay trùng). |
| **Công cụ** | Ghi nhận | Trên Windows/Node, sau output thành công có thể có assertion libuv (`UV_HANDLE_CLOSING`). **Coi là nhiễu teardown sau thành công** cho tới khi có bằng chứng ngược; **không** xóa kết luận B/C ở trên. |

**Giới hạn:** R2 **hàng tổng** vẫn **In progress** cho tới khi R3 / archive đỏacted đầy đủ theo board và **`trust:live` không còn fail aiProxy** (nếu board gộp tiêu chí đóng).

<a id="trustlive-vs-aiproxy-mở"></a>

### trust:live vs aiProxy (mở)

Theo `scripts/trust-live-smoke.mjs`, **`trust:live` chỉ PASS khi cả ba nhánh** (walletOps, b2bStaffQueueSnapshot, aiProxy) đạt tiêu chí OK trong script.

| Surface | Session gần nhất | Ý nghĩa |
|---------|------------------|--------|
| walletOps | **200**, ledger đọc được | OK |
| b2bStaffQueueSnapshot | **403** | OK theo runbook (từ chối claim/App Check có cấu trúc) |
| **aiProxy** | **500** `{ "ok": false, "error": "proxy_error" }` | **FAIL theo smoke** — **không** ký **trust:live** full PASS; **không** coi Wave 1 trust runtime là đóng hết vì nhánh này. |

**Repo anchor (không đoán nguyên nhân production):** Trong `functions/src/index.ts`, **`proxy_error` + HTTP 500** chỉ đến từ **`catch`** sau khi đã qua App Check và (nếu bật) Firebase bearer — tức lỗi **ném từ `openaiProxy`** (vd. `OPENAI_API_KEY` thiếu/sai, OpenAI upstream trả !ok, lỗi mạng) hoặc exception khác trong nhánh `op === 'chat'`. **Xác định gốc cần Cloud Logging** (`[aiProxy] error`) và secret manager trên GCP; không kết luận DONE trong doc cho tới khi có bằng chứng sửa/env.

**Bước tiếp theo tối thiểu (external / manual — không suy đoán):** (1) Mở **Cloud Logging** cho function **`aiProxy`**, lọc **`[aiProxy] error`**. (2) Trên cùng project/revision, xác minh **`OPENAI_API_KEY`** đã gắn đúng cho Gen2/Functions. (3) Nếu deploy/ảnh runtime nghi lệch, **redeploy từ source** theo quy trình chuẩn (không chỉnh sửa thủ công artifact không theo repo). (4) Chạy lại **`npm run trust:live`** với cùng biến `TRUST_SMOKE_*` và lưu stdout mới trước khi cập nhật bảng “session gần nhất”.

**Checklist operator + mẫu evidence (Logging / GCP / mẫu điền):** `docs/WAVE1_OPERATIONS_CLOSURE_RUNBOOK.md` § **B3b**.

### R2 staging receipt verification runbook

**1. Exact commands** (repo root; same script as `npm run verify:receipt` → `scripts/verify-receipt-strictness.mjs`)

| Step | Command |
|------|--------|
| Auto (detect strict on/off, then run applicable branch) | `TRUST_SMOKE_BACKEND_BASE=<https://…region…project…cloudfunctions.net> TRUST_SMOKE_ID_TOKEN=<Firebase ID JWT> npm run verify:receipt` |
| Strict probe — missing receipt only | Same env + `npm run verify:receipt -- missing-only` **or** `node scripts/verify-receipt-strictness.mjs missing-only` |
| Full strict ON path (seed receipt + topup + duplicate) | After auto shows strict ON (exit `2`) or you know strict is on: `TRUST_SMOKE_BACKEND_BASE=… TRUST_SMOKE_ID_TOKEN=… GOOGLE_APPLICATION_CREDENTIALS=<path-to-service-account.json> VERIFY_RECEIPT_FIREBASE_UID=<uid matching token sub> node scripts/verify-receipt-strictness.mjs seeded-flow` |
| Seed only (alternative to inline seed) | `npm run receipt:seed --prefix functions -- <paymentEventId> <firebaseUid> [credits]` (requires ADC / `GOOGLE_APPLICATION_CREDENTIALS` for the **same** Firestore project as `walletOps`) |

**2. Required env / credentials / targets**

| Need | Detail |
|------|--------|
| **Target** | HTTPS base URL of deployed **`walletOps`** (no trailing slash). Script calls `POST {base}/walletOps`. |
| `TRUST_SMOKE_BACKEND_BASE` **or** `EXPO_PUBLIC_BACKEND_API_BASE` | Same base as above (harness prefers `TRUST_SMOKE_BACKEND_BASE` if set). |
| `TRUST_SMOKE_ID_TOKEN` | Short-lived Firebase **ID token** for the wallet owner used in the probe. |
| `TRUST_SMOKE_APP_CHECK` | **Optional**; required only if that deployment enforces App Check on `walletOps` (`FIREBASE_APP_CHECK_ENFORCE=1`). |
| `GOOGLE_APPLICATION_CREDENTIALS` (or ADC) | **Required for `seeded-flow` / `receipt:seed` only** — Admin SDK access to Firestore **in the same project** as the Functions deployment. |
| `VERIFY_RECEIPT_FIREBASE_UID` | **Required for `seeded-flow`** — Firebase Auth UID of the wallet owner (must match the user behind `TRUST_SMOKE_ID_TOKEN`). |
| `VERIFY_RECEIPT_PAYMENT_EVENT_ID`, `VERIFY_RECEIPT_CREDITS_AMOUNT` | **Optional** overrides for `seeded-flow` (defaults: generated id and `10` credits). |

**Staging access:** not assumed. Operators supply URL, token, and (if needed) service account; R2 does not run without them.

**3. Scenarios possible with “repo + operator secrets” only (no R1 PASS)**

| Scenario | Runnable? | Notes |
|----------|-----------|--------|
| **A — Strict OFF:** duplicate idempotency | Yes, if base URL + ID token reach a deployment where `WALLET_TOPUP_REQUIRE_PAYMENT_RECEIPT` is **not** `1`. | Mutates wallet (small test amounts in script). |
| **B — Strict ON:** missing receipt → **409** `payment_receipt_*` | Yes, with same URL + token **if** that deployment has strict receipt **on**. | `missing-only` → exit `0` when strict; exit `1` if topup succeeds without receipt. |
| **C — Strict ON:** seeded receipt → topup OK → duplicate | Yes, if strict on **and** Admin creds + `VERIFY_RECEIPT_FIREBASE_UID` + token; seed writes `platform_payment_receipts/*` via `functions/scripts/seed-payment-receipt.cjs`. | **Staging-only** risk: credits balance changes. |

**4. Blocked / not honest for P4 until R1 evidence exists**

| Item | Why |
|------|-----|
| Attributing runs to **“the” approved staging** backend | Repo does not define staging; R1 PASS requires named project + `walletOps` revision + env proof. Without it, logs prove behavior on **some** URL, not the board-approved staging slice. |
| Treating **strict ON** results as RC-closed **W1-04** for that slice | Same: need R1 so reviewers know flags and project match the intended staging revision. |
| **C (seeded-flow)** as formal evidence | Still needs matching Admin project + user; without R1, you cannot show the run targeted the same deployment as the documented strict env. |

Strict OFF scenario **A** can still be executed and archived for W1-04 **without** R1, as long as the log states which base URL was used (evidence is self-describing but not “board-certified staging”).

**5. Artifacts to save after each run**

- Full **stdout + stderr** capture (redact tokens / secrets).  
- **Exit code** (`0`, `1`, or `2`).  
- **Command line** (env var *names* only in doc; values in secure store).  
- **Timestamp (UTC)** and **git commit SHA** of the repo used.  
- **Target base URL host** (may redact path/query if policy requires; must remain identifiable to operators).  
- Any **JSON evidence lines** emitted (`wave1: receipt_strictness`, …).

**6. Pass / fail criteria (per scenario)**

| ID | Scenario | **Pass** | **Fail** |
|----|----------|----------|----------|
| **A** | Strict OFF — duplicate | Exit **`0`**; stdout includes `[verify-receipt-strictness] OK: receipt strict OFF; duplicate replay returns duplicate:true.` and a JSON line with step `duplicate_idempotent_ok`. | Exit **`1`**, or probe succeeds without prior receipt while strict should be off, or second topup does not return `duplicate: true`. |
| **B** | Strict ON — missing receipt | **`missing-only`:** exit **`0`** and JSON `missing_receipt_denied` with `status: 409` and `error` starting with `payment_receipt_`. **Auto:** exit **`2`** acceptable for W1-04 “strict ON (missing)” *if* stdout includes strict-ON detection and JSON `server_receipt_strict_on` with 409 / `payment_receipt_*` (then run **C** for full path). | **`missing-only`:** exit **`1`** (e.g. topup succeeded without receipt). **Auto:** unexpected probe (exit **`1`**) or no 409 when strict is expected on. |
| **C** | Strict ON — seeded full | Exit **`0`**; stdout `OK: seeded receipt → topup → duplicate replay.` and JSON `seeded_success_and_duplicate`. | Any non-zero exit from seed script, topup, or duplicate step. |

**Note:** Exit **`2`** from **auto** alone is **not** full W1-04 closure for strict ON; it is partial until **C** passes or product accepts partial evidence per `docs/WAVE1_CLOSURE_EVIDENCE.md`.

### R2 Scenario A operator checklist (run now)

1. **Command** (repo root; `auto` mode — classifies server, runs duplicate path only when strict is **off**):

   ```bash
   TRUST_SMOKE_BACKEND_BASE="https://<region>-<project>.cloudfunctions.net" TRUST_SMOKE_ID_TOKEN="<Firebase ID JWT>" npm run verify:receipt
   ```

2. **Minimal env vars** — **required:** `TRUST_SMOKE_BACKEND_BASE` **or** `EXPO_PUBLIC_BACKEND_API_BASE` (HTTPS base, **no** trailing slash; same host `walletOps` uses). **Required:** `TRUST_SMOKE_ID_TOKEN`. **Optional:** `TRUST_SMOKE_APP_CHECK` if that deployment enforces App Check on `walletOps`.

3. **Artifact files to save locally** — (a) **full terminal capture** stdout + stderr, **redacted** (no JWT, no refresh tokens). (b) **Small metadata sidecar** (plain text): UTC time, `git rev-parse HEAD`, exit code, and the Scenario A evidence block from [R2 operator evidence template](#r2-operator-evidence-template) filled in.

4. **File naming** — Use a single folder per run, e.g. `r2-scenario-a-<YYYYMMDD>-<HHMMSS>Z-<short-host>/` where `<short-host>` is a safe slug (e.g. `europe-west1-myproj-cf-net`). Inside: `console.log` (or `run.log`) for redacted output, `meta.txt` for metadata + evidence block. Example: `r2-scenario-a-20260409-143201Z-europe-west1-ketnoi/r2-scenario-a.log` + `r2-scenario-a.meta.txt`.

5. **Exact note if R1 is still open** — Paste into `meta.txt` (Notes / limitations) when targeting an environment **without** R1 proof. For **`ket-noi-global` / `walletOps`**, R1 is **PASS** on file ([R1 evidence — walletOps receipt strict ON (2026-04-10)](#r1-evidence--walletops-receipt-strict-on-2026-04-10)); use instead:

   `This run documents walletOps behavior at the stated host and revision; R1 proof for ket-noi-global is linked from docs/P4_EXECUTION_BOARD.md §R1 evidence (2026-04-10).`

6. **PASS / FAIL (Scenario A only)** — **PASS:** exit code **`0`**, and log contains `[verify-receipt-strictness] OK: receipt strict OFF; duplicate replay returns duplicate:true.` and a JSON line with `"step":"duplicate_idempotent_ok"`. **FAIL:** exit **`1`** or **`2`**, or duplicate replay does not return `duplicate: true`, or expected strict-OFF signals above are missing. *(Exit **`2`** here means the server behaved as **strict ON**; that is **not** Scenario A — archive under B / re-run against a strict-OFF deployment.)*

### R2 Scenario A recorded result

**Scenario A (strict OFF, duplicate idempotency):** **PASS** — recorded in [R2 Scenario A evidence — strict OFF PASS](#r2-scenario-a-evidence--strict-off-pass). Operators should still archive **redacted** stdout per the [Scenario A checklist](#r2-scenario-a-operator-checklist-run-now) and fill **[fill]** placeholders in that subsection (UTC time, commit SHA, artifact link) when attaching durable evidence.

**R2 row overall:** remains **In progress** until strict-ON / remaining W1-04 evidence is satisfied or explicitly accepted by the board (see Limits in the evidence subsection).

<a id="r2-scenario-a-evidence--strict-off-pass"></a>

### R2 Scenario A evidence — strict OFF PASS

| Field | Value |
|--------|--------|
| **Date/time UTC** | [fill] |
| **Commit SHA** | [fill] |
| **Project** | ket-noi-global |
| **Region** | europe-west1 |
| **Function** | walletOps |
| **Canonical backend base** | `https://europe-west1-ket-noi-global.cloudfunctions.net` |

**Result**

- `verify:receipt` reached live **`walletOps`** (`POST` to `{canonical base}/walletOps`).
- Harness JSON step **`server_receipt_strict_off`** observed with **HTTP 200** (top-up probe succeeded while receipt strictness was classified as **off** on the deployment).
- **Note:** top-up **succeeded without** a prior **`platform_payment_receipts/{paymentEventId}`** document (consistent with receipt enforcement **off** on that revision).
- Harness JSON step **`duplicate_idempotent_ok`** **passed** for the replayed **`paymentEventId`** (second top-up returned **`duplicate: true`** as expected).
- Final script line: **`[verify-receipt-strictness] OK: receipt strict OFF; duplicate replay returns duplicate:true.`**

**Conclusion**

- **Scenario A** is **PASS** for the **strict-OFF** lane (exit **`0`**, duplicate idempotency confirmed).
- The **backend** accepted **topup** **without** a prior receipt document while receipt enforcement was **off** (per harness classification and server behavior).
- **Duplicate replay** of the same **`paymentEventId`** is **idempotent** as expected (**`duplicate: true`** on replay).

**Limits**

- This result **does not by itself** close **strict-ON** scenarios (B / C / W1-04 strict path); see [R2 strict-ON harness status (2026-04-10)](#r2-strict-on-harness-status-2026-04-10).
- **R1** for **`ket-noi-global` / `walletOps`** is **PASS** with strict ON recorded [above](#r1-evidence--walletops-receipt-strict-on-2026-04-10); this historical **A** run predates that revision.
- **R2 overall** remains **In progress** until **B** / **C** are executed and archived (or waived).

### R2 operator evidence template

Fill one block per run. Store secrets only in approved locations; paste **redacted** logs into tickets or PR appendices.

**Shared fields (every scenario)**

| Field | Example / guidance |
|-------|---------------------|
| **Date/time UTC** | `2026-04-09T14:32:01Z` |
| **Commit SHA** | Full 40-char or short `abc1234` of repo at run time |
| **Backend host** | e.g. `europe-west1-PROJECT.cloudfunctions.net` (no path; redact internal aliases if needed) |
| **Project / environment name** | Operator label, e.g. `ket-noi-global dev` / `staging candidate X` / `unknown — not R1-certified` |
| **Command run** | Full command with env **names** documented separately, e.g. `TRUST_SMOKE_BACKEND_BASE=… TRUST_SMOKE_ID_TOKEN=… npm run verify:receipt` |
| **Exit code** | `0` / `1` / `2` |
| **Artifact links / file names** | e.g. `r2-scenario-a-20260409.log` in release drive; link to CI artifact |
| **Pass / fail conclusion** | `PASS` or `FAIL` vs runbook §6 for this scenario |
| **Notes / limitations** | App Check used? Wallet mutated? Partial vs full W1-04? |

---

**Scenario A — Strict OFF, duplicate idempotency** (copy-paste)

```text
=== P4 / R2 — Scenario A (receipt strict OFF, duplicate) ===
Date/time UTC:
Commit SHA:
Backend host (walletOps base, no trailing slash):
Project / environment name:
Command run: npm run verify:receipt   # auto mode; env: TRUST_SMOKE_BACKEND_BASE, TRUST_SMOKE_ID_TOKEN [+ TRUST_SMOKE_APP_CHECK if used]
Exit code:
Artifact (redacted stdout/stderr): <file name or URL>
Pass/Fail:
Notes / limitations:
```

**Minimum honesty wording when R1 is not PASS (Scenario A only):** add one line under **Notes / limitations**, e.g.  
`This run documents walletOps behavior at the stated host only. It is not asserted as the board-approved staging deployment; R1 PASS (project + revision + receipt env proof) is still open.`  
*(For **`ket-noi-global`** as of 2026-04-10, R1 **is** PASS — use the note in [Scenario A checklist](#r2-scenario-a-operator-checklist-run-now) §5 instead.)*

---

**Scenario B — Strict ON, missing receipt** (copy-paste)

```text
=== P4 / R2 — Scenario B (strict ON, missing receipt) ===
Date/time UTC:
Commit SHA:
Backend host:
Project / environment name:
Command run: npm run verify:receipt -- missing-only   # or: node scripts/verify-receipt-strictness.mjs missing-only
Exit code:
Artifact (redacted stdout/stderr): <file name or URL>
Pass/Fail:
Notes / limitations: (e.g. auto exit 2 + server_receipt_strict_on JSON — cite if using auto for partial strict-ON evidence)
```

---

**Scenario C — Strict ON, seeded full path** (copy-paste)

```text
=== P4 / R2 — Scenario C (strict ON, seeded receipt → topup → duplicate) ===
Date/time UTC:
Commit SHA:
Backend host:
Project / environment name:
Command run: node scripts/verify-receipt-strictness.mjs seeded-flow   # env: TRUST_SMOKE_BACKEND_BASE, TRUST_SMOKE_ID_TOKEN, GOOGLE_APPLICATION_CREDENTIALS, VERIFY_RECEIPT_FIREBASE_UID [optional VERIFY_RECEIPT_*]
Exit code:
Artifact (redacted stdout/stderr): <file name or URL>
Pass/Fail:
Notes / limitations: (confirm Admin project matches Functions/Firestore for this host; wallet balance changed)
```

---

### L2/L3 evidence — 2026-04-09

Short note: tiered `legalLeona` derivation (`calculateCallCreditPrice`); `predictiveSellingEngine` and `autonomy/orchestrator` aligned; fixed 99 constant removed; grep clean in `src/`; `npm run typecheck` PASS; `npm run preflight` PASS.

### C1 approved copy — 2026-04-09

**Policy anchor:** `docs/P0_DECISION_MEMO.md` §6 (pack fiat is static / approximate; do not imply live FX or legally binding local prices) and the same memo’s rule that **Credits debited on the server** are the commercial truth for usage, not a fiat figure on a reference line.

**Where it appears:** Wallet screen — the single `Text` using `styles.unitPrice` in `src/screens/WalletTopUpScreen.tsx`, fed by `interpolate(strings.walletTopUp.unitPriceLine, { inboundName, inboundPrice, outboundName, outboundPrice })`. Shipped as strings-only in `unitPriceLine` (no extra chrome).

**Rationale:** The line shows locale-formatted **local-money** amounts next to persona labels; without framing, users can read that as the **debit unit**. Prefixing with “reference / approximate” and explicitly naming **Credits** as what is debited aligns the row with P0 commercial truth while keeping the static fiat display as orientation only.

**Approved strings (placeholders: `{inboundName}`, `{inboundPrice}`, `{outboundName}`, `{outboundPrice}`; shipped under C2):**

- **en:** `Reference only (approximate local money — calls debit Credits): in-app support ({inboundName}): {inboundPrice} | outbound ({outboundName}): {outboundPrice}`
- **vi:** `Chỉ tham khảo (tiền địa phương ước tính — cuộc gọi trừ Credits): hỗ trợ trong app ({inboundName}): {inboundPrice} | gọi đối ngoại ({outboundName}): {outboundPrice}`

**cs / de:** Same meaning as **en** in `walletTopUp.unitPriceLine` (locale parity); see repo `src/i18n/strings.ts`.

**Out of scope for C1/C2:** **`packPriceLine`** on pack cards and **`TienIchScreen`** utility cards (separate surfaces; **C3** may cover display pipeline).

### C2 evidence — 2026-04-09

Short note: only `src/i18n/strings.ts` changed; Wallet screen logic unchanged; `unitPriceLine` now states reference-only / approximate local money and that calls debit **Credits**; `npm run typecheck` PASS; `npm run preflight` PASS.

### Recommended implementation order (9 items)

1. **L1** — Unblocks all Legal work.  
2. **C1** — Unblocks copy-only wallet clarity (parallelizable with L1 after kickoff).  
3. **R1** — Unblocks strict receipt runs.  
4. **L2** → **L3** — Sequential code alignment.  
5. **C2** — After C1 approval.  
6. **R2** — After R1 (strict ON path); strict OFF can be scheduled earlier if env allows partial runs.  
7. **R3** — After R2.  
8. **C3** — After C2 (or deferred to next wave).

*Practical parallel track:* **L1** + **C1** first; then **R1**; then **L2→L3** and **C2** in parallel where staffing allows; **R2→R3** when staging ready; **C3** last or next program increment.
