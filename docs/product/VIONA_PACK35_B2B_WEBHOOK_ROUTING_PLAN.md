# VIONA Request Engine — Pack35: B2B Omni-Channel Webhook & Agent Routing (Planning Packet)

- Document type: docs-only design/planning packet (no code, no schema migration)
- Packet ID: PACK35-B2B-WEBHOOK-ROUTING-PLAN
- Status: **PLANNING ONLY — no implementation authorized yet**
- Source master: `origin/master` @ `a011b28` (PR #327 — Pack34.5 Tech Debt Eradication, merged)
- Branch: `docs/pack35-b2b-webhook-routing-planning`
- Related: `docs/product/VIONA_PACK34_B2B_MERCHANT_GATEWAY_PLAN.md`;
  `docs/product/VIONA_PACK32_AUTONOMOUS_DISPATCHER_PLAN.md`;
  `docs/product/VIONA_PACK31_FINANCIAL_ESCROW_PLAN.md`;
  `docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md`

---

## 0. Why this packet now

Pack34 gave every merchant a `MerchantProfile` (tenant isolation, AI persona, a read-only tool
scope) — but there is still **no way for a real external message to reach VIONA at all**. Today
the *only* path into the AI Gateway is an authenticated, JWT-bearing `POST /api/viona/requests`
call followed by a service-layer-only `dispatchVionaAutonomousRequest()` invocation — there is no
HTTP route that a WhatsApp Business number, a custom merchant client, or any other external
channel could call. Pack35 is the **missing front door**: an inbound webhook endpoint that
authenticates the *channel* (not a human user), resolves it to the correct `MerchantProfile`
`tenantId`, and safely routes the resulting message into the existing, unmodified Pack32
dispatcher. This packet is docs-only by explicit operator instruction: no code, no Prisma schema
change, no runtime behavior change.

## 1. Header — authorization state (this packet)

| Item | State |
|---|---|
| Docs-only planning | Authorized by explicit operator instruction (this session) |
| Webhook endpoint controller — implementation | **NOT authorized** — design only |
| Webhook signature verification — implementation | **NOT authorized** — design only |
| Channel → tenant mapping schema — implementation | **NOT authorized** — design only |
| Dispatcher wiring (calling `dispatchVionaAutonomousRequest()`) — implementation | **NOT authorized** — design only |
| Idempotency / rate-limiting — implementation | **NOT authorized** — design only |
| Prisma schema change | **NOT authorized** — this packet only describes a proposed new model |
| Real execution / production | **UNCHANGED — still BLOCKED / NOT AUTHORIZED** |

## 2. Baseline — what already exists (this session's discovery, read-only audit)

- **`dispatchVionaAutonomousRequest()`** (`src/services/viona/vionaAutonomousDispatchService.ts`)
  is Pack32's single entry point into the Intent Router (`vionaIntentRouter.ts`) + Tool Registry
  (`vionaToolRegistry.ts`) + Pack30D-4/Pack31 execution chain. It is **service-layer only — not
  wired to any HTTP route today**. Its exact input contract:
  `{ authUserId, requestId, requestStatus, actionId?, requestSafetyLabels?, userMessage,
  operatorApprovalGranted, userConsentGranted, idempotencyKey? }`. **Critically, it does not
  create a `VionaRequest` — it requires an already-existing `requestId`/`requestStatus`.** Its
  module header is explicit that `operatorApprovalGranted`/`userConsentGranted` must be
  **human-supplied only, never inferred from the LLM's output** — this is the single hardest
  design constraint this packet must reconcile with an *unattended* webhook (§5.4).
- **`VionaRequest` creation today** (`vionaRequestCreateService.ts` /
  `POST /api/viona/requests`) is a **JWT-authenticated, Pack19-staging-only** path: it requires 6
  exact safety labels, forbids a long list of side-effect body keys (including `webhook`, `ai`,
  `merchant`, `execute`), and stamps `notProductionReady: true` into `metadataJson`. It was
  designed for internal QA, not real omni-channel production traffic — reusing it as-is for
  webhook ingress would be semantically wrong (§5.3 proposes a parallel, purpose-built creation
  path instead of loosening this one).
- **`MerchantProfile`** (Pack34, `prisma/schema.prisma`) already has `tenantId` (`@unique`),
  `ownerUserId` (`@unique`), `toolScope` (`String[]`), `isActive`, `aiPersona` (`Json?`) — but
  **no field maps an external channel (a WhatsApp phone-number ID, a custom client's API key,
  etc.) to a `tenantId`.** `assertVionaRequestTenantMatchesMerchant()`
  (`src/lib/viona/merchant/vionaMerchantTenantScope.ts`) already exists as the fail-closed
  tenant/active gate this packet's resolved merchant must be passed through — reused verbatim,
  never redesigned.
- **The only production-grade webhook signature verification in this repo is Stripe's**
  (`src/services/api/StripeWebhookService.ts`,
  `verifyStripeWebhookSignature(rawBody, signatureHeader, secret)` — HMAC-SHA256 over
  `${timestamp}.${rawBody}`, `crypto.timingSafeEqual` comparison, mounted in `app.ts` via
  `express.raw()` **before** `express.json()` and before the global rate limiter). No
  `X-Hub-Signature-256` (Meta/WhatsApp-style) or `X-Twilio-Signature`-style verification exists
  anywhere in `src/`. This packet's proposed generic verifier (§4.2) deliberately copies Stripe's
  exact shape (raw body, timestamp-bounded, `timingSafeEqual`) rather than inventing a new scheme.
- **Idempotency today has two live precedents**, both reused verbatim by this packet, never
  reinvented: (a) `vionaRequestCreateService.ts` dedups an optional `idempotencyKey` by scanning
  `VionaRequestAuditEvent` rows for a matching key in `payloadJson`; (b)
  `VionaRequestEscrowHold.idempotencyKey` is a Prisma `@unique` column with a
  find-or-return-existing pattern. `dispatchVionaAutonomousRequest()` already accepts and forwards
  an optional `idempotencyKey` end-to-end — no change needed there.
- **Rate limiting today** is a custom, dependency-free, in-memory sliding-window design — `
  src/middleware/RateLimitMiddleware.ts` (global, path-aware, keyed by IP, with an explicit bypass
  for the Stripe webhook path) and `src/services/local/localRateLimitGuard.ts`
  (`tryConsumeLocalRateLimit(userId, action, requestId?)`, per-user, per-action policies). No
  `express-rate-limit` package dependency exists. This packet's proposed webhook limiter (§6.2)
  follows the exact same in-memory-sliding-window shape, keyed by **channel identifier**, not IP
  (provider IPs are shared/rotating and not attributable to a single merchant).
- **Route mounting convention**: 17 existing route files, each an Express `Router` mounted in
  `src/app.ts`'s `createApp()`. The one precedent for an *unauthenticated*, signature-verified,
  raw-body webhook is the single `app.post('/api/pay/webhook/stripe', express.raw(...), ...)` call
  mounted before `express.json()`. Every existing `vionaRoutes.ts` route requires `authMiddleware`
  — there are currently **zero unauthenticated Viona endpoints**.

**Conclusion:** every piece this packet needs already has a working precedent in this codebase
(Stripe's signature-verification shape, the existing idempotency/rate-limit patterns, Pack32's
dispatcher contract, Pack34's tenant gate) — Pack35's job is to design the **missing glue** that
connects an unauthenticated external message to that dispatcher, safely, not to invent new
primitives.

## 3. Webhook Endpoint Controller

### 3.1 Goal

A single, new HTTP endpoint that accepts inbound messages from external channels (WhatsApp
Business Cloud API, or a custom merchant client using a documented VIONA webhook contract),
verifies the sender, resolves the target merchant, and safely forwards the message into the
existing dispatch chain — without ever trusting the payload's own claimed identity.

### 3.2 Proposed route (description only — no code in this packet)

```
POST /api/viona/webhooks/merchant-agent
```

Mounted the same way Stripe's webhook is mounted in `app.ts` (§2): **before**
`express.json()`, using `express.raw({ type: 'application/json', limit: '256kb' })`, so the
exact raw bytes are available for signature verification (JSON re-serialization is not
byte-stable and must never be used for HMAC input — mirrors the Stripe controller's own comment
to this effect).

Proposed request shape (illustrative — the exact body varies by `channelType`, see §3.3):

```ts
// Proposed, NOT created by this packet.
type VionaWebhookMerchantAgentRequestBody = Readonly<{
  channelType: 'whatsapp' | 'custom_client';
  channelExternalId: string;   // e.g. WhatsApp Business phone_number_id, or a client-issued channel ID
  externalMessageId: string;   // provider's own message ID — used as the idempotency key (§6.1)
  fromExternalContactId: string; // the end-customer's channel identity (e.g. WhatsApp wa_id) — logged, never authenticated as a VIONA User
  messageText: string;
  receivedAtIso: string;
}>;
```

### 3.3 Multi-channel normalization (design only)

Real provider payloads (WhatsApp's Cloud API webhook format in particular) are deeply nested and
provider-specific. This packet proposes a **thin, provider-specific normalization step inside the
controller**, before any shared logic runs: one small mapping function per `channelType`
(`normalizeWhatsAppWebhookPayload()`, `normalizeCustomClientWebhookPayload()`) that each produce
the same internal `VionaWebhookMerchantAgentRequestBody` shape above. This mirrors the existing
`Stripe*Service`/`Stripe*Controller` split (provider-specific parsing in a dedicated file, generic
verification/business logic downstream) rather than branching on `channelType` throughout the
whole call chain.

### 3.4 Response contract (design only)

Every webhook provider (WhatsApp Cloud API included) requires a **fast 2xx acknowledgment** or it
will retry/backoff aggressively. This packet proposes the controller **always** responds `200 OK`
with an empty body as soon as the message is durably accepted (i.e. after the `VionaRequest` row
is created and the dispatch call is at least queued/attempted) — mirroring the Stripe controller's
existing "ack fast, do not leak internal failure detail" pattern — even on a `blockedOperator`
dispatch outcome (that is a correct application-level result, not a webhook delivery failure).
Only signature-verification failure, unknown channel, or rate-limit rejection return a non-2xx
status (401/404/429 respectively), which is the correct signal for "do not retry, this request is
structurally invalid" versus WhatsApp's own retry-on-5xx/timeout semantics.

## 4. Security & Authentication

### 4.1 Goal

Every accepted webhook call must be provably from the claimed channel (never trust the payload's
own `channelExternalId`/`tenantId` claim without cryptographic proof), and must resolve to
*exactly* one `MerchantProfile`, with zero possibility of one merchant's webhook traffic being
misattributed to another merchant's `tenantId`.

### 4.2 Signature verification (design only — reuses Stripe's exact shape)

```ts
// src/services/viona/vionaWebhookSignatureVerificationService.ts (proposed, NOT created by this packet)
// Deliberately mirrors verifyStripeWebhookSignature()'s exact shape: raw body, timestamp-bounded,
// HMAC, crypto.timingSafeEqual. No new cryptographic scheme is invented.
export function verifyVionaWebhookSignature(
  rawBody: Buffer,
  signatureHeader: string | undefined,
  signingSecret: string,
  nowMs?: () => number,
): Readonly<{ ok: true } | { ok: false; reason: 'missing_header' | 'bad_format' | 'stale_timestamp' | 'signature_mismatch' }>;
```

- **WhatsApp Cloud API** channels: verified against Meta's `X-Hub-Signature-256` header
  (`sha256=<hmac>` over the raw body, keyed by the WhatsApp App Secret) — a documented, standard
  Meta webhook contract; this packet does not invent a new scheme for it, only proposes wiring the
  existing per-app secret into the generic verifier above.
- **Custom client** channels: verified against a **per-`MerchantWebhookChannel`** signing secret
  (§4.3), using the exact same generic verifier — timestamp + HMAC-SHA256 + `timingSafeEqual`,
  identical to Stripe's own scheme, documented once so any future channel type can reuse it rather
  than each channel type inventing its own crypto.
- **Replay protection**: the timestamp embedded in the signature header must be within a bounded
  window (proposed: 5 minutes, matching common webhook-provider tolerance) of the server's current
  time — a stale, replayed signature (even if cryptographically valid) is rejected as
  `stale_timestamp`. This is **in addition to**, not a replacement for, the idempotency check in
  §6.1 (signature staleness stops replay of an *old* request; idempotency stops *duplicate delivery
  of the same, fresh* request).
- **No `authMiddleware`, no JWT.** The webhook caller is a machine, not a logged-in VIONA `User` —
  the signature check *is* the authentication, exactly mirroring the Stripe webhook's own
  unauthenticated-but-signature-verified pattern. This is an explicit, deliberate departure from
  every other Viona route (§2), called out so a future implementation review does not mistakenly
  "fix" it by bolting on `authMiddleware`.

### 4.3 Channel → tenant mapping (proposed schema, description only — no migration in this packet)

```
VionaMerchantWebhookChannel (NEW model, PROPOSED — NOT created by this packet):
  id                    String   @id @default(uuid())
  merchantProfileId     String                     // FK -> MerchantProfile.id
  channelType           String                     // 'whatsapp' | 'custom_client' (plain String, mirrors MerchantProfile.toolScope's own "no new enum" convention)
  channelExternalId     String                     // e.g. WhatsApp phone_number_id, or a client-issued channel ID
  signingSecretHash     String                     // hashed at rest — the raw secret is never stored/logged; mirrors existing password-hash conventions (never plaintext, never reversible)
  isActive              Boolean  @default(false)   // fail-closed default, same convention as MerchantProfile.isActive (Pack34 §3.2)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@unique([channelType, channelExternalId])        // exactly one merchant may claim a given channel identity
  @@index([merchantProfileId])
```

Design notes:
- A **separate model**, not a new field bag on `MerchantProfile` itself — a merchant may plausibly
  register more than one channel (WhatsApp + a custom client) against the same `tenantId`/
  `MerchantProfile`, and channel secrets have a different rotation/security lifecycle than the
  merchant's persona/tool-scope fields. This mirrors Pack34's own precedent of keeping
  `MerchantProfile` narrow and adding new, purpose-scoped models alongside it rather than growing
  one model indefinitely (§3.4 of the Pack34 plan explicitly made the same choice for `Business`
  vs. `MerchantProfile`).
- `@@unique([channelType, channelExternalId])` is the **entire enforcement mechanism** for "map
  the incoming payload to the correct `tenantId`": the controller resolves this row first (never
  the payload's own tenant/merchant claim, which is not proposed to exist in the payload at all —
  see §3.2, the body has no `tenantId` field by design), then reads `merchantProfileId` →
  `MerchantProfile.tenantId` → passes both through `assertVionaRequestTenantMatchesMerchant()`
  (Pack34, reused verbatim) before anything else happens.
- `isActive: false` default on the **channel binding**, independent of `MerchantProfile.isActive`
  — a merchant's AI Gateway account can be active while a specific channel binding is
  provisioned-but-not-yet-verified (e.g. WhatsApp's own number-verification flow completes
  asynchronously). Both flags must be `true` for a webhook to be accepted (fail-closed on either).

## 5. Dispatcher Integration

### 5.1 Goal

Route a signature-verified, tenant-resolved webhook message into the existing, unmodified Pack32
`dispatchVionaAutonomousRequest()` — creating exactly the `VionaRequest` row it requires as a
precondition, without loosening the existing internal/QA creation path's own constraints (§2).

### 5.2 Proposed flow (illustrative — no code in this packet)

1. Controller verifies the signature (§4.2) → **401** on any failure, no further processing.
2. Controller resolves `VionaMerchantWebhookChannel` by `(channelType, channelExternalId)` (§4.3)
   → **404** if unknown (never a `500`, never leaking whether the ID is "close" to a real one).
3. Controller loads the linked `MerchantProfile` and calls the existing, unmodified
   `assertVionaRequestTenantMatchesMerchant()` (Pack34) plus checks the channel binding's own
   `isActive` → **403** on any gate failure (channel inactive, merchant inactive, or — structurally
   impossible given §4.3's FK, but defensively checked — a tenant mismatch).
4. Idempotency check (§6.1) using `externalMessageId` → if already processed, **200 OK** with no
   further action (no duplicate `VionaRequest`, no duplicate dispatch).
5. A **new, dedicated** creation function — proposed name `createVionaRequestFromWebhookMessage()`
   in a **new** file (§8) — creates exactly one `VionaRequest` row: `tenantId` = the resolved
   merchant's `tenantId`; `requesterUserId`/`ownerUserId` = the resolved merchant's `ownerUserId`
   (§5.4 below explains why, mirroring Pack34 §4's "the merchant pays, not the end-customer"
   design); `sourceUniverse` = a new, proposed literal (e.g. `'viona_omni_channel_webhook'`);
   `sourceFeature` = the `channelType`; `title`/`summary` derived from the message text;
   `metadataJson` records `channelType`, `channelExternalId`, `fromExternalContactId`,
   `externalMessageId` for traceability — **this function is new and parallel to
   `createVionaRequest()`, which remains completely untouched** (§2's semantic-mismatch finding:
   Pack19's 6 mandatory safety labels and forbidden-key list were designed for an internal QA
   harness, not real production traffic, and are not proposed to apply here).
6. Controller calls the existing, unmodified `dispatchVionaAutonomousRequest()` with:
   `authUserId: merchantProfile.ownerUserId`, the new request's `requestId`/`requestStatus`,
   `userMessage: <normalized message text>`, `idempotencyKey: externalMessageId`, and
   `operatorApprovalGranted`/`userConsentGranted` derived per §5.4 below (**never** hardcoded
   `true`).
7. Controller responds per §3.4.

### 5.3 Why a new creation function, not a change to `createVionaRequest()`

`createVionaRequest()`'s Pack19 constraints (exact safety-label set, forbidden body keys, staging-
only `notProductionReady` stamp) exist to keep that specific, JWT-authenticated endpoint tightly
scoped to internal QA. Loosening those constraints to accommodate webhook traffic would weaken
that existing guarantee for its *existing* callers. A new, purpose-built function with its own,
webhook-appropriate validation (§9 lists what that validation must still cover, even though it is
not designed in code here) is the same "additive, parallel path — never edit the existing
constrained one" pattern Pack34 §6.2 already used for a future merchant-pricing lookup.

### 5.4 The hardest constraint: `operatorApprovalGranted`/`userConsentGranted` on an unattended channel

`dispatchVionaAutonomousRequest()`'s module header is explicit and load-bearing: these two booleans
must be **human-supplied, never inferred from the LLM's output**. A webhook message arrives with
no human in the loop at request time — so this packet proposes a **standing, pre-granted consent**
model, set by an actual human (the merchant's admin) *in advance*, not per-message:

```ts
// Proposed additive field on VionaMerchantWebhookChannel (§4.3) or MerchantProfile — exact
// placement deferred to implementation review; NOT created by this packet:
standingApprovalForReadOnlyToolsOnly: Boolean @default(false)   // fail-closed
```

- When `true`, the webhook controller derives `operatorApprovalGranted = true` and
  `userConsentGranted = true` for the dispatch call — but this packet proposes an **additional,
  non-negotiable guard that must ship in the same implementation increment**: the derived
  `true` values may only ever reach `dispatchVionaAutonomousRequest()` when the Intent
  Router's resolved tool (§2, `vionaToolRegistry.ts`) has `category: 'merchant_read_only_query'`
  **and** `merchantScopedOnly: true` **and** its `name` is present in the merchant's
  `toolScope` (Pack34). For every other tool (including the existing `twilio_test_sms_poc` /
  `marketing_content_generator`, and any future write-capable merchant tool), the webhook path
  must set both flags to `false` regardless of the standing-approval flag, which will correctly
  cause `dispatchVionaAutonomousRequest()`'s existing, unmodified downstream gate to reject with
  `blockedOperator` — exactly the same fail-closed outcome as today for any caller that omits
  consent.
- This satisfies the "human-supplied" constraint literally (a human — the merchant admin —
  supplied it, once, explicitly, out-of-band) while never allowing an unattended channel to
  auto-approve a write/execution-triggering tool. A future implementation review must treat this
  guard as **safety-critical** (§10 test plan item 4) precisely because it is the one place this
  packet lets a machine act without a human confirming that specific message.
- **Explicit non-goal**: this packet does not design standing approval for *any* write-capable
  tool. That remains exactly as far out of scope as Pack34 §5.3/§9 already left it — a future,
  separately-reviewed pack, with its own, almost certainly per-message (not standing) approval
  model given the materially higher risk.

## 6. Idempotency & Rate Limiting

### 6.1 Idempotency (design only — reuses existing patterns verbatim)

- The provider's own `externalMessageId` (§3.2) is used as the `idempotencyKey`, forwarded
  unchanged through the new creation function (§5.2 step 5) and into
  `dispatchVionaAutonomousRequest()`'s existing, already-supported optional `idempotencyKey`
  parameter (§2) — no new dedup table, no new column type.
- Dedup check mirrors `vionaRequestCreateService.ts`'s existing pattern exactly: before creating a
  new `VionaRequest`, scan for an existing audit event whose payload's `idempotencyKey` matches.
  On a match, short-circuit to **200 OK**, no new row, no dispatch call, no double-billing risk
  through the Pack31 escrow chain.
- This defends against the documented behavior of real webhook providers (WhatsApp Cloud API
  explicitly warns it may redeliver the same event) without requiring provider-specific dedup
  logic — the same `externalMessageId`-as-idempotency-key approach works for every `channelType`.

### 6.2 Rate limiting (design only — reuses the existing in-memory sliding-window shape)

- Proposed new limiter, same shape as `tryConsumeLocalRateLimit()` (§2) but keyed by
  **`(channelType, channelExternalId)`**, not IP or `userId` — because a single WhatsApp Business
  number's traffic must be judged on its own, independent of the shared IP ranges Meta's
  infrastructure sends webhooks from, and independent of any VIONA `User` (there is no
  authenticated user on this path).
- Two independent limits proposed (exact numbers deferred to implementation review, not decided in
  this packet): (a) a **per-channel** limit (protects one merchant's own traffic from
  self-inflicted spam/misconfigured retry loops) and (b) a **global webhook-route** limit
  (protects shared downstream LLM/Twilio spend — the same *concern* Pack30D-5's Circuit Breaker
  addresses for provider spend, reused as a pattern, not as code, since that breaker is keyed by
  provider, not by inbound channel).
- Mounting order mirrors Stripe's exact precedent (§2): the new webhook route needs its own
  explicit bypass entry in the global `pathAwareApiRateLimiter`'s path table (so the generic IP-
  keyed limiter does not double-count against a shared provider IP range), with the
  channel-keyed limiter enforced *inside* the controller/a dedicated middleware instead.
- Rejections return **429**, counted as a security-relevant event but never as a webhook
  "delivery failure" that should make the provider retry indefinitely — a 429 is a valid terminal
  response for a legitimate provider retrier to eventually give up on.

## 7. Explicit boundary: what this packet does NOT touch

| File | Change proposed by this packet |
|---|---|
| `src/services/viona/vionaAutonomousDispatchService.ts` (`dispatchVionaAutonomousRequest()`) | **None.** The webhook controller only calls it, per its existing, unmodified contract. |
| `src/services/viona/vionaRequestCreateService.ts` (`createVionaRequest()`) | **None.** A new, parallel creation function is proposed instead (§5.3). |
| `src/lib/viona/dispatcher/vionaIntentRouter.ts` / `vionaToolRegistry.ts` | **None.** No new tool, no prompt change. §5.4's guard reads existing fields only. |
| `src/services/viona/vionaMerchantProfileService.ts` / `vionaMerchantTenantScope.ts` (Pack34) | **None.** `assertVionaRequestTenantMatchesMerchant()` is reused verbatim (§4.3, §5.2). |
| `src/services/viona/vionaRequestEscrowHoldService.ts` / `vionaExecutionPlanRouteService.ts` (Pack31) | **None.** This packet's read-only-tool-only scope (§5.4) never reaches the escrow chain in its first increment. |
| `src/services/api/StripeWebhookService.ts` / `StripeWebhookController.ts` | **None.** Its signature-verification *shape* is copied as a pattern (§4.2); its code is not touched or imported. |
| `MerchantProfile` model (Pack34) | **None** — the proposed channel mapping lives in a new, separate model (§4.3), not a new field on `MerchantProfile` itself. |
| `prisma/migrations/**` (any existing migration) | **None.** |

## 8. Exact file allowlist — Pack35 future implementation (NOT authorized in this packet)

Listed now, for operator review, so a future implementation phrase can be scoped precisely:

**New files:**
1. `src/controllers/VionaWebhookMerchantAgentController.ts` — the endpoint handler (§3).
2. `src/services/viona/vionaWebhookSignatureVerificationService.ts` — `verifyVionaWebhookSignature()` (§4.2).
3. `src/services/viona/vionaWebhookChannelResolutionService.ts` — resolves `(channelType, channelExternalId)` → `MerchantProfile` (§4.3).
4. `src/services/viona/vionaRequestCreateFromWebhookService.ts` — `createVionaRequestFromWebhookMessage()` (§5.2).
5. `src/middleware/vionaWebhookRateLimitMiddleware.ts` — per-channel sliding-window limiter (§6.2).
6. `src/routes/vionaWebhookRoutes.ts` — new router mounting the raw-body endpoint (§3.2).
7. `scripts/test-viona-pack35-b2b-webhook-routing.ts` — the future implementation's test suite (§10).

**Modified files (additive only):**
8. `prisma/schema.prisma` — new `VionaMerchantWebhookChannel` model only (§4.3); no existing model/field renamed or removed.
9. `src/app.ts` — mount the new raw-body route before `express.json()` (Stripe's exact pattern) + add its path to the rate-limiter bypass table (§6.2).
10. `src/middleware/RateLimitMiddleware.ts` — additive only: one new bypass path-table entry.
11. `docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md` — Kernel sync recording the implementation, once done.

**Explicitly NOT touched by any future Pack35 implementation increment:** every file listed in §7's table above.

## 9. Non-goals / forbidden scope (this packet, and the first future implementation increment)

- No write-capable tool invocation is ever enabled through this webhook path, standing-approval
  flag or not (§5.4) — a hard, safety-critical boundary, not an oversight.
- No real WhatsApp Cloud API / Meta App registration, phone-number provisioning, or credential
  acquisition is performed or designed in operational detail — only the verification *algorithm*
  (§4.2) and mapping *schema* (§4.3) are designed.
- No merchant-facing UI for registering a `VionaMerchantWebhookChannel` or setting the standing-
  approval flag is designed — a prerequisite for real merchant onboarding, tracked as a separate
  future packet.
- No per-tenant spend cap / Circuit-Breaker-style protection is designed in implementation detail
  for this new ingress path (§6.2 only names it as a recommended pattern to reuse) — deferred to
  implementation review or its own future pack.
- No relation between `VionaMerchantWebhookChannel` and the existing `Business`/`BizType` model is
  proposed — structurally independent, same reasoning as Pack34 §3.4.
- No client-side/UI work of any kind is designed or implied.
- No code file listed in §8 is created in this packet — verified in §11/§12 below.

## 10. Required test plan — future implementation pack

1. **Signature verification correctness (pure unit tests, no network):** valid signature + fresh
   timestamp → `ok: true`; missing header, malformed header, wrong secret, and stale timestamp
   (beyond the bounded window) each → their own distinct, documented failure reason — never a
   generic throw.
2. **Channel resolution correctness:** known `(channelType, channelExternalId)` → correct
   `tenantId`/`merchantProfileId`; unknown → rejected (404-shaped result, not a DB error leak);
   two different channels bound to the same merchant both resolve to the same `tenantId`.
3. **Idempotency (critical):** the same `externalMessageId` submitted twice results in exactly one
   `VionaRequest` row and at most one `dispatchVionaAutonomousRequest()` call (spy-based fake, no
   real dispatch) — the second call is a no-op 200.
4. **Standing-approval guard (CRITICAL, safety-relevant):** with
   `standingApprovalForReadOnlyToolsOnly: true`, a resolved tool with
   `category: 'merchant_read_only_query'` + `merchantScopedOnly: true` + present in `toolScope` →
   `operatorApprovalGranted`/`userConsentGranted` derived `true`. Every other case — flag `false`,
   or a resolved tool that is write-capable, or not in `toolScope`, or missing `merchantScopedOnly`
   — must derive `false`/`false` regardless of the standing flag, and the test must assert this for
   every existing registry entry (`twilio_test_sms_poc`, `marketing_content_generator`) explicitly,
   by name, so a future new tool addition cannot silently slip through this guard unnoticed.
5. **Tenant isolation regression:** a webhook resolved to merchant A can never produce a
   `VionaRequest` whose `tenantId` matches merchant B, even under a deliberately adversarial fake
   channel-resolution input (defensive test, not just a happy-path check).
6. **Rate limiting:** exceeding the per-channel threshold → 429, zero dispatch calls made for the
   rejected request.
7. **Contract regression (structural content-scan, NOT a git-diff-vs-origin/master check — see
   the Pack34.5 tech-debt lesson recorded in this repo's own Kernel Handoff):** a test asserts
   `dispatchVionaAutonomousRequest()`, `createVionaRequest()`, and
   `assertVionaRequestTenantMatchesMerchant()` each still export the exact signature this pack
   depends on, via `fs.readFileSync` + string checks — never via `git diff origin/master`, which
   would break the instant any future, unrelated change touches those files.
8. **Full regression:** every existing `scripts/test-viona-*.ts` script (20 today, 21 once this
   pack's own suite is added) must remain 100% PASS after the additive changes in §8.

## 11. Drift Report (this packet)

- `git diff --stat origin/master`: only this new file under `docs/product/`, plus the Kernel
  Handoff and local operator-handoff sync entries for this packet's own creation — zero `.ts`/
  `.tsx` files created or modified, per explicit operator instruction.
- `prisma/schema.prisma`: zero diff.
- `package.json` / lockfile: zero diff. No new npm dependency proposed (the signature-verification
  design reuses Node's built-in `crypto` module, exactly as `StripeWebhookService.ts` already
  does).
- `.env*`: zero diff.
- No HTTP route created or modified.
- No existing test file modified.

## 12. Explicit NO / YES assertions (this packet)

- Real execution enabled? **NO.**
- Production authorized? **NO.**
- Any `.ts`/`.tsx` file created or modified by this packet? **NO.**
- Any Prisma schema/migration change applied? **NO.**
- Any HTTP route created or reachable by running code today? **NO** — design only.
- Any write-capable tool made reachable from an unattended channel, today or in the first future
  implementation increment? **NO** — explicitly forbidden (§5.4, §9).
- Does this packet block or slow down any existing feature? **NO** — purely additive design, zero
  runtime impact.
- Is real WhatsApp/Meta App credential acquisition performed? **NO** — out of scope (§9).

## 13. Recommended next step

1. Operator review of this packet, in particular: (a) whether the standing-approval model in §5.4
   is an acceptable shape for "human-supplied consent" on an unattended channel, (b) whether
   `VionaMerchantWebhookChannel` should be its own model or a field bag on `MerchantProfile`
   (§4.3), and (c) confirmation that read-only-tools-only is an acceptable first increment scope,
   mirroring the same question Pack34 §13 already asked and the operator already answered
   affirmatively for Pack34's own read-only tools.
2. If approved, merge this docs-only PR.
3. A **separate, future** planning-to-implementation phrase (e.g.
   `APPROVE_PACK35_B2B_WEBHOOK_ROUTING_IMPLEMENTATION`) would be required before any code in §8's
   allowlist is written — mirroring the exact two-phase (plan phrase, then implementation phrase)
   pattern already used for Pack30D, Pack31, Pack32, Pack33, and Pack34.
