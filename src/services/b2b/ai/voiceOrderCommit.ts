import type { BusinessOrder } from '../../../domain/b2b/models';

/** Validate JSON lines from `commit_order` webhook body. */
export function parseVoiceOrderCommitLines(raw: unknown): BusinessOrder['lines'] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const lines: BusinessOrder['lines'] = [];
  for (const row of raw) {
    if (!row || typeof row !== 'object') return null;
    const o = row as Record<string, unknown>;
    const name = o.name;
    const quantity = o.quantity;
    if (typeof name !== 'string' || !name.trim()) return null;
    const q =
      typeof quantity === 'number' && Number.isFinite(quantity)
        ? quantity
        : typeof quantity === 'string'
          ? parseInt(quantity, 10)
          : NaN;
    if (!Number.isFinite(q) || q <= 0) return null;
    lines.push({
      name: name.trim(),
      quantity: Math.floor(q),
      needsClarification: o.needsClarification === true,
      notes: typeof o.notes === 'string' ? o.notes : undefined,
      sku: typeof o.sku === 'string' ? o.sku : undefined,
    });
  }
  return lines;
}

export function parseVoiceOrderLineClarifications(
  raw: unknown
): BusinessOrder['lineClarifications'] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  const out: NonNullable<BusinessOrder['lineClarifications']> = [];
  for (let i = 0; i < raw.length; i++) {
    const row = raw[i];
    if (!row || typeof row !== 'object') continue;
    const o = row as Record<string, unknown>;
    const lineIndex =
      typeof o.lineIndex === 'number' && Number.isFinite(o.lineIndex)
        ? o.lineIndex
        : typeof o.lineIndex === 'string'
          ? parseInt(o.lineIndex, 10)
          : i;
    if (!Number.isFinite(lineIndex)) continue;
    out.push({
      lineIndex: Math.max(0, Math.floor(lineIndex)),
      vi: typeof o.vi === 'string' ? o.vi : undefined,
      en: typeof o.en === 'string' ? o.en : undefined,
      cs: typeof o.cs === 'string' ? o.cs : undefined,
    });
  }
  return out.length ? out : undefined;
}
