# Pack 38 — B2B Intent Routing & Confidence Tuning (Planning Packet)

Status: **PLANNING ONLY**. No application code, no Prisma schema/migration change, no Fly secret
change is authorized by this document. Everything below is a design proposal for a future,
separately-authorized implementation packet.

## 1. Trigger / problem statement

Pack 37 (merged #333) closed the `dispatchAccepted:false` gap for the 2 Pack34 merchant
read-only tools by wiring them into `vionaAutonomousDispatchService.ts`'s switch. Pack 37's own
follow-up (`APPROVE_PACK37_OPENAI_STAGING_SECRET`, executed this session) confirmed
`OPENAI_API_KEY` is now live on `viona-api-staging-eu` and the classification LLM call itself
succeeds end-to-end (no more `llm_call_failed`).

However, the live staging QA script's own fixed test message —

> "What are your opening hours today?"

— still classifies as `low_confidence` (verified directly against the staging DB's own
`VionaRequestAuditEvent`, `dispatcherIntentRejected`, `payloadJson.reason: "low_confidence"`, not
inferred from the HTTP response alone). Per `vionaIntentRouter.ts`'s own contract, `low_confidence`
means either the model returned `toolName: null` (declined to pick a tool) or its `confidence` was
below `VIONA_DISPATCH_MIN_CONFIDENCE` (`0.6`). This is the **system working exactly as designed**
(fail-closed, no forced/guessed tool match) — the finding is a **prompt/description tuning gap**,
not a bug and not a safety regression.

## 2. Root-cause analysis (read directly from the current, shipped source — not guessed)

Reading `src/lib/viona/dispatcher/vionaToolRegistry.ts` and
`src/lib/viona/dispatcher/vionaIntentRouter.ts` as they exist on `master` today:

1. **Description/phrasing mismatch.** `merchant_schedule_availability_check`'s description is:
   > "Read-only: check a merchant's own appointment/booking schedule for open slots in a given
   > date range. Never creates, modifies, or cancels any booking."

   This describes *appointment-slot availability in a date range* — it never mentions "opening
   hours", "business hours", "hours today", or any of the common natural-language phrasings a
   real customer/merchant-agent message would use. A strict, deny-by-default classifier reading
   only this description has a legitimate reason to consider "opening hours today" a plausible-but-
   not-certain match and decline (`toolName: null`) rather than guess.

2. **Schema-shape hesitation.** The tool's `inputSchema` requires `dateRangeStart`/`dateRangeEnd`
   (both `string`). A question like "today" gives the model an implicit single day, not an explicit
   ISO date range — the model may be conservatively avoiding a schema-invalid guess (which
   `validateVionaToolInputAgainstSchema()` would reject anyway) by declining instead.

3. **Zero few-shot examples anywhere in the prompt.** `buildVionaDispatchClassificationPrompt()`
   (`vionaIntentRouter.ts`) lists the strict JSON-only instructions, the full tool registry (name +
   description + input schema), and the request context — but contains **no worked example** of
   any input message mapped to a correct classification, for any of the 4 registered tools. This
   is consistent with a Pack32-era design decision to keep the prompt "one structured-JSON LLM
   classification call — nothing more" (module header) and was never revisited once real merchant
   tools were added in Pack34/37. Adding well-chosen, safety-reviewed examples is the standard,
   lowest-risk lever for improving small-model structured-classification recall without touching
   any enforcement logic.

4. **`VIONA_DISPATCH_MIN_CONFIDENCE` (`0.6`) itself is untouched by this analysis.** The audit
   evidence does not tell us whether the model returned `toolName: null` or a below-threshold
   `toolName: "merchant_schedule_availability_check"` — `routeVionaDispatchIntent()` collapses both
   into the same `low_confidence` reason by design (module header: "the model itself declined to
   pick a tool... treated as not confident enough to act, never a separate no-op success"). This
   packet's implementation phase test plan (§7) requires distinguishing the two cases (e.g. via a
   temporary debug log or a fake-`callLlm` unit test replaying the real staging prompt) **before**
   deciding whether threshold-tuning is even relevant, per the safety-first ordering in §4.

## 3. Design principles carried forward (non-negotiable, unchanged from Pack32/34/37)

- **Deny-by-default stays deny-by-default.** This packet's entire purpose is to help the model
  *correctly and confidently* recognize an in-scope message — never to loosen validation, never to
  add a fallback/default tool guess, never to make `low_confidence` less strict.
- **Classification-prompt persona non-contamination (Pack37 §4.2 rule) is unchanged.** Any new
  few-shot examples are static, generic, and tool-registry-derived only — they must never
  reference a real `MerchantProfile.aiPersona`, tenant name, or any per-merchant data. This is the
  same rule Pack37's own test suite already content-scans for; this packet extends that same test,
  never relaxes it.
- **No new write-capable surface.** Both tools remain `merchant_read_only_query`,
  `merchantScopedOnly: true`, zero `inputSchema` change proposed.
- **Prompt-quality-first, threshold-second.** Improving tool descriptions + adding worked examples
  is the default, lowest-risk recommendation (§4, Option A). Lowering
  `VIONA_DISPATCH_MIN_CONFIDENCE` is named as a possible **future**, separately-authorized option
  (§4, Option B) only, specifically because a lower threshold is a safety-relevant change (higher
  false-accept risk for *every* tool, including the existing Twilio POC) and must not be bundled
  silently into a "just improve the wording" packet.

## 4. Proposed implementation options

### Option A — Prompt/description tuning only (RECOMMENDED default scope for the next implementation phase)

1. **Broaden `merchant_schedule_availability_check`'s `description` string** (text-only change,
   `vionaToolRegistry.ts`) to explicitly cover the common real-world phrasings this finding
   surfaced — "opening/business/operating hours", "are you open [today/tomorrow/now]", alongside
   the existing "open appointment slots in a date range" framing — and add a short input-shape hint
   (e.g. "for a same-day/general hours question, use today's date for both `dateRangeStart` and
   `dateRangeEnd`") so the model has an explicit, safe way to fill the existing schema without
   guessing. Zero `inputSchema` field added/removed/retyped.
2. **Broaden `merchant_inventory_stock_check`'s `description`** similarly with 1-2 additional
   common phrasings ("do you have X in stock", "is X available") — same "text-only, zero schema
   change" constraint.
3. **Add a small, fixed set of few-shot examples** to `buildVionaDispatchClassificationPrompt()`
   (`vionaIntentRouter.ts`) — proposed: exactly 1 positive example per registered tool (4 total,
   covering `twilio_test_sms_poc`, `marketing_content_generator`, and both merchant tools) plus
   exactly 1 explicit negative example (a message that must classify as `toolName: null`, e.g. an
   off-topic/unrelated message) so the model also sees a confirmed-correct "decline" case, not just
   confirmed-correct "accept" cases. Examples are static string literals in the source file, not
   fetched from any DB/config, and are the same for every tenant/request (no persona injection —
   see §3).
4. **No change to `VIONA_DISPATCH_MIN_CONFIDENCE`, `inputSchema`, `dispatchVionaAutonomousRequest()`,
   `vionaMerchantReadOnlyQueryExecutionService.ts`, or any Prisma model.**

### Option B — Confidence threshold review (named only, NOT designed in detail, NOT the default)

A possible future, separately-authorized packet could revisit `VIONA_DISPATCH_MIN_CONFIDENCE`
itself (e.g. a per-category threshold instead of one global constant) — but only after Option A
ships and staging evidence shows the model is now returning a correctly-matched `toolName` with a
confidence *just under* 0.6 (not `toolName: null`, which no threshold change could ever fix). This
packet does not propose a specific new threshold value; it only names the option and its own
distinct authorization phrase (§8) so it is never silently bundled into Option A's smaller,
lower-risk scope.

## 5. Script fix tracking (carried over from the previous session, at risk of being lost)

During the `APPROVE_PACK37_OPENAI_STAGING_SECRET` session, a real bug was found and fixed **locally,
uncommitted** in `scripts/fly-staging-sync-secrets.mjs`: `flyctl secrets import` reads
`NAME=VALUE` pairs from **stdin**, not from a file-path positional argument. The script was passing
a temp file path as an argument, which flyctl silently ignores while blocking forever on stdin —
causing 3 real multi-minute hangs before the root cause was isolated. The fix (piping the file's
contents via `spawnSync(..., { input: fs.readFileSync(tmp), stdio: ['pipe','inherit','inherit'] })`)
was applied to the working tree and **manually verified working** (the corrected stdin-fed flow was
run directly and successfully injected `OPENAI_API_KEY` to staging), but the file itself was never
staged or committed on any branch — it is a `.mjs` file, not `.ts`/`.tsx`, but this packet is
strictly docs-only per the operator's own instruction, so it is being **tracked here, not committed
here**.

**Implementation-phase action item (§7, first step):** `git add scripts/fly-staging-sync-secrets.mjs`
and commit this already-written, already-verified fix as part of (or immediately alongside) the
Pack 38 implementation PR, so the working-tree-only fix is not lost to a future `git stash drop`,
branch switch, or machine change. No new logic beyond what was already verified this session is
proposed — this is a commit-tracking item, not a design item.

## 6. Exact file allowlist for the implementation phase

| File | Change type | Notes |
|---|---|---|
| `src/lib/viona/dispatcher/vionaToolRegistry.ts` | Modify (additive/text-only) | `description` string edits only for the 2 merchant tools. Zero `inputSchema`/`category`/`merchantScopedOnly` change. |
| `src/lib/viona/dispatcher/vionaIntentRouter.ts` | Modify (additive) | Add a new, pure, exported few-shot-examples block consumed by `buildVionaDispatchClassificationPrompt()`. Zero change to `VIONA_DISPATCH_MIN_CONFIDENCE`, `routeVionaDispatchIntent()`'s control flow, or the response-shape contract. |
| `scripts/fly-staging-sync-secrets.mjs` | Commit pending fix (already written) | See §5 — stdin-pipe fix, no new changes. |
| `scripts/test-viona-pack38-b2b-intent-tuning.ts` | New | Test plan §7 below. |
| `docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md` | Modify (additive) | Log implementation completion. |
| `Handoff_VIONA11726.txt` | Modify (additive) | Log implementation completion. |

Explicitly **NOT** touched by this packet's implementation phase (unchanged safety boundary,
consistent with every prior B2B pack):

- `src/services/viona/vionaAutonomousDispatchService.ts` (dispatcher switch — Pack37, unmodified).
- `src/services/viona/vionaMerchantReadOnlyQueryExecutionService.ts` and
  `src/lib/viona/merchant/vionaMerchantReadOnlyQueryReplyFormatter.ts` (Option A data layer/reply
  formatting — Pack37, unmodified).
- `VIONA_DISPATCH_MIN_CONFIDENCE` and any `inputSchema` field on any tool (see Option B, §4 —
  explicitly out of scope unless separately authorized).
- Any Prisma schema/migration file.
- Any Fly secret.
- `vionaMerchantProfileService.ts`, `vionaMerchantTenantScope.ts`, `vionaMerchantAiPersonaTypes.ts`
  (persona resolution — Pack34/37, unmodified; §3's non-contamination rule applies to the new
  examples too).

## 7. Test plan for the implementation phase

All tests use an injected fake `callLlm` (per the existing Pack32/37 convention) — **no unit test in
this repo ever makes a real LLM call** (unchanged rule).

1. **Description content-scan.** `vionaToolRegistry.ts`'s `merchant_schedule_availability_check`
   and `merchant_inventory_stock_check` descriptions contain the new phrasings (e.g. a case-
   insensitive substring check for "hours" / "stock"/"available") while the existing
   `twilio_test_sms_poc`/`marketing_content_generator` descriptions remain byte-for-byte unchanged.
2. **Few-shot examples structural check.** The new examples block exists, contains exactly 1
   positive example per registered tool (4) + 1 explicit negative (`toolName: null`) example, and
   every example's `toolName` (when non-null) is a real, exact `findVionaToolRegistryEntry()` match
   — never a stale/renamed tool name.
3. **Classification-prompt non-contamination (carried forward from Pack37, re-asserted here).**
   Content-scan of `vionaIntentRouter.ts` (comments stripped, same `readSourceNoComments()` helper
   pattern Pack37 introduced) proves the new examples block contains none of: any real tenant id,
   `MerchantProfile`/`aiPersona` identifier, or any string sourced from `vionaMerchantAiPersonaTypes.ts`
   / `resolveMerchantAiPersona`.
4. **Fake-LLM regression — existing behavior preserved.** Every existing Pack32/37 fake-`callLlm`
   test scenario (`twilio_test_sms_poc` accept, `unknown_tool`, `tool_input_schema_invalid`,
   `response_not_valid_json`, `llm_call_failed`, pre-existing `low_confidence` case) still produces
   the identical `VionaDispatchDecision`/rejection reason as before — the prompt grew, but the
   parsing/validation contract did not change.
5. **New fake-LLM scenario — "opening hours" style message, injected model output.** A fake
   `callLlm` returning a *correctly classified* `merchant_schedule_availability_check` decision
   (with a valid `dateRangeStart`/`dateRangeEnd`, confidence ≥ `VIONA_DISPATCH_MIN_CONFIDENCE`) for
   an "opening hours today"-style `userMessage` proves the *plumbing* (prompt → parse → schema
   validate → dispatch) now correctly accepts this shape end-to-end — this test intentionally does
   not assert anything about what a *real* OpenAI model would return (that requires the optional
   live-staging step below), only that the rest of the pipeline is ready to accept it once the
   model does classify it correctly.
6. **`VIONA_DISPATCH_MIN_CONFIDENCE` unchanged assertion.** A direct equality check that the
   constant is still exactly `0.6` — a hard guard against Option B being silently bundled into this
   Option-A-scoped implementation.
7. **Full regression.** Every existing `scripts/test-viona-pack*.ts` suite (22 as of this planning
   packet) still 100% PASS; typecheck 0 errors; lint 0 new errors/warnings.
8. **Optional, opt-in, non-blocking: live staging re-run.** Re-running the existing
   `scripts/test-viona-pack36a-staging-webhook-qa.ts` against the deployed staging app after this
   packet's implementation ships is the only way to observe a *real* model's classification of the
   literal "What are your opening hours today?" message end-to-end. This is explicitly optional and
   non-blocking for the implementation PR's own merge (same "live-staging-only, excluded from local
   regression" precedent as Pack36A/37) — a `low_confidence` result even after Option A would be a
   valid, informative finding for a possible Option B follow-up, not a failure of this packet's own,
   narrower scope.

## 8. Authorization phrases for the implementation phase

- `APPROVE_PACK38_INTENT_TUNING_IMPLEMENTATION` — Option A only (description tuning + few-shot
  examples + committing the pending `fly-staging-sync-secrets.mjs` fix). Recommended default scope.
- `APPROVE_PACK38_CONFIDENCE_THRESHOLD_ADJUSTMENT` — Option B (named only, not designed in detail
  above) — kept as its own, separate, explicitly-safety-reviewed phrase, never implied by the first
  phrase.

## 9. Non-goals / deferred (unchanged from this session's own findings)

- Real (Option B, Pack37-numbering) tenant-scoped schedule/inventory Prisma models — still a
  separate, larger, not-yet-planned-in-detail future packet (`APPROVE_PACK37_REAL_DATA_LAYER`,
  already named in Pack37's own plan).
- Pack36B Merchant Admin UI — still deferred, unrelated to this packet.
- `TourismBooking` migration shadow-DB replay issue — still deferred, unrelated to this packet.
