import { Platform } from 'react-native';

const STYLE_ID = 'viona-reduced-motion-guard';

/** Web safety net: a reduce-motion preference removes CSS transitions and animations. */
export function ensureVionaReducedMotionGuard(): void {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = [
    '@media (prefers-reduced-motion: reduce) {',
    '  [data-testid="viona-motion"],',
    '  [data-testid="viona-motion"] *,',
    '  [data-testid="viona-companion-orb"],',
    '  [data-testid="viona-companion-orb"] * {',
    '    animation: none !important;',
    '    transition: none !important;',
    '  }',
    '}',
  ].join('\n');
  document.head.appendChild(style);
}
