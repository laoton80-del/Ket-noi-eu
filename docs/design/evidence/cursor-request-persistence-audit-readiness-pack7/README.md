# Pack7 — Request Persistence + Audit Readiness (Cursor)

## Scope

Read-only readiness contract for future VIONA Request persistence and audit logging. Docs, config, pure domain contracts, and check script only.

## Files changed

- `docs/product/VIONA_REQUEST_PERSISTENCE_AUDIT_READINESS.md`
- `src/config/vionaRequestPersistenceAuditReadiness.ts`
- `src/domain/requests/vionaRequestAuditEventTypes.ts`
- `src/domain/requests/vionaRequestPersistenceContract.ts`
- `scripts/viona-request-persistence-audit-readiness-check.mjs`
- `src/config/vionaOperatorInboxAdminReadiness.ts` (Pack7 pointer only)
- Optional: narrow gate-script allowlist refinements

## Current baseline

- `origin/master @ 8f47574` — PR #61 Admin Debug operator inbox preview

## Discovery summary

- VIONA Request Engine uses fixtures only; no DB/API in request domain
- Local vertical has live Prisma + audit — reference only, not VIONA SoT
- Pack6 explicitly forbids LocalOpsAudit API reuse for operator inbox
- Status enums differ between Local and VIONA — mapping contract deferred

## Why Local audit is reference-only

`LocalServiceRequestAuditEvent` demonstrates append-only audit patterns but belongs to the Local universe. VIONA cross-universe request persistence requires a separate SoT decision and mapping contract.

## Why API/DB are deferred

Protocol no-fake-production boundary and Pack6 readiness require source-of-truth, auth, audit, and human-confirmation gates before any persistence or mutation.

## Safety boundaries

- `persistenceApiActive: false`
- `prismaSchemaActive: false`
- `auditLogActive: false`
- `requestMutationActive: false`
- Admin Debug preview unchanged (fixtures only)
- Audit log is not ledger

## Gates run

- `viona-request-persistence-audit-readiness-check.mjs`
- Pack2–6 request inbox gates
- Foundation gates (capability, domain, automation, forbidden claims, AI0/AI1)
- `tsc`, `npm run smoke`

## Final result

Pending gate run on branch `viona/cursor-request-persistence-audit-readiness`.
