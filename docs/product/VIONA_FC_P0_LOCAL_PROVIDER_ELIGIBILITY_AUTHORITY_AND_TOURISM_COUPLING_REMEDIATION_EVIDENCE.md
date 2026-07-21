# VIONA — FC-P0 Local Create  
## Local Provider Eligibility Authority and Tourism Coupling Remediation Evidence

**Operator authorization:** `APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_ELIGIBILITY_AUTHORITY_AND_TOURISM_COUPLING_REMEDIATION`  
**Mode:** `IMPLEMENTATION_ONLY_NO_DEPLOY`  
**Path:** **Path 2 — safe containment**  
**Primary classification:** `READY_FOR_VIONA_LOCAL_TOURISM_COUPLING_CONTAINMENT_PR_REVIEW_WITH_FC_P0_STILL_BLOCKED`

```text
VIONA_FC_P0_LOCAL_PROVIDER_ELIGIBILITY_AUTHORITY
PATH_2_SAFE_CONTAINMENT
TOURISM_COUPLING_REMOVED
NO_CANONICAL_LOCAL_PROVIDER_ELIGIBILITY_AUTHORITY
RAW_UUID_REMOVAL_PRESERVED
SUBMIT_GUARD_PRESERVED
FC_P0_STILL_BLOCKED
IMPLEMENTATION_ONLY_NO_DEPLOY
REQUEST_ONLY_NO_CHARGE_PRESERVED
PACK40S_NOT_AUTHORIZED
APPLE_EAS_PHASE_D2_DEFERRED
```

---

## 1. Canonical baseline

| Field | Value |
|---|---|
| Canonical root | `C:\KNG\ket-noi-eu` |
| `origin/master` (pack start) | `8bc568b0404981d19c9e9579646acac0af276af6` |
| PR #413 squash merge | `8bc568b` |
| Reviewed PR #413 head | `72771f42fddcefa8f3f9e9b210124f16b7428b1d` |
| Branch | `feat/viona-fc-p0-local-provider-eligibility-tourism-coupling-remediation` |

---

## 2. Gate A — Tourism coupling removal

| Check | Result |
|---|---|
| Local create imports `viGlobalTourismApi` / `fetchTourismDiscover` | **Removed** |
| `mapTourismDiscoverToLocalCreateOptions` | **Removed** |
| Runtime call to `GET /api/tourism/discover` from Local create | **None** |
| Tourism route `/discover` itself | **Unchanged** (Travel only) |
| Hotels / tours / restaurants presented as Local providers | **Stopped** |

---

## 3. Gate B — Local provider-source inventory

| Candidate | Classification |
|---|---|
| `GET /api/tourism/discover` | `BUSINESS_ID_ONLY_NO_LOCAL_ELIGIBILITY` (rejected) |
| `createLocalServiceRequest` existence check | `BUSINESS_ID_ONLY_NO_LOCAL_ELIGIBILITY` |
| `GET /api/local/requests` history | `PARTIAL_LOCAL_PROVIDER_SIGNAL` (not first-time authority) |
| Merchant Local inbox | `MERCHANT_PRIVATE_SOURCE` |
| Ops Local list | `MERCHANT_PRIVATE_SOURCE` |
| Prisma `Business` (no Local eligibility field) | `REQUIRES_BROADER_BACKEND_SCOPE` |
| LocalScreen classifieds / fixer / B2B2C fixtures | `MOCK_OR_FIXTURE_SOURCE` |
| `localRoutes` (no provider GET) | `UNMOUNTED_OR_INACTIVE_SOURCE` (as catalog) |
| Role/KYC/ranking | `PARTIAL_LOCAL_PROVIDER_SIGNAL` |

**Verdict:** `NO_CANONICAL_LOCAL_PROVIDER_ELIGIBILITY_AUTHORITY`  
**No candidate classified** `VALID_LOCAL_PROVIDER_AUTHORITY`.

---

## 4. Path 2 — containment behavior

Default loader `loadLocalCreateBusinessOptions()` returns:

- `status: PROVIDER_SELECTION_UNAVAILABLE`
- `options: []`

Composer:

- Shows localized “Provider selection is not available yet.”
- Submit disabled; no POST without eligible selection
- No UUID TextInput / paste instructions
- No history-as-authority fallback
- No hardcoded / seed business ids
- Title / description / service-type draft still editable
- List / timeline / cancel unchanged
- Provider-source states kept separate from create-result states

---

## 5. Preserved green fixes from PR #413

| Fix | Status |
|---|---|
| Raw UUID consumer UX removed | **Preserved** |
| `runLocalCreateSubmit` sets `inFlight` before JWT await | **Preserved** |
| Executed DI guard/auth/mapping tests | **Preserved** |
| `POST /api/local/requests` + `source: LOCAL_SCREEN` | **Preserved** |
| Nine create UI states | **Preserved** |

---

## 6. Service-type compatibility

No Local provider authority exposes supported service types.  
Canonical server-accepted chips remain; UI does **not** claim per-provider compatibility.  
Tourism categories are **not** used as Local eligibility.

---

## 7. Minimal future Local provider eligibility authority (docs only)

| Item | Recommendation |
|---|---|
| Authority owner | Local universe product + backend Local services |
| Eligibility rule | Explicit Local opt-in / activation / published listing (not BizType alone) |
| Active/public visibility | B2C-visible + not suspended/disabled when those fields exist |
| Minimum DTO | `{ businessId, displayName, optional categoryLabel, optional serviceTypes[] }` |
| B2C route | e.g. `GET /api/local/providers` (future pack — **not implemented here**) |
| Pagination | Cursor or limit/skip; honest empty vs error |
| Filtering | Only Local-eligible + public |
| Provider/service compatibility | Optional `serviceTypes`; if absent, do not claim full matrix |
| Privacy | No owner, payment, settlement, scores, secrets |
| Staging data | Seed Local-eligible businesses separately from Tourism hub data |
| Tests | Zero-history load; filter ineligible; no Tourism import; submit guard |
| Non-goals | Broad marketplace catalog; Tourism coupling; UUID paste UX; schema in this pack |

---

## 8. Exact changed paths

- `src/services/local/localCreateBusinessSource.ts`
- `src/services/local/localCreateBusinessOptionModel.ts`
- `src/components/local/LocalUserRequestCreateComposer.tsx`
- `src/i18n/locales/en.json` / `vi.json`
- `scripts/test-local-user-request-create-client.ts`
- `docs/product/VIONA_FC_P0_LOCAL_PROVIDER_ELIGIBILITY_AUTHORITY_AND_TOURISM_COUPLING_REMEDIATION_EVIDENCE.md`
- `docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md`
- `Handoff_VIONA11726.txt`

---

## 9. Behavioral tests / regression gates

```text
npx tsx scripts/test-local-user-request-create-client.ts → OK
```

Covers: Tourism absence, containment status, no POST without authority, UUID absence, submit guard (1 JWT + 1 POST), auth header rules, HTTP mappings, EN/VI alignment, Prisma-free graph.

Also: client-contract, status-ui, list, timeline, cancel → OK; `tsc --noEmit` → PASS.

| Gate | Result |
|---|---|
| `ci:expo-readiness` | **PASS** |
| `ci:release-discipline` | **PASS** |
| Functions TSC debt | Recorded — not fixed |

---

## 10. Confirmations

- No backend/schema/payment/wallet/AI/Pack40 changes  
- No deploy / no live Local request  
- `REQUEST_ONLY_NO_CHARGE` preserved  
- Phase C closed green; Pack40S unauthorized; Apple/EAS/Phase D2 deferred  
- **FC-P0 Local create remains BLOCKED** until a valid Local provider eligibility authority pack is authorized and wired  

---

## 11. Next operator action

Strict read-only review of this containment PR.  
Do not merge as “FC-P0 closed.”  
Do not authorize staging/live Local create QA.  
After merge (if accepted), authorize a **separate minimal Local provider eligibility authority** pack (docs already sketched above).

## 12. Final classification

`READY_FOR_VIONA_LOCAL_TOURISM_COUPLING_CONTAINMENT_PR_REVIEW_WITH_FC_P0_STILL_BLOCKED`
