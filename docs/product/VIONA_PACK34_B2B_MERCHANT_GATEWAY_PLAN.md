# VIONA Request Engine — Pack34: B2B Merchant Gateway & AI White-Labeling (Planning Packet)

- Document type: docs-only design/planning packet (no code, no schema migration)
- Packet ID: PACK34-B2B-MERCHANT-GATEWAY-PLAN
- Status: **PLANNING ONLY — no implementation authorized yet**
- Source master: `origin/master` @ `f02d458` (PR #324 — Pack31 execution orchestrator +
  `inProgress` domain state, merged)
- Branch: `docs/pack34-b2b-merchant-gateway-planning`
- Related: `docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md`;
  `docs/product/VIONA_PACK31_FINANCIAL_ESCROW_PLAN.md`;
  `docs/product/VIONA_PACK31_ORCHESTRATOR_EVIDENCE.md`;
  `docs/product/VIONA_PACK32_AUTONOMOUS_DISPATCHER_PLAN.md`;
  `docs/product/VIONA_PACK33_GLOBAL_COMPLIANCE_PLAN.md`

---

## 0. Why this packet now

Every real-execution capability shipped so far (Pack30D real-provider POC, Pack31 escrow, Pack32
dispatcher, Pack33 compliance) is designed around a **single-tenant mental model**: one
`VionaRequest`, one `authUserId`/`ownerUserId`, one global `VIONA_TOOL_REGISTRY`, one hardcoded
per-action cost constant. "Pack 34" is the operator's explicit correction: VIONA's B2B roadmap
requires the AI Receptionist to act **on behalf of a merchant, for that merchant's own customers**,
with strict data/context/wallet isolation between merchants, a per-merchant AI persona, and a
narrow, read-only tool surface before any write/booking tool is even considered. This packet is
docs-only by explicit operator instruction: no code, no Prisma schema change, no runtime behavior
change. It exists to be reviewed before any implementation phrase is requested.

## 1. Header — authorization state (this packet)

| Item | State |
|---|---|
| Docs-only planning | Authorized by explicit operator instruction (this session) |
| `MerchantProfile` multi-tenant isolation — implementation | **NOT authorized** — design only |
| AI Persona storage — implementation | **NOT authorized** — design only |
| Tool Registry expansion (read-only merchant tools) — implementation | **NOT authorized** — design only |
| Escrow-trigger wiring for booking/appointment tools — implementation | **NOT authorized** — design only |
| Prisma schema change | **NOT authorized** — this packet only describes proposed fields |
| Real execution / production | **UNCHANGED — still BLOCKED / NOT AUTHORIZED** |

## 2. Baseline — what already exists (this session's discovery, read-only audit)

- **`VionaRequest.tenantId` already exists** (`String`, required, validated non-empty at create in
  `vionaRequestCreateService.ts`) but is a **free-text string with zero enforcement** — any caller
  can pass any value; there is no `Tenant`/`Merchant` table it references, and
  `buildAuthorizedVionaRequestWhere()` (`vionaRequestAccessScope.ts`) filters only by
  `requesterUserId` / `ownerUserId` / `participants` — **it does not filter by `tenantId` at all**.
  This is the single most concrete, actionable gap this packet exists to close: today, two
  different "tenants" sharing a `requesterUserId` (implausible today, but structurally possible)
  would not be isolated by anything in this code path.
- **A `Business` model already exists** (`prisma/schema.prisma`) for the existing Local-Service /
  Tourism B2B vertical: `ownerId` (a `Role.B2B`/`B2B_EU`/`B2B_VN` `User`), `brokerId`, `name`,
  `category` (`BizType` enum: `HOTEL | HOMESTAY | TOUR_OPERATOR | LOCAL_EXPERIENCE | RESTAURANT |
  TRANSPORT`), geolocation, ad/ranking fields, VietQR payout fields. **This is a booking/discovery
  merchant record, not an AI-context/tenant-isolation record** — it has no system-prompt field, no
  AI persona field, no link to `VionaRequest.tenantId`, and this packet does not repurpose it.
  `Pack34`'s `MerchantProfile` is a **new, narrower, AI-Gateway-specific** concept — see §3.4 for
  the explicit boundary between the two.
- **`User.role`** already includes `B2B`, `B2B_EU`, `B2B_VN` (EU/VN merchant segments) and `ADMIN`/
  `BROKER` — the natural anchor for "which user may administer/configure a `MerchantProfile`".
  `User.subscriptionPlan` (`"BASIC" | "ELITE"`, currently a plain `String`, not an enum) already
  exists for B2B tier gating and is the natural anchor for a future "which AI Gateway features does
  this merchant's plan unlock" check — this packet does not change that field, only reads it.
- **`Wallet.userId` is `@unique`** — exactly one wallet per `User` row today, system-wide, shared by
  every vertical (P2P, Tourism, AI-gateway debit, Pack31 escrow). **There is no per-merchant wallet
  today** — a B2B merchant's `User.id` (its `ownerId`) has the same one wallet any B2C user has.
  §4 below designs how a merchant-scoped escrow hold reuses this exact same wallet (the merchant's
  `ownerId`'s `Wallet`), never a second, competing balance concept — mirroring the Pack31 escrow
  plan's own `VIO Credits` naming-only rule (real balance stays on the one, existing `Wallet` row).
- **`VIONA_TOOL_REGISTRY`** (`src/lib/viona/dispatcher/vionaToolRegistry.ts`, Pack32/32.1) is a
  fixed, global, exact-match array with exactly 2 entries today (`twilio_test_sms_poc`,
  `marketing_content_generator`), each with a `category` (`'viona_request_execution'` or
  `'content_generation_draft'`), an `inputSchema` (primitive-type-only), and a hardcoded
  `requiresOperatorApproval: true`. It is **not tenant-scoped today** — every entry is visible to
  every dispatch call regardless of who/what merchant is asking. §5 designs an **additive**
  `merchantScope` concept without touching this file's existing 2 entries or its exact-match
  lookup contract.
- **No AI-Persona / system-prompt storage exists anywhere.** `vionaIntentRouter.ts`'s
  `defaultVionaDispatchCallLlm` sends a single, hardcoded classification prompt via
  `createRoutedChatCompletion({ taskType: LlmRouterTaskType.ROUTING_INQUIRY, ... })` — there is no
  per-caller/per-merchant override of tone, language, or persona anywhere in the dispatch path.
  `CountryPack` (`src/config/countryPacks/types.ts`) already carries a `defaultLanguage` +
  `legalFlowConfig.documentJurisdictionHint`, which is the closest existing precedent for "a
  narrow, typed, code-shipped configuration object describing how the AI should behave for a given
  scope" — §3 reuses that precedent's *shape*, not its *table* (country vs. merchant are orthogonal
  scopes).
- **Pack31 escrow (`holdVionaRequestExecutionCost`/`settleVionaRequestExecutionHold`,
  `vionaRequestEscrowHoldService.ts`) is action-id-scoped, not merchant-scoped**, and its caller
  (`vionaExecutionPlanRouteService.ts`) currently passes a **single hardcoded constant**,
  `VIONA_TWILIO_TEST_POC_ESTIMATED_COST_VIO = 0.01`, as `estimatedAmountVIO` for every call,
  regardless of who the request belongs to. There is no per-merchant/per-tool price table
  anywhere. §6 designs the missing glue, not a replacement for the existing hold/settle mechanics
  (which are explicitly untouched — see §8 file allowlist).
- **Pack33's `resolveVionaPiiScrubRegion(countryCode)`** and `VionaRequest.countryCode` are the
  existing precedent for "resolve a per-request scope key to a policy object, defaulting to the
  strictest baseline when unknown" — §3.2's `resolveMerchantAiPersona()` follows the exact same
  fail-safe shape (unknown/missing `tenantId` → a documented, safe default persona, never "no
  persona"/"crash").

**Conclusion:** every piece this packet needs already has an anchor point (`VionaRequest.tenantId`,
`User.role`/`subscriptionPlan`, the one shared `Wallet`, `VIONA_TOOL_REGISTRY`'s `category` field,
Pack33's region-resolution precedent) — Pack34's job is to *design the missing glue*, not invent a
parallel architecture.

## 3. Multi-tenant Data Isolation — `MerchantProfile` architecture

### 3.1 Goal

Every AI Gateway interaction (a `VionaRequest` created on behalf of a merchant's customer) must be
strictly scoped to exactly one `MerchantProfile`: the merchant's own conversation history, wallet,
AI persona, and tool surface must be structurally unreachable from a different merchant's context,
even under a caller bug — isolation must be enforced at the query layer, not just assumed from
correct application logic.

### 3.2 Proposed schema shape (description only — no migration in this packet)

```
MerchantProfile (NEW model, PROPOSED — NOT created by this packet):
  id                String   @id @default(uuid())
  ownerUserId       String   @unique        // the B2B User (Role.B2B/B2B_EU/B2B_VN) that owns this profile
  tenantId          String   @unique         // the exact string VionaRequest.tenantId must equal for this merchant — 1:1, enforced at read/write time (see 3.3)
  displayName       String
  countryCode       String?                  // reuses the exact existing VionaRequest.countryCode / Pack33 resolveVionaPiiScrubRegion() anchor — no new region concept
  defaultLocale     String?                  // reuses CountryDefaultLanguage's existing value set, not a new enum
  aiPersona         Json                     // see 3.4 — VionaMerchantAiPersona shape, stored as-is
  toolScope         String[]                 // see §5.2 — allowlist of VIONA_TOOL_REGISTRY `name`s this merchant may invoke; empty array = no tools (fail-closed default)
  isActive          Boolean  @default(false) // fail-closed default: a newly-created profile grants nothing until explicitly activated
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([tenantId])
```

Design notes:
- `tenantId` is `@unique` — a strict 1:1 mapping from the existing free-text `VionaRequest.tenantId`
  column to exactly one `MerchantProfile` row. This is the **entire fix** for the isolation gap
  found in §2: once implemented, every read/write path that already threads `tenantId` through
  (`vionaRequestCreateService.ts`, `vionaRequestReadService.ts`, `buildAuthorizedVionaRequestWhere`)
  gains a hard foreign-key-shaped boundary for free, with **zero change to the shape of any
  existing field** — only a new `@@index`-backed lookup added *alongside* the untouched existing
  filters (additive, not a replacement of the owner/participant scoping Pack25 already relies on).
- `ownerUserId` is `@unique` too — exactly one `MerchantProfile` per B2B `User`, mirroring the
  existing `Wallet.userId @unique` pattern exactly (§2) — deliberately the *same* cardinality
  shape, so a future implementation can reuse the identical "idempotent bootstrap" pattern
  `createWalletForUser()` already uses (find-or-create, unique-constraint-safe).
- `isActive: false` default is a **deliberate fail-closed choice**: provisioning a `MerchantProfile`
  row must never, by itself, grant any AI capability — a separate, explicit activation step (out of
  scope for this packet's first implementation increment — see §9) is required before
  `toolScope`/`aiPersona` take effect anywhere.
- No relation to the existing `Business` model is proposed. They answer different questions
  ("where can a customer discover/book this merchant" vs. "which AI context/tools/wallet may this
  merchant's AI Receptionist use") and a future pack may choose to link them by `ownerUserId`
  convention once both exist in production — not designed here to avoid coupling two independently
  evolving concerns prematurely.

### 3.3 Enforcement point (design only, no code)

A single new, pure helper function (§8, new file) is proposed:

```ts
// src/lib/viona/merchant/vionaMerchantTenantScope.ts (proposed, NOT created by this packet)
export function assertVionaRequestTenantMatchesMerchant(
  requestTenantId: string,
  merchantProfile: Readonly<{ tenantId: string; isActive: boolean }>,
): Readonly<{ ok: true } | { ok: false; reason: 'tenant_mismatch' | 'merchant_inactive' }>;
```

Every future AI-Gateway call site that resolves a `MerchantProfile` (persona lookup, tool-scope
check, escrow trigger) calls this **before** doing anything else — fail-closed, pure, no I/O. This
mirrors `canTransitionRequestStatus()`'s existing role in the Pack31 orchestrator: a small, pure,
independently-testable gate function that every future write path is designed to call, rather than
each call site re-implementing its own isolation check ad hoc.

### 3.4 Explicit boundary: `MerchantProfile` vs. the existing `Business` model

| Question | `Business` (existing) | `MerchantProfile` (this packet) |
|---|---|---|
| Purpose | Discovery/booking listing (Tourism/Local) | AI Gateway tenant/context isolation |
| Owner | `Role.B2B\|B2B_EU\|B2B_VN` `User` | Same `User`, different row, different table |
| Contains a wallet reference | No (uses owner's `Wallet` indirectly via booking flows) | No — reuses owner's `Wallet` too (§4), never a second wallet |
| Contains AI persona/system prompt | No | Yes (§3.2 `aiPersona` field) |
| Linked to `VionaRequest.tenantId` | No | Yes, 1:1, `@unique` |
| This packet touches it? | **No — zero changes proposed** | New model |

## 4. Wallet & Escrow scoping — reusing Pack31, never duplicating it

`MerchantProfile.ownerUserId` **is** the `userId` that `holdVionaRequestExecutionCost()` already
takes today (`HoldVionaRequestExecutionCostInput.userId`) — no new wallet concept, no new escrow
function. A future AI-Gateway call site resolves `ownerUserId` from the `MerchantProfile` matching
the inbound `VionaRequest.tenantId` (via §3.3's gate), then calls the **existing, unmodified**
`previewVionaExecutionPlanRealProviderPocRoute()`/`holdVionaRequestExecutionCost()` with that
`userId` — exactly the same call shape Pack31's orchestrator already uses, just with the merchant's
`ownerUserId` instead of the end-customer's `authUserId`. This is the intended commercial model:
the **merchant** pays VIO Credits for their AI Receptionist's actions on behalf of their customers,
not the end-customer. See §6 for where the estimated-cost figure itself would need to come from.

## 5. Tool Registry Expansion — read-only merchant tools

### 5.1 Goal

Add a narrow set of **read-only** tools (schedule/availability check, inventory/stock check) a
merchant's AI Receptionist may call during a conversation, without touching the existing 2 entries,
their exact-match lookup contract, or `dispatchVionaAutonomousRequest()` (explicitly forbidden from
modification by the existing Pack32.1 file allowlist, and this packet does not revisit that
decision).

### 5.2 Proposed additive shape (types only — no implementation in this packet)

```ts
// vionaToolRegistry.ts (EXISTING file — proposed additive changes only, illustrative, not applied
// in this packet):

export type VionaToolRegistryCategory =
  | 'viona_request_execution'
  | 'content_generation_draft'
  | 'merchant_read_only_query';       // NEW, additive — never removes the 2 existing values

export type VionaToolRegistryEntry = Readonly<{
  // ...all existing fields unchanged...
  /** Additive, optional. Omitted (undefined) = every existing entry's current behavior:
   * visible to every dispatch call, exactly as today. Present = this tool is only ever
   * eligible for dispatch when the resolved MerchantProfile.toolScope (§3.2) includes its
   * `name` — enforced by the dispatcher's caller, never inside this pure registry file. */
  merchantScopedOnly?: true;
}>;

// Two new, illustrative entries (not added to VIONA_TOOL_REGISTRY by this packet):
{
  name: 'merchant_schedule_availability_check',
  description: 'Read-only: check a merchant's own appointment/booking schedule for open slots in a given date range. Never creates, modifies, or cancels any booking.',
  category: 'merchant_read_only_query',
  merchantScopedOnly: true,
  linkedActionId: 'request.assign',   // same traceability anchor pattern as the existing entry — no new Pack26B action proposed in this packet
  inputSchema: { dateRangeStart: 'string', dateRangeEnd: 'string' },
  requiresOperatorApproval: true,
},
{
  name: 'merchant_inventory_stock_check',
  description: 'Read-only: check a merchant's own inventory/stock count for a named item or SKU. Never reserves, decrements, or modifies stock.',
  category: 'merchant_read_only_query',
  merchantScopedOnly: true,
  linkedActionId: 'request.assign',
  inputSchema: { itemName: 'string' },
  requiresOperatorApproval: true,
},
```

### 5.3 Why read-only, and why this is the entire scope of this increment

Both proposed tools are explicitly, structurally incapable of a write side effect — no proposed
`inputSchema` field or handler shape allows creating/modifying a booking, order, or stock row. This
is intentional: this packet's tool-registry expansion is scoped to *read-only query* tools only, so
a future implementation increment can ship them without simultaneously having to design a new
write-side eligibility/approval/escrow chain — that remains future work (see §9), and any future
*write*-capable merchant tool (e.g., "book this appointment") is explicitly out of scope for the
first Pack34 implementation increment and would need its own dedicated planning review given the
materially higher risk (a write tool needs the full escrow chain from §4/§6, not just a scope
check).

### 5.4 Where the actual read (schedule/inventory data) comes from

Deliberately **not designed in this packet** — no existing `Schedule`/`Inventory` Prisma model was
found in `prisma/schema.prisma` during this session's baseline audit (§2). A future implementation
increment must first design that data model (or integrate a merchant-supplied external read API) in
its *own* reviewed packet before these two tool entries can be wired to a real handler; this packet
only reserves their name/shape in the registry design and confirms they are read-only by
construction.

## 6. Escrow Integration — how the AI Receptionist triggers the Pack31 Zero-Loss hold

### 6.1 Goal

Define, at the design level only, how a **future** write-capable tool (e.g., "book this
appointment" — explicitly NOT implemented by this packet, see §5.3) would trigger the existing,
unmodified Pack31 Zero-Loss escrow hold during a live AI conversation, without inventing a second
escrow mechanism.

### 6.2 Proposed flow (illustrative — no code in this packet)

1. The dispatcher resolves the inbound `VionaRequest.tenantId` to a `MerchantProfile` via §3.3's
   gate (fail-closed on mismatch/inactive).
2. A **future** merchant-pricing lookup (proposed name only:
   `resolveMerchantToolEstimatedCostVIO(merchantProfile, toolName)` — not implemented here) replaces
   today's single hardcoded `VIONA_TWILIO_TEST_POC_ESTIMATED_COST_VIO` constant for merchant-scoped
   write tools only; the existing Twilio POC call site's constant is explicitly untouched (§8
   allowlist) — this is a **new, additive** cost-resolution path, never a change to the existing
   one.
3. The existing, unmodified `holdVionaRequestExecutionCost()` is called with
   `userId: merchantProfile.ownerUserId` (§4) and the resolved estimate — **identical call shape**
   to every existing Pack31 call site; no new escrow function, no new hold table, no new Wallet
   concept.
4. On the tool's real outcome, the existing, unmodified `settleVionaRequestExecutionHold()` /
   `refundVionaRequestExecutionHold()` resolves the hold exactly as today (full settle on success,
   full refund on any blocked/failed outcome) — the Zero-Loss guarantee is inherited verbatim, not
   redesigned.

### 6.3 Explicit non-goal

This packet does not design, and no future increment following it may assume without its own
review: (a) any new escrow/hold/wallet primitive, (b) any bypass of `holdVionaRequestExecutionCost`'s
existing atomic-conditional-decrement/insufficient-funds fail-closed behavior, (c) any change to
`vionaRequestEscrowHoldService.ts` itself (explicitly untouched — §8).

## 7. AI Persona — structure for per-merchant system prompt, language, tone

### 7.1 Proposed shape (types only — no implementation in this packet)

```ts
// src/lib/viona/merchant/vionaMerchantAiPersonaTypes.ts (proposed, NOT created by this packet)

export type VionaMerchantAiPersonaTone = 'formal' | 'friendly' | 'concise' | 'warm';

export type VionaMerchantAiPersona = Readonly<{
  /** Free-text, operator-authored addendum appended to (never replacing) the existing, unmodified
   * base classification/dispatch prompt in vionaIntentRouter.ts — additive layering, not an
   * override of the safety-relevant parts of that prompt (tool list, JSON-response contract). */
  systemPromptAddendum: string;
  preferredLocale: string;            // reuses CountryDefaultLanguage's existing value set (§2) — no new locale list
  tone: VionaMerchantAiPersonaTone;
  /** Reuses the exact, existing Pack33 message-dictionary fallback chain design
   * (resolveVionaServiceMessage(): requested locale -> 'en' -> literal id) for any
   * persona-driven system message — never a new fallback rule invented here. */
}>;

export const VIONA_MERCHANT_AI_PERSONA_DEFAULT: VionaMerchantAiPersona = {
  systemPromptAddendum: '',
  preferredLocale: 'en',
  tone: 'friendly',
} as const;

/** Pure. Fail-safe: a missing/inactive/malformed MerchantProfile always resolves to the
 * documented default persona above, never "no persona"/throw — mirrors
 * resolveVionaPiiScrubRegion()'s exact fail-safe shape (§2). */
export function resolveMerchantAiPersona(
  merchantProfile: Readonly<{ aiPersona: unknown; isActive: boolean }> | null,
): VionaMerchantAiPersona;
```

### 7.2 Explicit non-goal: this does NOT change the existing dispatch prompt's safety-relevant contract

`vionaIntentRouter.ts`'s existing classification prompt enforces the tool list + JSON-response
contract that `findVionaToolRegistryEntry()`'s exact-match hallucination defense (§2, Pack32 module
header) depends on. `systemPromptAddendum` is designed as a **strictly additive, appended** string
— a future implementation must never let it replace, precede, or otherwise reorder the existing
safety-relevant prompt sections. This constraint is called out explicitly so a future implementation
cannot conflate "merchant branding/tone" with "merchant-controlled override of the hallucination
defense."

## 8. Exact file allowlist — Pack34 future implementation (NOT authorized in this packet)

Listed now, for operator review, so a future implementation phrase can be scoped precisely:

**New files:**
1. `src/lib/viona/merchant/vionaMerchantTenantScope.ts` — `assertVionaRequestTenantMatchesMerchant()` (§3.3).
2. `src/lib/viona/merchant/vionaMerchantAiPersonaTypes.ts` — `VionaMerchantAiPersona`, `resolveMerchantAiPersona()` (§7.1).
3. `src/services/viona/vionaMerchantProfileService.ts` — CRUD/read for `MerchantProfile` rows (idempotent create, mirroring `createWalletForUser()`'s pattern per §3.2).
4. `scripts/test-viona-pack34-b2b-merchant-gateway.ts` — the future implementation's unit test suite.

**Modified files:**
5. `prisma/schema.prisma` — **additive only**: new `MerchantProfile` model (§3.2). No existing model/field renamed or removed.
6. `src/lib/viona/dispatcher/vionaToolRegistry.ts` — additive only: new `'merchant_read_only_query'` category value + optional `merchantScopedOnly?: true` field (§5.2); the 2 existing entries' fields are unchanged.
7. `src/services/viona/vionaRequestAccessScope.ts` — additive only: `buildAuthorizedVionaRequestWhere()` gains an *additional*, optional tenant-scoping clause; existing `requesterUserId`/`ownerUserId`/`participants` clauses remain unchanged (§3.2).
8. `docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md` — Kernel sync recording the implementation, once done.

**Explicitly NOT touched by any future Pack34 implementation increment:**
- `src/services/viona/vionaRequestStatusActionService.ts` — no change (same boundary Pack31's orchestrator already respects).
- `src/services/viona/vionaRequestExecutionOrchestrator.ts` — no change; a future merchant-scoped flow calls it, never edits it.
- `src/services/viona/vionaRequestEscrowHoldService.ts` — no change (§6.3); a future call site passes a different `userId`, never a different function.
- `src/services/viona/vionaExecutionPlanRouteService.ts` — no change to the existing Twilio-POC cost constant or call shape (§6.2 item 2 is a *new*, parallel path).
- `src/services/viona/vionaAutonomousDispatchService.ts` (`dispatchVionaAutonomousRequest()`) — no change, per the existing, still-binding Pack32.1 file-allowlist decision (§2).
- `src/lib/viona/realProviderAdapter/**` — no change to what is actually sent to Twilio or any future provider.
- `src/lib/viona/compliance/**` (Pack33) — no change; a future merchant-scoped audit event reuses the existing, unmodified scrubber/retention path exactly as every other call site does today.
- The existing `Business`/`BizType` model and every Tourism/Local-Service booking flow that reads it — zero changes (§3.4).
- Any `PACK30_REAL_PROVIDER_EXECUTION_ENABLED` gating logic.

## 9. Non-goals / forbidden scope (this packet, and the first future implementation increment)

- No write-capable merchant tool (booking/appointment creation, inventory decrement) is designed in
  implementation detail — only confirmed as explicitly future, higher-risk, separately-reviewed
  scope (§5.3).
- No `MerchantProfile` **activation** workflow (who flips `isActive: true`, and under what
  approval) is designed — deferred, tracked as a prerequisite gate for the first implementation
  increment, not silently defaulted.
- No `Schedule`/`Inventory` data model is designed (§5.4) — a hard prerequisite for the two
  read-only tools to have a real handler, tracked as a separate future packet.
- No per-merchant pricing/billing-plan mechanism beyond the single proposed
  `resolveMerchantToolEstimatedCostVIO()` **name** (§6.2) is designed — its actual values/formula
  are explicitly deferred to a future, separately-reviewed pack.
- No relation/migration linking `MerchantProfile` to the existing `Business` model is proposed
  (§3.4) — confirmed structurally independent for now.
- No client-side/UI work of any kind is designed or implied.
- No code file listed in §8 is created in this packet — verified in §10/§11 below.

## 10. Required test plan — future implementation pack

1. **Tenant-scope gate correctness (pure unit tests, no I/O):** matching `tenantId` + `isActive:
   true` → `ok: true`; mismatched `tenantId` → `tenant_mismatch`; `isActive: false` →
   `merchant_inactive`, even when `tenantId` matches.
2. **Persona resolution fallback:** `null` merchant profile, malformed `aiPersona` JSON, and an
   inactive profile all resolve to `VIONA_MERCHANT_AI_PERSONA_DEFAULT`, never throw, never "no
   persona."
3. **Tool registry integrity (regression, critical):** the 2 existing entries' `category`,
   `inputSchema`, and `linkedActionId` are byte-for-byte unchanged after the additive change;
   `assertVionaToolRegistryLinkedActionIdsAreKnown()` still passes unmodified.
4. **`buildAuthorizedVionaRequestWhere()` regression (critical):** every existing call site's
   current behavior (owner/requester/participant scoping) is provably unchanged when the new,
   optional tenant clause is omitted — a source-scan + functional test asserting no existing caller
   is silently narrowed or widened.
5. **Escrow call-shape regression (critical):** a test asserts `holdVionaRequestExecutionCost()`'s
   own source file (`vionaRequestEscrowHoldService.ts`) has a zero diff vs. `origin/master`,
   mirroring the exact source-scan pattern the Pack31 orchestrator's own test suite already uses
   for `vionaRequestStatusActionService.ts`.
6. **Business/BizType non-interference regression:** a source-scan test asserting zero diff on the
   existing `Business` model usage sites (`WalletService.ts` Tourism/Local flows) — confirming §3.4's
   "zero changes proposed" claim holds in the actual future diff, not just in this document.
7. **Full regression:** every existing Pack29–Pack33 test script must remain 100% PASS after the
   additive changes in §8 items 6–7.

## 11. Drift Report (this packet)

- `git diff --stat origin/master`: only new files under `docs/product/` (this file), plus the
  Kernel Handoff and local operator-handoff sync entries for this packet's own creation — zero
  `.ts`/`.tsx` files created or modified, per explicit operator instruction.
- `prisma/schema.prisma`: zero diff.
- `package.json` / lockfile: zero diff.
- `.env*`: zero diff.
- No new npm dependency proposed or installed.
- No HTTP route created or modified.
- No existing test file modified.

## 12. Explicit NO / YES assertions (this packet)

- Real execution enabled? **NO.**
- Production authorized? **NO.**
- Any `.ts`/`.tsx` file created or modified by this packet? **NO.**
- Any Prisma schema/migration change applied? **NO.**
- Any `MerchantProfile` row created by running code today? **NO** — design only.
- Any existing file in §8's "explicitly NOT touched" list modified today? **NO.**
- Does this packet block or slow down any existing feature? **NO** — purely additive design, zero
  runtime impact.
- Is a write-capable merchant tool (booking/appointment) designed in implementation detail? **NO**
  — explicitly deferred (§5.3, §9).

## 13. Recommended next step

1. Operator review of this packet, in particular: (a) the `MerchantProfile`/`Business` boundary in
   §3.4, (b) whether `MerchantProfile` activation (§9) should itself require its own planning
   packet before any implementation phrase is granted, and (c) confirmation that the two read-only
   tools in §5.2 are an acceptable, sufficiently narrow first increment.
2. If approved, merge this docs-only PR.
3. A **separate, future** planning-to-implementation phrase (e.g.
   `APPROVE_PACK34_B2B_MERCHANT_GATEWAY_IMPLEMENTATION`) would be required before any code in §8's
   allowlist is written — mirroring the exact two-phase (plan phrase, then implementation phrase)
   pattern already used for Pack30D-2/30D-4, Pack31, Pack32, and Pack33.
