# P0-A1 Receipt and In-Flight Notes

`providerRequestId` records the provider-side receipt identifier when known. `usageInputTokens`, `usageOutputTokens`, and `actualCostMicrousd` record observed receipt usage and actual platform cost; all remain nullable because unknown is not zero. `settledAt` records the durable settlement time.

In-flight means `(status = 'RESERVED' and createdAt is within the RESERVED TTL)` or `(status = 'DISPATCHING' and dispatchedAt is within the dispatch lease)`. `OUTCOME_UNKNOWN` does not consume an in-flight slot, but its `reservedMicrousd` remains in the original reserve-window counter until reconciliation.

A settlement greater than its reserve records the actual value without clipping it. `actualCostMicrousd` is present only for `SETTLED` operations, and `SETTLED` requires `settledAt`.
