# VIONA Request Engine — Pack25 Live QA Sandbox/Auth Access Blocked Evidence

**Document type:** Live QA sandbox/auth access blocked evidence (docs-only — no code changes).
**Baseline:** `origin/master @ 6b309b7` — `docs(pack25): record Pack24 note input UI live operator sign-off evidence (#146)`.
**Related:** `docs/product/VIONA_REQUEST_PACK25_PACK24_NOTE_INPUT_UI_LIVE_OPERATOR_SIGN_OFF_EVIDENCE.md`, `docs/product/VIONA_REQUEST_PACK25_PACK24_NOTE_INPUT_UI_MANUAL_QA_EVIDENCE.md`, `docs/runbooks/VIONA_LOCAL_STAGING_PASS_HANDOFF.md`, `docs/runbooks/VIONA_LOCAL_PILOT_ACCOUNT_PROVISIONING_PLAN_1.md`

---

## 1. Evidence summary

| Field | Value |
| --- | --- |
| Operating Protocol read | **YES** |
| Docs-only evidence | **YES** |
| Pack24 note input/write UI on master | **Green** (PR #143) — not failed by this evidence |
| Pack25 live sign-off pending-gate evidence | **Green** (PR #146 @ `6b309b7`) — live session still NOT EXECUTED |
| **Live QA status** | **BLOCKED** |
| **Live QA result** | **NOT EXECUTED** |
| Pack24 failed | **NO** — access/setup gap only |
| Pack26 opened by this evidence | **NO** |
| Live operator attestation | **Pending** |
| All non-note write/actions remain blocked | **YES** |

### Audit source

Read-only no-secret audit performed without modifying files, without inspecting `.env*` values, without printing secrets or URL values, and without running DB/Prisma/Supabase/SQL commands.

---

## 2. Why live QA is BLOCKED (not FAIL)

| Finding | Detail |
| --- | --- |
| Status classification | **BLOCKED** — sandbox/auth/access prerequisites not met |
| Not Pack24 FAIL | Pack24 implementation on master remains verified green; live session could not start |
| REST client likely unconfigured | Metro session reported **0 env vars injected** — suggests client REST base not active |
| Key name exists | `EXPO_PUBLIC_REST_API_BASE` is defined in `src/services/apiClient.ts` |
| Current values not inspected | `.env*` files were not read in audit or this evidence pack |
| Demo login fallback | Without REST base configured, `OtpScreen` uses 4-digit demo OTP path — **no real REST JWT** |
| Pack24 requires real JWT | `appendVionaRequestNote` uses `restApiFetchJson` with Bearer JWT |
| Pilot account required | Documented pilot phones (e.g. `+420910000001`) — PIN operator-provisioned, not in repo |
| No Pack24 registration UI | Login uses provisioned phone + PIN; no separate in-app registration for note QA |
| VionaRequest row required | Pack16 list/detail are requester/owner/participant-scoped |
| No documented VionaRequest seed | No repo seed script found for scoped request rows |
| Demo sandbox must be off | When demo mode active, REST is mocked — not real Pack24 staging behavior |

---

## 3. Required local-only setup (operator — values not recorded here)

| Prerequisite | Required |
| --- | --- |
| `EXPO_PUBLIC_REST_API_BASE` in local `.env.local` only | **YES** — staging or local API |
| `EXPO_PUBLIC_DEV_REST_JWT` | **Empty** — per strict UI proof runbooks |
| Provisioned pilot user | **YES** — see `VIONA_LOCAL_PILOT_ACCOUNT_PROVISIONING_PLAN_1.md` |
| Operator PIN | **YES** — vault / local env only (`VIONA_PILOT_PIN` or per-user PIN keys) |
| Scoped `VionaRequest` row for test user | **YES** — inbox empty without DB row |
| Demo sandbox mode | **OFF** — for real API behavior |
| Staging API reachable | **YES** — local `npm run api:dev` or documented public staging API |

---

## 4. Safe operator next steps

1. Configure **`.env.local` locally only** — set `EXPO_PUBLIC_REST_API_BASE` to staging or local API; do not commit.
2. Leave **`EXPO_PUBLIC_DEV_REST_JWT` empty** for strict UI proof.
3. Restart Expo with cache clear: `npx expo start -c --web`.
4. Ensure pilot accounts provisioned per `docs/runbooks/VIONA_LOCAL_PILOT_ACCOUNT_PROVISIONING_PLAN_1.md`.
5. Confirm at least one **scoped `VionaRequest`** exists for the test user on staging (coordinate with ops if inbox is empty — no documented seed script in repo).
6. **Login:** `Login` → pilot phone → **PIN** (6+ chars when REST configured).
7. **Navigate:** Account → **VIONA requests** → select request → submit note via Pack24 input.
8. **Verify:** safe success/error copy; note in Pack22 timeline after refresh; status unchanged.
9. Record outcome in a **future live operator sign-off update** — do not convert this BLOCKED evidence into PASS.

---

## 5. Blocking issues register

| ID | Issue | Severity |
| --- | --- | --- |
| BLOCK-LIVE-001 | REST client likely unconfigured in current Expo web session | **High** |
| BLOCK-LIVE-002 | Demo OTP path active when REST base missing — no JWT for Pack24 | **High** |
| BLOCK-LIVE-003 | Operator PIN + pilot account required — not in repository | **Medium** |
| BLOCK-LIVE-004 | No documented `VionaRequest` seed for pilot user | **Medium** |
| BLOCK-LIVE-005 | Demo sandbox mode would mock REST if enabled | **Low** |

---

## 6. Explicit non-scope (this evidence pack)

| Item | State |
| --- | --- |
| Code implemented | **NO** |
| Pack24 runtime modified | **NO** |
| Users created | **NO** |
| DB seeded | **NO** |
| DB/Prisma/Supabase/SQL commands run | **NO** |
| Secrets inspected or printed | **NO** |
| URL values printed | **NO** |
| `.env*` modified | **NO** |
| New write actions | **NO** |
| Status / assign / confirm / cancel | **NO** |
| Payments / booking / SOS / wallet / live AI | **NO** |

---

## 7. Status flags

| Flag | Value |
| --- | --- |
| `pack25LiveQaSandboxAuthAccessBlockedEvidencePrepared` | `true` |
| `pack25LiveQaStatus` | `blocked` |
| `pack25LiveQaResult` | `not_executed` |
| `pack24Failed` | `false` |
| `pack26NoteWriteUiHardeningOpened` | `false` |
| `pack25LiveOperatorAttestationPending` | `true` |
| `allNonNoteWriteActionsBlocked` | `true` |

---

## 8. Recommendation

| Recommendation | Status |
| --- | --- |
| **A) Safe to open PR** for docs-only BLOCKED evidence | **YES** |
| Treat as Pack24 failure | **NO** |
| Proceed with live QA now | **NO** — complete §4 setup first |
| Open Pack26 from this evidence | **NO** |

---

**Evidence:** `docs/design/evidence/cursor-pack25-live-qa-sandbox-auth-access-blocked-evidence/README.md`
