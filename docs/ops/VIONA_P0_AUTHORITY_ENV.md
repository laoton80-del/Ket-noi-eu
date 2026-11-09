# Viona P0 Authority Gate

## Purpose and boundary

This package establishes a server-side, single-use authority record for the pilot action `VOICE_CALL_BOOKING`. It does not connect the authority gate to Voice, AI planning, or a provider execution path. An authority record is a durable authorization decision, not an execution token; possession of its UUID alone grants no permission.

`AuthorityService` is the only production module permitted to write `AuthorityRecord` and `AuthorityLedgerEntry`. Its injected policy provider must fail closed. The issue adapter for a later package must validate subject, tenant, policy version, consent, risk, quota, prepare hash, and approval reference. The consume adapter must re-check current consent and policy before atomic consumption. Those identity, consent, risk, quota, approval, and live context integrations are placeholders and must be implemented and reviewed before production use.

## Deploy database roles

Production deployment MUST use separate database roles: the issuer/service role may write the two authority tables; the planner/AI process role MUST have no `INSERT`, `UPDATE`, or `DELETE` permission on either table. The ledger also rejects row updates and deletes with a database trigger. Do not deploy this foundation until the role separation has been applied and independently verified.

The runtime/service role MUST NOT own either authority table and MUST NOT have `TRUNCATE`, `DROP`, `ALTER`, or trigger-disable/trigger-management rights. The planner/AI role receives no `INSERT`, `UPDATE`, or `DELETE` on either table. Only the designated issuer role may `INSERT`; it may have narrowly scoped `UPDATE` on `AuthorityRecord` solely for the atomic consume compare-and-swap. `AuthorityLedgerEntry` is insert-only: do not grant `UPDATE`, `DELETE`, or `TRUNCATE`; row and statement triggers reject `UPDATE`, `DELETE`, and `TRUNCATE` as defense in depth. Independently verify actual ownership, grants, role inheritance, schema/database privileges, and enabled trigger state before production. Trigger enforcement does not replace database privilege separation.

## Lifecycle and caller ordering

The server issues an `ACTIVE_UNUSED` record only after the injected issue policy authorizes it, and writes an `ISSUED` ledger entry in the same transaction. `prepareSha256` is uppercase SHA-256 over recursively key-sorted, compact JSON encoded as UTF-8; object key order does not affect the hash. `verifyAndConsume` checks the current subject, tenant, exact target, context binding, payload hash, expiry, and injected current policy, then changes the record with a compare-and-swap and writes `CONSUMED` atomically. A rejected or expired consume is audited as `CONSUME_REJECTED` or `EXPIRED`. A crash after consume does not restore the authority.

When a future caller reserves cost first, it must call `verifyAndConsume` before any dispatch. If consume does not win, it must call `CostGovernorService.release({ operationId, reason: 'reserved_not_dispatched' })`; this package tests that ordering but does not wire a provider caller.

## Operational controls

This package adds no environment-variable configuration and does not change VIO, credit, wallet, or SOS behavior. A UUID without a matching server-issued row and bound context is rejected. PostgreSQL integration tests use a disposable loopback database only; this foundation is not production-ready until the pending policy integrations, DB role split, Linux PostgreSQL CI, and independent review are complete.
