# P0-A1 Cost Governor environment

P0-A1 records platform-provider AI cost in integer micro-USD. It does not read,
write, convert, reserve, or authorize a VIO or credit balance.

`reserve` reads every setting below and snapshots the provider timeout in its
durable operation. `markDispatching` also requires a valid current
configuration before any provider call, but reads its dispatch lease only from
that operation's reserve-time timeout snapshot. Each value must be a plain
positive base-10 integer
representable as `BigInt`. A missing, zero, negative, malformed, or otherwise
invalid value denies a new reserve or dispatch with `DENY_UNCONFIGURED`. There
is no enable flag, disable flag, or bypass.

The three micro-USD cap values must also be no larger than PostgreSQL `BIGINT`
(`9223372036854775807`). A value above that maximum is invalid and is rejected
by configuration parsing before the runtime can bind it into a counter query.

The provider timeout is captured in the reserve result for the caller's
`AbortSignal`; `markDispatching` accepts no caller timeout. Its durable lease
is that reserve-time timeout plus the fixed grace period. A later valid timeout
change is not retroactive. A missing
or invalid configuration still prevents a new dispatch before any provider
request, and the caller releases the still-undispatched reservation.

## Caller-supplied idempotency keys

An idempotency key supplied by a caller is responsible for identifying the full
logical provider attempt, including its prompt and token bounds. Reusing the
same `(subjectId, idempotencyKey)` returns the existing operation's
`DUPLICATE_IN_PROGRESS` or `OUTCOME_UNKNOWN` result; it never creates another
reservation or ledger entry. When a routed chat caller omits the key, the
router generates a fresh server-side key for that attempt.

| Environment variable | Meaning | Runtime default | Pilot value proposed by Operator |
| --- | --- | --- | --- |
| `VIONA_COST_GOVERNOR_USER_DAILY_CAP_MICRO_USD` | Maximum reserved plus settled platform-provider cost for one subject in its UTC reserve-day window. | None; deny when absent or invalid. | `500000` |
| `VIONA_COST_GOVERNOR_GLOBAL_DAILY_CAP_MICRO_USD` | Maximum reserved plus settled platform-provider cost for all subjects in the UTC reserve-day window. | None; deny when absent or invalid. | `12000000` |
| `VIONA_COST_GOVERNOR_GLOBAL_MONTHLY_CAP_MICRO_USD` | Maximum reserved plus settled platform-provider cost for all subjects in the UTC reserve-month window. | None; deny when absent or invalid. | `250000000` |
| `VIONA_COST_GOVERNOR_USER_INFLIGHT_LIMIT` | Maximum concurrent in-flight paid attempts for one subject. | None; deny when absent or invalid. | `2` |
| `VIONA_COST_GOVERNOR_GLOBAL_INFLIGHT_LIMIT` | Maximum concurrent in-flight paid attempts across all subjects. | None; deny when absent or invalid. | `5` |
| `VIONA_COST_GOVERNOR_PROVIDER_TIMEOUT_MS` | Provider attempt timeout in milliseconds. The in-flight lease is this value plus the fixed 15,000 ms grace period. | None; deny when absent or invalid. | `45000` |

The reserved-without-dispatch TTL is fixed at 300,000 ms. A timed-out lease no
longer occupies an in-flight slot, but it does not release a money reservation.
An orphaned `RESERVED` operation—when a process crashes before
`markDispatching`, or an attempted release fails—also stops occupying a slot
only after that TTL; its money reservation remains in the original counter
window until A1-RECON handles it. `OUTCOME_UNKNOWN` likewise does not occupy a
slot and keeps its original-window reservation until reconciliation. These
rules prevent treating an ambiguous or interrupted provider outcome as zero
cost.

## Terminal accounting independence

After a reserve exists, `settle`, `release`, and `markOutcomeUnknown` use only
the durable operation, its original UTC windows, and its reserved amount. They
do not read runtime cap, in-flight, or provider-timeout settings, so a later
configuration removal or invalid value cannot block terminal accounting. A
configuration failure before `markDispatching` releases the reservation and
prevents the caller from making a provider request.

## Production activation condition

Paid admission must not be enabled for production (including by supplying all
six `VIONA_COST_GOVERNOR_*` settings) until A1-RECON has received independent
review. A `DISPATCHING` operation orphaned by a crash stops occupying an
in-flight slot when its dispatch lease expires, while its reservation remains
in its original UTC counter window. It is not silently released or charged as
zero. Reconciliation must resolve that ambiguous provider outcome; once it is
recorded as `OUTCOME_UNKNOWN`, the 24-hour outcome-unknown policy retains the
reservation in that same original window pending reconciliation.

A `RESERVED` operation orphaned before dispatch is known not to have reached a
provider, but this runtime does not automatically alter its original-window
money counter after its slot TTL expires. A1-RECON must make that durable
release decision; a failed in-process release follows the same policy.

## Snapshot migration precondition

`20261105000000_ai_cost_operation_snapshots` has no invented default and no
backfill. Apply it only while `AiCostOperation` is empty / has never been used.
The migration has a leading database guard that rejects a non-empty table with
an explicit error, before it alters snapshot columns or constraints.

Run this migration in a no-traffic window with no writer to `AiCostOperation`.
If a writer inserts between the guard and `ALTER TABLE`, the `NOT NULL` alter
still fails and the migration transaction leaves no half-applied schema, but
the explicit guard message may not be the reported error. The raw migration is
not idempotent: rerunning it against an empty table after a successful apply
fails on duplicate snapshot columns/constraints.

## SOS and Firebase boundary

Operator decision 2026-11-06: SOS/emergency runtime disposition belongs to
A1-FIREBASE, not this Express CORE pack. The static import-graph check in CORE
is evidence only for the Express backend. A1-FIREBASE has a hard requirement:
an SOS/emergency path must never be blocked by a cost cap or a ledger error,
and that rail requires its own dedicated test before it is enabled.

## Evidence acceptance

Operator decision 2026-11-06: no fixed numeric coverage threshold is required
for A1-CORE. Acceptance evidence is the T1–T4x scenario matrix together with
independent review; this does not authorize production activation.

## Price history

`AiModelPrice` rows are immutable price versions. A price change must add a new
row and close the prior row by setting its `effectiveTo`; it must never UPDATE
the price fields of an existing row. Reserve snapshots the positive input and
output micro-USD-per-million-token values into `AiCostOperation`, together
with `priceVersionId` for traceability. Settlement calculates only from those
durable snapshots, even if a historical price row is later closed or corrupted.

## Routed-chat estimator boundary

The routed-chat estimator is a conservative upper bound for normalized
`messages` only: it serializes copied role/content text plus fixed framing.
The router permits only `response_format.type` values `text` and `json_object`;
neither contains caller-provided schema or prompt material. `stop` and `user`
are control fields accepted only as normalized strings and are not appended to
the provider message payload, so they do not add billed input under this
contract. A future format with a schema or any other caller-provided prompt
material must either be included in the estimate before reserve or be denied.

## Transaction lock guard

Every cost-governor transaction uses a five-second local PostgreSQL lock
timeout and a ten-second statement timeout. A wait that exceeds either guard
fails closed: admission cannot dispatch a provider call, while terminal
accounting reports a ledger error for reconciliation rather than silently
changing money state.

Interactive Prisma transactions use the fixed code constants `TX_MAX_WAIT_MS = 5000`
and `TX_TIMEOUT_MS = 20000`; these are not environment variables. A module-load
invariant requires the transaction timeout to exceed the database lock and
statement timeouts by at least five seconds, and max wait to be at least one
second. This is a defense-in-depth margin that reduces the chance of Prisma
`P2028` interrupting the normal database guard path; it does not prove which
timeout fires first. Prisma may wait up to five seconds to acquire a connection
and, after acquisition, holds it for at most twenty seconds if a transaction
stalls. PostgreSQL lock timeout (`55P03`), statement timeout (`57014`), and
Prisma transaction timeout (`P2028`) all fail closed as ledger-unavailable
(`503`); an accounting error does not release a reservation. An operation that
has reached `DISPATCHING` and has an ambiguous outcome is never automatically
released as if it had not been dispatched; retain its reservation for A1-RECON.

## PostgreSQL BIGINT arithmetic boundary

The runtime rejects configured caps above PostgreSQL `BIGINT`, but arithmetic
can still overflow inside a conditional counter statement before its cap
comparison—for example, `settledMicrousd = MAX - 1` plus a reserve of `2`.
PostgreSQL reports an SQL error; the transaction rolls back and admission fails
closed as `DENY_LEDGER_UNAVAILABLE`, so overflow cannot produce a successful
admission. A dedicated near-maximum counter-addition test is not present in
this CORE pack.

## Test-boundary caveats

T35's `after-acknowledgment` fault is injected before transaction commit; it
does not simulate loss of a provider acknowledgment after a database COMMIT.
T41 deliberately uses a harness-fixed idempotency key and a provider-admission
gate stub. Those constraints prove Express ordering and lifecycle handling,
not the production gate implementation or arbitrary caller-key generation.
