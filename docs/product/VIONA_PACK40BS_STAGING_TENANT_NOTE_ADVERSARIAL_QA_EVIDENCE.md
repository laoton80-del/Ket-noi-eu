# Pack40BS — Staging Tenant Note Adversarial QA Evidence

Status: **EXECUTION COMPLETE — STAGING NOTE-MUTATION QA ONLY**

Operator phrase: `APPROVE_PACK40BS_STAGING_TENANT_NOTE_ADVERSARIAL_QA`

Pack40B closure: **PENDING EVIDENCE PR MERGE** — do not mark CLOSED/GREEN until this evidence is reviewed and merged.

---

## 1. Verified master SHA

`44ff2f76a1b32b4423e51e141ad5415955620021` — includes Pack40BD evidence (PR #358)

## 2. PR #358 state and merge commit

**MERGED** @ `2026-07-15T12:17:22Z`, merge commit `44ff2f76a1b32b4423e51e141ad5415955620021`

## 3. Branch and evidence commit

- Branch: `chore/pack40bs-staging-tenant-note-adversarial-qa`
- Commit: recorded at PR open time

## 4. Staging release and image

| Field | Value |
|---|---|
| App | `viona-api-staging-eu` |
| Release | **v25-verified** |
| Pack40B source | PR #356 @ `a165ca9` + corrective PR #357 @ `45c8f29` |
| Deploy evidence | Pack40BD PR #358 merged |

## 5. Redacted environment identities

| Target | Redacted label |
|---|---|
| API | `https://viona-api-staging-eu.fly.dev` |
| Database | `db.euqbfanilcssjiwwtcby.supabase.co` |

## 6. Source-boundary confirmation

| Check | Result |
|---|---|
| Single surface: `POST /api/viona/requests/:id/actions/note` | **PASS** |
| Serializable in-transaction principal resolution | **PASS** (verified on master + staging v25) |
| Authorization before idempotency replay | **PASS** |
| Pack40A direct reads unchanged | **PASS** |
| Status/execution/create/webhook unchanged | **PASS** |

## 7. Fly-log limitation

`fly logs` not used as QA gate (known 401/hang risk). Evidence based on release verification, health, POST contracts, and read-only DB invariants.

## 8. Fixture discovery result

| Fixture | Marker / criterion | Result |
|---|---|---|
| Consumer | `pack40p5-consumer-ee22193` | **PASS** — `scopeKind=consumer`, `merchantProfileId=null` |
| Merchant | `pack40p5-webhook-ee22193` | **PASS** — `scopeKind=merchant`, exact active profile + tenant snapshot |
| Legacy unresolved | excluded webhook-less row | **PASS** — `scopeKind=legacyUnresolved`, `merchantProfileId=null` |

## 9. Dual-role proof

Positively verified via read-only DB checks: approved pilot owns consumer fixture user scope **and** owns the active `MerchantProfile` linked to the merchant fixture.

## 10. Non-owner proof

Distinct approved pilot verified outside consumer fixture user scope, outside merchant fixture user scope, and outside selected legacy fixture user scope.

## 11. Pre-QA invariant state

| Invariant | Value |
|---|---|
| Release | v25-verified |
| Provenance distribution | legacy=5, merchant=6, consumer=1, total=12 |
| P4W digest | matches approved constant |
| Pre-existing `action.note` audit events | 2 |
| Consumer QA marker count | 0 |
| Merchant QA marker count | 0 |
| Consumer idempotency key count | 0 |
| Merchant idempotency key count | 0 |
| MerchantProfile active | yes |

## 12. Consumer first note result

| Check | Result |
|---|---|
| Actor | dual-role owner |
| HTTP status | **201** |
| Contract | `success=true`, `action.eventType=action.note`, `idempotentReplay=false` |
| DB marker | exactly 1 `pack40bs-consumer-note-44ff2f7` |

## 13. Consumer replay result

| Check | Result |
|---|---|
| HTTP status | **200** |
| Contract | `idempotentReplay=true` |
| Duplicate audit events | **0** |

## 14. Merchant first note result

| Check | Result |
|---|---|
| Actor | dual-role active merchant owner |
| Profile active at execution | **yes** |
| HTTP status | **201** |
| Contract | `success=true`, `action.eventType=action.note`, `idempotentReplay=false` |
| DB marker | exactly 1 `pack40bs-merchant-note-44ff2f7` |

## 15. Merchant replay result

| Check | Result |
|---|---|
| HTTP status | **200** |
| Contract | `idempotentReplay=true` |
| Duplicate audit events | **0** |

## 16. Non-owner successful-key reuse denial

| Case | HTTP | Public error | Side effect |
|---|---|---|---|
| Non-owner + consumer idempotency key | **404** | `Request not found` | **0** note audits |

Successful idempotency record did **not** bypass current authorization.

## 17. Spoof-attempt denial

Non-owner replayed merchant idempotency key with bounded client-controlled expansion attempts (body fields, query params, policy-like headers).

| Check | Result |
|---|---|
| HTTP status | **404** |
| Public error | `Request not found` |
| Replay disclosure | **none** |
| Side effect | **0** note audits |

## 18. Legacy-unresolved denial

Existing-scope owner attempted note on legacy-unresolved fixture with bounded tenant/provenance-like spoof values.

| Check | Result |
|---|---|
| HTTP status | **404** |
| Side effect | **0** note audits |

## 19. Nonexistent-request denial

Dual-role actor posted to locally generated nonexistent request ID.

| Check | Result |
|---|---|
| HTTP status | **404** |
| Public error | `Request not found` |

## 20. Error-normalization result

All four denied classes (non-owner consumer, non-owner merchant, legacy owner, nonexistent request) produced equivalent external behavior: **HTTP 404**, **`Request not found`**, no existence leak.

## 21. Exact successful audit delta

**+2** `action.note` audit events attributable to QA (consumer + merchant first writes only).

## 22. Replay duplicate count

**0** — consumer replay and merchant replay each added zero duplicate events.

## 23. Denied side-effect count

**0** — all four denied POST classes created zero successful-note audit events.

## 24. Post-QA preservation result

| Invariant | Result |
|---|---|
| VionaRequest count | unchanged (12) |
| Provenance distribution | unchanged |
| P4W digest | unchanged |
| Consumer fixture provenance | unchanged (`consumer`, null profile) |
| Merchant fixture provenance | unchanged (exact profile + tenant) |
| Legacy fixture | unchanged (`legacyUnresolved`) |
| MerchantProfile count/state | unchanged |
| Request statuses | unchanged |
| Data cleanup | **none** |

## 25. Transactional live-fixture limitations

The following remain covered by the Pack40B **81-test** local suite only (not manufactured on staging):

- active-to-inactive race
- tenant drift race
- ownership drift race
- profile removal race
- Serializable rejection / transaction rollback

This does **not** block Pack40BS — all mandatory end-to-end cases passed.

## 26. Privacy confirmation

No request IDs, audit-event IDs, user IDs, tenant IDs, MerchantProfile IDs, tokens, credentials, names, emails, phone numbers, or existing note contents were printed or committed.

## 27. Confirmations

| Action | Status |
|---|---|
| No direct DB mutation | **CONFIRMED** — read-only DB; POST was sole mutation mechanism |
| No deployment | **CONFIRMED** |
| No migration | **CONFIRMED** |
| No secret change | **CONFIRMED** |
| No production access | **CONFIRMED** |
| Pack40A remains CLOSED/GREEN | **CONFIRMED** |
| Pack40C/D/S unimplemented | **CONFIRMED** |
| Exactly 8 note POST requests | **CONFIRMED** |

## 28. Pack40B staging QA result

**PASS** — corrected Pack40B transactional note enforcement behaves as specified on staging v25.

## 29. Pack40B closure recommendation

Recommend marking Pack40B **CLOSED/GREEN** only after this evidence PR is reviewed and merged into master and canonical docs are synchronized.

## 30. Final classification

**`READY_FOR_PACK40BS_QA_EVIDENCE_PR_REVIEW`**

Synthetic QA markers (sanitized):

```text
pack40bs-consumer-note-44ff2f7
pack40bs-merchant-note-44ff2f7
pack40bs-consumer-idem-44ff2f7
pack40bs-merchant-idem-44ff2f7
```

Next: review and merge this evidence PR; then update Pack40B to CLOSED/GREEN in canonical docs.
