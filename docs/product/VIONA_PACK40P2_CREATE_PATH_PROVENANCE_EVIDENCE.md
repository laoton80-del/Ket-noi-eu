# Pack40P2 — Create-Path Provenance Wiring Evidence

Status: **IMPLEMENTATION COMPLETE — MERGE ONLY, NO DEPLOY**

Operator phrase: `APPROVE_PACK40P2_CREATE_PATH_PROVENANCE_WIRING`

Staging state remains:

```text
STAGING_SCHEMA_READY_APPLICATION_DEPLOY_STILL_SEPARATELY_AUTHORIZED
```

---

## 1. Verified master SHA

`4ec4e423612f8aff299633789c5bbea914dda5db` (includes Pack40P3 evidence via PR #346)

## 2. PR #346 merge state

**MERGED** @ `2026-07-14T20:38:27Z`, merge commit `4ec4e423612f8aff299633789c5bbea914dda5db`

## 3. Branch and implementation commit

- Branch: `feat/pack40p2-create-path-provenance-wiring`
- Commit: `d9c50e0` — `feat(viona): wire Pack40P request provenance creation`

## 4. Exact files changed

### Production (4)

1. `src/services/viona/vionaRequestCreateDto.ts` — forbid client `scopekind` / `merchantprofileid`
2. `src/services/viona/vionaRequestCreateService.ts` — Pack19 assigns `consumer` + `merchantProfileId: null`
3. `src/services/viona/vionaRequestCreateFromWebhookService.ts` — Pack35 assigns `merchant` + trusted FK
4. `src/controllers/VionaWebhookMerchantAgentController.ts` — passes `merchantProfileId` into webhook create

### Tests (3 — includes mechanical alignment)

5. `scripts/test-viona-pack40p2-create-path-provenance.ts` (new)
6. `scripts/test-viona-pack35-b2b-webhook-routing.ts` (mechanical: live-DB input adds `merchantProfileId`)
7. `scripts/test-viona-pack40p1-provenance-schema.ts` (mechanical: post-P2 create-path expectations)

### Documentation (2)

8. `docs/product/VIONA_PACK40P2_CREATE_PATH_PROVENANCE_EVIDENCE.md`
9. `docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md`
10. `Handoff_VIONA11726.txt`

## 5. Pack19 provenance assignment

On successful create, Prisma payload explicitly sets:

```text
scopeKind = consumer
merchantProfileId = null
```

Client `tenantId` remains compatibility metadata only.

## 6. Dual-role behavior

Pack19 create service performs **no** `MerchantProfile` lookup. Merchant-profile owners using Pack19 receive consumer provenance by creation path.

## 7. Client-field rejection

`screenCreateVionaRequestRawBody` rejects bodies containing `scopeKind` or `merchantProfileId` via expanded forbidden side-effect keys.

## 8. Pack35 provenance assignment

On successful webhook create:

```text
scopeKind = merchant
merchantProfileId = resolved MerchantProfile.id (required input)
tenantId = trusted channel/merchant context
```

## 9. MerchantProfile ID and tenant source

Controller passes `channel.merchantProfileId` and `channel.tenantId` from `ResolvedVionaWebhookChannel` after signature/gate success — not from webhook message body.

## 10. Missing-profile fail-closed behavior

Empty/whitespace `merchantProfileId` returns `{ ok: false, reason: 'invalid_input' }` before `$transaction`.

## 11. Idempotency preservation

Pack19 idempotency-key replay and Pack35 `externalMessageId` replay paths unchanged (verified by tests).

## 12. Audit/dispatcher preservation

Webhook audit event type `webhookMessageAccepted` unchanged. Controller dispatch/intent wiring unchanged except passing existing `merchantProfileId` into create input.

## 13. Test results

| Suite | Result |
|---|---|
| `test-viona-pack40p2-create-path-provenance.ts` | **14/14 PASS** |
| Full local `test-viona-pack*.ts` (excl. Pack36A staging QA) | **25/25 PASS** |

## 14. Typecheck and lint

- `npx tsc --noEmit` — **PASS**
- ESLint on touched production + P2 test files — **PASS**

## 15. Confirmations

| Check | Result |
|---|---|
| Schema/migration changed | **No** |
| Database accessed | **No** |
| Deployment occurred | **No** |
| Backfill occurred | **No** |
| Pack40A access policy changed | **No** |
| Existing rows updated | **No** |

## 16. Staging deployment state

```text
STAGING_SCHEMA_READY_APPLICATION_DEPLOY_STILL_SEPARATELY_AUTHORIZED
```

P2D deploy requires separate phrase: `APPROVE_PACK40P2D_STAGING_CREATE_PATH_PROVENANCE_DEPLOY`

## 17. Final classification

`READY_FOR_PACK40P2_CREATE_PATH_PR_REVIEW`
