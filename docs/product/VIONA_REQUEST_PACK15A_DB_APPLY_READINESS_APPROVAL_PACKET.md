# VIONA Request Engine — Pack15A DB Apply Readiness Human Approval Packet

**Document type:** DB apply readiness / human approval packet (blank — pending human decision).
**Baseline:** `origin/master @ 8517da6` — `docs(kernel): update VIONA Fast Safe Global Mode handoff (#78)`.
**Related:** `docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md`, `docs/product/VIONA_REQUEST_PACK14C_PRISMA_MIGRATION_CREATION_ONLY.md`, `docs/product/VIONA_REQUEST_PACK14D_GATE_FACTORY_NO_PRODUCT_CHANGE.md`

---

## 1. Purpose

Pack15A prepares a **human approval decision** for whether VIONA may proceed to **DB apply** in a later pack.

Pack15A does **not** approve DB apply.
Pack15A does **not** apply DB.
Pack15A does **not** run Prisma DB commands.
Pack15A does **not** change `prisma/schema.prisma`, migration SQL, API, adapter, mutation, or runtime.

Pack15A documents readiness, risks, the exact migration target, required approval phrase for Pack15B, rollback/verification expectations, and hard stop conditions only.

- **Cursor/agent must not fill approval fields** in this document.
- **Cursor/agent must not silently set DB apply approval flags.**
- `agentMayFlipSignoff` remains `false`.

---

## 2. Current verified baseline

| Field | Value |
| --- | --- |
| Remote | `origin/master` |
| Commit | `8517da6` |
| Message | `docs(kernel): update VIONA Fast Safe Global Mode handoff (#78)` |

### Parent chain (Request Engine)

| Pack | Milestone | SHA |
| --- | --- | --- |
| Pack14C | Migration file creation complete | `2c15ba9` |
| Pack14D | Gate Factory no-product-change complete | `3de7667` |
| Pack14E | Fast Safe Global Mode kernel + handoff merged | `8517da6` (PR #78) |

### Pack14E completion state on master

- Canonical handoff: `docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md`
- Pack14C migration file exists on master
- Pack14D Gate Factory exists on master (`scripts/lib/vionaPackDiffAllowlist.mjs`)
- **DB apply remains blocked**

---

## 3. Migration target

| Item | Path |
| --- | --- |
| Migration folder | `prisma/migrations/20260615120000_add_viona_request_models/` |
| Migration file | `prisma/migrations/20260615120000_add_viona_request_models/migration.sql` |

State on master:

- Migration SQL **already created** (Pack14C)
- Migration SQL is **additive-only**
- **No DB apply yet**
- **No API / adapter / mutation / runtime yet**

Six `VionaRequest*` models covered by this migration (from Pack13C schema):

- `VionaRequest`
- `VionaRequestParticipant`
- `VionaRequestSourceLink`
- `VionaRequestStatusEvent`
- `VionaRequestAuditEvent`
- `VionaRequestAttachmentReference`

Dedicated VIONA Request Store remains source-of-truth direction. Direct `LocalServiceRequest` reuse remains disallowed.

---

## 4. What DB apply would mean in a future pack

Future **Pack15C**, if explicitly approved and issued as a separate DB-apply-only pack, would apply the **existing** migration SQL to the **selected database environment**.

It would move from:

| Flag | Before Pack15C | After successful Pack15C only |
| --- | --- | --- |
| `dbApplied` | `false` | `true` |

**Only after Pack15B** records explicit human approval with the required phrase.

Pack15C would **not** by itself unlock API, adapter, mutation, Admin Debug live data, OPERATOR role, payment, booking, SOS, wallet, live AI, or merchant live execution.

DB apply alone creates database tables — not product behavior.

---

## 5. Environment readiness checklist

Human/operator must confirm **before Pack15B approval** (all default **unchecked** until human review):

- [ ] Target DB environment identified (staging / dev / other — name recorded outside this packet)
- [ ] Correct database URL/secret confirmed **outside repo** (never committed)
- [ ] Backup/snapshot plan confirmed
- [ ] Rollback/restore plan confirmed
- [ ] Migration SQL reviewed against master copy
- [ ] Additive-only nature confirmed
- [ ] No destructive SQL confirmed (no DROP TABLE / DROP COLUMN / data wipe in migration file)
- [ ] No production/live user impact expected, or impact explicitly accepted and documented
- [ ] Maintenance window decision recorded if needed
- [ ] Responsible human operator named
- [ ] Verification command plan prepared (post-apply)
- [ ] Post-apply schema verification plan prepared (Pack15D)
- [ ] No app runtime depends on DB tables until later packs (Pack16+)
- [ ] No payment / booking / SOS / wallet / live AI behavior unlocked by DB apply alone

---

## 6. Safety and zero-loss boundaries

Pack15A and any future approved DB apply path must respect:

- **No fake production claims**
- **No DB apply in Pack15A**
- **No DB commands in Pack15A**
- **No payment capture**
- **No booking confirmation**
- **No SOS dispatch**
- **No wallet mutation**
- **No live AI protected actions**
- **No merchant live execution**
- **No OPERATOR Prisma/Auth changes**
- **No API/mutation ahead of sequence** (Pack16–18)
- **No direct `LocalServiceRequest` source-of-truth reuse**
- **No payment/booking/SOS/wallet truth encoded into request lifecycle**

Admin Debug remains fixture-only until separately approved. Audit log is not a payment ledger.

---

## 7. Required approval phrase for Pack15B

Pack15B is **recording-only**. Pack15B must **not** apply DB.

The human must provide this **exact phrase** in an explicit human-authorized Pack15B recording pack:

```txt
APPROVED Pack15 DB apply readiness for the existing VIONA Request migration. I confirm DB apply may be planned next, but not performed in Pack15B.
```

Pack15B records approval only. Pack15B does **not** run `prisma migrate dev`, `prisma migrate deploy`, `prisma db push`, or any DB mutation.

---

## 8. Pack15C preconditions

Pack15C may **only** be created after:

1. Pack15A merged and sync-verified
2. Pack15B merged and sync-verified with the exact approval phrase recorded

Pack15C must be a **separate explicit DB apply only** pack.

Pack15C must include:

- Target environment statement
- Command plan (apply command only — no schema edit)
- Backup/restore confirmation
- Apply command (`prisma migrate deploy` or approved equivalent for target env)
- Post-apply verification steps
- **No runtime/API/mutation changes**
- Stop-on-error behavior
- Final `dbApplied: true` evidence **only if apply succeeds**

If apply fails, `dbApplied` remains `false` until failure is resolved and evidence is recorded.

---

## 9. Stop list

**Hard stop** — do not proceed to Pack15B recording or Pack15C if:

- Human approval phrase missing or paraphrased
- Target DB unclear
- Local / staging / production environment unclear
- Backup/restore plan unclear
- Migration SQL differs from master copy
- `prisma/schema.prisma` or migration SQL diff appears in a DB apply pack without explicit approval
- Runtime / API / mutation changes appear in a DB apply pack
- Payment / booking / SOS / wallet / live AI changes appear
- OPERATOR role / auth changes appear
- Prisma DB command was already run accidentally without pack authorization
- Any destructive SQL is detected in the migration file
- Gates or forbidden-claims checks fail

---

## 10. Next sequence

Execute in order — do not skip:

1. **Pack15A** — DB apply readiness approval packet *(this document)*
2. **Pack15B** — Record DB apply human approval
3. **Pack15C** — DB apply only, if approved
4. **Pack15D** — DB schema verification
5. **Pack16** — Read-only persistence API
6. **Pack17** — Live read-only request inbox
7. **Pack18** — Request mutation
8. **Pack19** — Merchant / operator workflow
9. **Pack20+** — AI request assistant / AI action foundation

---

## Human approval section

**Status: PENDING**

### Decision

- [ ] APPROVED (for Pack15B recording in a future pack — not in Pack15A)
- [ ] REJECTED
- [ ] NEEDS REVISION

### Approval owner

| Field | Value |
| --- | --- |
| **Name** | *(blank — human fills)* |
| **Role** | *(blank — human fills)* |
| **Decision date** | *(blank — human fills)* |

---

## Encoded readiness after Pack15A (packet prepared only)

| Flag | Value |
| --- | --- |
| `migrationCreated` | `true` |
| `prismaMigrationActive` | `true` |
| `pack14MigrationCreationOnly` | `true` |
| `dbApplied` | `false` |
| `pack15DbApplyReadinessPacketActive` | `true` |
| `pack15DbApplyHumanApprovalRequired` | `true` |
| `pack15DbApplyApproved` | `false` |
| `pack15DbApplyPermitted` | `false` |

DB apply, API, adapter, mutation, and live runtime flags remain **false** until future approved packs.

---

## Safety acknowledgements

- Admin Debug remains fixture-only.
- OPERATOR is still not Prisma/Auth.
- No payment captured. No booking confirmed. No SOS dispatch. No wallet mutation. No live AI protected actions. No merchant live execution authorized.
- No production/live persistence claims.
- No DB apply performed in Pack15A.
