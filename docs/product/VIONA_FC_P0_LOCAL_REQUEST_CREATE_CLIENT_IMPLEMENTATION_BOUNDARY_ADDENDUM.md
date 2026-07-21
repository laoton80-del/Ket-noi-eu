# VIONA — FC-P0 Local Request Create Client  
## Implementation Boundary Addendum

**Operator authorization (this docs pack):** `APPROVE_VIONA_FC_P0_LOCAL_REQUEST_CREATE_CLIENT_BOUNDARY_ADDENDUM`  
**Resolves review blocker:** `BLOCKED_LOCAL_CREATE_IMPLEMENTATION_BOUNDARY_UNRESOLVED` (after PR #410)  
**Canonical master baseline:** `86fb9fba9d94cae19f37af0469263c9e05785ff2` (PR #410 squash merge)  
**Mode:** Docs-only boundary resolution — **no client implementation**  
**Future implementation phrase (still unauthorized):** `APPROVE_VIONA_FC_P0_LOCAL_REQUEST_CREATE_CLIENT`

```text
VIONA_FC_P0_LOCAL_REQUEST_CREATE_CLIENT_BOUNDARY_ADDENDUM
LOCAL_CREATE_IMPLEMENTATION_BOUNDARY_LOCKED
NO_RUNTIME_SOURCE_CHANGE
NO_DEPLOY
FC_P0_IMPLEMENTATION_STILL_UNAUTHORIZED
APPLE_EAS_PHASE_D2_DEFERRED
PACK40S_NOT_AUTHORIZED
```

---

## 1. Source inventory (inspected)

| Area | Path / symbol |
|---|---|
| Local tab host | `src/navigation/MainTabNavigator.tsx` → `TabLocal` → `LocalScreen` |
| Local hub → my requests | `src/screens/b2c/LocalScreen.tsx` → `onMyRequests={() => navigation.navigate('LocalUserRequestStatus')}` |
| Flagship tile | `src/components/viona/local/LocalHeroCardsRow.tsx` — `testID: 'local-tile-my-requests'` |
| Stack route | `App.tsx` `Stack.Screen name="LocalUserRequestStatus"` → `LocalUserRequestStatusScreen` |
| Route type | `src/navigation/routes.ts` — `LocalUserRequestStatus: undefined` |
| Status / list UI | `src/screens/b2c/LocalUserRequestStatusScreen.tsx` |
| Status UI helpers | `src/screens/b2c/localUserRequestStatusUi.ts` |
| List card | `src/components/local/LocalUserRequestStatusCard.tsx` |
| Client API (list/timeline/cancel only) | `src/services/localUserRequestApi.ts` |
| Client contract (status/wallet enums) | `src/domain/local/localServiceRequestClientContract.ts` |
| apiClient | `src/services/apiClient.ts` — `getRestApiJwt`, `restApiFetchJson` |
| Express mount | `src/app.ts` — `app.use('/api/local', localRouter)` |
| Routes | `src/routes/localRoutes.ts` — `POST /requests` |
| Auth middleware | `src/middleware/authMiddleware.ts` |
| Rate limiter | `src/middleware/localRateLimitMiddleware.ts` + `src/services/local/localRateLimitGuard.ts` (`create_request`: 30 / 60s) |
| Controller | `LocalRequestController.postCreateLocalServiceRequest` |
| Validation | `src/services/local/localRequestCreateValidation.ts` |
| Service | `src/services/local/localRequestCreateService.ts` — `createLocalServiceRequest` |
| Pilot seed (non-product) | `scripts/create-local-pilot-requests-staging.ts` |
| Create SoT tests | `scripts/test-local-request-create-source-of-truth.ts` |
| QA note (create UI limited) | `docs/qa/VIONA_LOCAL_MANUAL_DEVICE_STAGING_WALKTHROUGH_1.md` |

**Explicitly rejected as create entry (do not use):**

| Surface | Why rejected |
|---|---|
| `LocalHeroCardsRow` `onBookingAssist` → `LeonaCall` | AI assist prefill only; not LocalServiceRequest create |
| Local classifieds / VIP composer on `LocalScreen` | Classified listing / credits path; not `POST /api/local/requests` |
| `LocalMerchantRequestInbox` | Merchant B2B; confirm/reject only |
| `VionaRequestLiveInbox` | Separate VionaRequest engine; not LocalServiceRequest |
| New root stack route inventing a parallel Local create navigator | Forbidden — no new navigation architecture in FC-P0 |

---

## 2. Exact client entry surface (locked)

### Canonical host

| Field | Locked value |
|---|---|
| Screen | `LocalUserRequestStatusScreen` |
| File | `src/screens/b2c/LocalUserRequestStatusScreen.tsx` |
| Stack name | `LocalUserRequestStatus` |
| Create UI form | **In-screen create composer** rendered by this screen (or a child component owned by this screen under `src/components/local/` / `src/screens/b2c/`). **No new `Stack.Screen`.** |

### Exact reach path (existing)

1. Authenticated B2C session with Rest API base configured (`isRestApiConfigured()`).  
2. User opens Local universe via B2C tab `TabLocal` → `LocalScreen` (`MainTabNavigator.tsx`).  
   - Alternate existing alias: stack `LocalUniverse` → same `LocalScreen` (`App.tsx`).  
3. User presses flagship **My requests** tile (`local-tile-my-requests`) → `navigation.navigate('LocalUserRequestStatus')`.  
4. On `LocalUserRequestStatusScreen`, user presses the **create** CTA (to be added in implementation) → opens the in-screen create composer (`IDLE`).

### User action that opens create flow

Exactly one: press **Create Local request** control on `LocalUserRequestStatusScreen` (implementation adds this control; empty-state and/or top action row — both still on this same screen).

### Required preceding context

| Context | Rule |
|---|---|
| Authenticated user | Session JWT present in `STORAGE_KEYS.restApiJwt` via `getRestApiJwt()`; else `AUTH_REQUIRED_OR_EXPIRED` |
| Selected business/provider | User supplies valid `businessId` (UUID string) on the create form. **Merchant catalog discovery is out of scope for FC-P0.** Server returns `404` `business_not_found` if unknown. Pilot/staging may use known Business rows (see staging pilot script IDs — not hardcoded into product as secrets). |
| Service type | User selects one `LocalServiceType` wire value on the form (required). |
| Title | User enters non-empty title (required). |
| Optional service | Optional `serviceId` if known; server validates business match. |

### Visibility rule

- Create CTA visible on `LocalUserRequestStatusScreen` when the screen is mounted for a B2C consumer session.  
- If Rest API not configured → show existing load error pattern; create submit disabled.  
- Not mounted behind B2B-only wrappers (unlike `LocalMerchantRequestInbox`).

### B2C role boundary

- Consumer requester only.  
- Server enforces `self_request_forbidden` when `requesterUserId === business.ownerId` → client maps to validation/error state.  
- Do not add merchant confirm/reject UI to this flow.

### Destination after successful creation (exactly one)

**Remain on `LocalUserRequestStatusScreen`:** refresh the user request list, then expand the created request row (timeline may load on expand).  
**Do not** navigate to Leona, Home, merchant inbox, or a new detail route (no dedicated Local request detail stack screen exists).

---

## 3. Exact server endpoint and middleware

| Field | Value |
|---|---|
| Method / path | `POST /api/local/requests` |
| Mount | `src/app.ts` → `app.use('/api/local', localRouter)` |
| Route file | `src/routes/localRoutes.ts` |
| Middleware order | (1) `localRouter.use(authMiddleware)` → (2) `createLocalMutationRateLimiter('create_request')` → (3) `LocalRequestController.postCreateLocalServiceRequest` |
| Controller | `postCreateLocalServiceRequest` |
| Service | `createLocalServiceRequest` |
| Validation helpers | `findDangerousLocalRequestCreateBodyKeys`, `parseLocalServiceType`, `parseLocalRequestSource`, `parseBizType`, `parseMetadataJson`, `parseIsoDate` |
| Success HTTP | **201** via `jsonOk(res, result.request, 201)` |
| Envelope | `{ success: true, data: <request> }` / `{ success: false, error: string }` (`src/utils/apiEnvelope.ts`) |

### Success `data` shape (service → controller)

From `CreateLocalServiceRequestResult` ok branch:

- `id`, `requesterUserId`, `businessId`, `serviceId`, `serviceType`, `title`, `status`, `walletMode`, `walletPhase`
- `totalVioCredits`, `heldVioCredits`, `releasedVioCredits`, `platformFeeVioCredits`, `providerEarningsVioCredits` (null on no-charge create)
- `message`: `LOCAL_REQUEST_CREATE_SUCCESS_MESSAGE` = `'Request submitted for merchant review.'`

Server sets `walletMode: REQUEST_ONLY_NO_CHARGE`, `walletPhase: NONE`, `status: REQUESTED`.

### Availability claim

Endpoint is **mounted in the Express app source**. This addendum does **not** claim staging/production live availability beyond existing Local pilot/QA docs.

---

## 4. Exact create DTO (from controller + validation + service)

### Required client fields

| Field | Wire type | Validation |
|---|---|---|
| `businessId` | string | Non-empty after trim; must exist as `Business.id` |
| `serviceType` | string enum | Must parse via `parseLocalServiceType` → `LocalServiceType` |
| `title` | string | Non-empty after trim |

`source` is **required for FC-P0 client** even though server defaults omitted/`null` body key to `API_DIRECT`: the locked client **must send** `source: "LOCAL_SCREEN"`.

### Accepted `serviceType` values (`LocalServiceType`)

`SERVICE_MENU` | `FIXER_HIRE` | `GENERIC_REQUEST` | `LEGAL_INTAKE` | `CLASSIFIED_LEAD`

### Accepted `source` values (`LocalRequestSource`)

`LOCAL_SCREEN` | `FIXER_CHECKOUT` | `LEONA_ASSIST` | `LEGAL_SCAN` | `ADMIN_SEED` | `API_DIRECT`  

**FC-P0 client fixed value:** `LOCAL_SCREEN` only.

### Optional client fields (only if present in controller)

| Field | Rule |
|---|---|
| `serviceId` | Optional non-empty string; must belong to `businessId` |
| `fixerProfileKey` | Optional non-empty string |
| `category` | Optional; if present must be `BizType`: `HOTEL` \| `HOMESTAY` \| `TOUR_OPERATOR` \| `LOCAL_EXPERIENCE` \| `RESTAURANT` \| `TRANSPORT` |
| `description` | Optional string (trimmed); server stores `''` if omitted |
| `locationText`, `city`, `countryCode` | Optional trimmed strings |
| `scheduledStartAt`, `scheduledEndAt` | Optional ISO-8601 instant strings; invalid → 400 |
| `metadata` | Optional JSON object; arrays/non-objects → 400 |

### Defaults / nullability

| Field | Default |
|---|---|
| `source` omitted on server | `API_DIRECT` — **FC-P0 client must not omit; sends `LOCAL_SCREEN`** |
| `category` omitted | undefined (allowed) |
| `description` omitted | stored as `''` |
| Wallet / status | Server-only defaults (`REQUEST_ONLY_NO_CHARGE`, `NONE`, `REQUESTED`) |

### String limits

Controller/service enforce non-empty trim for required strings; **no additional max-length constant** found in create validation. Client should apply a reasonable UI max consistent with existing Local forms without inventing a new server limit.

### Forbidden client keys (`DANGEROUS_LOCAL_REQUEST_CREATE_BODY_KEYS`)

Any of these in the body → **400** (`Request-only create does not accept: …`):

`status`, `walletMode`, `walletPhase`, credit/settlement amount fields, merchant/user cancel timestamps, `requesterUserId`, `assignedProviderUserId`, `legacyBookingId`, `cancelReason`, `rejectReason`, `cancelledByRole`, etc. (full list in `localRequestCreateValidation.ts`).

### Server-derived (never client-authoritative)

`requesterUserId` (from JWT), `status`, `walletMode`, `walletPhase`, ledger amounts, merchant decision fields, audit events.

**Controller / validator / service agreement:** Required identity fields and dangerous-key rejection are consistent. No `BLOCKED_LOCAL_CREATE_DTO_CONTRADICTION`.

---

## 5. Authentication chain (locked)

### Client

1. `restApiFetchJson` in `src/services/apiClient.ts`.  
2. JWT only from `getRestApiJwt()` → `AsyncStorage` `STORAGE_KEYS.restApiJwt`.  
3. **No** `EXPO_PUBLIC_DEV_REST_JWT` (removed; comments forbid public env bearer fallbacks).  
4. Authorization header set **only if** JWT non-empty; otherwise request has no Bearer → server **401**.  
5. Unauthenticated create: client enters `AUTH_REQUIRED_OR_EXPIRED` and routes to existing auth entry (`Login` / session restore) or shows auth-required UI — **no new auth mechanism**.

### Server

1. `authMiddleware` verifies Bearer JWT with `JWT_SECRET`, sets `req.authUserId = sub`.  
2. `readAuthUserId(req)` in controller reads `req.authUserId`.  
3. Passed to `createLocalServiceRequest({ requesterUserId, ... })`.  
4. Client DTO must never include `requesterUserId` (dangerous key).

---

## 6. UI state machine (locked)

| State | UI message | Fields editable | Submit enabled | Retry | Navigate | List refresh |
|---|---|---|---|---|---|---|
| `IDLE` | None / composer ready | Yes | Yes (if required fields valid) | — | No | No |
| `VALIDATION_ERROR` | Client-side field errors (localized) | Yes | No until fixed | Correct fields | No | No |
| `SUBMITTING` | Accessible loading indicator | No | **No** | No | No | No |
| `CREATED_SUCCESS` | Success using server `message` or localized equivalent | Composer may close | No (until new create) | — | **Stay on screen** | **Yes** then expand created id |
| `AUTH_REQUIRED_OR_EXPIRED` | Auth required / session expired | Yes | No | After re-auth | To existing Login flow if needed | No |
| `RATE_LIMITED` | Safe localized rate-limit copy (map 429) | Yes | After cool-down | Manual | No | No |
| `SERVER_VALIDATION_ERROR` | Safe localized map of 400 reasons | Yes | Yes after edit | Manual | No | No |
| `NETWORK_RESULT_UNKNOWN` | Explicit unknown-result copy | Yes | **No auto**; see §7 | Manual only after policy | No | **Yes** (inspect match) |
| `SERVER_ERROR` | Generic server error (5xx) | Yes | Manual retry allowed | Manual | No | No |

Accessible loading and error feedback required (ActivityIndicator / labels consistent with existing Local status screen patterns).

---

## 7. Duplicate-submit / idempotency policy (locked)

**Verified from source:**

- Rate limiter: `createLocalMutationRateLimiter('create_request')` — **30 attempts / 60_000 ms** per authenticated user (`localRateLimitGuard.ts`).  
- **No** idempotency key in `postCreateLocalServiceRequest` or create service.

**FC-P0 client rules:**

1. Server rate limiting is **abuse protection**, not transactional idempotency.  
2. Only **one** create POST may be in flight (`SUBMITTING`).  
3. Submit control **disabled** while `SUBMITTING`.  
4. Repeated taps while `SUBMITTING` must **not** enqueue additional POSTs.  
5. `restApiFetchJson` / create adapter must **not** auto-retry POST create.  
6. Timeout / disconnect after POST → `NETWORK_RESULT_UNKNOWN` (`unreachable: true` or status `0`).  
7. In `NETWORK_RESULT_UNKNOWN`:  
   - do **not** silently POST again;  
   - refresh user request list via `fetchUserLocalServiceRequests`;  
   - if a matching new request is visible (same title + businessId + recent `createdAt` / returned id if any), treat as likely success and expand it;  
   - otherwise show explicit user choice before any **manual** resubmit.  
8. **No** DB idempotency key, schema change, or migration in FC-P0.

---

## 8. Post-create refresh / navigation (locked — one sequence)

1. Receive `ApiRequestResult` ok with `status === 201` and `data.id`.  
2. Retain `createdRequestId = data.id` in create-flow state.  
3. Call existing `fetchUserLocalServiceRequests()` (same as screen `load`).  
4. Update list state with returned rows (same mapping as today: `attachLocalUserRequestActions`).  
5. Set `expandedId` to `createdRequestId` (optional timeline fetch via existing `loadTimeline`).  
6. Transition to `CREATED_SUCCESS`; close or reset composer to `IDLE` for a subsequent create.

### Refresh failure after successful create

- Do **not** report create as failed.  
- Keep `createdRequestId` + success response.  
- Show refresh warning; offer manual reopen/refresh of the list.  
- Do **not** send another create POST.

---

## 9. Error mapping

| Outcome | Client state | Notes |
|---|---|---|
| 201 + envelope success | `CREATED_SUCCESS` | Canonical create success |
| 400 dangerous keys / invalid fields / self_request / service mismatch | `SERVER_VALIDATION_ERROR` or `VALIDATION_ERROR` | Prefer **safe localized** messages; do not dump raw server strings when unsafe |
| 401 | `AUTH_REQUIRED_OR_EXPIRED` | Missing/invalid JWT |
| 404 business/service not found | `SERVER_VALIDATION_ERROR` | |
| 429 | `RATE_LIMITED` | `LOCAL_RATE_LIMIT_TOO_MANY_MESSAGE` |
| 500 / other 5xx | `SERVER_ERROR` | Generic copy |
| Network / status 0 / `unreachable` | `NETWORK_RESULT_UNKNOWN` | Per §7 |
| **409** | **Not used** | Create route does not return 409 — do not claim |
| **403** | **Not used on create** | authMiddleware uses 401; do not claim 403 for create |

---

## 10. Allowed future implementation scope (paths)

Implementation remains **unauthorized** until a separate phrase. When authorized, allowed files/categories:

| Category | Candidate paths |
|---|---|
| Host screen | `src/screens/b2c/LocalUserRequestStatusScreen.tsx` |
| Create composer UI | `src/components/local/*Create*` or `src/screens/b2c/*Create*` child of status screen |
| API adapter | `src/services/localUserRequestApi.ts` — add `createUserLocalServiceRequest` |
| Client DTO/types | Prefer extend `src/domain/local/localServiceRequestClientContract.ts` and/or types colocated with API — **no Prisma import on mobile** |
| State helper/hook | Optional under `src/screens/b2c/` or `src/hooks/` scoped to Local create |
| i18n keys | Existing Local i18n modules only as needed |
| Focused tests | New/focused scripts or unit tests for create client mapping/states (implementation pack) |
| Evidence + Kernel + Handoff | Docs only after implementation |

---

## 11. Explicit non-goals

FC-P0 implementation must **not** include:

payment collection; Stripe; wallet settlement; VIO ledger changes; merchant confirm/reject; status-machine expansion; provider dispatch; expiry scheduler; notifications; ratings/disputes; AI/Leona integration for create; Local monetization changes; schema/migrations/seeds; new backend create endpoint; new auth mechanism; admin tooling; Pack40 recovery; Pack40S; deploy; Apple Developer; EAS iOS; Phase D2; business discovery catalog; changing `onBookingAssist` → Leona behavior; classifieds VIP path.

**Preserve** `REQUEST_ONLY_NO_CHARGE` pilot commercial boundary.

---

## 12. Required tests (future implementation)

1. Canonical create DTO mapping (required + optional + forbidden keys).  
2. Session JWT via `getRestApiJwt` / `restApiFetchJson`.  
3. No Authorization header without token.  
4. Required-field client validation.  
5. Submit disabled during in-flight POST.  
6. Double-tap → one POST.  
7. No automatic POST retry.  
8. Success 201 handling.  
9. Post-create list refresh.  
10. Refresh failure after success.  
11. 401 behavior.  
12. 429 behavior.  
13. Backend validation error behavior.  
14. `NETWORK_RESULT_UNKNOWN` behavior.  
15. Generic 5xx.  
16. List/timeline/cancel unchanged.  
17. Mobile no-Prisma gate green.  
18. Root TypeScript + Local gates; preserve Modern Home A/B/C, SOS, Profile/Language, `ci:expo-readiness`, `ci:release-discipline`.

---

## 13. Deployment boundary

**`IMPLEMENTATION_ONLY_NO_DEPLOY`**

May: bounded client source, focused tests, PR, local/read-only CI.  
Must not: staging/production deploy, migrations, create staging users/requests, live QA.  

Staging deploy + live Local create QA require **separate** operator authorization after merge.

---

## 14. Remaining risks

| Risk | Severity | Mitigation in boundary |
|---|---|---|
| No merchant discovery UI | FEATURE_COMPLETE later | `businessId` manual/pilot-known; catalog = later pack |
| No server idempotency key | Duplicate rows on blind retry | Client in-flight lock + NETWORK_RESULT_UNKNOWN policy |
| In-memory rate limit not multi-instance | Ops | Documented; out of FC-P0 |
| Pre-existing Functions TSC debt | Unrelated | Do not fix in FC-P0 |

---

## 15. Authorization phrases

| Phrase | Status |
|---|---|
| `APPROVE_VIONA_FC_P0_LOCAL_REQUEST_CREATE_CLIENT_BOUNDARY_ADDENDUM` | **This pack** |
| `APPROVE_VIONA_FC_P0_LOCAL_REQUEST_CREATE_CLIENT` | **Unauthorized** until this addendum is reviewed, merged, and post-merge verified |

---

## 16. Validation (read-only, this docs pack)

| Gate | Result |
|---|---|
| `npm run ci:expo-readiness` | **PASS** |
| `npm run ci:release-discipline` | **PASS** |
| Pre-existing Functions TypeScript debt | **Recorded separately** — not fixed |
| Runtime / `src/**` / deploy | **Unchanged** |

## 17. Final classification (this docs pack)

`READY_TO_MERGE_VIONA_FC_P0_LOCAL_REQUEST_CREATE_CLIENT_BOUNDARY_ADDENDUM`
