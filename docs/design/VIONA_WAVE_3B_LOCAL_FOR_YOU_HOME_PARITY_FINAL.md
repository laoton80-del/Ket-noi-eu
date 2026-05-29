# VIONA Wave 3B — Local for you Home parity final

**Pack:** `VIONA.WAVE_3B.LOCAL_FOR_YOU_HOME_PARITY_FINAL.1`  
**Type:** Visual parity + hierarchy weight reduction (no logic changes)

## Intent

Bring Local quick access closer to Home "VIONA FOR YOU" grammar while keeping Local opening hierarchy:

1. Dynamic Hero (primary)
2. Four Hero Cards (secondary)
3. LOCAL FOR YOU compact panel (tertiary)
4. Heavy modules moved lower and de-emphasized

## Local for you panel updates

- Kept six existing quick actions and existing handlers.
- Refined panel to Home-like compact glass grammar:
  - thin semantic border
  - restrained glow
  - compact vertical rhythm
  - short uppercase heading: `LOCAL FOR YOU`
  - icon + short label pills only
- Responsive action grid:
  - very narrow: 1 column
  - mobile: 2 columns
  - tablet: 3 columns
  - desktop: 4 columns
  - wide desktop: 6 columns

## Page lightening pass

- Increased opening-stage bottom separation so lower modules start later.
- Kept request status guide available but visually lighter.
- Added lightweight divider heading: "Explore more local tools".
- Kept all modules but reduced early competition by:
  - moving/keeping heavy sections lower
  - reducing opacity emphasis on secondary groups
  - keeping connected universes and large service blocks as lower-tier content

## Safety and drift

- No route changes.
- No handler changes.
- No payment/wallet logic changes.
- No AI/SOS/backend/auth logic changes.
- No fake production claims.
- Modules preserved; only moved/de-emphasized.

## Evidence capture

Run:

```bash
node scripts/capture-local-for-you-home-parity-final.mjs
```

Output:

`docs/design/evidence/wave-3b-local-for-you-home-parity-final/`
