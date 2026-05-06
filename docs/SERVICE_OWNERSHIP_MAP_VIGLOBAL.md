# Service Ownership Map (ViGlobal)

## Canonical Ownership
- `src/services/autonomy/*`: autonomy planner/execution and orchestration boundaries.
- `src/services/b2b/*`: merchant operations, receptionist, billing-adjacent B2B flows.
- `src/services/marketplace/*`: consumer discovery ranking and marketplace read models.
- `src/lifeOS/*`: UX composition and action derivations only.

## Migration Guardrails
- No direct `lifeOS` imports inside `services/marketplace`.
- No direct `services/b2b` imports inside `lifeOS/hooks`.
- Shared contracts should live in config/types layer.

## Rollback Strategy
- Keep compatibility facades for one release cycle.
- Introduce feature flags for migrated callsites.
- Rollback by toggling flags and retaining old adapters until stable.

