# VIONA T3C Dedicated Gate Identity Probe

Classification:
NON_PRODUCT_NON_RUNTIME_GOVERNANCE_IDENTITY_PROBE

Purpose:
Provide one stable docs-only pull-request head for a one-shot
`Viona Merge Authorization Gate` workflow_dispatch identity probe.

Fixed base:
74eaa9228ca42b4cf9d8cedf46f6631c5c30e24b

Rules:
- identity probe only
- must remain OPEN during gate evaluation
- must never be merged
- no product/runtime/backend/provider/payment/DB/auth/SOS change
- no ordinary freeze release
- #451 and #452 are out of scope
- gate success is not required for identity verification
- a real Checks API check run and verified app identity are required
  before branch protection may transition
- probe is to be closed without merge after T3C completes

Freeze scope:
FREEZE_EXCEPTION_FOR_MERGE_GUARDRAIL_REMEDIATION_ONLY
