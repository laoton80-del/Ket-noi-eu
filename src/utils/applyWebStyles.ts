import { Platform } from 'react-native';

/** Stable class tokens for `assets/global.css` (web-only). */
export const KN_WEB_CLASS = {
  glass: 'kn-glass',
  neonB2b: 'kn-neon-b2b',
  neonSos: 'kn-neon-sos',
} as const;

/**
 * Returns `classNames` on web, `undefined` on native so `className` is omitted and Metro does not warn.
 *
 * Use alongside RN `style` — CSS wins for `backdrop-filter`, layered `box-shadow`, etc.:
 *
 *   <View style={styles.card} className={applyWebStyles(`${KN_WEB_CLASS.glass} ${KN_WEB_CLASS.neonB2b}`)} />
 *
 * Or: `className={applyWebStyles('kn-glass kn-neon-b2b')}`
 */
export function applyWebStyles(classNames: string): string | undefined {
  if (Platform.OS !== 'web') return undefined;
  return classNames.trim() || undefined;
}

/** Merge optional fragments; returns `undefined` on native or when result is empty. */
export function mergeWebClassNames(...parts: Array<string | undefined | null | false>): string | undefined {
  if (Platform.OS !== 'web') return undefined;
  const merged = parts.filter(Boolean).join(' ').trim().replace(/\s+/g, ' ');
  return merged || undefined;
}
