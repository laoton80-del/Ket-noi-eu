# Pack 39 — B2B Routing Performance & Test Isolation Fixes (Planning Packet)

Status: **PLANNING ONLY**. No application code, no Prisma schema/migration change, no Fly secret
change is authorized by this document. Everything below is a design proposal for a future,
separately-authorized implementation packet.

## 1. Trigger / problem statement

Pack 38 (merged #335) fixed the `low_confidence` intent-tuning gap and was live-verified on
staging. Two orthogonal findings surfaced during that same session's full regression run and live
`fly logs` capture — both logged in the DEFERRED/BACKLOG section, neither fixed (out of Pack 38's
authorized scope):

1. **Performance/safety finding — double LLM classification call per inbound webhook message.**
   The merchant-agent webhook controller and the autonomous dispatcher each independently call the
   Intent Router's real LLM classification for the *same* message, doubling per-message OpenAI
   cost and — more importantly — opening a narrow but real **decision-drift window** (see §2.1)
   where two separate real-model calls for identical input are not guaranteed to return identical
   output.
2. **Financial-leak finding — a real, billed OpenAI API call fires during local unit-test
   regression.** `scripts/test-viona-pack37-b2b-dispatcher-realization.ts`'s own pre-existing test
   #19 explicitly `delete`s `process.env.OPENAI_API_KEY` to prove graceful degradation with no key
   configured, but `@prisma/client`'s own internal `.env` auto-load silently restores the real key
   mid-test the moment that test's own (unmocked) code path first touches the database, defeating
   the test's env-isolation and causing an unintended, real, billed network call on every local
   regression run now that `.env`'s key is a real value.

Both are read directly from shipped source and this session's own reproduction, not guessed — see
§2 for the exact evidence trail.

## 2. Root-cause analysis (read directly from the current, shipped source — not guessed)

### 2.1 Double LLM classification call

Reading `src/controllers/VionaWebhookMerchantAgentController.ts` and
`src/services/viona/vionaAutonomousDispatchService.ts` as they exist on `master` today:

1. `postVionaWebhookMerchantAgent()` calls `routeIntentFn(...)` (`routeVionaDispatchIntent()`) once,
   itself — **call #1** — purely to learn the classified `toolName` *before* dispatch, because it
   must compute `operatorApprovalGranted`/`userConsentGranted` (via
   `deriveVionaWebhookStandingApprovalFlags()`) and pass them into `dispatchFn(...)` as
   already-computed, human-consent-shaped booleans. This is not accidental: `dispatchVionaAutonomousRequest()`'s
   own module header states it "never derives, infers, or defaults [these] from the LLM's decision" —
   by design, it expects the caller to already know what it is consenting to.
2. `dispatchVionaAutonomousRequest()` then unconditionally calls `routeVionaDispatchIntent()` again,
   itself, internally (`vionaAutonomousDispatchService.ts` line ~148) — **call #2** — with
   effectively the same `requestId`/`requestStatus`/`userMessage` inputs, because its own public
   contract as authored in Pack 32 is "classify AND validate AND execute in one call", with no
   parameter allowing a caller to supply an already-computed decision.
3. Confirmed empirically in this session: a single Pack 39-triggering webhook request produced 2
   real `[AIRouter] task=ROUTING_INQUIRY` log lines with **identical** `promptTokens=1008` (the same
   classification prompt, called twice), captured live via `fly logs` during the Pack 38 QA run,
   plus a 3rd, unrelated, smaller call for Tier-2 reply phrasing.
4. **Why this is a safety finding, not only a cost one:** because each of the 2 calls is an
   independent real network round-trip to a non-deterministic model, there is no guarantee call #1
   and call #2 return the *same* `toolName`/`confidence`. In the current code, the consent flags
   used for execution are derived from call #1's decision, while the tool that is *actually executed*
   is whatever call #2 independently reclassifies — a narrow window where a standing-approved
   read-only tool (from call #1) could, in a low-probability model-variance scenario, diverge from
   what call #2 executes. No evidence of this having actually happened has been observed; this is a
   structural risk this packet closes by construction, not a reported incident.
5. `dispatchVionaAutonomousRequest()` already exports the exact return type of
   `routeVionaDispatchIntent()` as `VionaDispatchDecision` (`vionaIntentRouter.ts`) — a full,
   reusable, already-existing type, not something this packet needs to invent.

### 2.2 Real OpenAI call during local regression (financial leak)

Reading `scripts/test-viona-pack37-b2b-dispatcher-realization.ts`,
`src/lib/viona/merchant/vionaMerchantReadOnlyQueryReplyFormatter.ts`, and `src/lib/prisma.ts`, plus a
throwaway repro script run and deleted this session:

1. `formatVionaMerchantReadOnlyQueryReply()`'s Tier-2 gate is a fresh, per-call read:
   `const apiKey = process.env.OPENAI_API_KEY?.trim(); if (!apiKey) return tier1Reply;` — correct
   and stateless on its own.
2. Test #19 ("secrets: end-to-end dispatch with `OPENAI_API_KEY` unset...") wraps its call in
   `withOpenAiApiKeyAsync(undefined, async () => { ... })`, which does
   `delete process.env.OPENAI_API_KEY` before the call and restores it in a `finally` block after.
   In isolation this is correct.
3. Unlike its own sibling tests (#1–#4 in the same file), test #19 does **not** inject a fake
   `deps.executeMerchantQuery` into `dispatchVionaAutonomousRequest()`. This means it reaches the
   real, unmocked `executeMerchantReadOnlyQuery()` → `findMerchantProfileById()` → the **first-ever**
   `getPrisma()` call in that test process.
4. `@prisma/client`'s generated runtime (confirmed this session by inspecting
   `node_modules/@prisma/client/runtime/library.js`, which bundles its own `dotenv`-parsing/merge
   logic, and `node_modules/.prisma/client/index.js`'s embedded `"schemaEnvPath": "../../../.env"`
   config) auto-loads the project's root `.env` file **internally**, independent of any
   application-level `import 'dotenv/config'`, the first time a `PrismaClient` is constructed in a
   process. Because test #19 had just `delete`d `OPENAI_API_KEY` (not merely set it to `""`),
   Prisma's own env-loader — which only ever fills in keys it considers "missing" — sees the key as
   absent and **silently re-injects the real value from `.env`**, restoring it mid-test.
5. Reproduced directly this session with a throwaway script (since deleted): `delete
   process.env.OPENAI_API_KEY` → confirmed `undefined` → `import('./src/lib/prisma')` +
   `getPrisma()` → confirmed the real key (`164` chars) was back in `process.env`, with zero
   application code involved in restoring it.
6. Net effect: the real, un-mocked `formatVionaMerchantReadOnlyQueryReply()` call inside test #19
   now sees a real key, attempts Tier-2, and succeeds — a real, billed OpenAI network call
   (confirmed via a real `[AIRouter]` log line with real token counts) fires on every local
   regression run, silently, with the test's own assertions (`dispatchAccepted:true`, non-empty
   `replyText`) passing either way (Tier-1 or Tier-2 both satisfy them) — so the leak produces no
   test failure signal at all today.
7. This is a **test-isolation gap**, not a functional/product regression, and it only became
   observable once `.env`'s `OPENAI_API_KEY` became a real value (`APPROVE_PACK37_OPENAI_STAGING_SECRET`
   session) — before that, Prisma's silent restore just re-injected an empty string, masking the
   issue completely.

## 3. Design principles carried forward (non-negotiable, unchanged from Pack32/37/38)

- **Zero behavior change for every existing caller.** Both fixes must be purely additive/opt-in;
  every existing test and call site that does not use the new capability keeps its exact current
  behavior.
- **No unit test in this repo may ever make a real network call, deliberately or by accident** (the
  rule `vionaIntentRouter.ts`'s own module header already states) — §4.2 is specifically about
  making this rule *actually hold* rather than merely stated.
- **Fail-closed, deny-by-default stays unchanged.** Neither fix touches `VIONA_DISPATCH_MIN_CONFIDENCE`,
  any `inputSchema`, the consent-flag derivation rule (still always human-supplied, never
  LLM-inferred), or any Tool Registry entry.
- **Defense in depth over a single point of trust.** §4.2 proposes a layered fix (a mechanical
  test-file fix + a reusable test-infra guard + an optional, off-by-default production circuit
  breaker) precisely so a *future* test that repeats test #19's same mistake is still caught, not
  just this one instance.

## 4. Proposed implementation options

### 4.1 Fix — deduplicate the classification call (Option A, RECOMMENDED default scope)

Add a new, optional, additive field to `DispatchVionaAutonomousRequestInput`
(`vionaAutonomousDispatchService.ts`):

```ts
/** Pack39, additive, optional. When the caller has already classified this exact request via its
 *  own routeVionaDispatchIntent() call (e.g. to derive consent flags before calling this function),
 *  pass that same decision here to skip this function's own internal classification call —
 *  eliminating the double-LLM-call cost AND the decision-drift window described in plan §2.1.
 *  Omitted (undefined, the default): behavior is byte-for-byte unchanged — this function classifies
 *  internally exactly as it always has. The existing defensive `findVionaToolRegistryEntry()`
 *  re-check (this file's own pre-existing discipline) still runs unconditionally either way — a
 *  precomputed decision is never trusted more than a freshly-computed one. */
precomputedIntentDecision?: VionaDispatchDecision;
```

`dispatchVionaAutonomousRequest()`'s one-line change:

```ts
const decision = input.precomputedIntentDecision ?? await routeVionaDispatchIntent({ ... }, { callLlm });
```

`VionaWebhookMerchantAgentController.ts`'s change: pass its own already-computed `intentDecision`
(the result of its existing `routeIntentFn(...)` call, already used today for
`deriveVionaWebhookStandingApprovalFlags()`) into `dispatchFn(...)` as
`precomputedIntentDecision: intentDecision`. The controller's own call to `routeIntentFn` is now the
**only** real classification call for the whole request; `dispatchFn` reuses its exact result
instead of reclassifying.

Properties of this design:

- **Zero new types.** `VionaDispatchDecision` already exists, exported by `vionaIntentRouter.ts`,
  covering both the accept and reject shapes.
- **Zero behavior change for every non-webhook caller.** Every existing `scripts/test-viona-pack32*`/
  `pack37`/`pack38` test that calls `dispatchVionaAutonomousRequest()` directly, without setting this
  new field, continues to classify internally exactly as today — re-verified by a dedicated
  regression test (§6, item 4).
- **Closes the decision-drift window** described in §2.1 item 4 by construction: the consent flags
  and the executed tool are now guaranteed to come from the exact same decision object, not two
  independent model calls.
- **Rejected-decision case handled uniformly.** If `precomputedIntentDecision.ok === false`, the
  function's existing reject-path (audit write + `dispatch.accepted:false`) runs exactly as it does
  today for a freshly-computed rejection — no new branch needed, since the function already
  branches on `decision.ok` regardless of where `decision` came from.

**Alternatives considered and rejected:**

- *A message-keyed, in-process cache/memoization of classification results* — rejected: introduces
  cross-request mutable module state, cache-invalidation questions (TTL? keyed on what exactly?),
  and breaks this codebase's consistent "pure, dependency-injected function" testing philosophy
  (every Pack29–38 service is designed to be a pure function of its own explicit input + injected
  `deps`, never ambient module state) for a marginal benefit the explicit-parameter approach already
  achieves with zero new state.
- *Having the controller call `dispatchFn` first (with consent flags temporarily `false`), inspect
  its internal decision, then call it a second time with corrected flags if needed* — rejected: still
  2 calls, and worse, risks executing a tool once with incorrect consent before "correcting" it.

### 4.2 Fix — layered defense against real network calls in tests (Option A, RECOMMENDED default scope)

Three layers, in increasing order of robustness. **Layers 1 and 2 are required** (test-only, zero
production-code change); **Layer 3 is proposed but flagged as a separate, smaller authorization
decision** since it touches exactly one shared production file.

**Layer 1 — mechanical: fix test #19 itself (test-file only).**
`scripts/test-viona-pack37-b2b-dispatcher-realization.ts`'s test #19 must inject a fake
`deps.executeMerchantQuery` into its `dispatchVionaAutonomousRequest()` call, exactly mirroring its
own sibling tests #1–#4 in the same file. This means it never reaches the real
`executeMerchantReadOnlyQuery()` → `findMerchantProfileById()` → first-`getPrisma()` call — the
actual trigger for Prisma's env-reload — closing the specific leak at its root, with zero product
code touched.

**Layer 2 — reusable "deeply unset" test-env guard (new, small, test-infra-only file).**
A new shared helper, `scripts/_testHelpers/vionaTestEnvGuard.ts` (or colocated per-file if the
operator prefers zero new shared files — a decision for the implementation phase), replacing the
current, sibling-duplicated `withOpenAiApiKeyAsync()` pattern with one that does not merely `delete`
the key but **traps** it for the duration of the callback:

```ts
async function withOpenAiApiKeyDeeplyUnsetAsync<T>(fn: () => Promise<T>): Promise<T> {
  const original = Object.getOwnPropertyDescriptor(process.env, 'OPENAI_API_KEY');
  Object.defineProperty(process.env, 'OPENAI_API_KEY', {
    configurable: true,
    enumerable: true,
    get: () => undefined,
    set: () => { /* swallow any later write attempt, e.g. Prisma's own silent .env re-merge */ },
  });
  try {
    return await fn();
  } finally {
    if (original) Object.defineProperty(process.env, 'OPENAI_API_KEY', original);
    else delete process.env.OPENAI_API_KEY;
  }
}
```

Because this replaces the plain property with a getter/setter pair, any later plain assignment
(`process.env.OPENAI_API_KEY = '...'` — exactly what Prisma's bundled dotenv-merge logic does
internally) is silently absorbed by the setter and never visible to any *subsequent read* — including
`formatVionaMerchantReadOnlyQueryReply()`'s own `process.env.OPENAI_API_KEY?.trim()` check. This
satisfies the operator's own framing ("deeply unset... even if Prisma silently reloads the `.env`
file") directly, and is reusable by any current or future `OPENAI_API_KEY`-graceful-degradation test
in this repo, not just test #19.

**Layer 3 — optional, off-by-default production circuit breaker (proposed, separate sign-off).**
A single, additive, test-only env flag check inside `AIRouterService.ts`'s real-call path (e.g.
`VIONA_TEST_BLOCK_REAL_OPENAI_CALLS`), defaulting to unset/no-op in every real
environment (local dev, staging, production) and only ever set by a shared test-bootstrap import at
the very top of `scripts/test-viona-*.ts` files:

```ts
if (process.env.VIONA_TEST_BLOCK_REAL_OPENAI_CALLS === '1') {
  throw new Error(
    '[AIRouterService] a real OpenAI call was attempted during a test run — inject callLlm/deps instead.'
  );
}
```

This converts *any* future accidental real-call attempt (including ones this packet's own Layers 1–2
did not anticipate) from a silent billing leak into an immediate, loud test failure — true defense in
depth. Flagged as its own, smaller decision because it is the only one of the 3 layers that touches a
shared production file (`AIRouterService.ts`), even though the change itself is a 3-line, off-by-
default, test-only guard with zero effect on any real environment.

## 5. Exact file allowlist for the implementation phase

| File | Change type | Notes |
|---|---|---|
| `src/services/viona/vionaAutonomousDispatchService.ts` | Modify (additive) | New optional `precomputedIntentDecision` field + 1-line fallback change (§4.1). Zero change to the existing internal classification path when omitted. |
| `src/controllers/VionaWebhookMerchantAgentController.ts` | Modify (additive) | Pass its own already-computed `intentDecision` into `dispatchFn(...)` as `precomputedIntentDecision`. Zero change to signature verification/channel-gate/idempotency/response-shape logic. |
| `scripts/test-viona-pack37-b2b-dispatcher-realization.ts` | Modify | Test #19: inject a fake `executeMerchantQuery` (Layer 1, §4.2) + adopt the new deeply-unset guard (Layer 2). |
| `scripts/_testHelpers/vionaTestEnvGuard.ts` (exact path TBD at implementation time) | New | Shared `withOpenAiApiKeyDeeplyUnsetAsync()` helper (Layer 2, §4.2). |
| `src/services/ai/AIRouterService.ts` | Modify (additive, optional — separate sign-off) | Layer 3 only (§4.2) — a 3-line, off-by-default test-mode guard. May be deferred to a follow-up if the operator prefers Layers 1–2 only for this pack. |
| `scripts/test-viona-pack39-routing-performance-and-test-isolation.ts` | New | Test plan §6 below. |
| `scripts/test-viona-pack32-autonomous-dispatcher.ts`, `scripts/test-viona-pack32-5-core-integration-audit.ts`, `scripts/test-viona-pack35-b2b-webhook-routing.ts`, `scripts/test-viona-pack37-b2b-dispatcher-realization.ts`, `scripts/test-viona-pack38-b2b-intent-tuning.ts` | No change expected | Regression-only — every existing `dispatchVionaAutonomousRequest()`/webhook-controller call site in these files omits the new field, so their asserted behavior must remain byte-for-byte identical (§6, item 4). Listed here explicitly so any *unexpected* diff during implementation is treated as a signal, not silently accepted. |
| `docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md` | Modify (additive) | Log implementation completion. |
| `Handoff_VIONA11726.txt` | Modify (additive) | Log implementation completion. |

Explicitly **NOT** touched by this packet's implementation phase:

- `src/lib/viona/dispatcher/vionaIntentRouter.ts` — `routeVionaDispatchIntent()`'s own classification
  logic, prompt, few-shot examples (Pack38), and `VIONA_DISPATCH_MIN_CONFIDENCE` are all unchanged;
  this packet only changes *how many times* it gets called, never *how* it classifies.
- `src/lib/viona/dispatcher/vionaToolRegistry.ts` — no tool/description/schema change.
- `src/services/viona/vionaMerchantReadOnlyQueryExecutionService.ts` and
  `src/lib/viona/merchant/vionaMerchantReadOnlyQueryReplyFormatter.ts` — unchanged; the Tier-1/Tier-2
  gate logic itself is correct today (§2.2 item 1) and needs no fix, only better test isolation
  around it.
- Any Prisma schema/migration file — the `.env` auto-load behavior lives inside `@prisma/client`'s
  own bundled runtime, not this repo's schema; this packet works around it in tests, it does not (and
  structurally cannot, without vendoring/patching a 3rd-party package — explicitly rejected as
  disproportionate) change Prisma's own behavior.
- Any Fly secret.
- `src/services/viona/vionaMerchantProfileService.ts`, `vionaMerchantTenantScope.ts`,
  `vionaMerchantAiPersonaTypes.ts` — persona resolution, unrelated to either finding.

## 6. Test plan for the implementation phase

1. **Deduplication — dynamic proof.** A spy-wrapped `callLlm` injected into a full webhook-controller
   → `dispatchFn` round trip (mirroring `scripts/test-viona-pack35-b2b-webhook-routing.ts`'s own
   controller-level test shape) asserts the spy is invoked **exactly once** for a single inbound
   webhook message that results in an accepted dispatch — today this would assert exactly twice,
   making this the core regression-proof of the fix.
2. **Precomputed-decision correctness — accept case.** Calling `dispatchVionaAutonomousRequest()`
   with a `precomputedIntentDecision` set to a fake, already-`ok:true` decision and a `callLlm` spy
   that throws if ever invoked proves the internal classification call is fully skipped and the
   supplied decision's `toolName`/`toolInput` drive execution exactly as a freshly-classified one
   would.
3. **Precomputed-decision correctness — reject case.** Same as above but with an `ok:false`
   precomputed decision (e.g. `reason: 'low_confidence'`) proves the existing reject-path (audit
   write + `dispatch.accepted:false`) still runs correctly, with zero LLM call.
4. **Zero-regression when omitted.** Every existing Pack32/32.5/35/37/38 test file that calls
   `dispatchVionaAutonomousRequest()` or the webhook controller *without* setting the new field must
   produce byte-for-byte identical results to before this pack (full regression — see item 7).
5. **Financial-leak — direct reproduction-then-fix proof.** A new test that mirrors this session's
   own throwaway repro (delete `OPENAI_API_KEY`, trigger a real `getPrisma()`-touching code path,
   assert the key is back) run *without* the Layer 2 guard (to document the bug still exists at the
   Prisma layer, which this packet cannot and does not change) followed by the same sequence *with*
   `withOpenAiApiKeyDeeplyUnsetAsync()` proving the key reads as `undefined` even after the exact same
   Prisma-triggering call.
6. **Test #19 no longer touches the network.** After Layer 1's fix, a lightweight guard (e.g.
   temporarily monkey-patching `createRoutedChatCompletion` for the duration of a single assertion,
   or simply asserting `deps.executeMerchantQuery` was called and the real service module's export
   was never referenced during that specific test) proves test #19 no longer reaches
   `findMerchantProfileById()`/`getPrisma()` at all.
7. **Full regression.** Every existing `scripts/test-viona-pack*.ts` suite (23 as of this planning
   packet, excluding the live-staging-only Pack36A QA script) still 100% PASS; typecheck 0 errors;
   lint 0 new errors/warnings.
8. **(If Layer 3 is authorized) Circuit-breaker test.** With `VIONA_TEST_BLOCK_REAL_OPENAI_CALLS=1`
   set, any attempt to call the real, unmocked `createRoutedChatCompletion()` throws the documented
   error instead of making a network call; with the flag unset (the default, real-environment state),
   `AIRouterService.ts`'s behavior is byte-for-byte unchanged from today.

## 7. Authorization phrases for the implementation phase

- `APPROVE_PACK39_TECH_DEBT_ERADICATION_IMPLEMENTATION` — Layers 1–2 of §4.2 (test-file fix + reusable
  deeply-unset guard) plus §4.1 (classification-call deduplication). Recommended default scope —
  zero production files touched except the 2 listed in §4.1 (`vionaAutonomousDispatchService.ts`,
  `VionaWebhookMerchantAgentController.ts`), both purely additive/optional changes.
- `APPROVE_PACK39_NETWORK_CIRCUIT_BREAKER` — Layer 3 of §4.2 only (the optional, off-by-default
  `AIRouterService.ts` test-mode guard) — kept as its own, separate phrase since it is the only
  change touching a shared production file across all of §4, never implied by the first phrase.

## 8. Non-goals / deferred (unchanged from this session's own findings)

- `Pack36B` Merchant Admin UI — still deferred, unrelated to this packet.
- `TourismBooking` migration shadow-DB replay issue — still deferred, unrelated to this packet.
- Any change to `VIONA_DISPATCH_MIN_CONFIDENCE`, Tool Registry entries, or the Pack38 few-shot
  examples — unrelated to either of this packet's 2 findings.
- Vendoring, patching, or working around `@prisma/client`'s own bundled `.env` auto-load behavior at
  its source (e.g. a Prisma config flag to disable it) — not attempted; this packet's Layer 2 guard
  neutralizes its *effect* on tests without touching Prisma's own package, which is out of scope and
  disproportionate to the size of the actual problem.
