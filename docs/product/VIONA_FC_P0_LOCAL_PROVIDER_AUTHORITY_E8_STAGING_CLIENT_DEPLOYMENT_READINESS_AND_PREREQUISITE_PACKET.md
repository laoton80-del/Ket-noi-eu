# VIONA FC-P0 — E8 Staging Client Deployment Readiness and Prerequisite Packet

**Primary classification:** `READY_FOR_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_E8_STAGING_CLIENT_DEPLOYMENT_READINESS_AND_PREREQUISITE_PACKET_PR_REVIEW`

**Case decision (this packet):** `E8_CASE_A_DOCS_ONLY_RECOMMENDED`

**Target inventory marker:** `BLOCKED_NO_VERIFIED_VIONA_STAGING_CLIENT_DEPLOYMENT_TARGET`

**Project-binding marker:** `BLOCKED_E8_STAGING_CLIENT_PROJECT_BINDING_UNRESOLVED`

**Rollback-contract marker:** `BLOCKED_E8_CLIENT_DEPLOYMENT_ROLLBACK_CONTRACT_INCOMPLETE`

**Authorization (this packet only):** `APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_E8_STAGING_CLIENT_DEPLOYMENT_READINESS_AND_PREREQUISITE_PACKET`

**Mode:** Strict docs-only planning + read-only source/deployment inventory — **no** client deploy, API deploy, login, provider mutation, Local request, functional QA, or migration

**Canonical master baseline:** `a98a3222a0a5a637088693d8fe147861210070b1`

**Held prior classification:** `VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_POST_ACTIVATION_NEXT_STAGE_DECISION_PACKET_VERIFIED_ON_MASTER_WITH_E8_RECOMMENDED_BUT_UNAUTHORIZED`

**Held prior recommendation:** `RECOMMEND_E8_FOR_SEPARATE_OPERATOR_AUTHORIZATION_DECISION`

**Branch:** `docs/viona-fc-p0-local-provider-authority-e8-staging-client-deployment-readiness-prerequisite-packet`

```text
E8_STAGING_CLIENT_DEPLOYMENT_READINESS_PACKET_AUTHORIZED_FOR_DOCS_ONLY
NO_CLIENT_DEPLOYMENT
NO_API_DEPLOYMENT
NO_LOGIN
NO_PROVIDER_MUTATION
NO_LOCAL_REQUEST
NO_FUNCTIONAL_QA
NO_MIGRATION
E8_EXECUTION_NOT_AUTHORIZED
E9_THROUGH_E10_NOT_AUTHORIZED
REQUEST_ONLY_NO_CHARGE
PACK40S_NOT_AUTHORIZED
APPLE_EAS_PHASE_D2_DEFERRED
PHASE_C_CLOSED_GREEN
AI_HARD_STOP_NOT_STARTED
NO_PRODUCTION_READY_CLAIM
E8_CASE_A_DOCS_ONLY_RECOMMENDED
BLOCKED_NO_VERIFIED_VIONA_STAGING_CLIENT_DEPLOYMENT_TARGET
```

---

## 1. Purpose

Close or explicitly identify remaining prerequisites for a future **E8** staging-client deployment decision.

This packet **does not** deploy any client and **does not** grant:

`APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_STAGING_CLIENT_DEPLOY`

---

## 2. Canonical workspace gate

| Check | Result |
|---|---|
| Top-level | `C:/KNG/ket-noi-eu` |
| Branch at inventory start | `master` @ `a98a3222a0a5a637088693d8fe147861210070b1` |
| `origin/master` | Identical tip |
| Working tree | Clean before docs branch |
| Contains baseline SHA | Yes (tip equals baseline; master had not advanced) |
| Sibling worktrees | Present on disk; **not used** for this packet |
| Docs branch | `docs/viona-fc-p0-local-provider-authority-e8-staging-client-deployment-readiness-prerequisite-packet` |

No reset, rewrite, or modification of `master` content beyond branching for docs.

---

## 3. Verified provider baseline (held; not re-mutated)

From prior authorized activation-retry + post-activation decision (PR #434 / #435):

| Field | Held value |
|---|---|
| lifecycle / status | `ACTIVE` |
| `publicB2cVisible` | `true` |
| `supportedServiceTypes` | `GENERIC_REQUEST` only |
| `activatedAt` | non-null |
| `suspendedAt` / `retiredAt` | null |
| audit | `REGISTERED` → `CONFIG_UPDATED` → `ACTIVATED` |
| eligibility / audit totals | 1 / 3 |
| Staging API | `https://viona-api-staging-eu.fly.dev` (`viona-api-staging-eu`) |

This packet performed **zero** provider reads that require login and **zero** mutations.

---

## 4. E8 canonical extraction (verbatim spirit; phrase remains PROPOSED)

Source: `docs/product/VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_EXECUTION_PLANNING_PACKET.md` §13 + post-activation decision packet §3.1.

| # | Field | Content |
|---|---|---|
| 1 | Exact stage name | **Stage E8 — Client deployment decision** |
| 2 | Exact proposed authorization phrase | `APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_STAGING_CLIENT_DEPLOY` |
| 3 | Purpose | Decide whether a separate staging client/web deploy is needed so Pack B + PR #423 contracts are live for Local QA |
| 4 | Case A behavior | Staging client already serves verified Pack B + PR #423 source → **document**; **no** new client deploy |
| 5 | Case B behavior | Client missing those contracts → separate client/web deploy only; record SHA; run readiness gates |
| 6 | Prerequisites | E7 complete (provider ACTIVE); client target + binding + rollback + API-base safety resolvable before Case B |
| 7 | Allowed actions | Document already-served client **or** (under separate Case B grant) deploy client/web only |
| 8 | Prohibited actions | Native deploy assumption; combining client deploy auth with Local QA (E9); production alias impact; automatic Local create / AI / paid runtime |
| 9 | Expected evidence | Evidence matrix row E8; SHA / readiness when deploy occurs; or documented already-served |
| 10 | Rollback requirements | Rollback to previous verified client artifact (§18); no DB rollback; no provider deactivation; no migration rollback |
| 11 | Functional QA boundary | Client functional Local QA belongs in **E9**, separately gated — **not** inside E8 |

**Phrase status (required):**

```text
PROPOSED
NOT GRANTED
NOT EFFECTIVE
NOT AUTHORIZED
```

**Current E8 state (unchanged by this packet):**

```text
DEFINED_BUT_PREREQUISITES_INCOMPLETE
NOT GRANTED
NOT EFFECTIVE
NOT AUTHORIZED
```

---

## 5. Client target inventory

### 5.1 Plausible targets supported by the repository

| Target name | Platform | Deployment provider | Project/app/site id | Deployed URL (verified) | VIONA vs other | Current status | Source branch/SHA | Build command | Output | Env mechanism | Canonical staging API | Auth compatibility | Rollback | Operator credentials | Public-user impact |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Expo static web (`build:web`) → Vercel SPA | web / mobile-web | Vercel (inferred from `vercel.json` + `fix-vercel-fonts.js`) | Local gitignored `.vercel` link names project `ket-noi-eu` only — **not** committed staging binding | **None verified** in canonical docs or this session | App `name`/`web.name` = **VIONA** (`app.config.js`) | Config present; **no** verified live staging host | Would be master tip when authorized | `npm run build:web` | `dist/` (gitignored) | Build-time `EXPO_PUBLIC_*` | Must be `https://viona-api-staging-eu.fly.dev` | Public login → REST JWT in AsyncStorage (`apiClient.ts`); no env JWT | Prior Vercel deployment / promote previous — **unproven** | Yes (Vercel CLI/token) for deploy | Unknown until project aliases proven staging-only |
| Expo Metro web (`expo start --web`) | web (local) | None (dev server) | n/a | Local only | VIONA | Dev pattern used historically with staging API | Local checkout | `npm run web` | Metro | `.env` / `.env.local` | Operator-set | Same REST login | Stop Metro | Local machine | None (not a shared staging URL) |
| EAS preview (Android APK / iOS) | Android / iOS | Expo EAS | `eas.projectId` in `app.config.js` `extra.eas` | None verified for FC-P0 staging | VIONA | `eas.json` preview/production profiles exist | EAS build SHA | `eas build --profile preview` | Store/internal binary | EAS env | Could point staging | Same | Rebuild prior | Apple/Google + EAS | Store/internal distribution risk |
| EAS production / store | Android / iOS | EAS + stores | same | Production path | VIONA | **Out of scope** — Apple/EAS Phase D2 deferred | — | production profile | Store artifacts | EAS production | Must not | — | Store rollback | Yes | **Yes — blocked for E8** |

### 5.2 Historical staging-client pattern (canonical docs)

Pack17 / Pack18 staging QA runbooks repeatedly record: **no dedicated deployed staging web host confirmed**; validation used **local Expo web + staging API**.

### 5.3 Inventory conclusion

```text
BLOCKED_NO_VERIFIED_VIONA_STAGING_CLIENT_DEPLOYMENT_TARGET
```

No URL was claimed as a live VIONA staging client without verifiable evidence.

---

## 6. Recommended E8 target

**No single staging client target is recommended for Case B deploy** in this packet.

Required proofs for a recommendation were **not** all met:

| Proof | Status |
|---|---|
| Is a VIONA client | Candidate Expo web **is** branded VIONA in source |
| Isolated from production | **UNRESOLVED** — Vercel project aliases / domains not authenticated-inspected |
| Supports Local flow | Source has `LocalScreen` in `App.tsx` + Pack B / PR #423 on master |
| Points only to staging API | **Not** proven for any deployed host; local `dist` baked `127.0.0.1:8787` from operator env |
| Deterministic build | `npm run build:web` succeeds locally (see §9) |
| Reversible deployment | **UNRESOLVED** — no prior verified client deployment baseline |
| No Apple/EAS Phase D2 | Expo web candidate would avoid D2; EAS native does not |
| No automatic Local request / paid AI | Source create is user-driven; deploy itself must not invoke AI |
| No secrets in client bundle | Build-time discipline required; see §8 |

**Ranked candidates (informational only — not a Case B recommendation):**

1. Future **isolated** Vercel staging project hosting Expo `dist/` (best isolation/rollback/repro for E9) — **binding unresolved**
2. Operator-local Expo web + staging API (historical Pack17 pattern) — **not** an E8 Case B deploy target
3. EAS preview — deferred / higher credential surface

---

## 7. Source SHA and build readiness

| Field | Value |
|---|---|
| Eligible source SHA | `a98a3222a0a5a637088693d8fe147861210070b1` |
| Branch | `master` (docs work on the readiness branch; deploy source remains master tip when authorized) |
| Relationship | Tip of `origin/master` at inventory; contains PR #434 (`1110c21…`) and PR #435 (`a98a322…`); contains PR #423 (`c7b9365…`) Pack B recovery |
| ACTIVE provider docs | Preserved on master (activation-retry + decision packets) |
| Phase C / mobile-web | Preserved; no client runtime edits in this packet |
| Unreviewed client/runtime after SHA | None on master tip |

**Clean build prerequisites:** Node/npm with repo lockfile; Expo ~54; `npm run build:web` without deploy secrets.

**Build command:** `npm run build:web` (= `npx expo export --platform web --clear && node fix-vercel-fonts.js`)

**Expected artifact:** `dist/` (SPA: `index.html`, static JS/CSS, fonts fix, copied `vercel.json`)

**Validation:** `dist/index.html` present; `fix-vercel-fonts` completes; artifact **not** committed (`dist/` gitignored)

**Local build without deployment:** **Yes** — executed this session; **no upload**.

---

## 8. API base and environment safety

### 8.1 Canonical client API-base resolution

`src/services/apiClient.ts`:

- Primary: `process.env.EXPO_PUBLIC_REST_API_BASE`
- Legacy: `process.env.EXPO_PUBLIC_BACKEND_API_BASE`
- **No** production URL hardcoded fallback
- **No** automatic localhost fallback in code — empty base → configured=false / user-visible error
- JWT: AsyncStorage session only — **no** `EXPO_PUBLIC_*` JWT bearer fallback

**Required future staging client value:**

`https://viona-api-staging-eu.fly.dev`

### 8.2 Local artifact observation (this session)

Safe local `npm run build:web` succeeded but operator env inlined **`127.0.0.1:8787`** into the JS bundle. That artifact is **not** staging-API-safe for Case B upload.

### 8.3 Environment variable classification (E8 client deploy surface)

| Variable / class | Classification |
|---|---|
| `EXPO_PUBLIC_REST_API_BASE` (= staging HTTPS origin only) | **PUBLIC_CLIENT_SAFE** (must be set at build) |
| `EXPO_PUBLIC_BACKEND_API_BASE` | **NOT_REQUIRED** if REST base set; if used, same staging-only rule |
| Firebase `EXPO_PUBLIC_FIREBASE_*` public web config | **PUBLIC_CLIENT_SAFE** |
| Mapbox / Stripe **publishable** keys | **PUBLIC_CLIENT_SAFE** (public by design) |
| `EXPO_PUBLIC_SENTRY_DSN` | **PUBLIC_CLIENT_SAFE** if used |
| `JWT_SECRET`, `DATABASE_URL`, Supabase service role, Fly/GitHub/Vercel tokens, Stripe **secret**, OpenAI keys | **SERVER_ONLY_SECRET** — must not appear in client bundle |
| Dev JWT / `EXPO_PUBLIC_*` bearer JWT | **NOT_REQUIRED** / forbidden for staging client |
| Vercel project staging vs production alias binding | **UNRESOLVED** |
| Exact Vercel staging env UI values for API base | **UNRESOLVED** (requires operator console; not queried) |

**Secret-boundary rule:** Any unresolved secret boundary that could place **SERVER_ONLY_SECRET** into the client, or leave production API wired, **blocks Case B**.

Auth bootstrap: canonical public login (`POST /api/auth/login`) → store JWT. Operator-only Local ops routes remain server-protected (Role.ADMIN).

---

## 9. Build artifact readiness

| Item | Result |
|---|---|
| Exact command | `npm run build:web` |
| Expected output | `dist/` Expo web export + font/favicon/`vercel.json` post-process |
| Node/npm/Expo | Expo `~54.0.36`; RN `0.81.5`; `engines` field unset in `package.json` |
| Required env for **staging** artifact | `EXPO_PUBLIC_REST_API_BASE=https://viona-api-staging-eu.fly.dev` (+ public Firebase/etc. as needed) — **not** localhost |
| SHA embedding | No dedicated client SHA stamp observed in `metadata.json` (`{"version":0,"bundler":"metro",...}`) |
| Rendering | Static SPA export; `vercel.json` rewrites `/(.*)` → `/index.html` |
| Assets/fonts | `fix-vercel-fonts.js` rewrites vendor fonts + injects global CSS |
| Local route | `LocalScreen` registered in `App.tsx` (Home/Local B2C) |
| Failure conditions | Export/Metro errors; missing `dist` skips font fix; CI readiness/doctor failures |

### 9.1 Safe local checks executed

| Check | Result |
|---|---|
| `npx tsc --noEmit` | PASS (via gates) |
| `npm run ci:expo-readiness` | PASS |
| `npm run ci:release-discipline` | PASS (exit 0) |
| `npm run build:web` | PASS locally; artifact gitignored; **API base not staging** |

Dist secret scan (names only): no `DATABASE_URL`, `service_role`, `FLY_API_TOKEN`, `VERCEL_TOKEN`, or JWT `eyJ` blobs observed in `dist` JS/HTML.

---

## 10. Deployment platform readiness (candidate Expo web → Vercel)

| Item | Status |
|---|---|
| Platform | Vercel static SPA (repo-confirmed intent) |
| Staging project/site id | **UNRESOLVED** as staging-isolated binding |
| Local link evidence | Gitignored `.vercel` on operator machine names project `ket-noi-eu` — **not** treated as verified staging binding; identifiers not copied into this packet |
| Region | **UNRESOLVED** |
| Deploy command (typical, **not executed**) | e.g. `vercel deploy --prebuilt` / project deploy of `dist` — exact flags **UNRESOLVED** without provider auth |
| Local vs remote build | Local `build:web` proven; remote Vercel build **UNRESOLVED** |
| Operator authentication | Required for any deploy — **not performed** |
| Preview vs persistent staging | **UNRESOLVED** |
| Domain/URL | **UNRESOLVED** — no verified URL |
| Rollback | Promote/restore prior deployment — **unproven** without prior baseline |
| Cancel / logs | Provider console — not accessed |
| Production alias impact | **UNRESOLVED** → treat as risk until proven staging-only |

```text
BLOCKED_E8_STAGING_CLIENT_PROJECT_BINDING_UNRESOLVED
```

If a future grant would modify a production domain/alias:

```text
BLOCKED_E8_STAGING_CLIENT_PRODUCTION_EXPOSURE_RISK
```

---

## 11. Rollback contract (future Case B)

| Requirement | Status |
|---|---|
| Known previous client deployment or known no-client baseline | **Incomplete** — historical docs = no dedicated staging web host; no verified prior artifact id |
| Exact rollback mechanism | Intended: restore previous Vercel deployment / remove preview — **not proven** |
| Trigger conditions | Smoke failure; wrong API base; production alias hit; secret leak; unexpected paid calls |
| Max smoke-check failure window | Propose ≤ 15 minutes to decide rollback after deploy smoke starts (operator-tunable; not live-tested) |
| Rollback evidence | Provider deployment id/URL before/after; no provider/DB change |
| No database rollback | Required |
| No provider deactivation | Required |
| No migration rollback | Required |
| Client deploy failure must not mutate ACTIVE provider | Required |

```text
BLOCKED_E8_CLIENT_DEPLOYMENT_ROLLBACK_CONTRACT_INCOMPLETE
```

---

## 12. Post-deploy smoke boundary (non-mutating only)

Permitted **after** a future authorized Case B deploy (not executed now):

1. Deployed URL returns expected VIONA client shell (`index.html` / app chrome)
2. Static assets load
3. Client-configured API origin is exactly `https://viona-api-staging-eu.fly.dev`
4. `GET {api}/health` reachable from that origin
5. Protected Local/ops mutations remain protected without auth
6. Local screen renders without submitting a request
7. No automatic Local request creation
8. No paid AI / Twilio / maps/search / booking / payment / travel provider invocation from mere page load
9. No production API endpoint traffic from the client

**Excluded (need separate authorization — E9+):** Local request submission; provider matching execution; authenticated customer mutation; payment/charge; AI runtime; external provider dispatch.

---

## 13. Customer exposure boundary

| Question | Finding |
|---|---|
| Future staging URL privacy | **UNRESOLVED** until project/domain known |
| Likely default if public Vercel URL | Publicly accessible preview/production URL unless password/SSO added |
| Production domain attachment | **UNRESOLVED** — must be proven absent |

**Recommended controls (for a future Case B grant):**

- Dedicated Vercel **staging** project or explicit non-production alias
- No production custom domain attachment
- Prefer password protection / allowlist / unlisted preview URL
- `noindex` headers/robots where applicable
- Operator-only distribution of URL
- Build env locked to staging API only

---

## 14. AI and zero-loss boundary

| Control | Status |
|---|---|
| AI runtime cost hard-stop | **NOT STARTED** |
| E8 deploy must not auto-invoke AI matching / paid LLM / Twilio / paid maps / booking / payment / travel providers | Required |
| `REQUEST_ONLY_NO_CHARGE` | Preserved |
| Deployment readiness ≠ authorization for request/match/notify/book/pay/payout | Affirmed |

---

## 15. Prerequisite matrix

| Row | Classification | Notes |
|---|---|---|
| Exact staging client target | **BLOCKED** | `BLOCKED_NO_VERIFIED_VIONA_STAGING_CLIENT_DEPLOYMENT_TARGET` |
| Deployment project binding | **BLOCKED** | `BLOCKED_E8_STAGING_CLIENT_PROJECT_BINDING_UNRESOLVED` |
| Source SHA | **VERIFIED** | `a98a3222a0a5a637088693d8fe147861210070b1` |
| Build command | **VERIFIED** | `npm run build:web` |
| Successful local build/readiness result | **VERIFIED** | `tsc` / `ci:expo-readiness` / `ci:release-discipline` / local `build:web` PASS |
| Artifact identity | **READY_WITH_OPERATOR_INPUT** | Local `dist/` exists but API base = localhost; staging rebuild required before any upload |
| Staging API base | **VERIFIED** (required value) / **READY_WITH_OPERATOR_INPUT** (build wiring) | Must be `https://viona-api-staging-eu.fly.dev` at Case B build |
| Public/server secret separation | **READY_WITH_OPERATOR_INPUT** | Code path OK; unresolved Vercel env + must prevent server secrets in bundle |
| Deployment command | **UNRESOLVED** | Not executed; exact flags/project unproven |
| Operator credential requirement | **VERIFIED** | Deploy needs provider auth (not used this session) |
| Rollback mechanism | **BLOCKED** | `BLOCKED_E8_CLIENT_DEPLOYMENT_ROLLBACK_CONTRACT_INCOMPLETE` |
| Prior deployment/baseline | **BLOCKED** | No verified prior staging client deployment |
| Non-mutating smoke checks | **VERIFIED** | Defined in §12; not executed |
| Customer exposure controls | **UNRESOLVED** | Recommend controls; not applied |
| Logging/evidence path | **VERIFIED** | This packet + `docs/design/evidence/cursor-viona-fc-p0-local-provider-authority-e8-staging-client-deployment-readiness/` |
| AI/paid-runtime exclusion | **VERIFIED** | Doctrine recorded; hard-stop not started |
| Local functional QA separation | **VERIFIED** | E9 separately gated |

---

## 16. Case decision

```text
E8_CASE_A_DOCS_ONLY_RECOMMENDED
```

**Not** `E8_CASE_B_STAGING_CLIENT_DEPLOYMENT_READY_FOR_SEPARATE_AUTHORIZATION_DECISION` — Case B gates incomplete.

**Exact blockers preventing Case B:**

1. `BLOCKED_NO_VERIFIED_VIONA_STAGING_CLIENT_DEPLOYMENT_TARGET`
2. `BLOCKED_E8_STAGING_CLIENT_PROJECT_BINDING_UNRESOLVED`
3. `BLOCKED_E8_CLIENT_DEPLOYMENT_ROLLBACK_CONTRACT_INCOMPLETE`
4. Staging-safe client artifact not yet produced (local `dist` embeds localhost API)
5. Deployment command / production-alias non-impact not verified without provider authentication
6. Customer exposure controls unresolved for any future URL

E8 execution phrase remains **NOT GRANTED**.

---

## 17. Docs output / non-touch list

**Created:**

- This packet
- `docs/design/evidence/cursor-viona-fc-p0-local-provider-authority-e8-staging-client-deployment-readiness/README.md`

**Updated when necessary:** Kernel + Handoff sync rows only.

**Not modified:** historical E6/E7/visibility/activation result docs; `src/`; `prisma/`; migrations; `scripts/`; package files; deploy configuration; environment files; runtime assets. Local `dist/` left untracked/gitignored.

---

## 18. Security

No deployment tokens, GitHub/Fly/Vercel/Supabase credentials, phone/PIN/JWT, DB URLs with credentials, full Business/User identifiers, or customer PII are printed or committed in this packet.

---

## 19. Validation summary

| Gate | Result |
|---|---|
| Docs-only diff intent | Yes |
| Zero client/API deployment | Yes |
| Zero login / provider mutation / Local request / migration | Yes |
| Provider ACTIVE baseline preserved (held) | Yes |
| Exact E8 semantics | Documented; phrase PROPOSED only |
| Prerequisite matrix | Complete |
| No invented deployment URL | Yes |
| REQUEST_ONLY_NO_CHARGE | Preserved |
| AI hard-stop | Not started |
| E8–E10 unauthorized | Yes |

---

## 20. Final classification

```text
READY_FOR_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_E8_STAGING_CLIENT_DEPLOYMENT_READINESS_AND_PREREQUISITE_PACKET_PR_REVIEW
E8_CASE_A_DOCS_ONLY_RECOMMENDED
```

Confirm:

- no client deployment occurred
- no login occurred
- no provider state changed
- no Local request was created
- no migration occurred
- E8 execution remains unauthorized
- E9–E10 remain unauthorized
- `REQUEST_ONLY_NO_CHARGE` preserved
