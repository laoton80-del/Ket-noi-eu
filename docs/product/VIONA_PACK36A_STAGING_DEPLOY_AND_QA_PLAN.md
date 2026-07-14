# VIONA Request Engine — Pack36A: Staging Deployment & Webhook QA (Planning Packet)

- Document type: docs-only design/planning packet (no code, no schema migration, no deployment)
- Packet ID: PACK36A-STAGING-DEPLOY-AND-QA-PLAN
- Status: **PLANNING ONLY — no deployment, no application code change, and no real API call authorized yet**
- Source master: `origin/master` @ `b3134d2` (PR #329 — Pack35 B2B Webhook Routing implementation, merged)
- Branch: `docs/pack36a-staging-deploy-qa-planning`
- Related: `docs/product/VIONA_PACK35_B2B_WEBHOOK_ROUTING_PLAN.md`;
  `docs/product/VIONA_PACK34_B2B_MERCHANT_GATEWAY_PLAN.md`;
  `docs/runbooks/VIONA_PUBLIC_STAGING_API_DEPLOY_PLAN.md`;
  `docs/design/evidence/cursor-pack30d-7-staging-deployment-stage-fix/README.md`;
  `docs/design/evidence/cursor-pack30d-8-internal-real-twilio-poc-route-wiring/README.md`;
  `docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md`

---

## 0. Why this packet now

Pack35 shipped a complete, unauthenticated, signature-verified webhook endpoint
(`POST /api/viona/webhooks/merchant-agent`) and its full supporting cast (channel resolution,
standing-approval gate, idempotency, rate limiting) — but it has only ever been exercised **locally**,
against a local `DATABASE_URL`, via `scripts/test-viona-pack35-b2b-webhook-routing.ts`. It has never
been deployed to `viona-api-staging-eu` on Fly.io, and no `VionaMerchantWebhookChannel` row has ever
been provisioned against the real staging database. Pack36A is the **missing bridge between "code
merged to `master`" and "verified working on the live staging URL"** — exactly the same gap Pack30D-8
closed for the internal Twilio POC route in an earlier session (`test-staging-ping.ts` against
`https://viona-api-staging-eu.fly.dev`). This packet designs that bridge for Pack35's webhook, without
performing any of it: no `fly deploy`, no staging data write, no HTTP call to staging. It is docs-only
by explicit operator instruction.

## 1. Header — authorization state (this packet)

| Item | State |
|---|---|
| Docs-only planning | Authorized by explicit operator instruction (this session) |
| Deployment of `master` to `viona-api-staging-eu` | **NOT authorized** — plan only, no `fly deploy` run |
| Staging data provisioning script (`MerchantProfile` + `VionaMerchantWebhookChannel`) | **NOT authorized** — design only, no script created |
| QA script (`scripts/test-viona-pack36a-staging-webhook-qa.ts`) | **NOT authorized** — design only, no script created |
| Any HTTP call to `https://viona-api-staging-eu.fly.dev` | **NOT authorized** in this packet |
| Any write to the staging database | **NOT authorized** in this packet |
| Real execution / production | **UNCHANGED — still BLOCKED / NOT AUTHORIZED** |

## 2. Baseline — what already exists (this session's discovery, read-only audit)

- **Fly app identity**: a single `fly.toml` targets app `viona-api-staging-eu`, region `fra`
  (Frankfurt), built from `Dockerfile.api` (`node:22-bookworm-slim`, `npm ci --legacy-peer-deps`,
  `npx prisma generate`, `CMD ["npx", "tsx", "src/server.ts"]`). Committed, non-secret `[env]` block
  already sets `VIONA_DEPLOYMENT_STAGE = 'staging'` (Pack30D-7's fix for the `NODE_ENV=production`
  trap), `MARKETING_AUTO_POSTER_ENABLED = '0'`, `TRUST_PROXY_HOPS = '1'`, `JWT_EXPIRES_IN = '7d'`. No
  code or config change is proposed to `fly.toml` by this packet.
- **Deployment is operator-driven, not npm-scripted.** No `deploy`/`fly` script exists in
  `package.json`. The documented command from prior sessions
  (`docs/runbooks/VIONA_PUBLIC_STAGING_API_DEPLOY_PLAN.md`,
  `docs/design/evidence/cursor-pack30d-7-staging-deployment-stage-fix/README.md`) is:
  `fly deploy --app viona-api-staging-eu --remote-only`. This packet reuses that exact,
  already-documented command — it does not invent a new deploy mechanism.
- **Secrets are synced via `scripts/fly-staging-sync-secrets.mjs`**, an existing, already-committed
  script that imports `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, AWS/SES vars from
  local `.env`/`.env.local` into Fly's secret store for `viona-api-staging-eu`, with a guard that
  requires the staging Supabase project ref (`euqbfanilcssjiwwtcby`) to appear in the DB URL before it
  will run. Real-provider flags (`PACK30_REAL_PROVIDER_EXECUTION_ENABLED`,
  `TWILIO_TEST_ACCOUNT_SID`/`AUTH_TOKEN`, `PACK30D5_TWILIO_DAILY_CAP_USD_CENTS`,
  `PACK30D_OPENAI_REAL_EXECUTION_ENABLED`) are **deliberately excluded** from this sync script and
  must be set as one-off Fly secrets by the operator — this packet's deploy step (§3) never touches
  them and never needs them, because Pack35's webhook path has no dependency on real-provider
  execution in its first, read-only-tool-only increment (Pack35 plan §5.4/§9).
- **`VIONA_DEPLOYMENT_STAGE` gates real-provider execution and the internal Twilio POC route, but
  NOT the Pack35 webhook route.** `readVionaDeploymentStage()`
  (`src/lib/viona/realProviderAdapter/vionaRealProviderExecutionFlag.ts`) reads this env var and
  `isRealProviderExecutionEnabled()` hard-blocks on `'production'` and requires `'staging'` +
  `PACK30_REAL_PROVIDER_EXECUTION_ENABLED === 'true'` (exact string) to allow real Twilio calls.
  Pack35's webhook controller and route have **no dependency on this flag at all** — their safety
  comes entirely from signature verification + channel/merchant active gates (Pack35 plan §4, §5.2).
  This means a Pack35 webhook QA smoke test can succeed on staging with real-provider execution flags
  left exactly as they are today (unset/false) — no change to those flags is proposed or needed by
  this packet.
- **"Safely deploy without affecting production flags"** concretely means: this packet's deploy step
  (§3) is a plain `fly deploy` of the current `master` — it does not add, remove, or modify any Fly
  secret, does not touch `PACK30_REAL_PROVIDER_EXECUTION_ENABLED` or any other real-provider flag on
  the `viona-api-staging-eu` app (they remain whatever they already are today), and does not touch any
  production Fly app (there is only one Fly app in this repo's `fly.toml`, `viona-api-staging-eu`
  itself — there is no separate production Fly app defined in this codebase to accidentally affect).
- **Precedent for "call the live staging URL from a script and verify a DB side effect"**: the existing
  `scripts/test-staging-ping.ts` already does exactly this shape for the internal Twilio POC route —
  it resolves the base URL from `STAGING_PUBLIC_API_BASE`/`EXPO_PUBLIC_REST_API_BASE` (default
  `https://viona-api-staging-eu.fly.dev`), calls `GET /health` first as a liveness check, then the
  target route, and reports the JSON response. Pack36A's QA script (§5) follows this exact reporting
  shape, adapted for Pack35's unauthenticated, signature-verified route instead of a JWT-bearing one.
- **The webhook route requires no JWT/`authMiddleware` at all** — `src/routes/vionaWebhookRoutes.ts`
  mounts `POST /merchant-agent` behind only `vionaWebhookChannelRateLimiter`; the signature check
  inside the controller *is* the authentication (Pack35 plan §4.2). This materially simplifies QA
  compared to the Pack30D-8 precedent, which required a pilot-account login (`POST /api/auth/login`)
  to obtain a Bearer token first — Pack36A's QA script needs no login step, only a valid HMAC
  signature built from the test channel's own secret.
- **`signingSecretHash`, despite its name, is used verbatim as the raw HMAC key** —
  `vionaWebhookChannelResolutionService.ts`'s own field-level comment states this explicitly ("Used
  directly as the HMAC verification key for this channel"), and
  `VionaWebhookMerchantAgentController.ts` passes `channel.signingSecretHash` straight into
  `verifySignatureFn(raw, header, channel.signingSecretHash, nowMs)` with no hashing/decoding step in
  between. **This is a load-bearing fact for §4's provisioning design**: the staging provisioning
  script must write the plaintext secret directly into `signingSecretHash`, and the QA script must
  read that same plaintext value back to build its signature — there is no bcrypt/SHA pre-image step
  to reverse, unlike a real password-hash column.
- **`buildVionaWebhookSignatureHeader(rawBody, signingSecret, timestampMs?)`**
  (`src/services/viona/vionaWebhookSignatureVerificationService.ts`) is an already-exported,
  already-tested pure function that builds the exact `t=<unixSeconds>,v1=<hex hmac>` header format the
  controller's verifier expects. Pack35's own test suite
  (`scripts/test-viona-pack35-b2b-webhook-routing.ts`) already imports and calls it directly. Pack36A's
  QA script design (§5) proposes importing this **exact, unmodified function** rather than
  reimplementing HMAC construction — this is the single most important reuse decision in this packet,
  because any independent reimplementation risks a subtle mismatch (e.g. payload-join order, hex vs.
  base64) that would produce false QA failures unrelated to the real system under test.
- **Rate limits are generous enough for a single smoke call**: global bucket 50 req/s, per-channel
  bucket 20 req/10s (`src/middleware/vionaWebhookRateLimitMiddleware.ts`). A QA script that sends one
  request (or a small, deliberately-paced handful for an idempotency-replay check) will never approach
  either threshold; this is noted for completeness, not because any mitigation is required.
- **No existing script provisions a `VionaMerchantWebhookChannel` row anywhere**, staging or local.
  `scripts/test-viona-pack34-b2b-merchant-gateway.ts --with-db` creates a `MerchantProfile` (via the
  existing `createMerchantProfile()` service) but never activates it (`isActive` stays `false`) and
  never creates a channel. `scripts/test-viona-pack35-b2b-webhook-routing.ts --with-db` only exercises
  `createVionaRequestFromWebhookMessage()`'s idempotency directly, bypassing the HTTP layer and channel
  resolution entirely. **This is the gap §4 designs a new, standalone provisioning script to close** —
  mirroring the exact "no existing script does this, write one, standalone, dev/staging-only" pattern
  already used for `scripts/provision-test-wallet.ts` in an earlier session.

**Conclusion:** every mechanical piece this packet needs (the deploy command, the secrets pipeline, the
signature-building function, the staging-URL-calling pattern) already has a working precedent in this
codebase. Pack36A's job is to sequence them correctly and design the two small pieces that don't exist
yet — a staging `MerchantProfile`/`VionaMerchantWebhookChannel` provisioning script and a webhook QA
script — not to invent new deployment or cryptographic mechanisms.

## 3. Deployment Strategy

### 3.1 Goal

Get the current `master` (which already contains all of Pack35's code, merged via PR #329) running on
`viona-api-staging-eu` on Fly.io, with zero change to any production-relevant flag, so that the webhook
route physically exists at the live URL for QA to call against.

### 3.2 Pre-deploy checklist (design only — no step executed by this packet)

1. Confirm local `git log origin/master -1` matches the commit the operator intends to deploy (at
   packet-authoring time: `b3134d2`, PR #329).
2. Confirm no uncommitted/staged changes exist in the deploying operator's working tree that could
   accidentally get baked into the Docker build context (`fly deploy` builds from the local checkout,
   not directly from GitHub, unless `--remote-only` with a clean tree is used — this packet proposes
   always using `--remote-only`, §3.3, which builds on Fly's remote builder from the pushed `master`
   ref, avoiding any local-working-tree drift risk entirely).
3. Confirm the Pack35 migration (`20260714100000_pack35_add_merchant_webhook_channel`) is applied to
   the **staging** database *before* traffic hits the new code path — this packet proposes this as an
   explicit, separate step (§3.4), not something `fly deploy` performs automatically (this repo's
   `Dockerfile.api` runs `prisma generate`, not `prisma migrate deploy`, at build/start time — verified
   by reading `Dockerfile.api`; no migration is auto-applied on boot).
4. Confirm no real-provider Fly secret (`PACK30_REAL_PROVIDER_EXECUTION_ENABLED`,
   `TWILIO_TEST_ACCOUNT_SID`/`AUTH_TOKEN`, `PACK30D_OPENAI_REAL_EXECUTION_ENABLED`) is being changed as
   part of this deploy — this packet's deploy step is **code-only**; whatever those secrets are set to
   today on `viona-api-staging-eu` remains unchanged, satisfying "without affecting production flags."

### 3.3 Proposed deploy command (description only — not run by this packet)

```bash
fly deploy --app viona-api-staging-eu --remote-only
```

This is the exact, already-documented command from
`docs/design/evidence/cursor-pack30d-7-staging-deployment-stage-fix/README.md` and
`docs/runbooks/VIONA_PUBLIC_STAGING_API_DEPLOY_PLAN.md` — reused verbatim, not redesigned.
`--remote-only` builds the Docker image on Fly's remote builder from the currently-pushed `master`,
which both avoids relying on the operator's local Docker install and guarantees the deployed artifact
exactly matches what is on GitHub (no local working-tree drift can leak in).

### 3.4 Staging migration step (description only — not run by this packet)

Proposed as a **separate, explicit command**, run once, before or immediately after `fly deploy`
(order does not matter for this specific migration since it is purely additive — a new table — and the
old code never references it):

```bash
npx prisma migrate deploy
```

...run with `DATABASE_URL` pointed at the staging Supabase database (ref `euqbfanilcssjiwwtcby`), the
same DB the deployed Fly app itself uses. This packet proposes using `prisma migrate deploy` (the
production-safe, non-interactive Prisma CLI command that only applies pending migrations and never
generates new ones or prompts for destructive confirmation) rather than `prisma migrate dev`, mirroring
the exact caution already recorded in this repo's own Kernel Handoff for Pack34.5 ("DO NOT run `prisma
migrate dev` if it risks dropping tables"). Before running it, the operator should first run
`npx prisma migrate status` against the staging DB to confirm the **only** pending migration is
`20260714100000_pack35_add_merchant_webhook_channel` and that no other, unrelated drift has appeared —
if any other pending/failed migration is reported, this packet proposes **stopping and re-planning**
rather than proceeding, exactly the same fail-closed posture Pack34.5 used for the `TourismBooking`
ledger drift it found.

### 3.5 Post-deploy verification (description only — not run by this packet)

1. `GET https://viona-api-staging-eu.fly.dev/health` → expect `200`, confirming the new Docker image
   booted successfully (mirrors `test-staging-ping.ts`'s own first check).
2. Confirm via Fly's own tooling (`fly status --app viona-api-staging-eu` / `fly logs`) that exactly one
   healthy machine is running the newly deployed image (no rollback, no crash loop).
3. **No webhook call is made in this step** — that is §5's QA script's job, gated on §4's data
   provisioning having run first.

## 4. Staging Data Provisioning

### 4.1 Goal

Create exactly one active `MerchantProfile` and exactly one active `VionaMerchantWebhookChannel` in the
**staging** database, with a known, plaintext signing secret the QA script (§5) can read back, so
there is a valid target for the webhook QA call to resolve against — without ever touching a real
merchant's data or enabling any write-capable/real-provider capability.

### 4.2 Proposed script (description only — not created by this packet)

```
scripts/provision-staging-webhook-test-channel.ts   (proposed filename; not created by this packet)
```

Design, mirroring `scripts/provision-test-wallet.ts`'s own already-proven shape (idempotent,
deployment-stage-checked, masked-URL-only logging, no destructive operation):

1. **Deployment-stage guard, fail-closed**: read `readVionaDeploymentStage()`
   (reused, unmodified, from `vionaRealProviderExecutionFlag.ts`) and **hard-refuse to run** if the
   resolved stage is `'production'` — exactly the same guard `provision-test-wallet.ts` already uses.
   This script is only ever intended to be run with `DATABASE_URL` pointed at the staging Supabase
   database (operator sets this locally before invoking it), never against a real production database
   (which does not exist in this repo's current Fly topology, but the guard is kept anyway, as a
   structural safety net, mirroring existing convention).
2. **Idempotent lookup-or-create for `MerchantProfile`**: use the existing, unmodified
   `createMerchantProfile()` (`src/services/viona/vionaMerchantProfileService.ts`) with a fixed,
   clearly-synthetic `tenantId` (proposed: `pack36a-qa-tenant`) and `ownerUserId` resolved the same way
   `provision-test-wallet.ts` resolves its target user (`--userId=`/`--phone=`/`VIONA_PILOT_PHONE`/first
   user in DB) — reusing the existing pilot-account convention rather than inventing a new user.
3. **Explicit activation step**: `createMerchantProfile()` always creates with `isActive: false`
   (Pack34's own fail-closed default, verified in §2) and there is no public service function to flip
   it — this proposed script would perform one, narrowly-scoped, direct Prisma
   `prisma.merchantProfile.update({ where: { id }, data: { isActive: true } })` call, logged loudly to
   stdout as an explicit, auditable action, scoped only to this one synthetic QA tenant's row (never a
   bulk update, never touching any other merchant).
4. **Idempotent lookup-or-create for `VionaMerchantWebhookChannel`**: direct Prisma
   `prisma.vionaMerchantWebhookChannel.upsert()` keyed on the model's own
   `@@unique([channelType, channelExternalId])` constraint, with:
   - `channelType`: proposed fixed value `'custom_client'` (avoids any implication of a real WhatsApp
     Business registration, which is explicitly out of scope per Pack35 plan §9).
   - `channelExternalId`: proposed fixed, clearly-synthetic value, e.g.
     `pack36a-qa-channel-<shortRandomOrFixedSuffix>`.
   - `signingSecretHash`: a freshly-generated random secret (proposed: `crypto.randomBytes(32).toString('hex')`),
     written as **plaintext**, consistent with §2's finding that this column is used verbatim as the
     HMAC key, never pre-hashed — the script would print this secret to stdout once so the operator (or
     the QA script, §5) can capture it via an environment variable, never committing it to any file.
   - `isActive: true` (this channel's own active flag, independent of `MerchantProfile.isActive`,
     Pack35 plan §4.3).
   - `standingApprovalForReadOnlyToolsOnly: true` — deliberately enabled, since the QA script's whole
     purpose (§5) is to prove a webhook message reaches the dispatcher; leaving this `false` would
     correctly cause every dispatch to be blocked-by-design (Pack35 plan §5.4), which would make the
     smoke test unable to distinguish "webhook layer worked" from "dispatch was correctly refused" —
     turning it on for this synthetic, isolated QA tenant is the only way to observe the full,
     intended, safe path.
5. **Output**: the script prints the resolved `merchantProfileId`, `tenantId`, `channelType`,
   `channelExternalId`, and the plaintext signing secret to stdout — the operator copies these into
   environment variables the QA script (§5) reads, exactly mirroring how `test-staging-ping.ts` already
   expects `VIONA_PILOT_PHONE`/`VIONA_PILOT_PIN` to be supplied out-of-band rather than hardcoded.
6. **No wallet, no escrow, no real-provider flag is touched by this script** — Pack35's webhook path in
   its read-only-tool-only first increment never reaches the Pack31 escrow chain (Pack35 plan §7), so
   there is nothing for this provisioning step to prepare on that front, unlike the earlier
   `provision-test-wallet.ts`, which existed specifically because the *orchestrator* (Pack31) path does
   touch escrow.

### 4.3 Explicit non-goal for this section

This packet does **not** propose seeding a real WhatsApp Business channel, a real merchant's data, or
any tool beyond the two existing read-only registry entries (`merchant_schedule_availability_check`,
`merchant_inventory_stock_check`) that Pack35's standing-approval guard already permits. The synthetic
`tenantId`/`channelExternalId` values are chosen specifically to be unambiguous test fixtures, easy to
find and delete later if the operator chooses to clean up staging test data (a future, separate,
explicitly-authorized step — not designed here).

## 5. QA Script Design

### 5.1 Goal

A standalone script, run manually by the operator against the **live** staging URL, that proves —
with real HTTP + real DB evidence, not a mock — that a correctly-signed webhook message reaches the
deployed Pack35 endpoint, is accepted, and produces the expected audit trail, without invoking any
real-provider (Twilio/OpenAI real-execution) call, since the underlying dispatched tool in this
increment is read-only only (§4.2 step 4).

### 5.2 Proposed script (description only — not created by this packet)

```
scripts/test-viona-pack36a-staging-webhook-qa.ts   (exact filename, per operator instruction)
```

Design, mirroring `scripts/test-staging-ping.ts`'s already-proven "resolve base URL from env, call
live staging, print structured PASS/FAIL result" shape, and reusing
`buildVionaWebhookSignatureHeader()` (§2) verbatim rather than reimplementing HMAC construction:

1. **Inputs (from environment, never hardcoded secrets)**: `STAGING_PUBLIC_API_BASE` (default
   `https://viona-api-staging-eu.fly.dev`, same convention as `test-staging-ping.ts`), plus the four
   values §4.2 step 5 prints (`PACK36A_QA_CHANNEL_TYPE`, `PACK36A_QA_CHANNEL_EXTERNAL_ID`,
   `PACK36A_QA_SIGNING_SECRET`, and optionally `PACK36A_QA_TENANT_ID` for the final DB-verification
   step, §5.2 step 5). The script fails fast with a clear message if the signing secret is missing —
   never silently falling back to a guessed/default value.
2. **(a) Construct a mock payload**: build the exact
   `VionaWebhookMerchantAgentRequestBody` shape the controller expects (§2,
   `src/controllers/VionaWebhookMerchantAgentController.ts`):
   ```ts
   {
     channelType: process.env.PACK36A_QA_CHANNEL_TYPE,
     channelExternalId: process.env.PACK36A_QA_CHANNEL_EXTERNAL_ID,
     externalMessageId: `pack36a-qa-<timestamp>-<random>`,  // fresh every run, so idempotency never falsely short-circuits a real first-run PASS
     fromExternalContactId: 'pack36a-qa-synthetic-contact',
     messageText: 'What are your opening hours today?',      // deliberately maps to an existing read-only tool's intent
     receivedAtIso: new Date().toISOString(),
   }
   ```
   Serialized once, as a `Buffer`, and that exact buffer is used both as the HMAC input and the HTTP
   request body — never re-serialized in between (§2's byte-stability warning, inherited from the
   Stripe/Pack35 precedent, applies identically here).
3. **(b) Generate a valid HMAC-SHA256 signature**: call the existing, unmodified
   `buildVionaWebhookSignatureHeader(rawBodyBuffer, signingSecret)`
   (`src/services/viona/vionaWebhookSignatureVerificationService.ts`) to produce the
   `t=<seconds>,v1=<hex>` header value — imported directly via a relative `tsx`-resolvable path, exactly
   as `scripts/test-viona-pack35-b2b-webhook-routing.ts` already does today for its own local tests.
4. **(c) Send the POST request to the live staging URL**: plain `fetch()` (Node 22's built-in, no new
   dependency, same convention `test-staging-ping.ts` already uses) —
   ```
   POST https://viona-api-staging-eu.fly.dev/api/viona/webhooks/merchant-agent
   Headers: Content-Type: application/json; x-viona-webhook-signature: <header from step 3>
   Body: <the exact same raw Buffer from step 2>
   ```
5. **(d) Verify the response and the remote DB side effect**:
   - Assert HTTP status is `200` and the JSON body has `accepted: true`, `idempotentReplay: false`,
     and a present `requestId` (per the controller's documented response contract, §2/Pack35 plan §3.4).
   - Using a **second, independent** `DATABASE_URL` connection (Prisma, pointed at the same staging
     Supabase database — the script does not go through the API for this check, mirroring
     `scripts/test-e2e-real-flow.ts`'s own precedent of verifying business outcomes via direct Prisma
     read after an HTTP/service call), query `VionaRequestAuditEvent` for a row matching the returned
     `requestId` with `eventType === 'webhookMessageAccepted'` (the exact literal Pack35 added to
     `vionaRequestAuditEventTypes.ts`) and confirm its `payloadJson` contains the same
     `externalMessageId` sent in step 2 — proving the full round trip (HTTP → signature verify →
     channel resolve → request create → audit write) actually happened on the live staging system, not
     just that the HTTP layer returned a plausible-looking response.
   - Print a clear, structured `PASS`/`FAIL` summary (mirroring every existing `scripts/test-viona-*.ts`
     script's own convention) with the resolved `requestId`, the audit event's `id`/`createdAt`, and
     the elapsed wall-clock time of the HTTP call.
6. **Optional, explicitly-secondary check — idempotency on staging**: re-send the *exact same* signed
   request a second time (same `externalMessageId`) and assert the response now has
   `idempotentReplay: true` and no second `VionaRequestAuditEvent` row was created — proving Pack35's
   idempotency guarantee (plan §6.1) holds end-to-end against the real deployed system, not just in the
   local unit-test suite. This step is proposed as opt-in (e.g. a `--check-idempotency` flag), not part
   of the default run, to keep the primary smoke test's blast radius minimal.
7. **What this script explicitly does NOT do**: it never sends a `messageText` that would resolve to
   any write-capable tool (there are none reachable from this path today, §4.2 step 4's finding,
   Pack35 plan §5.4/§9), never sets `standingApprovalForReadOnlyToolsOnly: false` mid-test, and never
   touches the Pack30D real-provider flags or the escrow chain — its blast radius is exactly "one new
   `VionaRequest` + one new `VionaRequestAuditEvent` row, scoped to the synthetic `pack36a-qa-tenant`
   `MerchantProfile`, with a dispatch outcome that is read-only by construction."

### 5.3 Why HTTP + real DB check, not a mocked test

Every existing Pack35 test (`scripts/test-viona-pack35-b2b-webhook-routing.ts`) already proves the
logic is correct against a local Express app / local DB / mocked dispatch. What has never been proven
is that the **deployed artifact** on Fly, talking to the **real staging Postgres**, with the **real**
raw-body middleware ordering in `app.ts` and the **real** rate-limiter bypass table, behaves the same
way. This is the same category of gap Pack30D-8's `test-staging-ping.ts` closed for the internal Twilio
POC route, and Pack36A closes it for the webhook route using the same "real HTTP call, real DB
verification, no mocks" philosophy — deliberately, not as an oversight.

## 6. Explicit boundary: what this packet does NOT touch

| File / system | Change proposed by this packet |
|---|---|
| `src/controllers/VionaWebhookMerchantAgentController.ts` and all other Pack35 `.ts` files | **None.** This packet only calls the already-deployed, unmodified endpoint from outside. |
| `src/services/viona/vionaWebhookSignatureVerificationService.ts` | **None.** `buildVionaWebhookSignatureHeader()` is imported/reused verbatim by the proposed QA script (§5.2), never reimplemented or modified. |
| `prisma/schema.prisma` / any migration file | **None.** The only migration referenced (§3.4) is Pack35's own, already-committed `20260714100000_pack35_add_merchant_webhook_channel` — applying it to staging is an operational step, not a schema change. |
| `fly.toml` / `Dockerfile.api` | **None.** The deploy command (§3.3) uses the existing, unmodified config as-is. |
| `scripts/fly-staging-sync-secrets.mjs` | **None.** Not run or modified by this packet; assumed already up to date from prior sessions. |
| Any real-provider flag (`PACK30_REAL_PROVIDER_EXECUTION_ENABLED`, `TWILIO_TEST_ACCOUNT_SID`/`AUTH_TOKEN`, `PACK30D_OPENAI_REAL_EXECUTION_ENABLED`, `PACK30D5_TWILIO_DAILY_CAP_USD_CENTS`) | **None.** Not read, set, or relied upon by this packet's proposed deploy or QA design. |
| Any existing `MerchantProfile`/`VionaMerchantWebhookChannel` row (real or previously-created test data) | **None.** §4's proposed provisioning script only creates/updates one new, clearly-synthetic, fixed-`tenantId` row; it does not scan for or modify any other row. |
| `src/services/viona/vionaAutonomousDispatchService.ts` (`dispatchVionaAutonomousRequest()`) | **None.** The QA script only observes its effect via the HTTP response and the audit ledger; it is never called directly or modified. |

## 7. Exact file allowlist — Pack36A future implementation (NOT authorized in this packet)

Listed now, for operator review, so a future implementation/execution phrase can be scoped precisely:

**New files:**
1. `scripts/provision-staging-webhook-test-channel.ts` — staging `MerchantProfile` +
   `VionaMerchantWebhookChannel` provisioning (§4.2). Standalone script; imports existing services only
   (`createMerchantProfile()`); no production/business-logic file modified.
2. `scripts/test-viona-pack36a-staging-webhook-qa.ts` — the QA script (§5.2). Standalone script;
   imports `buildVionaWebhookSignatureHeader()` (read-only import, unmodified) plus Prisma for the
   verification read; makes real HTTP calls to staging only when explicitly run by the operator.

**Modified files:** none proposed. Both new files are additive, standalone scripts under `scripts/`.

**Operational actions (not files, listed for completeness):**
3. `fly deploy --app viona-api-staging-eu --remote-only` (§3.3) — a deployment action, not a file
   change.
4. `npx prisma migrate deploy` against the staging `DATABASE_URL` (§3.4) — an operational action
   applying an already-committed, already-reviewed migration; no new migration file is authored.
5. `docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md` — Kernel sync recording the
   deployment + QA result, once done.

**Explicitly NOT touched by any future Pack36A execution increment:** every file listed in §6's table
above.

## 8. Non-goals / forbidden scope (this packet, and the first future execution increment)

- No `fly deploy`, no `prisma migrate deploy`, and no HTTP call to
  `https://viona-api-staging-eu.fly.dev` is performed by this packet — plan only.
- No real WhatsApp Cloud API / Meta App registration or credential acquisition is performed or
  designed in operational detail — the QA script's `channelType` is the existing, already-supported
  generic `'custom_client'` value, exactly matching Pack35's own already-shipped design (Pack35 plan
  §4.2), not a real Meta integration.
- No real-provider (Twilio/OpenAI) execution path is exercised, enabled, or relied upon — the QA
  script's target tool is deliberately read-only, and no real-provider Fly secret is touched (§6).
- No write-capable tool is exercised through the webhook path in this packet's design, mirroring
  Pack35's own hard boundary (plan §5.4/§9) verbatim.
- No production Fly app is affected — this repo's `fly.toml` defines only `viona-api-staging-eu`; there
  is no separate production app in scope to accidentally touch.
- No cleanup/deletion of the synthetic QA `MerchantProfile`/`VionaMerchantWebhookChannel` test data is
  designed in this packet — left as an explicit, separate, future decision for the operator once QA
  execution has actually run.
- No client-side/UI work of any kind is designed or implied.
- No code file listed in §7 is created in this packet — verified in §10/§11 below.

## 9. Required verification plan — future execution increment

1. **Health check first**: `GET /health` on staging returns `200` before any webhook call is attempted
   — a basic liveness gate, exactly mirroring `test-staging-ping.ts`'s own first step.
2. **Provisioning idempotency**: running the provisioning script (§4.2) a second time against the same
   staging DB must not create a duplicate `MerchantProfile` or `VionaMerchantWebhookChannel` row (the
   existing `@@unique` constraints + the script's own upsert/lookup-first logic must hold) and must
   print the same `tenantId`/`channelExternalId` (only the signing secret may legitimately differ if
   the script chooses to rotate it — a design choice deferred to implementation, not decided here).
3. **QA happy path (CRITICAL)**: a correctly-signed request to the live staging URL returns `200`,
   `accepted: true`, `idempotentReplay: false`, and a real, queryable `requestId`; the corresponding
   `VionaRequestAuditEvent` row with `eventType: 'webhookMessageAccepted'` exists in the staging DB
   within a few seconds of the HTTP call returning (§5.2 step 5).
4. **QA idempotency replay (secondary, opt-in per §5.2 step 6)**: re-sending the identical signed
   request returns `idempotentReplay: true` and creates no second audit row.
5. **Negative control (recommended, not mandatory)**: a deliberately *mis-signed* request (wrong
   secret) against the same live staging channel returns `401`, proving the deployed signature
   verification is actually active in production configuration, not accidentally bypassed by some
   staging-only misconfiguration — this is the single most important negative check, since a silently
   disabled signature check would be a serious, undetected security regression.
6. **No real-provider call observed**: confirm (via Fly logs or the audit ledger) that no
   Twilio/OpenAI real-provider call was attempted as a side effect of the QA run — expected, since the
   dispatched tool is read-only, but worth an explicit assertion given how safety-critical this
   boundary is (Pack35 plan §5.4).
7. **Full regression, unchanged**: this packet's own execution increment touches no production
   TypeScript file (§6), so the existing `typecheck`/`lint`/`scripts/test-viona-*.ts` suite is expected
   to remain exactly as green as it is on `master` today — re-run as a sanity check, not because any
   change to those files is proposed.

## 10. Drift Report (this packet)

- `git diff --stat origin/master`: only this new file under `docs/product/`, plus the Kernel Handoff
  and local operator-handoff sync entries for this packet's own creation — zero `.ts`/`.tsx` files
  created or modified, per explicit operator instruction.
- `prisma/schema.prisma`: zero diff.
- `fly.toml` / `Dockerfile.api`: zero diff.
- `package.json` / lockfile: zero diff. No new npm dependency proposed (the QA script design reuses
  Node's built-in `fetch`/`crypto`, exactly as `test-staging-ping.ts` and
  `vionaWebhookSignatureVerificationService.ts` already do).
- `.env*`: zero diff.
- No `fly deploy` executed. No `prisma migrate deploy` executed. No HTTP request sent to
  `https://viona-api-staging-eu.fly.dev` in the course of writing this packet.
- No existing test file modified.

## 11. Explicit NO / YES assertions (this packet)

- Real execution enabled? **NO.**
- Production affected? **NO** — no production Fly app exists separately from `viona-api-staging-eu` in
  this repo's config, and no real-provider flag is touched.
- Any `.ts`/`.tsx` file created or modified by this packet? **NO.**
- Any Prisma schema/migration change authored or applied by this packet? **NO.**
- Any Fly deployment run by this packet? **NO.**
- Any HTTP request sent to staging by this packet? **NO** — design only.
- Any write to the staging database performed by this packet? **NO.**
- Any write-capable tool made reachable from the webhook path, today or in the proposed QA design?
  **NO** — explicitly forbidden (§8), unchanged from Pack35's own boundary.
- Does this packet block or slow down any existing feature? **NO** — purely additive design, zero
  runtime impact.

## 12. Authorization phrases required for the next phase

Two separable, independently-authorizable actions are designed by this packet. The operator may
authorize them together or separately:

- **`APPROVE_PACK36A_STAGING_DEPLOY`** — authorizes §3 only: running
  `fly deploy --app viona-api-staging-eu --remote-only` and `npx prisma migrate deploy` against the
  staging database. Does **not**, by itself, authorize any data provisioning or QA HTTP call.
- **`APPROVE_PACK36A_WEBHOOK_QA_EXECUTION`** — authorizes §4 and §5: creating the two new provisioning
  and QA scripts listed in §7, running the provisioning script against the staging database, and
  running the QA script's HTTP calls against the live staging URL. This phrase presumes the deploy step
  has already completed (either via `APPROVE_PACK36A_STAGING_DEPLOY` or because the operator confirms
  the relevant code is already live on staging).
- A single combined phrase, **`APPROVE_PACK36A_STAGING_DEPLOY_AND_QA_EXECUTION`**, may be used to
  authorize both in one instruction, mirroring the same "operator states the exact phrase, agent
  executes exactly that scope" pattern already used for Pack30D-8, Pack31, Pack34, and Pack35's own
  implementation phases.

## 13. Recommended next step

1. Operator review of this packet, in particular: (a) whether the two-script design (provisioning +
   QA) in §4/§5 is an acceptable shape, (b) whether `standingApprovalForReadOnlyToolsOnly: true` on a
   synthetic, isolated QA-only tenant is an acceptable scope for proving the end-to-end path (§4.2 step
   4), and (c) which of the §12 authorization phrases to issue, and when.
2. If approved, merge this docs-only PR.
3. A separate, future authorization phrase from §12 would be required before any deployment, script
   creation, or live HTTP call is performed — mirroring the exact two-phase (plan phrase, then
   execution phrase) pattern already used for Pack30D, Pack31, Pack32, Pack33, Pack34, and Pack35.
