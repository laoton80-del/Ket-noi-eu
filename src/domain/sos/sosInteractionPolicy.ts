/**
 * Shared, side-effect-free interaction policy for VIONA SOS entry controls.
 *
 * Keep this module free of UI, animation, platform, provider, permission,
 * navigation, payment, and network dependencies so shell chrome can consume
 * the policy without initializing an SOS implementation.
 */
export const V7_SOS_HOLD_TO_TRIGGER_MS = 3_000 as const;
