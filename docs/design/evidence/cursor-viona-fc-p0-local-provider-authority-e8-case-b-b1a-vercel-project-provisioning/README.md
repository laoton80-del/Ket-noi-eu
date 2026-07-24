# Evidence — FC-P0 E8 Case B B1A Vercel Project Provisioning

## 1. Authorization

`APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_E8_CASE_B_B1A_DEDICATED_VERCEL_STAGING_PROJECT_PROVISIONING_AND_LOCAL_LINK_ONLY`

## 2. Canonical master baseline

`331d610c25c795f16c1be5c4cf1fe0d56b4ffaa1`

## 3. Classification

- Branch: `docs/viona-fc-p0-local-provider-authority-e8-case-b-b1a-vercel-project-provisioning-result`
- Primary: `BLOCKED_B1A_VERCEL_CLI_NOT_AVAILABLE`
- Not returned: `DEDICATED_VERCEL_STAGING_PROJECT_PROVISIONED_WITH_ZERO_DEPLOYMENTS`
- Not returned: `B1A_LOCAL_PROJECT_LINK_VERIFIED_WITH_GIT_BINDING_UNAUTHORIZED`

## 4. CLI gate evidence (sanitized)

| Check | Result |
|---|---|
| `vercel` on PATH | No |
| Local `node_modules/.bin/vercel` | No |
| `npx --no-install vercel` | Missing package; install not performed |
| Auto-install | Forbidden / not performed |

## 5. Mutation counts

| Action | Count |
|---|---|
| Project creation | **0** |
| Local project link | **0** |
| Git connection | **0** |
| Environment mutation | **0** |
| Build / deploy / domain | **0** |

## 6. Preserved blockers

```text
BLOCKED_NO_VERIFIED_VIONA_STAGING_CLIENT_DEPLOYMENT_TARGET
BLOCKED_E8_STAGING_CLIENT_PROJECT_BINDING_UNRESOLVED
BLOCKED_E8_CLIENT_DEPLOYMENT_ROLLBACK_CONTRACT_INCOMPLETE
BLOCKED_E8_STAGING_CLIENT_API_BASE_NOT_SAFE
```

## 7. Boundaries

`REQUEST_ONLY_NO_CHARGE` preserved. AI hard-stop **not started**. B1B–B7 **NOT AUTHORIZED**. E8 deploy **NOT AUTHORIZED**. E9–E10 **NOT AUTHORIZED**.

## 8. Operator prep

Install a usable Vercel CLI outside this lane; confirm `vercel --version`; optionally `vercel login` interactively; then re-run B1A. Do not paste tokens into chat.
