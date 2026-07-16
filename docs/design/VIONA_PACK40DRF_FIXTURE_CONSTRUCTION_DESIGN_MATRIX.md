# Pack40DRF — Fixture Construction Design Matrix

Companion to `VIONA_PACK40DRF_SAFE_STRANDED_FIXTURE_CONSTRUCTION_DESIGN_AUDIT.md`.

| Target | Desired residual | App-path today | Recovery proof | Safe construction now? |
|---|---|---|---|---|
| A providerSucceeded + inProgress + HELD | Settle failed after durable success | Only accidental settle failure | Recovered completion | No (non-deterministic) |
| B providerFailed + inProgress + HELD | Refund failed after durable failure | Only accidental refund failure | Recovered failure | No (non-deterministic) |
| C outcomeUncertain + exact ref + HELD | Gateway uncertain; escrow skipped | Possible under transport uncertainty | Exact lookup recon | Wait natural only |
| D claimed + expired lease | Stop before provider | No stop hook | Operator-review only | No (and insufficient) |

| Method | Source change? | Real SMS? | Cleanup? | Classification impact |
|---|---|---|---|---|
| Natural wait | No | No (unless uncontrolled prod path — staging test SMS only) | No | `WAIT_FOR_NATURAL_STRANDED_ATTEMPT` |
| Claimed stop | Would need new hook | No | No | Not full recovery |
| Known-failure live path | No | No (test credentials) | N/A — ends terminal | Not stranded |
| Post-outcome pause | Yes (Method 5) | No if paused after durable outcome | No if recovery closes | Separate DRF1 packet |
| Direct DB | Bypass | N/A | Likely | **PROHIBITED** |

| Recovery state | Proves |
|---|---|
| claimed | Operator review only |
| providerSucceeded + HELD | Escrow settle + recovered complete |
| providerFailed + HELD | Escrow refund + recovered fail |
| outcomeUncertain + exact ref | One lookup + then A/B path |
| terminal completed/failed | DRS0 already covered |
