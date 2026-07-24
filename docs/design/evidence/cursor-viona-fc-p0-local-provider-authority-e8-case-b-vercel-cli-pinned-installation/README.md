# Evidence — E8 Case B Vercel CLI Pinned Installation

**Packet:** `docs/product/VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_E8_CASE_B_VERCEL_CLI_PINNED_INSTALLATION_RESULT.md`

**Classifications:**

```text
READY_FOR_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_E8_CASE_B_VERCEL_CLI_PINNED_INSTALLATION_RESULT_PACKET_PR_REVIEW
VERCEL_CLI_PINNED_GLOBAL_INSTALLATION_VERIFIED
B1A_CLI_PREREQUISITE_REMEDIATED_WITH_LOGIN_AND_RETRY_UNAUTHORIZED
```

**Baseline:** `d4fcce082b284884caacab2fd550ead558a7c716`

---

## Authorization

Exact phrase granted in operator `user_query` before install:

`APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_E8_CASE_B_VERCEL_CLI_PINNED_TOOLING_INSTALLATION_ONLY`

---

## Install record (sanitized)

| Field | Value |
|---|---|
| Command | `npm install -g vercel@56.5.0` |
| Start UTC | `2026-07-24T15:06:53.437Z` |
| End UTC | `2026-07-24T15:08:03.027Z` |
| Exit | 0 |
| Prefix | `<USER_APPDATA>\Roaming\npm` |
| `vercel --version` | `56.5.0` |
| `npm list -g vercel` | `vercel@56.5.0` |
| Executable | `<USER_APPDATA>\Roaming\npm\vercel.cmd` |
| package.json / lockfile | Unchanged |
| Login / project / link / deploy | 0 |

---

## Pin metadata

| Field | Value |
|---|---|
| Package | `vercel@56.5.0` |
| engines | `>= 18` |
| integrity | `sha512-wAKpT8DFSbnwlgbS711fbvxGjOfQeb1n+NcaBaSC4onq9eJAjbPfERrjrKE4GDsV8dkoBo0627lp0QxbLCGFiw==` |
| deprecated | none |
| registry | `https://registry.npmjs.org/` |

---

## Boundaries preserved

| Item | Status |
|---|---|
| Four Case B blockers | PRESERVED |
| Login phrase | PROPOSED / NOT AUTHORIZED |
| B1A retry | NOT AUTHORIZED |
| B1B–B7 / E8–E10 | NOT AUTHORIZED |
| `REQUEST_ONLY_NO_CHARGE` | PRESERVED |
| Pre-existing `.vercel` (`ket-noi-eu`) | NON-AUTHORITATIVE; hash unchanged |

Paths sanitized; no secrets or PII.
