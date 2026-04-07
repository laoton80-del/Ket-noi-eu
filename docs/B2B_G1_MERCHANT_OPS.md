# B2B Step G1 — merchant/staff queue productionization

This pass adds a **server-authoritative** read path for the staff queue and documents how tenant scope should bind to **Firebase Auth custom claims** — without pretending there is full enterprise RBAC.

## Intended production direction

1. Staff users sign in with Firebase Auth (today often the same anonymous/session model as wallet; **future** may be email/password or SSO for merchant consoles).
2. An operator uses the **Firebase Admin SDK** to set custom claims on that user:

   ```bash
   npm run b2b:g1-set-claims -- <firebaseUid> <tenantId>
   ```

   Claim name: **`b2bTenantId`** (string). See `src/config/b2bMerchantAccess.ts`.

3. The app calls **`GET {EXPO_PUBLIC_BACKEND_API_BASE}/b2bStaffQueueSnapshot`** with header `Authorization: Bearer <Firebase ID token>`.
4. **Cloud Function `b2bStaffQueueSnapshot`** verifies the token, reads **`b2bTenantId` from the decoded token only**, then reads Firestore with the **Admin SDK**. The client **must not** send `tenantId` in the query/body for tenant binding (a `limit` query param is allowed).

This removes dependence on “whatever Firestore rules happen to allow” for the **preferred** path, as long as the function is deployed and the token has the claim.

## Client configuration (Expo)

| Variable | Effect |
|----------|--------|
| `EXPO_PUBLIC_B2B_STAFF_QUEUE_PREFER_HTTPS=1` | Try HTTPS snapshot **before** legacy Firestore client reads. |
| `EXPO_PUBLIC_B2B_FIRESTORE_QUEUE_FALLBACK=1` | **G2:** When HTTPS is preferred and the snapshot call **fails**, allow legacy Firestore reads **only** if this is exactly `1` and `EXPO_PUBLIC_B2B_DEV_TENANT_ID` is set. Unset/`0` = no fallback (avoids masking HTTPS/claim issues). |
| `EXPO_PUBLIC_B2B_DEV_TENANT_ID` | Legacy **dev** tenant for direct Firestore reads (still not the long-term merchant model). |

## Deploy URL

After deploy, the HTTPS name is **`b2bStaffQueueSnapshot`** (Gen2, region `europe-west1` in source). Exact URL follows your Firebase project host pattern, e.g.:

`https://europe-west1-<PROJECT_ID>.cloudfunctions.net/b2bStaffQueueSnapshot`

Use the same base as `EXPO_PUBLIC_BACKEND_API_BASE` (where `walletOps` / `aiProxy` live).

**G2:** HTTPS failure → Firestore fallback semantics are stricter; see **`docs/G2_RUNTIME_TRUST.md`**.

## Optional App Check

If `FIREBASE_APP_CHECK_ENFORCE=1`, send `X-Firebase-AppCheck` on this endpoint the same way as `walletOps` (see `docs/PILOT_TRUST_ENV.md`).

## Proof / verification

1. **Firestore + fixtures (existing):** from `functions/`:

   ```bash
   B2B_VERIFY_TENANT_ID=<tenant> node scripts/b2b-phase32-verify.cjs --inject-fixture
   ```

2. **HTTP queue (optional):** obtain a Firebase **ID token** for a user that has `b2bTenantId` set, then:

   ```bash
   export B2B_STAFF_QUEUE_URL=https://europe-west1-PROJECT.cloudfunctions.net/b2bStaffQueueSnapshot
   export B2B_STAFF_QUEUE_BEARER=<idToken>
   B2B_VERIFY_TENANT_ID=<tenant> node scripts/b2b-phase32-verify.cjs
   ```

   The script prints `[G1 staff queue HTTP]` when both env vars are set.

## Honest limits

- This is **not** a full merchant dashboard, role matrix, or audit log product.
- **Anonymous** wallet users can receive `b2bTenantId` claims for **dev/staging** only; production merchant consoles should use an explicit staff identity policy you define operationally.
