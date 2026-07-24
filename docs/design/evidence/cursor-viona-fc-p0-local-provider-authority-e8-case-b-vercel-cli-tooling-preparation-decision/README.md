# Evidence — E8 Case B Vercel CLI Tooling-Preparation Decision

**Packet:** `docs/product/VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_E8_CASE_B_VERCEL_CLI_TOOLING_PREPARATION_DECISION.md`

**Classification:** `READY_FOR_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_E8_CASE_B_VERCEL_CLI_TOOLING_PREPARATION_DECISION_PACKET_PR_REVIEW`

**Decision:** `VERCEL_CLI_PINNED_GLOBAL_INSTALLATION_RECOMMENDED_FOR_SEPARATE_AUTHORIZATION`

**Canonical tip:** `5f658cd08842c5be58de5f29f673cb285bb002f2`

**Held:** `BLOCKED_B1A_VERCEL_CLI_NOT_AVAILABLE`

---

## Mode confirmation

```text
NO_CLI_INSTALLATION
NO_PACKAGE_FETCH_OR_INSTALL
NO_VERCEL_LOGIN
NO_PROJECT_CREATION
NO_LOCAL_PROJECT_LINK
NO_GIT_CONNECTION
NO_ENVIRONMENT_MUTATION
NO_BUILD
NO_DEPLOYMENT
NO_B1A_RETRY
REQUEST_ONLY_NO_CHARGE
```

---

## Read-only inventory (sanitized)

| Check | Result |
|---|---|
| `node --version` | `v24.14.1` |
| `npm --version` | `11.11.0` |
| `corepack --version` | `0.34.6` |
| `pnpm` / `yarn` | Unavailable |
| `where.exe node` | System NodeJS only |
| npm prefix | `<USER_APPDATA>\Roaming\npm` |
| Roaming npm on PATH | Yes (1 entry) |
| Session elevated | No |
| `vercel --version` | Unavailable |
| `node_modules/.bin/vercel` | Absent |
| Global `vercel.cmd` under prefix | Absent |
| `vercel` in `package.json` | Absent |
| gitignored `.vercel/` | **Pre-existing** (`projectName`: `ket-noi-eu`); **not** created/modified this packet; **not** Case B staging target |

---

## Registry metadata (read-only; no tarball download)

| Field | Value |
|---|---|
| Package | `vercel` |
| `latest` | `56.5.0` |
| engines | `node >= 18` |
| license | Apache-2.0 |
| registry | `registry.npmjs.org` |
| integrity | `sha512-wAKpT8DFSbnwlgbS711fbvxGjOfQeb1n+NcaBaSC4onq9eJAjbPfERrjrKE4GDsV8dkoBo0627lp0QxbLCGFiw==` |
| tarball path (not fetched) | `vercel/-/vercel-56.5.0.tgz` |

---

## Official docs markers

| Doc | Marker |
|---|---|
| https://vercel.com/docs/cli | `last_updated: 2026-07-08` |
| https://vercel.com/docs/cli/login | `last_updated: 2026-04-10` |
| https://vercel.com/docs/cli/link | `last_updated: 2026-03-17` |

---

## Option ranking (not executed)

| Option | Result |
|---|---|
| A — pinned global `npm install -g vercel@56.5.0` | `RECOMMENDED_FOR_SEPARATE_AUTHORIZATION` |
| B — repo `devDependency` | `NOT SELECTED` (lockfile/repo impact) |
| C — ephemeral `npx` | `NOT SELECTED_FOR_NORMAL_B1A_PATH` |

---

## Future phrases (not granted)

| Phrase | Status |
|---|---|
| `APPROVE_…_VERCEL_CLI_PINNED_TOOLING_INSTALLATION_ONLY` | PROPOSED / NOT GRANTED / NOT EFFECTIVE / NOT AUTHORIZED |
| `APPROVE_…_VERCEL_CLI_OPERATOR_INTERACTIVE_LOGIN_ONLY` | PROPOSED / NOT GRANTED / NOT EFFECTIVE / NOT AUTHORIZED |
| B1A retry | NOT AUTHORIZED |
| B1B–B7 | NOT AUTHORIZED |
| E8 deploy | NOT AUTHORIZED |

---

## Non-touch confirmation

No changes to `src/`, `package.json`, `package-lock.json`, npm config, workflows, Expo/Vercel/Fly config, env files, `.vercel`, or `dist/`.

Paths sanitized; no secrets or PII.
