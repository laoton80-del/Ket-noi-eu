# Pack40P5 — Staging Provenance Verification Evidence

Status: **EXECUTION COMPLETE — STAGING VERIFICATION ONLY**

Operator phrase: `APPROVE_PACK40P5_STAGING_PROVENANCE_VERIFICATION`

---

## 1. Verified master SHA

`ee22193ad5c02f5d50c949cfec9ca6bd40c0ccfa`

## 2. PR #350 state and merge commit

**MERGED** @ `2026-07-15T08:00:42Z`, merge commit `ee22193ad5c02f5d50c949cfec9ca6bd40c0ccfa`

## 3. Branch and evidence commit

- Branch: `chore/pack40p5-staging-provenance-verification`
- Commit: recorded at PR open time

## 4. Redacted staging API/database identity

| Label | Value |
|---|---|
| Fly app | `viona-api-staging-eu` |
| Public API (redacted) | `https://viona-api-staging-eu.fly.dev` |
| Supabase project ref | `euqbfanilcssjiwwtcby` |
| Database host (redacted) | `db.euqbfanilcssjiwwtcby.supabase.co` |

## 5. Current staging release

**v23-or-later-verified** — Pack40P2 create-path code deployed per merged Pack40P2D evidence (release **v23**). No redeploy performed in P5.

## 6. Fly-log limitation

Post-deploy Fly log capture was **not** used as a gate (P2D recorded Windows CLI `401 Unauthorized` / hang behavior). P5 evidence relies on staging API responses, read-only database verification, synthetic correlation markers, and provenance invariants. Logs were **not** claimed clean.

## 7. Pre-action health

| Check | Result |
|---|---|
| `GET /health` | **HTTP 200** |

## 8. Pre-action provenance baseline

| scopeKind | Count |
|---|---|
| `legacyUnresolved` | 5 |
| `merchant` | 5 |
| `consumer` | 0 |
| **total** | **10** |

## 9. Original backfill digest verification

| Field | Value |
|---|---|
| Count | **5** |
| Digest | `aa74f63813af18e26afca268175b2b40246159619cda5438aaf40c6d5f930213` |
| Matches approved P4D/P4W | **true** |

## 10. Excluded legacy-row verification

Five non-webhook `legacyUnresolved` rows preserved (`legacyUnresolved` count unchanged at **5**; no webhook-positive audit on excluded population).

## 11. Pack19 QA marker and HTTP result

| Field | Value |
|---|---|
| Synthetic tenant marker | `pack40p5-consumer-ee22193` |
| Idempotency marker | `pack40p5-consumer-create-ee22193` |
| HTTP result | **201** (bounded Pack19 create on staging API) |

## 12. Pack19 provenance result

| Check | Result |
|---|---|
| `scopeKind` | **consumer** |
| `merchantProfileId` | **null** |
| Stored `tenantId` | synthetic compatibility marker only |

## 13. Pack19 dual-role and tenant non-control result

Pilot identity may own a `MerchantProfile`, but Pack19 path still assigned **consumer** provenance with **null** `merchantProfileId`. Client `tenantId` did not establish a merchant relation.

## 14. Pack35 safety audit

Pre-invocation audit passed for Pack36A-approved fixture:

- Channel: `custom_client` / `pack36a-qa-channel`
- Message: read-only opening-hours intent (Pack36A precedent)
- Tool scope: read-only registry tools only
- Max classification calls: **1**; max reply-format calls: **1**
- Real tool executions: **0**; real outbound: **0**

## 15. Pack35 QA marker and HTTP result

| Field | Value |
|---|---|
| External message marker | `pack40p5-webhook-ee22193` |
| HTTP result | **200** (`accepted: true`, `idempotentReplay: false`) |

## 16. Pack35 provenance and relation result

| Check | Result |
|---|---|
| `scopeKind` | **merchant** |
| `merchantProfileId` | matches server-resolved `MerchantProfile` from channel |
| `tenantId` | matches resolved profile tenant snapshot |
| Owner alignment | **true** |

## 17. Webhook-origin audit result

Positive `webhookMessageAccepted` audit associated with Pack35 marker row (verified read-only; audit payload not committed).

## 18. Provider-call count

| Metric | Count |
|---|---|
| Classification calls (max) | **1** |
| Optional reply-format calls (max) | **1** |

## 19. Real-action/tool/outbound count

| Metric | Count |
|---|---|
| Real tool executions | **0** |
| Real booking/payment/SOS | **0** |
| Real outbound communications | **0** |

## 20. Post-action provenance distribution

| scopeKind | Count |
|---|---|
| `legacyUnresolved` | 5 |
| `merchant` | 6 |
| `consumer` | 1 |
| **total** | **12** |

## 21. Existing-row preservation

Original five backfilled merchant rows unchanged (digest, relations, tenant snapshots). Five excluded legacy rows unchanged. **0** existing rows modified.

## 22. MerchantProfile preservation

`MerchantProfile` count and activation state unchanged.

## 23. Privacy confirmation

No request IDs, user IDs, profile IDs, audit IDs, credentials, real tenant IDs, personal message content, names, emails, or phone numbers committed.

## 24. Confirmation no IDs were retained

Committed evidence uses aggregate counts, booleans, synthetic markers, and redacted environment labels only.

## 25. Confirmation no deployment occurred

No Fly deploy, restart, or auth change in P5.

## 26. Confirmation no schema/migration/backfill occurred

No migration, schema change, or merchant backfill in P5.

## 27. Confirmation production was untouched

Target remained staging-only (`viona-api-staging-eu`, Supabase ref `euqbfanilcssjiwwtcby`).

## 28. Pack40P definition-of-ready result

**MET** — `PACK40P_PROVENANCE_DEFINITION_OF_READY_MET`

## 29. Pack40A readiness recommendation

Pack40A (tenant/access enforcement) remains **unimplemented** and should proceed only under a **separate** operator authorization after P5 evidence PR review/merge.

## 30. Final classification

`PACK40P_PROVENANCE_DEFINITION_OF_READY_MET`
