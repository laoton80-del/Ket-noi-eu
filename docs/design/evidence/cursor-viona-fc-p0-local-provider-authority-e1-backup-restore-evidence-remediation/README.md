# Evidence — FC-P0 E1 Backup / Restore Evidence Remediation

## 1. Authorization phrase

`APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_E1_BACKUP_RESTORE_EVIDENCE_REMEDIATION`

## 2. Canonical baseline

`098cb8709a980aa6a9df76a6ca6a1e4fffa9478d`

## 3. Branch and HEAD

- Branch: `docs/viona-fc-p0-local-provider-authority-e1-backup-restore-evidence-remediation`
- HEAD: recorded at commit time

## 4. Exact changed paths

| Path | Purpose |
|---|---|
| `docs/product/VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_E1_BACKUP_RESTORE_EVIDENCE_REMEDIATION.md` | Remediation result |
| `docs/product/VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_E2_BACKUP_RESTORE_RISK_ACCEPTANCE_PROPOSAL.md` | Proposed risk acceptance (**NOT GRANTED**) |
| `docs/design/evidence/cursor-viona-fc-p0-local-provider-authority-e1-backup-restore-evidence-remediation/README.md` | This evidence README |
| `docs/product/VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_STAGING_EXECUTION_PREFLIGHT_RESULT.md` | E1 honesty corrections |
| `docs/design/evidence/cursor-viona-fc-p0-local-provider-authority-staging-execution-preflight/README.md` | E1 evidence corrections |
| `docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md` | Kernel sync |
| `Handoff_VIONA11726.txt` | Handoff sync |

## 5. Read-only / docs-only proof

No `src/`, prisma SQL, scripts, tests, package.json, deploy config, env, or secrets changes.

## 6–7. Commands performed / not performed

Performed: Git/LF checksum; `supabase backups` help; `backups list` (auth fail); Fly config show; migrate status; docs.

Not performed: backups restore; backup create; migrate deploy; deploy; provider mutation; Local create; risk-acceptance grant; `supabase login`.

## 8. Staging identity (safe)

App `viona-api-staging-eu` / `fra` / stage `staging`; project alias `viona-staging-eu`; ref `euqbfanilcssjiwwtcby`.

## 9–13. Backup metadata

| Field | Value |
|---|---|
| Source attempted | `npx supabase backups list --project-ref euqbfanilcssjiwwtcby` |
| Observation time | `2026-07-22T22:59:28Z` |
| Latest recovery point | **UNRESOLVED** (token unavailable) |
| Status/type/retention | **UNRESOLVED** |
| Schema coverage | **UNPROVEN** for current pre-A1 state |

## 14–17. Restore

Historical Pack15C owner/procedure referenced; staging-only; restore **not** executed; separate approval still required.

## 18–20. Pack A1 checksum

- Canonical Git/LF SHA256: `3B028C852F594AC9B538FED90C2CEE1D494EC33091F260906020F1819FF23D69`
- Bytes: 3471
- CRLF WT hash labelled non-canonical: `082EB713…66ACC` / 3552 B

## 21. Migration status

Pack A1 still **unapplied** (re-observed).

## 22. Production exclusion

Preserved (Fly staging + staging project ref).

## 23–25. Residual risk / E2 decision

Fresh recovery point unproven → `BLOCKED_E1_EXPLICIT_FC_P0_RISK_ACCEPTANCE_REQUIRED`.  
Risk acceptance **proposed, not granted**. E2 **not** authorized.

## 26–35. Confirmations

No backup create; no restore; no migrate apply; no deploy; no provider mutation; no live Local request; no payment; `REQUEST_ONLY_NO_CHARGE`; Pack40S unauthorized; Apple/EAS/Phase D2 deferred.

## 36. Next operator action

Strict-review this remediation PR. Do not authorize E2 or grant risk acceptance automatically.

## 37. Validation

| Command | Exit |
|---|---|
| `npx tsc --noEmit` | **0** |
| `npm run ci:expo-readiness` | **0** (PASS) |
| `npm run ci:release-discipline` | **0** |
