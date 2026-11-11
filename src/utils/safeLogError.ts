export function safeErrorMeta(err: unknown): { errName: string; status?: number } {
  const errName = (typeof (err as { name?: unknown })?.name === 'string' ? (err as { name: string }).name : 'UnknownError')
    .replace(/[^A-Za-z0-9_.-]/g, '').slice(0, 64);
  const status = typeof (err as { status?: unknown })?.status === 'number' && Number.isFinite((err as { status: number }).status)
    ? (err as { status: number }).status : undefined;
  return status === undefined ? { errName } : { errName, status };
}

export function logSafeError(label: string, err: unknown, extra?: Readonly<Record<string, string | number>>): void {
  console.error(label, { ...safeErrorMeta(err), ...(extra ?? {}) });
}
