# Observability & Operations (repo scope)

This runbook defines what the app can surface in production **from this repo** and what still requires external setup.

## Runtime signals now in app

- Global JS crash capture (`ErrorUtils`) with structured operational emission.
- Unhandled promise rejection capture (when runtime exposes handler).
- Performance span emission for startup-critical operations (storage migration baseline).
- Ops runtime config resolution:
  - build-time env defaults
  - optional remote config fetch with timeout
  - cached fallback from AsyncStorage when remote is unavailable
- Emergency kill switch UI (maintenance screen) to stop user flows without shipping a new binary.
- Read-only mode signal and disabled-feature list support for operational rollouts.

## Configuration variables

Use `.env` / EAS environment values:

- `EXPO_PUBLIC_APP_ENV` — `development|staging|production`.
- `EXPO_PUBLIC_OBS_INGEST_URL` — optional HTTPS endpoint to collect operational envelopes.
- `EXPO_PUBLIC_OPS_CONFIG_URL` — optional remote JSON config endpoint.
- `EXPO_PUBLIC_OPS_CONFIG_TIMEOUT_MS` — fetch timeout in ms (default `2500`).
- `EXPO_PUBLIC_OPS_KILL_SWITCH` — hard override (`1` blocks app with maintenance screen).
- `EXPO_PUBLIC_OPS_READ_ONLY_MODE` — hard override.
- `EXPO_PUBLIC_OPS_DISABLED_FEATURES` — comma-separated feature names.

## Remote ops config contract

`GET EXPO_PUBLIC_OPS_CONFIG_URL` should return JSON:

```json
{
  "killSwitch": false,
  "readOnlyMode": false,
  "disabledFeatures": ["ai_proxy", "wallet_topup"]
}
```

Unknown keys are ignored. When remote fetch fails, the app uses cached payload (if present), otherwise env-only defaults.

## Validation (repo-level)

- `npm run ops:preflight` — static wiring checks.
- `npm run typecheck` — compile/runtime API safety for observability module.
- Optional runtime smoke:
  1. Set `EXPO_PUBLIC_OPS_KILL_SWITCH=1`
  2. launch app and verify maintenance screen renders.

## External setup required

1. Provision an ingest endpoint for `EXPO_PUBLIC_OBS_INGEST_URL` (store logs with retention + alerting). Do not rely on client-embedded secrets.
2. Configure alert rules:
   - `js_fatal_exception`
   - `promise_unhandled_rejection`
   - repeated `ops_config_fallback_cached` on production.
3. Host remote ops config endpoint and protect it (auth/network controls).
4. Operationalize on-call runbook:
   - when to enable kill switch
   - rollback criteria
   - staging validation before production flag changes.

## Honest limits

- This repo does not include vendor crash SDK dashboards by default.
- Signal transport is best-effort; if ingest endpoint is unreachable, app continues.
- Full mobile ANR/native crash depth still requires external crash backend tooling.
