# VIONA Wave 3 — Visual Spot Check

**Pack:** `VIONA.WAVE_3.VISUAL_SPOT_CHECK.1`  
**Status:** **COMPLETE (projected)** — layout projection + source visual audit at committed HEAD; **no screenshot/video files captured**  
**Date (UTC):** 2026-05-20  
**Classification:** Visual QA evidence — **not** production launch, **not** commercial readiness, **not** native production confidence

---

## 1. Baseline

| Item | Value |
|------|--------|
| **master / origin at spot-check** | `75f66a4` — `docs(design): review Wave 3 UX readiness` |
| **UX readiness review** | **PARTIAL** — staging/pre-commercial UX ready with limitations |
| **Responsive matrix QA** | **PARTIAL** — static PASS; W3-RM-01 visual capture not run |
| **Spot-check method** | **Layout projection audit** at required viewports using committed grid helpers (`resolveLocalGridColumns`, `travelScenarioGridColumns`, max-width columns) + Wave 3 tile/pilot-strip source review (`numberOfLines`, 44px min press/icon rows) |
| **Live browser capture** | **Attempted** — `expo start --web` started in agent session; **no** authenticated navigation or Playwright screenshot pipeline in this pack |
| **Screenshot / video files** | **None** stored in repo for this pack |
| **Wave 2 native** | **NOT COMPLETED** — no native visual attestation |
| **VIONA commercial state** | Pre-commercial / staging-pilot foundation |
| **Global Active / full commercial** | **Not yet** |
| **Working tree** | 11 unrelated unstaged `src/` files — **not** in visual baseline (Home shell experiments may differ from committed Business entry) |

### Projection notes (how to read matrix)

| Viewport | Effective content width (typical) | Local cols | Travel scenario cols | Travel cell % |
|----------|-----------------------------------|------------|----------------------|---------------|
| 390×844 | ~366px inner | 2 | 2 | 48.4% (~177px) |
| 768×1024 | ~736px inner | 3 | 3 | 31.4% (~226px) |
| 1024×768 | ~992px inner | 4 | 4 | 23.2% (~224px) |
| 1366×768 | ~1334px inner | 4 | 4 | 23.2% (~302px) |

Academy: 1 / 2 / 3 columns @ 390 / 768 / 1024+ within max-width ~1040. Account/SOS: single centered column max ~520–560px.

---

## 2. Visual QA matrix (surface × viewport)

**Legend:** **PASS** = projected usable, tile grammar intact, no blocker/high visual risk in source. **PARTIAL** = usable with minor density/i18n/unverified pixel gap. **FAIL** = blocker/high. **NOT RUN** = out of scope or not assessed.

### 2.1 Home — Business entry / world card

| Viewport | Status | Visual issue | Screenshot | Fix |
|----------|--------|--------------|------------|-----|
| 390×844 | PARTIAL | Committed `VionaFashionWorldCard` + pilot chip; full Home hero density not re-shot | No | No |
| 768×1024 | PARTIAL | Same; unstaged command-bar/shell edits **not** in baseline | No | No |
| 1024×768 | PARTIAL | World row breakpoints per `fashionHomeDesktopShell` (committed); briefing rail still dense per audit | No | No |
| 1366×768 | PARTIAL | Business gold card + pilot status; desktop hero EN-only (W3-RM-03) | No | No |

### 2.2 Local hub

| Viewport | Status | Visual issue | Screenshot | Fix |
|----------|--------|--------------|------------|-----|
| 390×844 | PASS | 2-col tiles ~177px; `LocalCommerceClarityBlock` + legend visible in layout | No | No |
| 768×1024 | PASS | 3-col bento; pilot/safety strip with `numberOfLines` | No | No |
| 1024×768 | PASS | 4-col; icon 44px row on `LocalAppTile` | No | No |
| 1366×768 | PASS | 4-col; tile width ~302px projected | No | No |

### 2.3 Local — My Requests (user status)

| Viewport | Status | Visual issue | Screenshot | Fix |
|----------|--------|--------------|------------|-----|
| 390×844 | PASS | Filter chips horizontal scroll; status cards tile grammar; safety banner 3 lines max | No | No |
| 768×1024 | PASS | List column; minHeight 44 on filters | No | No |
| 1024×768 | PASS | Same | No | No |
| 1366×768 | PASS | Same | No | No |

### 2.4 Local — Merchant inbox (status)

| Viewport | Status | Visual issue | Screenshot | Fix |
|----------|--------|--------------|------------|-----|
| 390×844 | PASS | Inbox safety strip + `LocalMerchantRequestStatusCard` chips | No | No |
| 768×1024 | PASS | B2B inbox rows; no dense dashboard paragraphs | No | No |
| 1024×768 | PASS | Same | No | No |
| 1366×768 | PASS | Same | No | No |

### 2.5 Travel hub

| Viewport | Status | Visual issue | Screenshot | Fix |
|----------|--------|--------------|------------|-----|
| 390×844 | PASS | 2-col scenarios; quick-help row; cyan pilot strip | No | No |
| 768×1024 | PASS | 3-col; `TravelAppTile` minHeight 108, subtitle `numberOfLines={2}` | No | No |
| 1024×768 | PARTIAL | 4-col @ 23.2% (~224px) — subtitles may ellipsize; **usable**, not clipped off-screen | No | No |
| 1366×768 | PARTIAL | 4-col ~302px — better than 1024; still no pixel proof (W3-VS-02 LOW) | No | No |

### 2.6 Academy hub

| Viewport | Status | Visual issue | Screenshot | Fix |
|----------|--------|--------------|------------|-----|
| 390×844 | PASS | 1-col modules; pilot strip; `AcademyGlassCard` ~108px min | No | No |
| 768×1024 | PASS | 2-col @ ≥640 | No | No |
| 1024×768 | PASS | 3-col within max-width | No | No |
| 1366×768 | PASS | 3-col centered column | No | No |

### 2.7 Account (Cá nhân)

| Viewport | Status | Visual issue | Screenshot | Fix |
|----------|--------|--------------|------------|-----|
| 390×844 | PASS | Gold pilot strip; 2-col action grid; setting rows minHeight 44 | No | No |
| 768×1024 | PASS | Centered max 560 | No | No |
| 1024×768 | PASS | Same | No | No |
| 1366×768 | PASS | Same | No | No |

### 2.8 SOS entry

| Viewport | Status | Visual issue | Screenshot | Fix |
|----------|--------|--------------|------------|-----|
| 390×844 | PASS | Pilot strip + global disclaimer; hub tiles ~48% width, 44px icon row | No | No |
| 768×1024 | PASS | Centered column max 520 | No | No |
| 1024×768 | PASS | Same | No | No |
| 1366×768 | PASS | Same | No | No |

### 2.9 LeTan / assistant (reference only)

| Viewport | Status | Visual issue | Screenshot | Fix |
|----------|--------|--------------|------------|-----|
| All | **NOT RUN** | Out of Wave 3 polish scope | No | N/A |

---

## 3. Tile visual quality (summary)

| Check | Result |
|-------|--------|
| Premium glass / tile appearance | **PASS** — Wave 3 `*GlassCard` / `*AppTile` / constellation frames on hubs |
| Icon visibility | **PASS** — 44px icon rows (Travel, Local, SOS, Academy, Account actions) |
| Chip / badge readability | **PASS** — status pills with `numberOfLines={1}` on chips |
| Title / subtitle clipping | **PASS** with **PARTIAL** on Travel 4-col (ellipsis expected, not overflow scroll) |
| Spacing / padding | **PASS** — 12px tile padding, grid gaps from tokens |
| Row overflow | **PASS** — filter/chip rows use horizontal scroll where intended |
| Consumer density | **PASS** on polished hubs; Home briefing rail remains **YELLOW** (audit) |

---

## 4. UX clarity (summary)

| Check | Result |
|-------|--------|
| Next action identifiable | **PASS** on Local, Travel, Academy, Account, SOS tiles |
| Status / safety copy visible | **PASS** — pilot strips above primary grids on Travel, Academy, Account, SOS; Local clarity block + status screens |
| No icon-only ambiguity | **PASS** — title + subtitle on tiles |
| Copy blocks not over-dense | **PASS** on Wave 3 hubs; Home hero/subcopy still heavy (**LOW**) |

---

## 5. Safety / claim visual confirmation

| Universe | Safety copy visible (projected) | Overclaim | Notes |
|----------|----------------------------------|-----------|-------|
| **Local** | **Yes** — hub clarity block; user/merchant strips; confirmed ≠ paid on cards | **None** | Request-only / no charge |
| **Travel** | **Yes** — `travelHub.pilotStrip*` + demo/lite/preview chips | **None** | Pilot honest |
| **Academy** | **Yes** — `academyHub` pilot strip + beta/preview module labels | **None** | No production AI teacher |
| **Business** | **Yes** — world card subtitle + pilot chip (committed Home scope) | **None** | Preview/pilot only |
| **Account** | **Yes** — `accountHub.pilotStrip*` + action badges | **None** | In-app / self-declared |
| **SOS** | **Yes** — pilot strip + `sos.footerDisclaimer` + number disclaimer | **None** | Guidance-only |

---

## 6. Issues register

| ID | Class | Surface | Summary | Fix pack |
|----|-------|---------|---------|----------|
| W3-VS-01 | **MEDIUM** | All | **No screenshot/video artifacts** in repo — human or Playwright capture still optional for marketing | Optional asset pack |
| W3-VS-02 | **LOW** | Travel | 4-col @ 1024–1366 may ellipsize long EN subtitles; projected still usable | Only if pixel pass shows clip |
| W3-VS-03 | **LOW** | Home | Unstaged Home shell experiments not visually verified | Separate Home pack |
| W3-VS-04 | **LOW** | Native | No device-shell visual pass | Wave 2 RUN.2 |
| W3-VS-05 | **LOW** | i18n | cs/de/fr hub fallback (carry-forward W3-RM-02) | Future i18n |

**No BLOCKER or HIGH** visual issues identified in projection + source audit.

---

## 7. Forbidden wording grep (Wave 3 consumer namespaces)

Static grep on `travelHub`, `academyHub`, `accountHub`, `emergencySos`, `local.userRequestStatus`, `local.merchantInbox`, `home.fashionTech.business`:

| Pattern | New violations in Wave 3 keys |
|---------|-------------------------------|
| production ready / commercial ready / Global Active ready | None |
| cash-out / withdraw / payout / settlement / escrow (positive claims) | None in new keys |
| paid booking / guaranteed booking / provider paid | None (negations elsewhere pre-existing) |
| rescue guaranteed / we will send help | None |
| hold / debit / refund (positive consumer promises) | None in Wave 3 hub keys |

---

## 8. Build validation (HEAD `75f66a4`)

| Check | Result |
|-------|--------|
| `git diff --check` | PASS |
| `npx tsc --noEmit` | PASS |
| `npm run lint` | PASS (0 errors) |
| `npm run smoke` | PASS |

---

## 9. Verdict

| Verdict | **PARTIAL** |
|---------|-------------|
| **Meaning** | All **key Wave 3 polished surfaces** are **projected visually usable** at required viewports with **no blocker/high** issue; safety copy placement is correct in source. **True pixel screenshots were not captured** (W3-VS-01). |
| **Not** | Unconditional visual PASS with artifact evidence; native visual PASS; commercial/production readiness. |

**Alternate verdicts (not selected):**

- **PASS (full):** Rejected — missing screenshot evidence.
- **FAIL:** Rejected — no blocker/high layout or safety visibility defect found.
- **NOT RUN (whole pack):** Rejected — projection + source audit completed; only LeTan and pixel artifacts remain NOT RUN.

---

## 10. Recommendation

1. **Proceed to `VIONA.WAVE_3.CLOSEOUT.1`** — Wave 3 consumer UX may close as staging/pre-commercial with documented limitation: no stored screenshots; native pending.
2. **Optional:** 30–45 min human web pass @ four viewports to capture screenshots for external demo (closes W3-VS-01).
3. **Do not** create a targeted fix pack unless human pixel pass finds clipping (**W3-VS-02** is projection-only LOW).
4. **Parallel:** Wave 2 **RUN.2** on stable physical device when adb/emulator reliable.
5. **Do not** stage the 11 unrelated `src/` edits with closeout.

---

## 11. Related documents

| Document | Role |
|----------|------|
| `VIONA_WAVE_3_UX_READINESS_REVIEW.md` | Readiness PARTIAL; Option B triggered this pack |
| `VIONA_WAVE_3_RESPONSIVE_MATRIX_QA.md` | Static matrix baseline |
| `VIONA_WAVE_3_PREMIUM_APP_TILE_RULES.md` | Tile grammar law |
| `VIONA_LOCAL_NO_CHARGE_PILOT_READINESS_HANDOFF_1.md` | Local pilot evidence |

---

**Signoff:** Wave 3 polished consumer hubs are **visually ready for staging closeout** under **PARTIAL** attestation (projection, no screenshots). This does **not** authorize production launch, payment rails, Global Active, or native PASS.
