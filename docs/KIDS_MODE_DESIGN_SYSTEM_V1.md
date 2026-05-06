# Kids Mode Design System v1

## Scope
- Applies to Viet-Kids surfaces only.
- Exception from default `.kn-glass` enterprise language is intentional.

## Tokens
- Source of truth: `src/theme/kidsModeTokens.ts`
- Color, radius, typography, motion, and accessibility thresholds are versioned there.

## Accessibility Constraints
- Minimum touch target: 44x44.
- Body text contrast target: >= 4.5:1.
- Motion fallback: disable celebratory loops on low-end profiles (future runtime flag).

## Motion Budget
- Quick interactions: <= 220ms
- Primary transitions: <= 420ms
- Celebratory bursts: <= 900ms

