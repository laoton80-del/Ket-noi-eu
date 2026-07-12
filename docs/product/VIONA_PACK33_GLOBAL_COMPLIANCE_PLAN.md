# VIONA Request Engine — Pack33: Global Omni-Compliance & Localization (Planning Packet)

- Document type: docs-only design/planning packet (no code, no schema migration)
- Packet ID: PACK33-GLOBAL-COMPLIANCE-PLAN
- Operator phrase: not explicitly re-stated for this packet by the operator in this session — this
  is itself recorded in §13/§14 below and in the Handoff. Treated as directly authorized because
  (a) the operator's instruction was explicit and unambiguous ("Khởi động PACK 33... tạo PLANNING
  packet (docs-only)") and (b) this packet is strictly docs-only, the lowest risk tier in this
  project's own established ladder — no code, no schema, no runtime behavior change of any kind.
  A future implementation increment for Pack33 still requires its own, separately-granted operator
  phrase, exactly like every prior pack in this chain.
- Source master: `origin/master` @ `48b4187` (PR #308 — Pack32.5 Core System Integration Audit,
  merged)
- Branch: `docs/pack33-global-omni-compliance-planning`
- Status: **PLANNING ONLY — no implementation authorized yet**
- Related: `docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md` (§16 Visionary Roadmap;
  §12 VIONA Master Economy); `docs/product/VIONA_PACK31_FINANCIAL_ESCROW_PLAN.md`;
  `docs/product/VIONA_PACK32_AUTONOMOUS_DISPATCHER_PLAN.md`;
  `docs/design/evidence/cursor-pack32-5-core-system-integration-audit/README.md`

---

## 0. Why this packet now — correcting the core vision

The operator has explicitly corrected the project's framing: **VIONA is a GLOBAL product**, not a
Europe-only product. Every real-execution capability built so far (Pack30D real-provider POC,
Pack31 escrow, Pack32 dispatcher) is provider-agnostic and jurisdiction-agnostic *by omission* —
none of it yet asks "which country's law applies to this request, and what does that imply for
data handling, retention, and the copy shown to the user?" Before any future pack wires real
execution to more providers or more markets, this gap needs an explicit, reviewable design. This
packet is that design. It is intentionally **docs-only**: no code, no Prisma schema change, no
runtime behavior change. It exists to be reviewed and approved *before* any implementation phrase
is requested.

## 1. Header — authorization state (this packet)

| Item | State |
|---|---|
| Docs-only planning | Authorized by explicit operator instruction (this session) |
| Region-Aware PII Scrubber — implementation | **NOT authorized** — design only, this packet |
| Global Data Retention Policy — implementation | **NOT authorized** — design only, this packet |
| Omni-Localization service-layer dictionary — implementation | **NOT authorized** — design only |
| Prisma schema change | **NOT authorized** — this packet only describes proposed fields |
| Real execution / production | **UNCHANGED — still BLOCKED / NOT AUTHORIZED** (Pack30D-4 hard-block untouched by this packet) |

## 2. Baseline — what already exists (this session's discovery)

A read-only audit of the current codebase found the following relevant baseline (full detail in
the accompanying evidence — see §12):

- **i18n (client-side, mature):** `react-i18next` + `i18next` + `expo-localization`, 7 JSON locale
  files under `src/i18n/locales/` (`en`, `vi`, `cs`, `de`, `fr`, `ja`, `ko`), plus a legacy typed
  string map `src/i18n/strings.ts`. This is **UI copy only** — it has nothing to do with
  server-generated audit messages, notification copy, or compliance text, and Pack33 does not
  touch it.
- **`VionaRequest` already carries `locale` and `countryCode`** (both optional, validated at
  create in `vionaRequestCreateService.ts`) — this is the natural anchor field for a future
  jurisdiction resolver, and already exists with **zero schema change needed** to read from.
- **`VionaRequestAuditEvent`** (`prisma/schema.prisma`) is a flat, append-only table:
  `id, requestId, eventType, actorUserId, actorRoleLabel, message, payloadJson, createdAt`. It has
  **no** `deletedAt`/`expiresAt`/retention field, and cascades on `VionaRequest` delete only — no
  independent per-region TTL exists today.
- **No centralized PII scrubber exists.** Redaction is currently ad hoc and per-module:
  `redactPhone()`/`redactSafe()` in a smoke-test script, key-blocking in
  `localRequestAuditEventService.ts` (Local universe only, not Viona), `maskIban()` in the payout
  queue, `SENSITIVE_KEY_RE` in `AnalyticsService.ts`. **The Pack30D-4/Pack31/Pack32 real-execution
  chain writes phone numbers and message bodies directly into `VionaRequestAuditEvent.payloadJson`
  with no masking at all** — this is the single most concrete, actionable gap this packet exists
  to close.
- **A `redactionLevel` enum (`'none' | 'partial' | 'operator_only_detail'`) already exists** in
  `vionaOperatorApprovalTypes.ts` / `vionaAuditTimelineTypes.ts`, but is not wired to the Viona
  audit writer or to any API serializer. Pack33 reuses this existing enum rather than inventing a
  new one.
- **`User.gdprErasedAt` already exists** as a GDPR erasure marker, but no automated purge job
  reads it against `VionaRequestAuditEvent` today.
- **Universe/jurisdiction is currently inferred, not resolved:** `VionaRequest.tenantId` +
  `sourceUniverse` (enum `vionaRequestUniverses`, `src/domain/requests/vionaRequestTypes.ts`) plus
  the optional `countryCode`/`locale` fields are the only signals — there is no server-side
  function today that maps a country code to a legal regime (GDPR/CCPA/LGPD/APPI/other).
  Commercial `countryPacks/` config (`src/config/countryPacks/`) already carries a `regionCode` +
  `legalFlowConfig` per supported country, but for *pricing/legal-scenario routing*, not for data
  protection compliance — a separate, narrower concern this packet designs for.

**Conclusion:** every piece this packet needs already has an anchor point (`countryCode`,
`redactionLevel`, `appendVionaExecutionAuditEvent`) — Pack33's job is to *design the missing glue*,
not invent new primitives from scratch.

## 3. Region-Aware PII Scrubber — architecture

### 3.1 Goal

Mask/hash PII (phone numbers, emails, credit-card-shaped numbers, and other configured patterns)
**before** it is written to `VionaRequestAuditEvent.payloadJson`/`.message`, and **before**
`executeReal()`-family functions (Pack30D-4 and any future real-provider adapter) forward a payload
to a third-party provider's *logs* (not the payload the provider actually needs to fulfil the
call — see §3.5 for that distinction). The masking rule set is **region-aware**: some jurisdictions
(e.g. GDPR/EU, LGPD/Brazil) treat phone number + name combined as PII requiring stricter handling
than others; the scrubber's rule table, not its call sites, is what varies by region.

### 3.2 Proposed module shape (types only — no implementation in this packet)

```ts
// src/lib/viona/compliance/vionaPiiScrubber.ts (proposed, NOT created by this packet)

export type VionaPiiScrubRegion = 'eu_gdpr' | 'us_ccpa' | 'br_lgpd' | 'jp_appi' | 'default';

export type VionaPiiScrubRule = Readonly<{
  name: string;               // e.g. 'e164_phone', 'email', 'card_pan'
  pattern: RegExp;            // pure, synchronous, no backtracking-unsafe patterns
  replacement: string;        // e.g. '[REDACTED_PHONE]'
  appliesToRegions: readonly VionaPiiScrubRegion[] | 'all';
}>;

export type VionaPiiScrubInput = Readonly<{
  countryCode?: string | null;   // from VionaRequest.countryCode — resolved to a region below
  text: string;
}>;

export type VionaPiiScrubResult = Readonly<{
  scrubbedText: string;
  matchedRuleNames: readonly string[]; // for audit/debugging — never the original matched value
}>;

/** Pure, synchronous, no I/O. Resolves countryCode -> region via a static lookup table, then
 * applies every rule whose `appliesToRegions` includes that region (or 'all'). */
export function scrubVionaPii(input: VionaPiiScrubInput): VionaPiiScrubResult;

/** Pure. countryCode (ISO 3166-1 alpha-2) -> VionaPiiScrubRegion, default 'default' (baseline
 * rule set — the strictest common denominator) for unknown/missing country codes. Fail-safe:
 * missing region information must never mean "skip scrubbing", it must mean "scrub with the
 * strictest baseline". */
export function resolveVionaPiiScrubRegion(countryCode: string | null | undefined): VionaPiiScrubRegion;
```

### 3.3 Where it is called (call-site design, no code yet)

| Call site | What gets scrubbed | Existing function it wraps |
|---|---|---|
| `appendVionaExecutionAuditEvent()` (audit writer) | `message` and any string leaf inside `payloadJson` before the Prisma `create()` call | `vionaExecutionAuditWriteService.ts` |
| A future `previewVionaExecutionPlanRealProviderPocRoute()`-family route, at the point it builds its own **operator-facing** `console.error`/log lines (not the request payload it sends to the real provider — see §3.5) | any interpolated user-supplied string | `vionaExecutionPlanRouteService.ts` |
| Any future Pack32-style dispatcher rationale/log string that echoes LLM-derived text containing user-supplied content | `rationale`, `message` fields written to the ledger | `vionaAutonomousDispatchService.ts` |

This is deliberately a **wrapper around the existing audit writer**, not a new write path — the
audit writer's signature does not need to change; scrubbing is proposed as an internal
pre-processing step inside `appendVionaExecutionAuditEvent()` itself (or a thin call immediately
before it), so every existing call site benefits automatically with zero call-site changes
required.

### 3.4 Reusing the existing `redactionLevel` enum

`'none' | 'partial' | 'operator_only_detail'` (already defined, currently unused by the Viona audit
path) becomes the **read-time** counterpart to the scrubber's **write-time** masking:

- `none` — full detail visible (internal ops/global-admin role only).
- `partial` — the scrubber's masked form is what's stored *and* what's read back (this packet's
  default for all new audit rows).
- `operator_only_detail` — reserved for a future design where an unmasked value is stored
  separately (e.g. a short-lived, encrypted side-table) and only revealed to a narrowly-scoped
  operator role; **out of scope for the first Pack33 implementation increment** (see §9).

### 3.5 Explicit non-goal: this does NOT touch the actual provider call payload

`executeVionaTwilioTestPocReal()`'s `intent.toNumber`/`intent.fromNumber`/`intent.body` are sent to
Twilio *because Twilio needs the real phone number to route an SMS* — scrubbing those before the
provider call would break the feature. The scrubber in this design only ever touches **our own
logs and audit ledger**, never the outbound payload of a real-provider adapter. This distinction
is called out explicitly so a future implementation cannot conflate "compliance scrubbing" with
"breaking the actual provider integration."

## 4. Global Data Retention Policy — architecture

### 4.1 Goal

A per-jurisdiction, configurable retention window for `VionaRequestAuditEvent` rows, after which a
row is either **anonymized in place** (preferred — preserves audit trail shape/count for
operational metrics) or **hard-deleted** (only for jurisdictions/event types that mandate it),
without ever breaking the append-only, tamper-evident nature of the ledger for rows still inside
their retention window.

### 4.2 Proposed schema shape (description only — no migration in this packet)

```
VionaRequestAuditEvent (existing model, PROPOSED additive fields — NOT created by this packet):
  + retentionRegion   String?   // resolved once at write time via resolveVionaPiiScrubRegion()
                                 // frozen at write time so a later country-code change on the
                                 // parent VionaRequest never silently changes a past row's policy
  + anonymizedAt       DateTime? // null = not yet anonymized; set once, never cleared
```

Both fields are **nullable and additive** — existing rows read `null` for both, which the retention
job (§4.3) treats as "assign `retentionRegion` from a one-time backfill using the parent request's
`countryCode` at the time the job runs, `default` if that is also missing."

### 4.3 Retention job design (batch, not real-time)

- A scheduled job (cadence TBD at implementation time — daily is the working assumption) selects
  `VionaRequestAuditEvent` rows where `anonymizedAt IS NULL AND createdAt < now() - retentionWindow(retentionRegion)`.
- `retentionWindow(region)` is a **pure, static lookup function** (`src/lib/viona/compliance/`),
  not a per-row DB column — the window itself is a code-level policy decision reviewed alongside
  this packet, not an operator-editable runtime setting (avoids an under-reviewed compliance knob).
- Anonymization replaces `message` and every string leaf in `payloadJson` with the scrubber's
  masked form (§3.2) and sets `anonymizedAt = now()` — `eventType`, `createdAt`, `requestId`
  linkage, and row count are preserved, so operational analytics (e.g. "how many
  `executionRealFailedBounded` events last month") remain accurate after anonymization.
- Hard-delete is a **separate, narrower, explicitly-opt-in path** reserved for a future erasure
  request tied to `User.gdprErasedAt` — this packet does not design that path's automation trigger
  in detail; it only confirms the two are structurally distinct (anonymize-by-time vs
  delete-by-request) and must not be conflated in implementation.

### 4.4 Why anonymize-in-place is the default, not hard-delete

The Kernel's own Human-in-the-Loop and Zero-Loss principles depend on the audit ledger being a
reliable historical record for financial reconciliation (Pack31 escrow) and safety review (Pack32
dispatcher rejections). Silently deleting rows would remove exactly the evidence those systems
exist to produce. Anonymization preserves the *shape* of the audit trail (an event of this type
happened, at this time, on this request) while removing the *content* that made it personally
identifiable — this is the standard "data minimization over time" pattern used by GDPR-compliant
systems, generalized here to the other regimes in scope (§5).

## 5. Regimes explicitly in scope

| Regime | Jurisdiction | Status in this design |
|---|---|---|
| GDPR | EU/EEA | Primary reference regime — strictest default (`resolveVionaPiiScrubRegion()`'s `'default'` fallback approximates GDPR-level strictness for unknown countries) |
| CCPA/CPRA | California, US | Second reference regime — "right to know"/"right to delete" mapped to the anonymize/hard-delete distinction in §4.3/§4.4 |
| LGPD | Brazil | Structurally identical to GDPR in this design (same rule-table mechanism, different retention window) |
| APPI | Japan | Structurally identical (same mechanism, different window) — chosen explicitly because VIONA already ships a `ja` UI locale |
| Others (PIPEDA/Canada, PDPA/Singapore, etc.) | — | Not enumerated individually in this packet; the design's `VionaPiiScrubRegion`/`retentionWindow()` lookup tables are **additive** — adding a new regime is a config-table change, not an architecture change, by design |

This packet does **not** claim legal sign-off on any specific regime's requirements — it designs
the *mechanism* (region-aware rule tables + retention windows) that a legal/compliance review can
populate with correct values before implementation. That legal review is explicitly listed as a
prerequisite gate in §9.

## 6. Omni-Localization for system-generated messages (service-layer, no DB growth)

### 6.1 Problem framing

Client-side UI copy is already solved (`react-i18next`, §2). The gap is **server-generated**
strings: audit `message` fields, future compliance notices, dispatcher rejection reasons — text
that is currently hardcoded English inside service files (e.g.
`'Pack30D-4 Twilio Test-Credentials real-provider POC: execution plan denied...'`). Localizing
these must not require a database table (avoids unbounded growth tied to request volume × language
count) and must not add runtime latency (no synchronous translation-API call in a hot path).

### 6.2 Proposed shape — a static, code-shipped dictionary, keyed by message ID

```ts
// src/lib/viona/i18n/vionaServiceMessageDictionary.ts (proposed, NOT created by this packet)

export type VionaServiceMessageId =
  | 'execution_plan_denied_operator_approval'
  | 'execution_plan_denied_blocked_lane'
  | 'escrow_hold_denied_insufficient_funds'
  | 'dispatcher_rejected_unknown_tool';
  // ... additive, one ID per existing hardcoded string being migrated

export type VionaServiceMessageLocale = 'en' | 'vi' | 'cs' | 'de' | 'fr' | 'ja' | 'ko'; // mirrors
// the 7 locales the client i18n stack already ships, so no new locale list is invented

/** Pure, synchronous, in-memory lookup — a plain nested object literal, same pattern as the
 * existing src/i18n/strings.ts, just scoped to server-generated Viona messages. Never a DB read. */
export function resolveVionaServiceMessage(
  id: VionaServiceMessageId,
  locale: VionaServiceMessageLocale,
  params?: Readonly<Record<string, string>>,
): string;
```

### 6.3 Design rules

- **Code-shipped, not DB-backed.** The dictionary is a TypeScript module (like the existing
  `src/i18n/strings.ts`), deployed with the application, so adding a language is a code change +
  deploy, never a migration, and lookups are O(1) in-memory — zero added latency and zero database
  storage growth as request volume grows.
- **`message` stores the resolved string in the request's own locale at write time** (matching how
  `VionaRequestAuditEvent.message` already works today) **plus a stable `messageId` in
  `payloadJson`** so a UI or export tool can re-render the same event in a *different* locale later
  without re-deriving intent from free text — this is additive to `payloadJson`, not a schema
  change.
- **Fallback chain:** requested locale -> `en` -> the literal `messageId` string itself (never a
  thrown error) — matching the existing client i18n's own `fallbackLng: 'en'` convention exactly.
- **English hardcoded strings already in the codebase are migrated incrementally**, one call site
  at a time, in a future implementation pack — this planning packet does not require a
  "big-bang" rewrite of every existing `appendVionaExecutionAuditEvent()` call site.

## 7. Exact file allowlist — Pack33 future implementation (NOT authorized in this packet)

Listed now, for operator review, so a future implementation phrase can be scoped precisely and
reviewed against this exact list before it starts:

**New files:**
1. `src/lib/viona/compliance/vionaPiiScrubber.ts` — `scrubVionaPii()`, `resolveVionaPiiScrubRegion()`, the rule table (§3.2).
2. `src/lib/viona/compliance/vionaAuditRetentionPolicy.ts` — `retentionWindow()`, the anonymization predicate (§4.3).
3. `src/lib/viona/i18n/vionaServiceMessageDictionary.ts` — `resolveVionaServiceMessage()`, the message-ID dictionary (§6.2).
4. `scripts/viona-pack33-audit-retention-job.ts` (or equivalent) — the batch job entry point (§4.3), designed to be safely runnable in dry-run mode.
5. `scripts/test-viona-pack33-global-compliance.ts` — the future implementation's unit test suite.

**Modified files:**
6. `src/services/viona/vionaExecutionAuditWriteService.ts` — call `scrubVionaPii()` on `message`/`payloadJson` string leaves before `create()`; additive only, existing call sites unchanged.
7. `prisma/schema.prisma` — **additive only**: `VionaRequestAuditEvent.retentionRegion` (`String?`), `VionaRequestAuditEvent.anonymizedAt` (`DateTime?`). No existing field renamed or removed.
8. `docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md` — Kernel sync recording the implementation, once done.

**Explicitly NOT touched by any future Pack33 implementation increment:**
- `src/services/viona/vionaExecutionPlanRouteService.ts` — no change to the real-provider call
  payload itself (§3.5).
- `src/lib/viona/realProviderAdapter/**` — no change to what is actually sent to Twilio or any
  future provider.
- `src/i18n/**` (client UI i18n) — untouched; Pack33's dictionary is a separate, server-only
  concern (§6.3).
- Any `PACK30_REAL_PROVIDER_EXECUTION_ENABLED` gating logic.

## 8. Required test plan — future implementation pack

1. **Scrubber correctness (pure unit tests, no I/O):** phone numbers (multiple international
   formats), emails, and card-PAN-shaped strings are masked; non-PII text passes through
   unchanged; a string with zero matches returns `matchedRuleNames: []`.
2. **Region resolution fallback:** unknown/`null`/malformed `countryCode` resolves to `'default'`
   (the strictest baseline), never to "no scrubbing."
3. **Audit-writer integration:** `appendVionaExecutionAuditEvent()` with a `payloadJson` containing
   a raw phone number stores the masked form; the original raw value is asserted to be absent from
   the persisted row (fake-Prisma-client assertion, same pattern as the Pack31/Pack32.5 test
   suites).
4. **Retention job dry-run:** given fixture rows at various ages/regions, the job correctly
   selects only rows past their window; a second run (idempotency) makes zero further changes to
   already-`anonymizedAt`-set rows; a row inside its window is provably untouched.
5. **Anonymization preserves shape:** `eventType`, `requestId`, `createdAt`, and row count are
   identical before/after anonymizing a fixture row; only `message`/`payloadJson` string content
   changes.
6. **Dictionary fallback chain:** an unknown `messageId`/locale combination never throws; falls
   back to `en`, then to the literal ID string.
7. **Provider-payload non-interference (regression, critical):** a test explicitly asserts that
   `executeVionaTwilioTestPocReal()`'s outbound `intent` fields are **not** run through the
   scrubber — reusing the exact fake-transport pattern from
   `scripts/test-viona-pack32-5-core-integration-audit.ts` to assert the real phone number the
   fake Twilio transport receives is unmodified, guarding against the exact conflation warned
   about in §3.5.
8. **Full regression:** every existing Pack29–Pack32.5 test script must remain 100% PASS after the
   audit-writer change in §7 item 6 (additive wrapping only).

## 9. Non-goals / forbidden scope (this packet, and the first future implementation increment)

- No legal sign-off is claimed for any regime's specific retention window or PII rule set — those
  values need a legal/compliance review before implementation, not just an engineering one (see
  §5). The mechanism is designed now; the region-specific parameter values are a follow-up review
  step tracked as a prerequisite gate, not silently defaulted by this packet.
- No hard-delete/erasure-automation path is designed in detail (§4.3) — only its structural
  separation from anonymize-by-time is confirmed.
- No change to the real-provider adapter's outbound payload (§3.5, §7) — compliance scrubbing is
  strictly an internal-logging concern in this design.
- No `operator_only_detail` unmask-and-reveal mechanism is designed (§3.4) — deferred.
- No client-side UI i18n change — `src/i18n/**` is untouched (§6.3, §7).
- No Prisma migration is run, and no migration file is even hand-authored, in this packet — §7's
  schema bullet is a description of a *future* additive change, unlike Pack31's own planning
  packet which went further and hand-authored (but did not apply) a migration file; this packet
  deliberately stays one step more conservative given the compliance sensitivity of the domain.
- No code file listed in §7 is created in this packet — verified in §10/§11 below.

## 10. Drift Report (this packet)

- `git diff --stat origin/master`: only new files under `docs/product/` (this file) and the
  Handoff update — zero `.ts`/`.tsx` files created or modified.
- `prisma/schema.prisma`: zero diff.
- `package.json` / lockfile: zero diff.
- `.env*`: zero diff.
- No new npm dependency proposed or installed.
- No HTTP route created or modified.
- No existing test file modified.

## 11. Explicit NO / YES assertions (this packet)

- Real execution enabled? **NO.**
- Production authorized? **NO.**
- Any `.ts`/`.tsx` file created or modified by this packet? **NO.**
- Any Prisma schema/migration change applied? **NO.**
- Any PII actually scrubbed by running code today? **NO** — design only.
- Any audit row actually anonymized/deleted today? **NO** — design only.
- Does this packet block or slow down any existing feature? **NO** — purely additive design, zero
  runtime impact.
- Is legal/compliance sign-off on specific regime parameters claimed? **NO** — explicitly deferred
  (§9).

## 12. Files changed (this packet)

- `docs/product/VIONA_PACK33_GLOBAL_COMPLIANCE_PLAN.md` (NEW — this file)
- `Handoff_VIONA11726.txt` (local file, not in this repo — updated separately per operator's own
  local workflow)

## 13. Operator-phrase note (transparency record)

No `APPROVE_PACK33_...` phrase was included in the operator's instruction that started this
packet, unlike every prior planning packet in this chain (Pack30D-2, Pack31, Pack32 planning all
included one explicitly). This is recorded here, not silently omitted, per this project's own
established transparency norm. Given the docs-only, zero-risk nature of this packet, work
proceeded on the strength of the operator's explicit, unambiguous written instruction. **A future
implementation increment for Pack33 still requires its own, separately and explicitly granted
operator phrase** (e.g. `APPROVE_PACK33_GLOBAL_OMNI_COMPLIANCE_IMPLEMENTATION`, to be confirmed by
the operator at that time) — this packet grants no implementation authorization of any kind.

## 14. Recommended next step

1. Operator review of this packet, in particular: (a) the region list in §5, (b) whether
   `retentionWindow()`'s values should be legal-reviewed before or after the mechanism is coded,
   and (c) confirmation that `request.assign`-style additive-only schema fields (§7 item 7) are an
   acceptable shape.
2. If approved, merge this docs-only PR.
3. A **separate, future** planning-to-implementation phrase (e.g.
   `APPROVE_PACK33_GLOBAL_OMNI_COMPLIANCE_IMPLEMENTATION`) would be required before any code in
   §7's allowlist is written — mirroring the exact two-phase (plan phrase, then implementation
   phrase) pattern already used for Pack30D-2/30D-4, Pack31, and Pack32.
