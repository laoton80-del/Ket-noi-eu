# Evidence — E8 Case B Vercel CLI Operator Interactive Login

**Packet:** `docs/product/VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_E8_CASE_B_VERCEL_CLI_OPERATOR_INTERACTIVE_LOGIN_RESULT.md`

**Classifications:**

```text
READY_FOR_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_E8_CASE_B_VERCEL_CLI_OPERATOR_INTERACTIVE_LOGIN_RESULT_PACKET_PR_REVIEW
VERCEL_CLI_OPERATOR_INTERACTIVE_LOGIN_VERIFIED
B1A_AUTHENTICATION_PREREQUISITE_REMEDIATED_WITH_PROJECT_PROVISIONING_RETRY_UNAUTHORIZED
```

**Baseline:** `c83a7500bcf45a08bc9e9dc6968ac99ce7f929df`

---

## Authorization

Exact phrase granted in operator `user_query` before login:

`APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_E8_CASE_B_VERCEL_CLI_OPERATOR_INTERACTIVE_LOGIN_ONLY`

---

## Login record (sanitized)

| Field | Value |
|---|---|
| CLI | `56.5.0` |
| Command | `vercel login` |
| Start UTC | `2026-07-24T15:42:41.194Z` |
| End UTC | `2026-07-24T15:43:52.243Z` |
| Exit | 0 |
| `vercel whoami` | exit 0; username sanitized `l******5` |
| Ownership | Confirmed via operator-completed device login |
| Tokens / codes / login URLs | Not recorded |
| package.json / lockfile | Unchanged |
| `.vercel` hash | Unchanged |
| Project / link / Git / env / build / deploy | 0 |

---

## Boundaries preserved

| Item | Status |
|---|---|
| Four Case B blockers | PRESERVED |
| B1A retry | NOT AUTHORIZED |
| B1B–B7 / E8–E10 | NOT AUTHORIZED |
| `REQUEST_ONLY_NO_CHARGE` | PRESERVED |

No secrets or PII committed.
