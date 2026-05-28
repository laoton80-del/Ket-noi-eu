# VIONA Capture Port Flexibility

Capture scripts now support configurable Expo dev-server ports.

## Port resolution

Each `scripts/capture-*.mjs` uses:

```js
const CAPTURE_PORT = Number(process.env.EXPO_CAPTURE_PORT || process.env.CAPTURE_PORT || 8088);
const BASE = process.env.VIONA_WEB_BASE ?? `http://localhost:${CAPTURE_PORT}`;
```

## Usage

- Default behavior (unchanged): uses port `8088` when no env var is provided.
- Override for busy-port situations:

```bash
EXPO_CAPTURE_PORT=8093 node scripts/capture-local-final-hero-assets.mjs
```

Alternative:

```bash
CAPTURE_PORT=8093 node scripts/capture-local-final-hero-assets.mjs
```

## Local selector readiness note

Local capture scripts may require hydration time before `data-testid` nodes appear.
For Local captures, readiness should wait for either:

- `[data-testid="local-premium-shell"]`, or
- `[id="local-hub-root"]`, or
- other stable Local selectors like `[data-testid="local-opening-stage"]`.
