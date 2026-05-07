# VIONA CSP Unsafe Eval Audit

## 1. Summary

- CSP warning observed in browser: `script-src` blocked string evaluation (`eval`, `new Function`, string timers).
- In current repository audit, no direct `eval/new Function/setTimeout("...")/setInterval("...")` usage was found in tracked app source/config.
- No production CSP header definition was found in current deploy configs (`vercel.json`, `firebase.json`, Expo app config), and no `unsafe-eval` token is present in tracked config.
- Production risk is currently **unknown until production web bundle + deployed response headers are verified end-to-end**.

## 2. Findings

| Source | Location | Dev/Prod | Risk | Action |
|---|---|---|---|---|
| App source direct string-eval | Repo scan (`src`, `scripts`, config files) | None found | Low (from tracked source) | Keep guardrails; no unsafe string execution added |
| Dependency-level eval | Not directly visible in tracked source; likely inside runtime/tooling package if warning persists | Needs verification | Medium | Inspect production built assets and browser stack trace package path; then upgrade/replace offending package if confirmed |
| Dev bundler/HMR/sourcemap behavior | `package.json` web dev uses `expo start --web` | Dev-only likely | Low for production, noisy for local CSP | Treat as dev-only unless reproduced on production build; do not add `unsafe-eval` to production CSP |
| Hosting CSP config | `vercel.json`, `firebase.json`, `app.config.js`, `.github/workflows/release-discipline.yml` | Production config scope | Low (no CSP override found) | If CSP is injected upstream (CDN/reverse proxy), audit that infra layer separately |
| Production bundle behavior | Dist/deployed assets not audited in this run | Production | Medium | Run production build + deploy header check + live console trace to confirm whether eval path exists in production bundle |

## 3. Decision

- unsafe-eval added? **no**
- production safe? **needs verification**

## 4. Fixes Applied

- No code fix applied because no direct unsafe string-eval source was identified in tracked app source.
- No CSP relaxation applied.

## 5. Remaining Needs Verification

- Production web build test and runtime console verification.
- Deployed CSP header verification on live host response headers.
- Dependency stack-trace attribution (exact package/file causing eval warning, if any).
- If dependency confirmed: evaluate package upgrade/replacement without business-logic scope creep.

## 6. Safety

- payment touched? no
- booking touched? no
- wallet touched? no
- DB/Prisma touched? no
- AI/Twilio touched? no
- route names changed? no
- feature flags changed? no
