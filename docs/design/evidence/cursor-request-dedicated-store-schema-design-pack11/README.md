# Pack11 evidence — Dedicated store schema design contract

**Branch:** `viona/cursor-request-dedicated-store-schema-design-contract-pack11`
**Baseline:** `origin/master @ fc1d1de` (PR #67 — Pack10C human SoT approval merged)

## Pack10C approval reference

| Field | Value |
| --- | --- |
| Owner | Nong Si Buong |
| Decision date | 2026-06-15 |
| Approved SoT | Dedicated VIONA Request Store |
| Scope | Pack11 discovery / schema-design contract only |

## Scope

Pure schema-design contract: docs, domain types, readiness config, check script. No Prisma, API, adapter, mutation, or live ops.

## Files changed

- `docs/product/VIONA_REQUEST_DEDICATED_STORE_SCHEMA_DESIGN_CONTRACT.md`
- `src/domain/requests/vionaRequestDedicatedStoreSchemaDesignContract.ts`
- `src/config/vionaRequestDedicatedStoreSchemaDesignReadiness.ts`
- `scripts/viona-request-dedicated-store-schema-design-contract-check.mjs`
- `docs/design/evidence/cursor-request-dedicated-store-schema-design-pack11/README.md`
- Pack10C pointer config updates + gate allowlists

## Schema design contract summary

Logical entity candidates: VionaRequest, VionaRequestParticipant, VionaRequestSourceLink, VionaRequestStatusEvent, VionaRequestAuditEvent, VionaRequestAttachmentReference.

Field groups: core identity, ownership, human-readable content, lifecycle, safety, source link, audit, attachment reference.

## Still-blocked implementation items

Prisma schema, migration, API, persistence adapter, request mutation, Admin Debug live data, OPERATOR Prisma/Auth, payment, booking, SOS, wallet, live AI, live merchant execution.

## Gates run

```bash
node scripts/viona-request-dedicated-store-schema-design-contract-check.mjs
node scripts/viona-request-sot-human-approval-recording-check.mjs
npx tsc --noEmit
npm run smoke
```

## Final recommendation

Schema design contract import-ready; human review required before `schemaDesignApproved` and any Prisma/API pack.
