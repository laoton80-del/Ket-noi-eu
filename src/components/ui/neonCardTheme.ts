/** Tailwind-aligned accent presets for {@link NeonCard} gradient + glow. */
export type NeonCardThemeColor =
  | 'emerald'
  | 'emerald-400'
  | 'cyan'
  | 'cyan-400'
  | 'violet'
  | 'violet-400'
  | 'amber'
  | 'amber-400'
  | 'rose'
  | 'rose-400'
  | 'fuchsia'
  | 'fuchsia-400'
  | (string & {});

export type NeonCardThemeSpec = Readonly<{
  accent: string;
  rgb: Readonly<{ r: number; g: number; b: number }>;
}>;

/** Tailwind 400-step hex values used for gradient + glow parity. */
const PRESET: Record<string, NeonCardThemeSpec> = {
  emerald: { accent: '#34D399', rgb: { r: 52, g: 211, b: 153 } },
  'emerald-400': { accent: '#34D399', rgb: { r: 52, g: 211, b: 153 } },
  cyan: { accent: '#22D3EE', rgb: { r: 34, g: 211, b: 238 } },
  'cyan-400': { accent: '#22D3EE', rgb: { r: 34, g: 211, b: 238 } },
  violet: { accent: '#A78BFA', rgb: { r: 167, g: 139, b: 250 } },
  'violet-400': { accent: '#A78BFA', rgb: { r: 167, g: 139, b: 250 } },
  amber: { accent: '#FBBF24', rgb: { r: 251, g: 191, b: 36 } },
  'amber-400': { accent: '#FBBF24', rgb: { r: 251, g: 191, b: 36 } },
  rose: { accent: '#FB7185', rgb: { r: 251, g: 113, b: 133 } },
  'rose-400': { accent: '#FB7185', rgb: { r: 251, g: 113, b: 133 } },
  fuchsia: { accent: '#E879F9', rgb: { r: 232, g: 121, b: 249 } },
  'fuchsia-400': { accent: '#E879F9', rgb: { r: 232, g: 121, b: 249 } },
};

function parseHex(hex: string): NeonCardThemeSpec | null {
  const normalized = hex.trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return null;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return { accent: `#${normalized.toUpperCase()}`, rgb: { r, g, b } };
}

export function resolveNeonCardTheme(themeColor: NeonCardThemeColor = 'emerald-400'): NeonCardThemeSpec {
  const key = themeColor.trim().toLowerCase();
  const preset = PRESET[key];
  if (preset) return preset;
  if (themeColor.startsWith('#')) {
    const parsed = parseHex(themeColor);
    if (parsed) return parsed;
  }
  return PRESET['emerald-400'];
}

export function neonCardBoxShadow(
  rgb: Readonly<{ r: number; g: number; b: number }>,
  hovered: boolean,
): string {
  const outerA = hovered ? 0.48 : 0.3;
  const outerSpread = hovered ? 28 : 15;
  const haloA = hovered ? 0.28 : 0.15;
  const innerA = hovered ? 0.14 : 0.08;
  return [
    `0 0 ${outerSpread}px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${outerA})`,
    `0 0 ${outerSpread * 2}px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${haloA})`,
    `inset 0 0 12px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${innerA})`,
  ].join(', ');
}
