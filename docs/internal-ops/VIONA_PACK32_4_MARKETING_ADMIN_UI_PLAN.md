# Pack32.4 — Marketing Admin Dashboard UI Integration (Planning Packet, Docs-Only)

**Operator phrase:** `APPROVE_PACK32_4_MARKETING_ADMIN_UI_PLANNING` — provided this session.
**Status:** Design plan only. **No `.ts`/`.tsx` (React/React Native) code written in this packet.**
**Predecessor:** PR #315 (Pack32.3 implementation — `POST /api/admin/marketing/generate-draft`).
**Baseline:** `origin/master @ 41098fe`.

---

## 1. Goal

Give an authenticated `Role.ADMIN` operator a UI to call the existing, unmodified
`POST /api/admin/marketing/generate-draft` (Pack32.3, PR #315) directly from the app, instead of
only from a script/console call. Scope is strictly: **render a form → call the API → show the
returned draft as read-only text.** No publish/share action of any kind.

---

## 2. Frontend architecture survey (mandatory boundary — "khảo sát nhanh")

This repo is an **Expo + React Native (+ web via `react-native-web`) app** — not plain React,
not Next.js, no file-based routing (`expo-router` is not used). Navigation is
`@react-navigation/native` (native-stack), route names declared in `src/navigation/routes.ts`,
stacks registered in `App.tsx`.

**Admin UI already exists on the frontend** (not backend-only):

| Layer | Path | Relevance |
|---|---|---|
| Existing marketing screen | `src/screens/admin/MarketingApprovalScreen.tsx` | Lists/edits/approves/publishes `MarketingPost` DRAFT rows — the natural home for this new component |
| Admin hub | `src/screens/admin/AdminDashboardScreen.tsx` | Already has a nav card into `MarketingApproval` |
| Admin API wrappers | `src/services/viGlobalAdminApi.ts` | Existing `fetchAdminMarketingPosts`, `putMarketingPost`, `publishAdminMarketingPost`, `postAdminMarketingApproveAndTranslate`, `deleteAdminMarketingDraft`, `triggerAdminMarketingDraft` — stops short of the new Pack32.3 endpoint (no wrapper for it yet) |
| Shared fetch client | `src/services/apiClient.ts` (`restApiFetchJson`) | Attaches JWT, base URL, returns a discriminated `ApiRequestResult<T>` — used by every admin screen |
| Component library | `src/components/ui/*` (`AppStateView`, `Skeleton`/`ScreenSkeleton`, `GlassCard`, `NeonCard`), `src/components/AppButton.tsx`, `src/components/viona/VionaButton.tsx` | No generic `Form`/`Input` wrapper exists anywhere in the repo — every screen, including `MarketingApprovalScreen` itself, uses raw React Native `TextInput`/`Pressable` directly |

**Key finding:** `MarketingApprovalScreen.tsx` itself does **not** use `AppButton`/`GlassCard` — it
uses raw RN primitives (`View`, `Text`, `TextInput`, `Pressable`, `ActivityIndicator`,
`SafeAreaView`, `ScrollView`) plus the shared `theme` object and `StyleSheet.create`, with
`Alert.alert` for errors and `formatNetworkFailureMessage()`/`isRestApiConfigured()` from
`apiClient.ts`. **Design decision: match the host screen's existing style exactly**, rather than
introducing `AppButton`/`GlassCard` into a file that doesn't otherwise use them — this maximizes
visual/code consistency with the *immediate* surrounding screen, which is a stronger form of
"reuse existing shared components" than reusing a component the host screen itself avoids.

**No new UI library dependency of any kind is proposed** — satisfies mandatory boundary #2
verbatim (no Tailwind, no Bootstrap, no Material UI, no `native-base`, no new form library).

---

## 3. Integration point decision

**Decision: embed a new, self-contained component at the top of the existing
`MarketingApprovalScreen.tsx`, rather than create a new screen + new navigation route.**

Rationale:

- `MarketingApprovalScreen` is already the exact screen where a human reviews/approves/publishes
  `MarketingPost` DRAFT rows — a newly generated draft belongs in the same list the operator is
  already looking at, one scroll away.
- Avoids any change to `src/navigation/routes.ts` or `App.tsx`'s `Stack.Screen` registration —
  smaller, more auditable diff; zero new navigation surface to gate/deep-link/test.
- The screen is already reachable only through the existing admin-debug gating chain
  (`isAdminDebugSurfaceEnabled()` build-time gate → 5-tap Home secret / dev PIN → `AdminDashboard`
  → "AI Social Media Desk" nav card → `MarketingApproval`) — the new component inherits that
  gating automatically, with zero new frontend gating logic required. Server-side, the API call
  itself is still fully protected by the existing, unmodified `authMiddleware` +
  `superAdminMiddleware` (Pack32.3) regardless of any frontend gate.

---

## 4. Component design — `AdminMarketingDraftGenerator`

**New file:** `src/components/admin/AdminMarketingDraftGenerator.tsx` — a self-contained,
presentational component with its own local state (no new global/zustand store).

### 4.1 Props

```typescript
export type AdminMarketingDraftGeneratorProps = Readonly<{
  /** Called after a draft is successfully generated, so the host screen can refresh its list. */
  onDraftGenerated?: (marketingPostId: string) => void;
}>;
```

### 4.2 Internal state

- `topic: string`, `tone: string`, `targetLanguageCode: string` — controlled `TextInput` values.
- `submitting: boolean` — disables the submit control and shows `ActivityIndicator` while the
  request is in flight (mirrors `MarketingApprovalScreen`'s `loading` pattern).
- `result: { content: string; toolName: string; confidence: number } | null` — last successful
  draft, rendered read-only below the form.
- `errorMessage: string | null` — last failure, rendered inline (in addition to/instead of
  `Alert.alert`, TBD at implementation time to match the host screen's own error UX exactly).

### 4.3 Render structure (READ → DISPLAY, never PUBLISH — mandatory boundary #3)

```
┌ Card/section (no new Card component — plain View + StyleSheet, matching host screen) ─────┐
│  Title: "AI Draft Generator" (or Vietnamese equivalent, matching screen's existing copy)   │
│  TextInput  — Topic          (single-line, required)                                      │
│  TextInput  — Tone           (single-line, required)                                      │
│  TextInput  — Target language code (single-line, required — e.g. "vi", "cs", "de")        │
│  Pressable  — "Generate Draft" (disabled while submitting; client-side validation blocks   │
│               submit if any field is empty, mirroring the server's own 400 rule)           │
│  [if submitting] ActivityIndicator                                                        │
│  [if errorMessage] Text (error, styled like existing error text in the host screen)        │
│  [if result]                                                                                │
│    TextInput  — multiline, `editable={false}`, value = result.content   ← READ-ONLY ONLY   │
│    Text — small caption: tool name + confidence (transparency, non-interactive)             │
│    Text — hint: "Scroll down to review, edit, approve, or publish this draft below."       │
│    NO "Publish" button. NO "Share to Facebook" button. NO auto-scroll-and-publish action.  │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Explicit exclusion (mandatory boundary #3):** this component never renders a control that maps
to `publishAdminMarketingPost()`/`postMarketingPostPublish` or any social-platform action. The
*only* way a generated draft can ever become public is via the existing, unmodified controls
already rendered further down `MarketingApprovalScreen` for every DRAFT row (including this new
one, once the list refreshes).

### 4.4 Data flow

```
User fills {topic, tone, targetLanguageCode} → taps "Generate Draft"
  │
  ▼
Client-side validation (all 3 non-empty after trim) — mirrors the server's own 400 rule so the
   common case never round-trips to the server just to fail
  │
  ▼
setSubmitting(true) → postAdminMarketingGenerateDraft({ topic, tone, targetLanguageCode })
   (NEW wrapper in viGlobalAdminApi.ts, calling the EXISTING, UNMODIFIED
   POST /api/admin/marketing/generate-draft via the EXISTING, UNMODIFIED restApiFetchJson)
  │
  ▼
res.ok === true  → setResult({ content, toolName, confidence }); onDraftGenerated?.(marketingPostId)
res.ok === false → setErrorMessage(res.error)  (the exact string the server returned — 400/422/502
   messages already documented in the Pack32.3 plan, never re-interpreted or hidden)
  │
  ▼
setSubmitting(false)
```

`onDraftGenerated` is wired, at the host-screen integration point, to the screen's own existing
`loadDrafts()` function (already used after every edit/approve/delete action) — so the new draft
appears in the list below without any new list-fetching logic being written.

---

## 5. Explicit non-modification / non-publish boundaries (mandatory boundaries #2, #3, #4)

- **No new UI library dependency** — `package.json` diff must be **empty**.
- **No backend file touched** — `AdminMarketingController.ts`, `adminRoutes.ts`, and every
  Pack32.1/Pack32.3 service/middleware file must show a **0-line diff** vs `origin/master`. This
  is a **frontend-only** pack; it consumes the Pack32.3 endpoint exactly as documented, never
  changes it.
- **No publish/share control** — the new component must never import
  `publishAdminMarketingPost`/`postAdminMarketingApproveAndTranslate` or reference
  Facebook/TikTok in any string, label, or comment.
- **Read-only result rendering** — the generated-content field must be non-editable
  (`editable={false}` if implemented as a `TextInput`, or a plain `Text` node) so it cannot be
  mistaken for the *separate*, pre-existing, already-editable per-draft field in the list below.

---

## 6. File allowlist (future implementation pack)

| # | File | Change | Purpose |
|---|---|---|---|
| 1 | `src/services/viGlobalAdminApi.ts` | MODIFY (additive) | New `postAdminMarketingGenerateDraft(input)` wrapper + `AdminMarketingGenerateDraftInput`/`...Payload` DTO types, calling the existing, unmodified `restApiFetchJson('/api/admin/marketing/generate-draft', { method: 'POST', body: input })` |
| 2 | `src/components/admin/AdminMarketingDraftGenerator.tsx` | NEW | The form + read-only result component (§4) |
| 3 | `src/screens/admin/MarketingApprovalScreen.tsx` | MODIFY (additive) | Import + render `<AdminMarketingDraftGenerator onDraftGenerated={() => void loadDrafts()} />` above the existing drafts list; **zero changes to any existing function in this file** |
| 4 | `scripts/test-viona-pack32-4-marketing-admin-ui.ts` | NEW | Logic-level tests (no RN component-rendering harness exists in this repo today — see §7) |
| 5 | `docs/design/evidence/cursor-pack32-4-marketing-admin-ui-planning-packet/README.md` | NEW (this packet) | Evidence + source excerpts backing this plan |

No Prisma schema change. No backend file. No `package.json` dependency change. No change to
`src/navigation/routes.ts` or `App.tsx`.

---

## 7. Test plan (for the future implementation pack)

This repo has no React Native component-rendering test harness (no `@testing-library/react-native`,
no Jest config for `.tsx` — every existing Pack25–33 test script is a plain `tsx`-executed
Node script asserting on pure functions / source-scans). The test plan below matches that existing
repo convention rather than introducing a new testing library (which would itself violate "no new
dependency"):

1. `postAdminMarketingGenerateDraft()` (new API wrapper) calls `restApiFetchJson` with the exact
   path `/api/admin/marketing/generate-draft`, method `POST`, and a body matching the input
   (verified via an injected fake `restApiFetchJson` or a fake global `fetch`, mirroring how
   backend Pack32.3 tests inject a fake `dispatch`).
2. A successful fake response maps to the exact `{ marketingPostId, content, toolName,
   confidence }` payload shape, unchanged.
3. A fake `{success:false, error}` response surfaces `error` unchanged (never re-wrapped, never
   swallowed).
4. **Source-scan (CRITICAL):** `AdminMarketingDraftGenerator.tsx` never references
   `publishAdminMarketingPost`, `postMarketingPostPublish`, `postAdminMarketingApproveAndTranslate`,
   `Facebook`, or `TikTok` (case-insensitive) anywhere in its source.
5. **Source-scan (CRITICAL):** the generated-content display uses `editable={false}` (if a
   `TextInput`) or is not a `TextInput` at all (if a plain `Text`) — never an editable field for
   the *generated* content.
6. **Source-scan (CRITICAL):** no new import of any UI/CSS framework (`tailwind`, `bootstrap`,
   `@mui`, `native-base`, `styled-components`, etc.) in any of the 3 new/modified `.tsx`/`.ts`
   files.
7. **Source-scan (CRITICAL):** `git diff --stat origin/master` for every backend file touched by
   Pack32.3 (`AdminMarketingController.ts`, `adminRoutes.ts`,
   `vionaMarketingContentDispatchService.ts`, and the rest of the Pack32.3 §5/§3 core-file list)
   shows **zero** lines — this pack is frontend-only.
8. **Source-scan:** `MarketingApprovalScreen.tsx`'s diff vs `origin/master` only *adds* lines
   (import + one new render block + the `onDraftGenerated` wiring) — no existing line inside any
   pre-existing function (`loadDrafts`, `publish...`, `delete...`, `approve...`) is modified.
9. Client-side validation helper (if extracted as a pure function, e.g.
   `isAdminMarketingDraftGeneratorFormValid({topic, tone, targetLanguageCode})`) rejects
   empty/whitespace-only fields for all 3 combinations tested independently.
10. Regression: `npm run typecheck`, `npm run lint`, and the full existing Pack25–33 backend test
    suite — 100% PASS required (this pack must not regress anything, even though it is
    frontend-only).

---

## 8. Explicit non-authorization boundary

This packet is **planning only**. It does **not**:

- Write, modify, or generate any `.ts`/`.tsx` file.
- Change `MarketingApprovalScreen.tsx`, `viGlobalAdminApi.ts`, `App.tsx`, or
  `src/navigation/routes.ts`.
- Add any new UI/CSS library dependency.
- Add a "Publish"/"Share to Facebook" control anywhere.
- Authorize implementation. A future, separate operator phrase (e.g.
  `APPROVE_PACK32_4_MARKETING_ADMIN_UI_IMPLEMENTATION`) is required before the file allowlist in
  §6 may be built.

Real execution (Pack30D-4 Twilio POC) remains **BLOCKED**. Automated social-media posting remains
**FORBIDDEN** — this pack does not add, plan, or imply an auto-publish path; every draft this
future UI could ever create still requires the existing, separate, human-operated `publish`
button already rendered in `MarketingApprovalScreen`. Production remains **NOT AUTHORIZED**.
