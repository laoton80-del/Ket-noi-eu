type TelemetryParams = Record<string, unknown>;

const SENSITIVE_KEY_PATTERN =
  /(name|phone|email|address|token|password|secret|base64|image|photo|document|summary|title|actionitems|text|content)/i;

function sanitizeParams(params?: TelemetryParams): TelemetryParams | undefined {
  if (!params) return undefined;
  const safeEntries = Object.entries(params)
    .filter(([key]) => !SENSITIVE_KEY_PATTERN.test(key))
    .map(([key, value]) => {
      if (typeof value === 'string') {
        return [key, value.slice(0, 120)];
      }
      if (typeof value === 'number' || typeof value === 'boolean' || value === null) {
        return [key, value];
      }
      return [key, String(value)];
    });
  return Object.fromEntries(safeEntries);
}

export function logEvent(eventName: string, params?: TelemetryParams): void {
  const safeParams = sanitizeParams(params);
  // TODO: Wire up to Firebase Analytics / Datadog / Sentry here.
  console.info(`[Telemetry] ${eventName}`, safeParams);
}
