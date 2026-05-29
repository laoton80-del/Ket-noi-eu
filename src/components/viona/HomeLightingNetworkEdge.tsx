/**
 * Home-facing alias for the shared premium light-network edge accent.
 * Implementation lives in LocalLightingNetworkEdge (geometry/tiers are universe-agnostic;
 * Home passes gold/cyan constellation accents at the call site).
 */
export {
  LocalLightingNetworkEdge as HomeLightingNetworkEdge,
  type LocalLightingNetworkTier as HomeLightingNetworkTier,
  type LocalLightingNetworkEdgeProps as HomeLightingNetworkEdgeProps,
} from './local/LocalLightingNetworkEdge';
