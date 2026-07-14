# VIONA Request Engine — Pack37: B2B Dispatcher Realization (Planning Packet)

- Document type: docs-only design/planning packet (no code, no schema migration)
- Packet ID: PACK37-B2B-DISPATCHER-REALIZATION-PLAN
- Status: **PLANNING ONLY — no implementation authorized yet**
- Source master: `origin/master` @ `471818f` (PR #331 — Pack36A Staging Deployment & Webhook QA execution, merged)
- Branch: `docs/pack37-b2b-dispatcher-realization-planning`
- Related: `docs/product/VIONA_PACK36A_STAGING_DEPLOY_AND_QA_PLAN.md`;
  `docs/product/VIONA_PACK35_B2B_WEBHOOK_ROUTING_PLAN.md`;
  `docs/product/VIONA_PACK34_B2B_MERCHANT_GATEWAY_PLAN.md`;
  `docs/product/VIONA_PACK32_AUTONOMOUS_DISPATCHER_PLAN.md`;
  `docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md`

---

## 0. Why this packet now

Pack36A's live staging QA proved the entire webhook front door works end-to-end — signature
verification, channel/tenant resolution, idempotent request creation, audit logging — but it also
surfaced one honest, unglossed-over finding: every webhook call returns `dispatchAccepted: false`.
Not because anything is broken, but because nobody ever finished the job. The Intent Router can
correctly classify a message to `merchant_schedule_availability_check` or
`merchant_inventory_stock_check` (both exist in the Tool Registry since Pack34), and the webhook's
own standing-approval gate can correctly grant `operatorApprovalGranted`/`userConsentGranted: true`
for them — but `dispatchVionaAutonomousRequest()`'s execution `switch` statement
(`vionaAutonomousDispatchService.ts`) has exactly one case, `'twilio_test_sms_poc'`, and every other
tool — including these two, registered, standing-approved, correctly-classified ones — falls through
to `default` and is rejected as `unknown_tool`. Pack37 designs the fix: not by forcing a read-only
merchant query through the Twilio/escrow pipeline that case was built for, but by giving these two
tools their own, real, honest execution path — closing the loop from "the webhook accepted your
message" to "and here is an actual answer computed for your merchant." This packet is docs-only by
explicit operator instruction: no code, no Prisma schema change, no runtime behavior change.

## 1. Header — authorization state (this packet)

| Item | State |
|---|---|
| Docs-only planning | Authorized by explicit operator instruction (this session) |
| `vionaAutonomousDispatchService.ts` switch-statement change — implementation | **NOT authorized** — design only |
| New merchant read-only query execution service — implementation | **NOT authorized** — design only |
| AI persona injection into any LLM call — implementation | **NOT authorized** — design only |
| `OPENAI_API_KEY` added to Fly staging secrets — implementation | **NOT authorized** — design only |
| Webhook response-contract extension — implementation | **NOT authorized** — design only |
| Any new Prisma model/migration | **NOT authorized** — this packet only discusses one as an optional, explicitly-deferred future increment |
| Real execution / production | **UNCHANGED — still BLOCKED / NOT AUTHORIZED** |

## 2. Baseline — what already exists (this session's discovery, read-only audit)

- **The exact gap, byte-for-byte**: `dispatchVionaAutonomousRequest()`'s `switch (entry.name)`
  (`src/services/viona/vionaAutonomousDispatchService.ts`) has one case,
  `case 'twilio_test_sms_poc':`, which delegates to `previewVionaExecutionPlanRealProviderPocRoute()`
  (Pack30D-4/Pack31's Twilio+escrow pipeline) and returns
  `{ ok: true, dispatch: { accepted: true, ... }, route: <Twilio/escrow result> }`. Every other
  matched tool name — including both Pack34 merchant tools — falls to
  `default: return { ok: true, dispatch: { accepted: false, reason: 'unknown_tool' }, route: null }`.
  This is the literal, single line responsible for every `dispatchAccepted: false` Pack36A observed.
- **`DispatchVionaAutonomousRequestResult`'s success variant is Twilio/escrow-shaped, not generic**:
  its `route` field is typed `PreviewVionaExecutionPlanRealProviderPocResult` — a discriminated result
  carrying `planAllowed`, `escrow`, `realProviderResult` fields that make no sense for a read-only
  schedule/inventory lookup. Forcing the 2 merchant tools through this exact type (or through
  `previewVionaExecutionPlanRealProviderPocRoute()` itself) would be a category error, not a fix —
  the same category-isolation reasoning Pack32.1's own module header already documents for why
  `marketing_content_generator` is **never** dispatched by this function at all.
- **The existing, proven precedent for "a new tool category needs its own execution path, not a
  bigger switch statement": `vionaMarketingContentDispatchService.ts`**
  (`dispatchVionaMarketingContentRequest()`). It is a **sibling orchestrator**, never called by and
  never calling `dispatchVionaAutonomousRequest()`, that: (1) reuses the existing, unmodified
  `routeVionaDispatchIntent()` verbatim; (2) defensively re-checks the matched entry's `category`
  (`=== 'content_generation_draft'`, else `wrong_tool_category`) as its **primary safety property** —
  a real-execution tool can never be forwarded through it; (3) calls exactly one new, purpose-built
  function (`generateVionaMarketingContentDraft()`) and returns its own, small, tool-shaped result
  type. Pack37 reuses this exact shape for the 2 merchant tools (§3), not a bigger `switch`.
- **No backing data source exists for either merchant tool today.** A repo-wide search for
  `merchant_schedule_availability_check`/`merchant_inventory_stock_check` outside the Tool Registry
  and Pack34/35/36A test/provisioning scripts returns nothing — no service function, no Prisma model,
  no query. The existing `Booking` model is B2C, keyed to `Business`, not `MerchantProfile.tenantId`.
  These two tools are, today, pure registry placeholders — Pack34's plan explicitly deferred "the
  activation workflow" and never claimed a real data layer either. Pack37 must decide (§3.3) whether
  to design that real data layer now or explicitly defer it again — this packet does the latter by
  default, recommending an honest "not yet configured" answer over any fabricated one (see §3.3's
  reasoning): VIONA's fail-closed doctrine treats a confident-sounding wrong answer as strictly worse
  than an honest "no data available."
- **`MerchantProfile.aiPersona` (Pack34) is fully modeled but has zero callers anywhere in `src/`.**
  `resolveMerchantAiPersona()` (`src/lib/viona/merchant/vionaMerchantAiPersonaTypes.ts`) already
  exists, is already fail-safe (`merchantProfile === null || !isActive` → the frozen
  `VIONA_MERCHANT_AI_PERSONA_DEFAULT`; any unparseable `aiPersona` JSON → the same safe default;
  never throws), and its own module header already states the intended safety contract: the
  persona's `systemPromptAddendum` is "designed to be strictly additive/appended," never a
  replacement for any existing system instruction. Pack37 reuses this function verbatim and designs
  exactly one new call site for it (§4) — it does not redesign the type or its fail-safe behavior.
- **The Intent Router's classification prompt (`buildVionaDispatchClassificationPrompt()`) is a
  single, strict, JSON-only-output system message with no persona injection point today** — and it
  must stay that way. Its own module header states it is "deny-by-default, fail-closed" with six
  documented, tested failure modes; injecting untrusted, merchant-authored free text
  (`systemPromptAddendum`) into the same prompt that decides *which tool gets invoked* would blur the
  line between "how the assistant should sound" and "what the assistant is allowed to do" — exactly
  the kind of prompt-injection surface this packet's design (§4) must close off, not open.
- **`createRoutedChatCompletion()` (`src/services/ai/AIRouterService.ts`) reads
  `process.env.OPENAI_API_KEY` directly, at call time, inside the function body — never at module
  load, never via `src/config/env.ts`'s `getServerEnv()`.** A missing key throws
  `Error('OPENAI_API_KEY is not configured')` at the moment of the call, not before. Today, this
  throw is already caught one layer up: `routeVionaDispatchIntent()` wraps its `deps.callLlm(...)`
  call in a `try/catch` and converts any throw into a typed `{ ok: false, reason: 'llm_call_failed' }`
  — never a process crash, never an unhandled rejection. This means **the existing classification
  call already degrades gracefully today** if `OPENAI_API_KEY` is unset locally — the webhook still
  returns HTTP 200 with `dispatchAccepted: false` (via the `unknown_tool` **or** `llm_call_failed`
  path, depending on which fails first). Pack37 does not need to invent a new degradation mechanism
  for the *classification* call — only for whatever *new* LLM-touching code it adds (§5).
- **`OPENAI_API_KEY` is confirmed absent from both `scripts/fly-staging-sync-secrets.mjs`'s synced
  key list and `.env.example`'s documented variables.** It is currently possible to deploy to
  `viona-api-staging-eu` with zero working LLM classification at all (every tool, not just the 2
  merchant ones, would fail closed with `llm_call_failed`) — a pre-existing gap this packet's §5
  addresses for the first time, independent of the 2 merchant tools' own execution wiring.
- **There is no outbound-reply mechanism anywhere in this codebase.** A repo-wide search for any
  webhook/channel outbound-send/reply service in `src/services/viona/` returns nothing. The Pack35
  webhook is, today, structurally inbound-only: it acknowledges receipt and reports whether dispatch
  was accepted — it has never sent anything back out to WhatsApp, a custom client, or any other
  channel. This is the essential fact behind §6's "Synchronous vs Asynchronous Response" design: this
  packet can only design how an answer gets back into the **existing HTTP response** of the webhook
  call itself, not how it reaches an end-customer's WhatsApp thread — that would require a real,
  provider-specific outbound-send integration, explicitly out of scope (§9), the same scope line
  Pack35 §9 already drew for real WhatsApp Cloud API credential acquisition.

**Conclusion:** every piece this packet needs already has a working precedent in this codebase (the
marketing sibling-orchestrator shape, `resolveMerchantAiPersona()`'s fail-safe design, the existing
`llm_call_failed` graceful-degradation pattern, the existing Fly-secrets-sync mechanism) — Pack37's job
is to compose them correctly for these 2 specific tools, not to invent new primitives.

## 3. Dispatcher Switch Wiring

### 3.1 Goal

Give `merchant_schedule_availability_check` and `merchant_inventory_stock_check` a real, honest
execution path, so a webhook message the Intent Router correctly classifies to either tool produces
`dispatchAccepted: true` — without forcing either tool through the Twilio/escrow pipeline built for
`twilio_test_sms_poc`, and without ever fabricating a plausible-sounding but false answer.

### 3.2 Proposed change to `vionaAutonomousDispatchService.ts` (description only — no code in this packet)

Two coupled changes, both additive:

1. **Broaden the success variant's `route` field into a small, tagged union** — instead of adding a
   parallel, differently-named field (which would force every caller to check two optional fields
   instead of one), this packet proposes generalizing `route`'s type from
   `PreviewVionaExecutionPlanRealProviderPocResult` to a discriminated union tagged by a new `kind`
   field:
   ```ts
   // Proposed, NOT created by this packet.
   export type VionaDispatchRoute =
     | Readonly<{ kind: 'twilioTestSmsPoc'; result: PreviewVionaExecutionPlanRealProviderPocResult }>
     | Readonly<{ kind: 'merchantReadOnlyQuery'; result: VionaMerchantReadOnlyQueryResult }>; // §3.3
   ```
   The existing `twilio_test_sms_poc` case is updated to wrap its existing, completely unchanged
   `previewVionaExecutionPlanRealProviderPocRoute()` call result as
   `{ kind: 'twilioTestSmsPoc', result: <same as today> }` — a pure, mechanical rename/wrap, zero
   behavioral change. The webhook controller today never reads `route` at all (§2), so this is a
   zero-risk change to its only current caller.
2. **Add two new `case` branches**, `case 'merchant_schedule_availability_check':` and
   `case 'merchant_inventory_stock_check':`, each delegating to exactly one new, purpose-built
   function — mirroring the existing `twilio_test_sms_poc` case's own "validate `toolInput` shape,
   delegate to one external service call, wrap the result" structure exactly:
   ```ts
   // Proposed, NOT created by this packet — illustrative shape only.
   case 'merchant_schedule_availability_check':
   case 'merchant_inventory_stock_check': {
     const result = await executeMerchantReadOnlyQuery({
       toolName: entry.name,
       tenantId: input.merchantTenantId,       // new, required input field — see §3.4
       toolInput: decision.toolInput,
     });
     return {
       ok: true,
       requestId,
       dispatch: { accepted: true, toolName: entry.name, confidence: decision.confidence },
       route: { kind: 'merchantReadOnlyQuery', result },
     };
   }
   ```
   Both tool names share one branch because both call the same new dispatcher-facing function
   (§3.3), which itself switches on `toolName` internally — mirroring how the Intent Router already
   treats both as siblings in the same `'merchant_read_only_query'` category.

### 3.3 New execution service: `executeMerchantReadOnlyQuery()` (proposed — not created by this packet)

Proposed new file: `src/services/viona/vionaMerchantReadOnlyQueryExecutionService.ts`. Design
constraints, mirroring `vionaMarketingContentDispatchService.ts`'s own category-isolation discipline
verbatim:

- **Structurally cannot reach a write/execution path.** This file never imports
  `holdVionaRequestExecutionCost()`, `executeVionaTwilioTestPocReal()`,
  `settleVionaRequestExecutionHold()`, `previewVionaExecutionPlanRealProviderPocRoute()`, or any
  Wallet-mutating function — verifiable by a content-scan test (§10 item 7), the same technique
  Pack35's own test suite already uses for its analogous boundaries.
- **Tenant-scoped by construction.** Every query this function runs is scoped to the caller-supplied
  `tenantId` — never a global lookup — closing off the same cross-tenant-leak class of risk Pack34's
  `assertVionaRequestTenantMatchesMerchant()` already guards elsewhere.
- **Result type** (proposed, illustrative):
  ```ts
  export type VionaMerchantReadOnlyQueryResult = Readonly<{
    toolName: string;
    dataAvailable: boolean;
    summary: string;       // machine-generated, deterministic, never LLM-authored at this layer (§4)
    detailJson: Readonly<Record<string, unknown>>;
  }>;
  ```

### 3.4 Data layer decision — the one real design choice this packet must make explicit

No real schedule/inventory table tied to `MerchantProfile.tenantId` exists. Two honest options,
presented for explicit operator choice (§13) rather than this packet silently picking one:

- **Option A — RECOMMENDED for the first increment: deterministic "not yet configured" answer, zero
  new tables.** `executeMerchantReadOnlyQuery()` returns `dataAvailable: false` with a fixed, honest
  `summary` (e.g. "This merchant has not configured real-time schedule data yet.") for every call,
  regardless of the query's actual `toolInput` — no database read beyond confirming the
  `MerchantProfile` is active, no LLM call, no fabrication risk of any kind. This closes the
  `dispatchAccepted: false` gap completely and honestly today, at the cost of the answer being
  uninteresting until a real store exists. This mirrors Pack34's own precedent of shipping an
  "illustrative, not yet backed by real data" capability and deferring the real store to a later,
  separately-scoped increment — the same incremental posture, applied one layer deeper.
- **Option B — explicitly deferred, NOT designed in schema detail here: real, tenant-scoped Prisma
  models** (e.g. `MerchantScheduleSlot`, `MerchantInventoryItem`), populated via a future merchant
  admin UI (itself unbuilt — Pack34 §9 already deferred this), queried for real by
  `executeMerchantReadOnlyQuery()`. This is materially larger (new migration, new admin UI, new
  merchant-facing data-entry workflow) and is named here only so the operator can explicitly choose
  it via a distinct authorization phrase (§13) rather than have it silently bundled into "wire the
  dispatcher" scope.

This packet's own recommendation (Option A) is chosen specifically because it satisfies the literal
ask — closing `dispatchAccepted: false` — without smuggling in an unbounded, much larger data-modeling
project under the same authorization phrase.

## 4. LLM Context Injection (Merchant AI Persona)

### 4.1 Goal

Let a merchant's own `aiPersona` (tone, locale, an additive system-prompt addendum) shape how the
*already-computed, already-safe* query result (§3) is phrased back — without ever letting persona
content influence *which* tool gets invoked or *what* data is claimed to exist.

### 4.2 Where persona is explicitly NOT injected

Reiterating §2's finding as a hard design constraint: **`buildVionaDispatchClassificationPrompt()`
(`vionaIntentRouter.ts`) is never modified, and no persona content is ever appended to it.**
Classification must stay a strict, merchant-content-free, structured-output decision — the Intent
Router has no concept of "which merchant" today and this packet does not give it one. This closes
off the most obvious-looking but most dangerous injection point: a merchant's own free-text
`systemPromptAddendum` must never be able to nudge which tool the classifier picks or persuade it to
accept a message it would otherwise reject.

### 4.3 Where persona IS injected — a second, later, non-tool-calling formatting step

Proposed new function (illustrative, not created by this packet):
`formatVionaMerchantReadOnlyQueryReply(result: VionaMerchantReadOnlyQueryResult, persona: VionaMerchantAiPersona): Promise<string>`
in a new file `src/lib/viona/merchant/vionaMerchantReadOnlyQueryReplyFormatter.ts`, called *after*
§3's `executeMerchantReadOnlyQuery()` has already produced its final, safe `result` — never before,
never in a way that could change `result` itself. Two implementation tiers, both designed here so the
operator can pick a starting point (§13):

- **Tier 1 — deterministic template (default, zero LLM cost/risk):** a fixed, code-shipped template
  per `(toolName, dataAvailable)` pair, with `persona.tone`/`persona.preferredLocale` selecting among
  a small, pre-written set of phrasings (mirroring Pack33's existing, already-shipped
  `vionaServiceMessageDictionary.ts` static-dictionary pattern — reused as a *pattern*, not
  necessarily the same file, since that dictionary is scoped to different message keys). No network
  call, works with zero `OPENAI_API_KEY` configured anywhere, in any environment.
- **Tier 2 — optional, persona-driven LLM phrasing (explicit future/opt-in enhancement, not the
  default):** one additional `createRoutedChatCompletion()` call whose **entire** prompt is: the
  already-computed `result` (verbatim, as data, never as an instruction) plus a clearly-delimited
  "Merchant voice/tone guidance (informational only — does not grant any additional capability or
  change what may be claimed)" block built from `persona.systemPromptAddendum`/`tone`/
  `preferredLocale`. This call is **never given function/tool-calling ability** — it can only
  paraphrase already-safe data, structurally incapable of invoking anything. `response_format` stays
  plain text (not JSON-mode), since there is no structured decision left to make at this point.

### 4.4 Persona resolution call site

`executeMerchantReadOnlyQuery()` (or its caller in `vionaAutonomousDispatchService.ts`) resolves the
persona via one new, small, additive read function proposed for the existing, otherwise-unmodified
`vionaMerchantProfileService.ts` — e.g. `findMerchantProfileById(id: string)` — since
`ResolvedVionaWebhookChannel` (Pack35) already carries `merchantProfileId` all the way to the
dispatcher's input, no change to `vionaWebhookChannelResolutionService.ts` is needed for this. The
fetched row's `{ aiPersona, isActive }` is passed straight into the existing, unmodified
`resolveMerchantAiPersona()` — reused verbatim, never redesigned, exactly per §2's finding.

## 5. Secrets Management (`OPENAI_API_KEY`)

### 5.1 Goal

Make real LLM classification (and, if Tier 2 is chosen, reply phrasing) actually work on staging,
while guaranteeing local development with zero `OPENAI_API_KEY` configured anywhere continues to work
exactly as it does today — degrading gracefully, never crashing the process or failing an otherwise-
successful webhook call over an optional enhancement.

### 5.2 Staging: add the key to the existing sync mechanism (proposed, not applied by this packet)

Add `'OPENAI_API_KEY'` to `scripts/fly-staging-sync-secrets.mjs`'s existing `SECRET_KEYS` array — a
one-line, additive change to an already-existing, already-trusted mechanism (no new secrets-
management code, no new CLI tool). Explicitly flagged for **operator decision, not this packet's
unilateral choice**: the sync script pulls whatever `OPENAI_API_KEY` is in the operator's own local
`.env` and pushes it to Fly as a secret — the operator must confirm that key is the one they intend
to use for staging LLM spend (cost/quota implications), exactly the same operator-judgment call
already implicit for every other key that script syncs today. `.env.example` also gains a documented
`OPENAI_API_KEY` entry (currently entirely absent, per §2) noting it is server-only, required for real
LLM classification, and safely omittable for local development that only needs Tier-1 deterministic
replies (§4.3) and accepts classification calls failing closed (§5.3).

### 5.3 Graceful degradation — reuses two existing, unmodified patterns verbatim, invents nothing new

- **Classification layer**: already-correct, already-shipped, untouched by this packet.
  `routeVionaDispatchIntent()`'s existing `try/catch` around `deps.callLlm(...)` already converts a
  missing-key throw into `{ ok: false, reason: 'llm_call_failed' }` (§2). Pack37 does not add a
  second check here — it is already fail-closed and correct.
- **Tier-2 reply-phrasing layer (§4.3, if chosen)**: must follow the exact same pre-check-then-typed-
  fallback shape already proven in `vionaOpenAiRealProviderAdapter.ts` (pre-check
  `process.env.OPENAI_API_KEY`, and if absent, return a typed "not available" outcome rather than
  calling `createRoutedChatCompletion()` at all) — except here, "not available" means "silently use
  the Tier-1 deterministic template instead," never a webhook-visible error. Concretely:
  `formatVionaMerchantReadOnlyQueryReply()` checks the key once at its own entry; if absent, it never
  attempts Tier 2 and returns the Tier-1 template output directly. **A missing `OPENAI_API_KEY` can
  therefore never cause this pack's own new success path (`dispatchAccepted: true` for a merchant
  query) to fail** — it can only ever cause the reply's *phrasing* to be the plainer, deterministic
  version instead of the persona-flavored one.
- **Explicit non-goal**: this packet does not change how the *existing* `twilio_test_sms_poc` path or
  any other existing LLM call site handles a missing key — those are unmodified, out of scope, exactly
  as they behave today.

## 6. Synchronous vs Asynchronous Response

### 6.1 Scope correction, stated explicitly

Per §2's confirmed finding, there is no mechanism anywhere in this codebase to send a message back
out through WhatsApp/a custom client/any channel. This section can therefore only design how an
answer reaches the **webhook caller's own HTTP response** — not how (or whether) that caller then
relays it on to the end-customer. Reaching an end-customer over WhatsApp is a separate, future,
explicitly out-of-scope capability (§9), mirroring Pack35 §9's own real-WhatsApp-integration deferral.

### 6.2 Proposed design: synchronous, additive HTTP response field (recommended)

The webhook controller's existing success response
(`{ accepted, idempotentReplay, requestId, dispatchAccepted }`, §2) gains exactly one new, optional
field, populated only when the dispatched tool was a merchant read-only query:

```ts
// Proposed additive response shape — NOT implemented by this packet.
{
  accepted: true,
  idempotentReplay: false,
  requestId: string,
  dispatchAccepted: true,
  merchantQueryResult: {           // present ONLY for merchant_read_only_query tools; absent/undefined otherwise
    toolName: string,
    dataAvailable: boolean,
    replyText: string,             // output of §4.3's formatter (Tier 1 or Tier 2)
  } | null,
}
```

Every existing field/value for every existing path (`twilio_test_sms_poc`, no-tool-matched,
idempotent replay) is **byte-for-byte unchanged** — this is a pure, additive extension, the same
"never break an existing caller, only add" discipline every prior pack in this chain has followed.
The entire classify → execute → (optionally) phrase → respond sequence happens inside the single
existing HTTP request/response cycle — no job queue, no new async infrastructure, matching this
codebase's current architecture exactly rather than introducing a new one.

### 6.3 Latency consideration (documented, not solved by new infrastructure)

If Tier 2 (§4.3) is enabled, a webhook call now makes up to two sequential OpenAI calls (classify,
then phrase) inside one HTTP request — realistically low seconds, well inside WhatsApp Cloud API's
own documented multi-second webhook-response tolerance, and unchanged in kind from what
`dispatchVionaMarketingContentRequest()` already does today (also two sequential LLM calls,
synchronously, inside one call). No timeout/retry design is proposed beyond what already exists. If
this bound is ever a real problem in practice, this packet recommends defaulting Tier 2 off (Tier 1
only, §4.3) rather than building async infrastructure speculatively — an explicit, documented
non-goal (§9).

### 6.4 Asynchronous option — named, explicitly not designed in operational detail

An async design (ack immediately, compute the answer in a background job, deliver it via a real
outbound-channel-send integration once one exists) is named here only so the operator can see the
full option space. It requires, at minimum: a job queue (none exists in this codebase today), a
retry/dead-letter policy, and — critically — the same missing outbound-send integration §6.1 already
flagged as absent. This packet does not design any of that; it is a strictly larger, separate future
pack (§9).

## 7. Explicit boundary: what this packet does NOT touch

| File | Change proposed by this packet |
|---|---|
| `src/lib/viona/dispatcher/vionaIntentRouter.ts` (`buildVionaDispatchClassificationPrompt()`) | **None.** No persona content, no new context, ever appended to the classification prompt (§4.2). |
| `src/services/viona/vionaMarketingContentDispatchService.ts` | **None.** Its shape is copied as a *pattern* (§3.2/§3.3); its code is not touched or imported. |
| `src/services/viona/vionaExecutionPlanRouteService.ts` / Pack30D-4/Pack31 escrow chain | **None.** The 2 merchant tools never call `previewVionaExecutionPlanRealProviderPocRoute()`, `holdVionaRequestExecutionCost()`, or `settleVionaRequestExecutionHold()` — structurally guarded, content-scan-tested (§10 item 7). |
| `src/services/viona/vionaWebhookChannelResolutionService.ts` (Pack35) | **None.** Persona resolution (§4.4) uses the already-carried `merchantProfileId`, not a change to this file. |
| `src/lib/viona/merchant/vionaMerchantAiPersonaTypes.ts` (`resolveMerchantAiPersona()`) | **None.** Reused verbatim, exactly as Pack34 shipped it (§4.4). |
| `twilio_test_sms_poc`'s existing case/behavior in `vionaAutonomousDispatchService.ts` | **Wrapped, not changed** — its own inner logic and the `PreviewVionaExecutionPlanRealProviderPocResult` it produces are byte-for-byte identical; only the outer `route` field's declared type gains a `kind` tag (§3.2). |
| Any write-capable tool, standing-approval logic (Pack35 §5.4), or the Tool Registry's category system (Pack34) | **None.** Both merchant tools remain `merchant_read_only_query`/`merchantScopedOnly: true`; no new tool is added to the registry by this packet. |
| Any real outbound-channel-send/reply-delivery mechanism | **None.** Confirmed absent (§2/§6.1); not designed in this packet (§9). |

## 8. Exact file allowlist — Pack37 future implementation (NOT authorized in this packet)

Listed now, for operator review, so a future implementation phrase can be scoped precisely.

**New files:**
1. `src/services/viona/vionaMerchantReadOnlyQueryExecutionService.ts` — `executeMerchantReadOnlyQuery()` (§3.3).
2. `src/lib/viona/merchant/vionaMerchantReadOnlyQueryReplyFormatter.ts` — `formatVionaMerchantReadOnlyQueryReply()`, Tier 1 (+ optional Tier 2) (§4.3).
3. `scripts/test-viona-pack37-b2b-dispatcher-realization.ts` — the future implementation's test suite (§10).

**Modified files (additive only):**
4. `src/services/viona/vionaAutonomousDispatchService.ts` — 2 new `switch` cases + `route`'s type broadened to a tagged union (§3.2); `twilio_test_sms_poc` behavior unchanged.
5. `src/services/viona/vionaMerchantProfileService.ts` — one new, additive read function, `findMerchantProfileById()` (§4.4); every existing export unchanged.
6. `src/controllers/VionaWebhookMerchantAgentController.ts` — one new, optional response field, `merchantQueryResult` (§6.2); every existing field/path unchanged.
7. `scripts/fly-staging-sync-secrets.mjs` — additive: `'OPENAI_API_KEY'` added to `SECRET_KEYS` (§5.2) — **operator must confirm** which local key value is acceptable to push to staging before this runs.
8. `.env.example` — additive: document `OPENAI_API_KEY` (§5.2).
9. `docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md` — Kernel sync recording the implementation, once done.

**Explicitly NOT touched by any future Pack37 implementation increment:** every file listed in §7's
table above.

**Explicitly deferred, NOT in this allowlist unless the operator separately authorizes Option B
(§3.4):** any new Prisma model/migration for real schedule/inventory data, any merchant-facing admin
UI to populate it.

## 9. Non-goals / forbidden scope (this packet, and the first future implementation increment)

- No write-capable tool invocation is ever enabled through this path — both tools remain read-only,
  `merchantScopedOnly: true`, unchanged from Pack34's own hard boundary.
- No real outbound message is ever sent to WhatsApp, a custom client, or any other channel — this
  packet only designs the webhook's own HTTP response (§6.1/§6.2), never a reply *delivered* to an
  end-customer.
- No job queue, retry policy, or async infrastructure of any kind is designed in operational detail
  (§6.4) — named as an option, not built.
- No real, tenant-scoped schedule/inventory Prisma model is designed in schema detail (§3.4 Option B)
  unless the operator separately authorizes it — the default, recommended increment (Option A) adds
  zero new tables.
- No merchant-facing UI of any kind (to configure persona, populate schedule/inventory data, or
  anything else) is designed or implied — consistent with every prior pack in this chain leaving UI
  out of scope.
- No change to the Intent Router's classification prompt, decision logic, or confidence threshold —
  reused 100% verbatim (§4.2).
- No change to any existing LLM call site's own missing-key handling outside this packet's own new
  code (§5.3's explicit non-goal).
- No code file listed in §8 is created in this packet — verified in §11/§12 below.

## 10. Required test plan — future implementation pack

1. **Switch-wiring correctness (CRITICAL — the literal fix):** dispatching a classified
   `merchant_schedule_availability_check`/`merchant_inventory_stock_check` (spy-based fake `callLlm`,
   no real network) returns `dispatch.accepted: true` — the exact condition Pack36A found false.
2. **Category isolation regression:** the `twilio_test_sms_poc` case's inner logic and returned
   `PreviewVionaExecutionPlanRealProviderPocResult` payload are unchanged — a structural content-scan
   (never a `git diff origin/master` check, per the Pack34.5 lesson already recorded in this repo's
   Kernel Handoff) confirming the existing case's own call to `previewVionaExecutionPlanRealProviderPocRoute()`
   still exists, unmodified, with the same argument shape.
3. **Persona resolution + safe injection:** a merchant with a configured `aiPersona` gets that
   persona reflected in the Tier-1 (or Tier-2) reply's tone/locale selection; a merchant with no
   `aiPersona`/inactive profile gets `VIONA_MERCHANT_AI_PERSONA_DEFAULT` (reusing
   `resolveMerchantAiPersona()`'s own already-tested fail-safe behavior — this test only checks the
   new call site passes the right input, not that function's internals again).
4. **Classification-prompt non-contamination (CRITICAL, safety-relevant):** a test asserts
   `buildVionaDispatchClassificationPrompt()`'s output for a fixed input is byte-for-byte identical
   whether or not a persona with a non-empty `systemPromptAddendum` exists for the resolved merchant —
   proving persona content never reaches the classifier, structurally, not just "in this test case."
5. **Secrets graceful degradation (CRITICAL):** with `OPENAI_API_KEY` unset, `dispatchAccepted: true`
   for a merchant-tool dispatch is still achieved (Tier-1 template path), and no exception propagates
   out of `formatVionaMerchantReadOnlyQueryReply()` or the webhook controller.
6. **Response-contract regression:** every existing field/value for the `twilio_test_sms_poc`,
   no-tool-matched, and idempotent-replay paths remains byte-for-byte unchanged; `merchantQueryResult`
   is absent/`null` for all of them and present only for the 2 merchant-tool paths.
7. **No write-capable path introduced (structural, content-scan):** `vionaMerchantReadOnlyQueryExecutionService.ts`
   never imports `holdVionaRequestExecutionCost`, `executeVionaTwilioTestPocReal`,
   `settleVionaRequestExecutionHold`, or `previewVionaExecutionPlanRealProviderPocRoute` — the same
   technique already used for `vionaMarketingContentDispatchService.ts`'s own analogous guarantee.
8. **Tenant isolation regression:** a query resolved for merchant A's `tenantId` can never return or
   be phrased using merchant B's `aiPersona`/data, even under a deliberately adversarial fake input
   (defensive test, matching Pack35 §10 item 5's own style).
9. **Full regression:** every existing `scripts/test-viona-*.ts` script (23 today, 24 once this pack's
   own suite is added) must remain 100% PASS after the additive changes in §8.

## 11. Drift Report (this packet)

- `git diff --stat origin/master`: only this new file under `docs/product/`, plus the Kernel Handoff
  and local operator-handoff sync entries for this packet's own creation — zero `.ts`/`.tsx` files
  created or modified, per explicit operator instruction.
- `prisma/schema.prisma`: zero diff.
- `package.json` / lockfile: zero diff. No new npm dependency proposed (reuses the existing
  `createRoutedChatCompletion()`/OpenAI SDK already in use).
- `.env*`: zero diff (§5.2's `.env.example` addition is proposed for the future implementation phase,
  not applied here).
- `scripts/fly-staging-sync-secrets.mjs`: zero diff (§5.2's addition is proposed, not applied).
- No HTTP route created or modified. No Fly deployment or secret change performed.
- No existing test file modified.

## 12. Explicit NO / YES assertions (this packet)

- Real execution enabled? **NO.**
- Production authorized? **NO.**
- Any `.ts`/`.tsx` file created or modified by this packet? **NO.**
- Any Prisma schema/migration change authored or applied? **NO.**
- Any Fly secret added/changed? **NO** — design only (§5.2).
- Any write-capable tool made reachable from either merchant tool, today or in the first future
  implementation increment? **NO** — explicitly forbidden (§9), unchanged from Pack34/35's own hard
  boundary.
- Any real outbound message sent to an end-customer channel, today or in the first future
  implementation increment? **NO** — explicitly out of scope (§6.1/§9).
- Does this packet block or slow down any existing feature? **NO** — purely additive design, zero
  runtime impact.

## 13. Authorization phrases required for the next phase

Three independently-authorizable scope choices are designed by this packet. The operator may combine
them; each phrase below composes additively with the others.

- **`APPROVE_PACK37_DISPATCHER_WIRING_MVP`** — authorizes the **recommended, smallest-scope**
  increment: §3 (switch wiring, Option A data layer — zero new tables), §4 Tier 1 only (deterministic
  reply template, no LLM phrasing call), §6.2 (additive response field). Does **not** authorize
  `OPENAI_API_KEY` on Fly or any Tier-2 LLM phrasing.
- **`APPROVE_PACK37_OPENAI_STAGING_SECRET`** — authorizes §5.2 only: adding `'OPENAI_API_KEY'` to
  `scripts/fly-staging-sync-secrets.mjs` and running it once against `viona-api-staging-eu`. Requires
  the operator to separately confirm which local key value is acceptable to push (§5.2's own note).
  Needed for real LLM *classification* to work on staging at all (a pre-existing gap, independent of
  the 2 merchant tools) and is a prerequisite for Tier 2 (below) to ever activate on staging.
- **`APPROVE_PACK37_LLM_REPLY_PHRASING`** — authorizes §4.3 Tier 2: the optional, persona-driven
  second LLM call for reply phrasing. Presumes `APPROVE_PACK37_OPENAI_STAGING_SECRET` has already
  been issued (or the operator confirms `OPENAI_API_KEY` is already available) if this is meant to
  activate on staging, not just locally.
- **`APPROVE_PACK37_REAL_DATA_LAYER`** — authorizes §3.4 Option B: designing (in a follow-up planning
  packet, not directly implemented) real, tenant-scoped Prisma models for schedule/inventory data.
  Explicitly the largest, least-scoped-yet option — issuing this phrase alone does not authorize any
  schema change; it authorizes producing that follow-up plan.

## 14. Recommended next step

1. Operator review of this packet, in particular: (a) whether Option A's honest "not yet configured"
   answer (§3.4) is an acceptable first increment versus committing to Option B's real data layer now,
   (b) whether Tier 1's deterministic reply template is sufficient to start, or whether Tier 2's LLM
   phrasing (and therefore the `OPENAI_API_KEY` Fly secret) should ship in the same increment, and
   (c) confirmation that a synchronous, additive HTTP response field (§6.2) is the right shape versus
   waiting for a future async/outbound-send capability.
2. If approved, merge this docs-only PR.
3. One or more of the §13 authorization phrases would be required before any code in §8's allowlist
   is written — mirroring the exact two-phase (plan phrase, then implementation phrase) pattern
   already used for Pack30D, Pack31, Pack32, Pack33, Pack34, Pack35, and Pack36A.
