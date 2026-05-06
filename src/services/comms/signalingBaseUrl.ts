/**
 * Socket.IO connects to the same host as the REST API unless `EXPO_PUBLIC_SIGNALING_URL` overrides.
 */

export function getSignalingBaseUrl(): string {
  const dedicated = process.env.EXPO_PUBLIC_SIGNALING_URL?.trim()?.replace(/\/+$/, '');
  if (dedicated) return dedicated;
  const rest = process.env.EXPO_PUBLIC_REST_API_BASE?.trim()?.replace(/\/+$/, '') ?? '';
  if (rest) return rest;
  return process.env.EXPO_PUBLIC_BACKEND_API_BASE?.trim()?.replace(/\/+$/, '') ?? '';
}
