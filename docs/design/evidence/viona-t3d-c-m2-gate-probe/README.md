# VIONA T3D-C M2 Gate Probe

Classification:
NON_PRODUCT_NON_RUNTIME_GOVERNANCE_IDENTITY_AND_PROTECTION_PROBE

Fixed base:
dec113f0772bd48fcf2624335867d1be95420c1a

Purpose:
Provide one fresh OPEN docs-only PR head for one controlled
Viona Merge Authorization Gate evaluation after the T3D
protection-read credential remediation.

Rules:

- probe only
- MUST NOT be merged
- must stay OPEN through Gate evaluation
- exactly one later workflow_dispatch
- Maty2016 approval required on exact current probe head
- reviewed_scope_digest computed from live GitHub PR files
- protection-read credential is the dedicated GitHub App
- App permission is Administration: read only
- no product/runtime/backend/provider/payment/DB/auth/SOS change
- no ordinary freeze release
- PR #451 and #452 are out of scope
- PR #453 is historical and must not be reused
- Gate conclusion may still fail only for the expected remaining
  legacy Emergency Merge Lock required-check dependency
- Gate app identity must be GET-verified from the new check run
- only after T3D-C2 verification may protection transition
  from Emergency Lock to Merge Authorization Gate
- this probe will later be closed WITHOUT merge

Freeze scope:
FREEZE_EXCEPTION_FOR_MERGE_GUARDRAIL_REMEDIATION_ONLY
