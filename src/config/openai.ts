/** Backend AI proxy base URL. */
export function getAiProxyBase(): string {
  return process.env.EXPO_PUBLIC_BACKEND_API_BASE?.trim() ?? '';
}
