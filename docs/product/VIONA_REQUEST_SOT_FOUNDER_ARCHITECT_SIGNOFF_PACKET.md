# VIONA Request Engine — Founder/Architect Source-of-Truth Sign-off Packet

**Document type:** Human review packet / decision memo — not sign-off itself.  
**Pack:** Pack10 — `founderArchitectSignoffPacket`  
**Baseline:** `origin/master @ 1777583` — PR #64 (Pack9 merged)

---

## 1. Purpose

This is the **Founder/Architect Source-of-Truth Sign-off Packet** — a consolidated decision memo for human review before any future source-of-truth activation, schema design, or persistence work on the cross-universe VIONA Request Engine.

**This packet does not record sign-off.** It prepares the decision lane only. Engineers and agents may reference it; only named human roles may approve and record sign-off outside agent implementation packs.

---

## 2. Current baseline

- **Master:** `origin/master @ 1777583` — `docs(requests): define sot signoff promotion readiness (#64)`
- **Packs 2–9 complete:** fixtures, ReferenceLab previews, Admin Debug operator preview, persistence/audit readiness, SoT/auth/tenant mapping, sign-off phase promotion readiness
- **Current live state:** fixture-only, read-only, no API, no DB, no adapter, no mutation
- **`sourceOfTruthDecisionSignedOff` remains false**
- **Founder/architect sign-off is pending**
- **Fixture-only Admin Debug preview remains unchanged**

---

## 3. Recommended decision

**Recommended SoT:** Dedicated VIONA Request Store (`dedicatedVionaRequestStore`)

**Dedicated VIONA Request Store is the recommended long-term candidate** because it:

- Supports cross-universe request routing without coupling to a single vertical
- Enables tenant-safe ownership keys (`requesterUserId`, `businessId`, `partnerId`) separate from Local wallet state
- Avoids coupling to Local wallet ledger semantics (see `VIONA_REQUEST_LOCAL_FIELD_COPY_BLOCKLIST`)
- Keeps audit and human-confirmation semantics under VIONA domain types

**Direct LocalServiceRequest reuse is not allowed.** Local models are reference-only for mapping analysis — not a drop-in persistence source.

**Hybrid bridge remains future-only.** Any hybrid link (`externalSourceKind`, `externalSourceId`) requires an explicit mapping/link contract and founder/architect approval — not direct copy.

---

## 4. Human sign-off blanks

Do not treat any line below as approved. All remain **PENDING** until humans record sign-off outside this pack.

| Role | Operating Protocol accountability | Status |
| --- | --- | --- |
| Founder / Executive Sponsor | Executive Sponsor / Founder Delegate | **PENDING** |
| Principal Architect | Principal Architect | **PENDING** |
| Product Owner | Chief Product Officer (CPO) Surface Owner | **PENDING** |
| Safety Owner | Trust & Safety Lead (Product + UX) | **PENDING** |
| Ops Runbook Owner | Operations / Incident Commander | **PENDING** |

**Cursor/agent cannot record source-of-truth sign-off.** Agent packs must not set `sourceOfTruthDecisionSignedOff: true`, `founderSignoffRecorded: true`, or `architectSignoffRecorded: true`.

---

## 5. Checklist for human approval

All items from Pack9 `VIONA_REQUEST_SOT_SIGNOFF_CHECKLIST` remain **pending** / not satisfied by this pack:

1. Source-of-truth option chosen by founder/architect — **PENDING**
2. Dedicated VIONA Request Store recommended as long-term candidate — **PENDING human confirmation**
3. Direct LocalServiceRequest reuse rejected — **PENDING**
4. Hybrid bridge requires explicit mapping/link contract — **PENDING**
5. OPERATOR policy decided — **PENDING**
6. Until OPERATOR exists, operator reads require ADMIN-equivalent server gate + auditRead — **PENDING**
7. Tenant matrix approved for server enforcement — **PENDING**
8. Server auth source-of-truth approved — **PENDING**
9. auditRead required before live operator reads — **PENDING**
10. Append-only audit required before writes — **PENDING**
11. Idempotency required before writes — **PENDING**
12. Human confirmation required before protected transitions — **PENDING**
13. Admin Debug stays fixture-only until explicit promotion — **PENDING**
14. No payment/booking/SOS/wallet/live AI behavior in Request Engine pack — **PENDING**
15. Runbook owner identified — **PENDING**

---

## 6. Dedicated store summary

Field manifest: `VIONA_REQUEST_DEDICATED_STORE_FIELD_MANIFEST` (Pack9) — 22 future design fields:

| Category | Fields (summary) |
| --- | --- |
| Identity / lifecycle | `id`, `version`, `createdAt`, `updatedAt` |
| Domain | `universe`, `intent`, `status`, `riskLevel`, `humanConfirmation` |
| Ownership | `requesterUserId`, `businessId`, `partnerId`, `assignedPartnerUserId` |
| Tenant scope | `tenantScope`, `universeFilter` |
| Audit / idempotency | `auditReason`, `idempotencyKey` |
| Hybrid link | `externalSourceKind`, `externalSourceId` (reference-only until signed off) |
| Locale / market / channel | `locale`, `market`, `sourceChannel` |

The field manifest is not Prisma schema.  
**No database schema or migration in this pack.**  
**No DB activation in this pack.**

Local wallet/ledger fields (`walletMode`, `walletPhase`, credit totals, Local release timing fields) must not be copied — see `VIONA_REQUEST_LOCAL_FIELD_COPY_BLOCKLIST`.

---

## 7. OPERATOR policy

- **OPERATOR is not a Prisma/Auth role yet** — do not add OPERATOR in Pack10 or any agent pack without explicit human approval
- Interim policy: operator reads = **ADMIN-equivalent server gate + mandatory auditRead**
- **Client-only role check is insufficient** for persistence APIs
- `operatorRoleAddedToAuth: false`, `operatorPolicyResolvedForImplementation: false`

---

## 8. Future path

| Phase | When | Scope |
| --- | --- | --- |
| **Pack11** | After human founder/architect sign-off recorded | Dedicated Store Schema Design Contract only — pure TS design types, still no Prisma migration |
| Read-only API | After schema design + auditRead design + server enforcement | Route/access planning and implementation — not in Pack10 |
| Mutation | Blocked | Requires append-only audit, idempotency, human confirmation, ops runbook sign-off |

**No API or persistence adapter in this pack.**  
**No read-only REST route in this pack.**  
**No request mutation in this pack.**

---

## Required safe copy

- Founder/Architect Source-of-Truth Sign-off Packet
- This packet does not record sign-off
- sourceOfTruthDecisionSignedOff remains false
- Founder/architect sign-off is pending
- Cursor/agent cannot record source-of-truth sign-off
- Dedicated VIONA Request Store is the recommended long-term candidate
- Direct LocalServiceRequest reuse is not allowed
- Hybrid bridge remains future-only
- OPERATOR is not a Prisma/Auth role yet
- No database schema or migration in this pack
- No API or persistence adapter in this pack
- Fixture-only Admin Debug preview remains unchanged
- No payment captured
- Not booking confirmed
- No SOS dispatch
- No live merchant execution
- Human confirmation required before any future protected action
- Audit log is not a ledger

---

## Files

| File | Role |
| --- | --- |
| `src/config/vionaRequestSotFounderArchitectSignoffPacketReadiness.ts` | Pack10 readiness, checklist re-export, sign-off blanks |
| `scripts/viona-request-sot-founder-architect-signoff-packet-check.mjs` | Pack10 validation gate |

## Import guidance

Do not wire Admin Debug, ReferenceLab, or merchant inboxes to persistence until humans record founder/architect sign-off, server auth/tenant gates, auditRead, and dedicated store schema design are explicitly approved in post-sign-off packs.
