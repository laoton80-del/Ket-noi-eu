# Evidence — PR #436 TypeScript RangeError Tooling Triage

## 1. Authorization phrase

`APPROVE_VIONA_FC_P0_PR436_POST_MERGE_TYPESCRIPT_RANGEERROR_NO_PRODUCT_CHANGE_TOOLING_TRIAGE_PACKET`

## 2. Canonical master baseline

`7f001c6fd403be795c812e247856d23af08a148f`

## 3. Classification

- Branch: `docs/viona-pr436-typescript-rangeerror-no-product-change-tooling-triage`
- Primary: `READY_FOR_VIONA_PR436_TYPESCRIPT_RANGEERROR_NO_PRODUCT_CHANGE_TOOLING_TRIAGE_PACKET_PR_REVIEW`
- Root cause: `BLOCKED_TYPESCRIPT_RANGEERROR_INPUT_SCOPE_RECURSION`
- PR #436 impact: `PR436_POST_MERGE_VALIDATION_REMAINS_BLOCKED_PENDING_TOOLING_REMEDIATION`

## 4. Exact changed paths

| Path | Purpose |
|---|---|
| `docs/product/VIONA_PR436_TYPESCRIPT_RANGEERROR_NO_PRODUCT_CHANGE_TOOLING_TRIAGE_PACKET.md` | Triage packet |
| `docs/design/evidence/cursor-viona-pr436-typescript-rangeerror-tooling-triage/README.md` | This evidence README |
| `docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md` | Kernel sync |
| `Handoff_VIONA11726.txt` | Handoff sync |

## 5. Key evidence (sanitized)

| Fact | Value |
|---|---|
| Local toolchain | Node v24.14.1 / npm 11.11.0 / TypeScript 5.9.3 |
| CI on PR #436 head | Release Discipline **success** under Node **v20.20.2** (run `30039107132`) |
| Root cause signal | `dist/_expo/static/js/web/*.js` included in root typecheck (`allowJs` + no `dist` exclude) |
| Functions `-p functions/tsconfig.json` | No RangeError (ordinary TS2322 only) |
| Node 20 local comparison | Unavailable — not installed in this lane |

## 6. Prohibitions honored

No product/tsconfig/package/lockfile edits; no installs; no `NODE_OPTIONS`; no stack increase; no E8 deploy; no login; no provider mutation; no Local request.

## 7. Boundaries

E8 Case A preserved. Case B blockers preserved. E8–E10 unauthorized. `REQUEST_ONLY_NO_CHARGE` preserved. AI hard-stop not started.
