# Pack40DD — Staging Controlled Indirect Execution Deployment Evidence

Operator authorization: `APPROVE_PACK40DD_STAGING_INDIRECT_EXECUTION_DEPLOY`

Classification: `READY_FOR_PACK40DD_DEPLOYMENT_EVIDENCE_PR_REVIEW`

## Deployed-state markers

```text
PACK40D_CONTROLLED_INDIRECT_EXECUTION_DEPLOYED_TO_STAGING
PACK40D_LIVE_EXECUTION_QA_STILL_REQUIRED
PACK40D_SIGNED_WEBHOOK_EXECUTION_DISABLED
PACK40D_RECOVERY_RECONCILIATION_NOT_IMPLEMENTED
```

## 1. Verified master SHA

`548b6ecc4c19e124e729de069bbe283938b70040`

## 2. PR #373 merge state

- State: **MERGED**
- Title: `feat(viona): wire controlled Pack40D execution gateway`
- Merged at: `2026-07-15T21:01:54Z`
- Merge commit: `548b6ecc4c19e124e729de069bbe283938b70040`
- URL: https://github.com/laoton80-del/Ket-noi-eu/pull/373

## 3. Branch and evidence commit

- Branch: `docs/pack40dd-staging-indirect-execution-deployment`
- Starting HEAD = verified master: `548b6ec`
- Evidence commit: recorded at PR open time (docs-only)

## 4. Source-boundary verification

Verified on merged master:

| # | Condition | Result |
|---|---|---|
| 1 | Exactly one enabled trigger: `internalAuthenticatedController` | PASS |
| 2 | Route: `POST /api/internal/viona/trigger-real-twilio-poc` | PASS |
| 3 | Controller uses `req.authUserId` only | PASS |
| 4 | Public tenant/profile/scope/owner fields ignored | PASS |
| 5 | Coordinator has no `vionaRequest.updateMany` / `getPrisma()` | PASS |
| 6 | Flow: D2 claim → escrow hold → D3A gateway → escrow resolve → D2 finalize | PASS |
| 7 | Pack40D2 owns claim/finalize | PASS |
| 8 | Pack40D3A owns prepare/key/outcome | PASS |
| 9 | Single-shot Twilio wrapper (not legacy retry adapter) | PASS |
| 10 | No blind retry after uncertain | PASS |
| 11 | Escrow key binds request+attempt+operation | PASS |
| 12 | Provider key binds provider+request+attempt+operation | PASS |
| 13 | Signed webhook/dispatch cannot execute Twilio | PASS (`pack40d_provider_execution_disabled`) |
| 14 | `approvedInternalDispatch` unwired | PASS |
| 15 | Preview routes side-effect free | PASS |
| 16 | Direct POC route closed / delegated | PASS (`provider_bypass_closed`) |
| 17 | Consumer/legacy fail closed | PASS |
| 18 | No recovery/lease steal | PASS |
| 19 | Pack40A/B/C unchanged | PASS |
| 20 | D3B added no schema/migration | PASS (latest migration remains Pack40D1) |

## 5. Single enabled trigger

`internalAuthenticatedController`

## 6. Disabled triggers

- `signedMerchantWebhook` — request create allowed; provider execution disabled
- `approvedInternalDispatch` — no runtime caller

## 7. Coordinator flow

```text
D2 claim
→ attempt-scoped escrow hold
→ D3A gateway (single-shot Twilio)
→ escrow settle/refund
→ D2 terminal finalize
```

## 8. Attempt-scoped escrow result

Key format preserved on master:

```text
escrow:{requestId}:{executionAttemptId}:twilio_test_sms
```

## 9. Single-shot Twilio result

`createPack40D3TwilioGatewayAdapter` — one transport call; timeout/unavailable → uncertain; no `attempts < 2` loop.

## 10. Bypass-closure result

- Direct POC → `provider_bypass_closed` without test doubles
- Dispatch Twilio → `pack40d_provider_execution_disabled`
- Internal controller → Pack40D coordinator only

## 11. Local gates

| Gate | Result |
|---|---|
| `npx prisma validate` | PASS |
| `npx prisma generate` | PASS |
| `npx tsc --noEmit` | PASS |
| ESLint Pack40D files | PASS |
| Pack40D3B | 54/54 PASS |
| Pack40D3A | 62/62 PASS |
| Pack40D2 | 112/112 PASS |
| Pack40D1 | 47/47 PASS |
| Pack40A | 39/39 PASS |
| Pack40B | 81/81 PASS |
| Pack40C | 93/93 PASS |
| Pack31 orchestrator | 10/10 PASS |
| Pack31 escrow | 14/14 PASS |
| Pack30D-8 / Pack30D Twilio POC | PASS |
| Complete non-staging `test-viona-pack*.ts` | TOTAL_FAILS=0 |

No DB connection, authenticated staging request, live Twilio, or real escrow mutation during gates.

## 12. Pack40D1 migration prerequisite

Merged evidence markers remain authoritative:

- `PACK40D1_EXECUTION_ATTEMPT_SCHEMA_APPLIED_TO_STAGING`
- Attempt table empty at D1 apply time
- D2/D3A/D3B add **no** Prisma migrations
- Latest attempt migration: `20260715120000_pack40d1_add_viona_request_execution_attempt`
- No later migration after Pack40D1

No Prisma command was run against staging during Pack40DD.

## 13. Previous release/image

- Previous release: **v26**
- Previous image tag: `deployment-01KXK0CRXQ4KXVK719EQ5EZ532`
- Previous digest: `sha256:6118e80673de7ea6dca8c16e650682402a3c0e0992ad68c72558dca61fad3c0a`
- Machines before: version 26 (1 stopped / 1 started)

## 14. Pre-deploy health

`GET https://viona-api-staging-eu.fly.dev/health` → **HTTP 200**  
Body: `{"success":true,"data":{"status":"ok"}}`

## 15. Exact deploy command

```text
fly deploy --app viona-api-staging-eu --remote-only
```

Deployed HEAD: `548b6ecc4c19e124e729de069bbe283938b70040` (merged master only)

## 16. Deployment result

- Exit code: **0**
- Start: `2026-07-15T23:06:04+02:00`
- End: `2026-07-15T23:09:11+02:00`
- Rolling strategy completed; leases cleared; DNS verified
- Transient smoke warning: app not yet listening on `0.0.0.0:8080` during early machine check; machine later reached good state and post-deploy health succeeded
- No crash loop in deploy output
- No migration ran
- No secret changed
- Production untouched

## 17. New release/image

- New release: **v27** (complete)
- New image tag: `deployment-01KXKSKRTN49GJW82A1ZAA8PXQ`
- New image digest: `sha256:5e227e5bb5753ae4202564323aad12226151c40572cd9e7937bd9ea577723fb8`
- App image: `viona-api-staging-eu:deployment-01KXKSKRTN49GJW82A1ZAA8PXQ`

## 18. Post-deploy health

`GET https://viona-api-staging-eu.fly.dev/health` → **HTTP 200**  
Body: `{"success":true,"data":{"status":"ok"}}`

## 19. Machine / rolling-window result

| Machine | Version | Region | State |
|---|---|---|---|
| `1850372b290d78` | 27 | fra | stopped |
| `2861545b90d938` | 27 | fra | started |

Rolling update completed; both machines on v27 image.

## 20. Fly-log limitation

Fly logs were **not** used as a mandatory gate (known CLI limitation). Evidence relies on deploy exit 0, release transition v26→v27, machine good states, DNS verification, and pre/post health.

## 21–24. Absolute prohibitions confirmed

- No internal execution POST (`trigger-real-twilio-poc` not invoked)
- No Twilio/provider call
- No escrow hold/settle/refund
- No execution-attempt creation / request status mutation
- No authenticated staging QA
- No DB query/mutation / Prisma migrate
- No schema/migration change
- No secret change
- No production deploy

## 25. Pack40A/B/C closure state

CLOSED/GREEN (unchanged)

## 26. Pack40S state

Unimplemented / unauthorized

## 27. Deployed-state markers

Recorded above. Pack40D is **not** CLOSED/GREEN. Live execution QA still required under separate authorization.

## 28. Final classification

`READY_FOR_PACK40DD_DEPLOYMENT_EVIDENCE_PR_REVIEW`
