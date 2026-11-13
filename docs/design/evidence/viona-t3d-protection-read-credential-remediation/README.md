# VIONA T3D protection-read credential remediation

Classification:
NON_PRODUCT_NON_RUNTIME_GOVERNANCE_REMEDIATION

Purpose:
Fail-closed split so Viona Merge Authorization Gate reads master
branch protection with a dedicated Administration:read credential
instead of GITHUB_TOKEN.

Fixed base (M1):
74eaa9228ca42b4cf9d8cedf46f6631c5c30e24b

This packet:
- does not create the GitHub App
- does not create repository secrets
- does not dispatch the gate
- does not mutate branch protection
- does not merge
- does not touch #451 / #452 / #453

Intended credential:
Dedicated GitHub App installation token
Repository Administration: read only
Administration write: no

Runtime env:
VIONA_GATE_PROTECTION_READ_TOKEN

Secrets (not created here):
VIONA_GATE_PROTECTION_READ_APP_ID
VIONA_GATE_PROTECTION_READ_APP_PRIVATE_KEY

New blockers:
BLOCKED_MERGE_PROTECTION_READ_CREDENTIAL_MISSING
BLOCKED_MERGE_PROTECTION_READ_UNAUTHORIZED

Freeze:
FREEZE_EXCEPTION_FOR_MERGE_GUARDRAIL_REMEDIATION_ONLY
GLOBAL_FREEZE remains active

Post-M2:
new dedicated probe PR required
#453 cannot be reused (no second dispatch / no rerun)
