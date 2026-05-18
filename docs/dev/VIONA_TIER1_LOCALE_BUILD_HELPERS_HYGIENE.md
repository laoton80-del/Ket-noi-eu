# VIONA Tier-1 locale build helpers — dev hygiene

**Document ID:** `VIONA.DEV_HYGIENE.TIER1_BUILD_HELPERS.1`  
**Type:** Dev hygiene (ignore rules + documentation only)  
**Date:** 2026-05-16  

**Governing context:** [VIONA Operating Protocol](../ai-context/VIONA_OPERATING_PROTOCOL.md), [Tier-1 locale completeness audit](../audit/VIONA_I18N_TIER1_LOCALE_COMPLETENESS_AUDIT_1.md), [Global language strategy audit](../audit/VIONA_I18N_GLOBAL_LANGUAGE_STRATEGY_AUDIT_1.md).

---

## Why this exists

During Tier-1 locale completion packs (`cs`/`de` expansion, `fr`/`ja`/`ko` safety bundle), one-off Node scripts and intermediate JSON were created under `scripts/` to merge pilot namespaces into `src/i18n/locales/*.json`. Those files were **never meant to ship** in git: they are workspace scratch, pack inputs/outputs, or flat translation maps.

Without ignore rules, `git status` stays noisy and it is easy to `git add` generated JSON by mistake.

**Canonical locale source of truth:** `src/i18n/locales/en.json` (and merged locale files on `master`). **Do not commit** intermediate pack JSON or `_*.json` extracts.

---

## What to commit vs ignore

| Commit to git | Keep local only (ignored) |
|---------------|---------------------------|
| `src/i18n/locales/*.json` after review + safety copy audit | `scripts/tier1-*-pack.json` |
| Release/readiness scripts already tracked under `scripts/` | `scripts/_en-pilot-ns.json`, `_safety-bundle-en.json`, `_strings-en.json`, `_tier1-*-leaves.json` |
| This doc + `.gitignore` hygiene | `scripts/tr/*-flat.mjs` (flat translation maps) |
| | One-off builders: `build-tier1-*.mjs`, `build-fr-ja-ko-safety.mjs`, `tier1-pack-build.mjs`, `_build-tier1-*.mjs` |

---

## File classification (2026-05-16 workspace)

### Generated artifacts (ignore)

- `scripts/tier1-cs-pack.json`, `tier1-de-pack.json`, `tier1-fr-pack.json`, `tier1-ja-pack.json`, `tier1-ko-pack.json` — namespace overlays produced for merge scripts; superseded once locales are on `master`.
- `scripts/_en-pilot-ns.json` — EN pilot namespace extract used as merge template.
- `scripts/_safety-bundle-en.json` — EN safety-bundle slice for `fr`/`ja`/`ko` pack build.
- `scripts/_strings-en.json`, `_tier1-en-leaves.json`, `_tier1-de-leaves.json` — leaf key lists / DE leaf map scratch.

### Translation scratch (ignore)

- `scripts/tr/fr-flat.mjs`, `ja-flat.mjs`, `ko-flat.mjs` — large flat `dotted.key → string` maps (~600+ keys) for safety-bundle generation.

### One-off reusable scripts (ignore locally; promote before tracking)

These **write or merge into** `src/i18n/locales/` when executed. They are useful for a repeat pack but are **not** part of CI/release discipline until reviewed and moved under a tracked path (e.g. `scripts/i18n/`).

| Script | Pack / purpose |
|--------|----------------|
| `build-tier1-cs-de-locales.mjs` | `VIONA.I18N.TIER1_CS_DE_COMPLETION.1` |
| `_build-tier1-de-pack.mjs` | Builds `tier1-de-pack.json` from EN + DE leaf map |
| `build-fr-ja-ko-safety.mjs` | `VIONA.I18N.TIER1_FR_JA_KO_SAFETY_BUNDLE.1` |
| `tier1-pack-build.mjs` | Builds `tier1-fr/ja/ko-pack.json` from `_safety-bundle-en.json` + `tr/*-flat.mjs` |

**Do not run** these against `master` without a dedicated i18n pack branch and copy/safety review. They can overwrite locale files.

### Unknown / needs review before tracking

None in the current ignore set — all listed untracked files were tied to completed Tier-1 packs above.

---

## `.gitignore` patterns

Added under “Tier-1 locale pack helpers” in repo root `.gitignore`:

- `scripts/tier1-*-pack.json`
- `scripts/_en-pilot-ns.json`, `_safety-bundle-en.json`, `_strings-en.json`, `_tier1-*-leaves.json`
- `scripts/tr/`
- `scripts/build-tier1-*.mjs`, `build-fr-ja-ko-safety.mjs`, `tier1-pack-build.mjs`, `_build-tier1-*.mjs`

Patterns are **narrow** (prefix/path scoped) so existing tracked `scripts/*` checks and release scripts are unaffected.

---

## How to avoid accidental commits

1. After locale work: `git status -sb` — only `src/i18n/locales/*.json` (and intentional docs) should appear for i18n packs.
2. Never `git add scripts/tier1-*` or `scripts/_*` without explicit pack review.
3. If promoting a builder to permanent tooling: move to `scripts/i18n/`, add a README, document inputs/outputs, and **remove** the path from `.gitignore` for that script only.
4. Prefer copy-only locale PRs separate from dev-hygiene PRs (this pack).

---

## Related completed waves

- Tier-1 `cs`/`de` completion, `fr`/`ja`/`ko` safety bundle (merged to `master`)
- SOS copy safety packs (audit, home ping, orphan hygiene, report queue) — locale JSON only, no helper commits
