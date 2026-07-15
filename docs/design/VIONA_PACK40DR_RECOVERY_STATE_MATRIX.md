# Pack40DR — Recovery State Matrix (design)

Companion to `docs/product/VIONA_PACK40DR_RECOVERY_RECONCILIATION_READINESS_AUDIT.md`.

Docs-only. Not authoritative over the readiness audit if they diverge.

| ID | Request | Attempt | Lease | Provider | Escrow | Safe next | Forbidden | Review |
|---|---|---|---|---|---|---|---|---|
| S1 | inProgress | claimed | unexpired | none | none/FAIL | wait owner | steal; send; 2nd attempt | SLA only |
| S2 | inProgress | claimed | expired | none / no key | none/FAIL | acquire+abandon or acquire+continue prepare | blind send; steal while live | Yes for abandon |
| S3 | inProgress | providerPending | any | unknown | HELD | exact recon; no send | settle/refund-as-known; 2nd SMS | Yes if no ref |
| S4 | inProgress | providerSucceeded | any | known ok | HELD | settle→finalize completed | rewrite fail; 2nd SMS | Auto preferred |
| S5 | inProgress | providerFailed | any | known fail | HELD | refund→finalize failed | settle-as-success | Auto preferred |
| S6 | inProgress | outcomeUncertain | any | unknown | HELD | exact recon or remain | settle; refund-as-known; finalize; retry send | Required |
| S7 | inProgress | providerSucceeded | any | known ok | SETTLED | finalize completed | refund; new provider | Low |
| S8 | inProgress | providerFailed | any | known fail | REFUNDED | finalize failed | settle; new provider | Low |
| S9 | inProgress | active | expired | depends | any | CAS acquire + gen then S3–S8 | stale worker write | if ambiguous |
| S10 | inProgress | uncertain/pending | any | digest-only | HELD | **blocked until schema** durable ref | list-by-destination; 2nd SMS | Required |
| S11 | completed/failed | terminal | n/a | terminal | terminal | no-op | any mutation | No |

## Crash quick map

| Crash | Residual | Next |
|---|---|---|
| before claim | none | retry original exec only |
| after claim | claimed + inProgress | S1/S2 |
| after hold | claimed + HELD | prepare once |
| after prepare key | providerPending + HELD | S3 |
| during provider | pending/uncertain + HELD | S3/S6 |
| after success before outcome | likely uncertain + HELD | S6/S10 until ref exists |
| after outcome before escrow | providerSucceeded/Failed + HELD | S4/S5 |
| after escrow before finalize | ready terminal-ish | S7/S8 |
| during finalize | inProgress until commit | retry finalize CAS |
| after commit before HTTP | terminal | client may retry HTTP; no second provider |

## Authoritative prohibitions

- no blind provider retry  
- no second SMS per attempt  
- no result transfer across attempts  
- no stale worker finalize  
- no consumer/legacy merchant rewrite  
- no signed-webhook / approvedInternalDispatch enablement  
