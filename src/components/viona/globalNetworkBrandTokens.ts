/** VIONA global-tech wordmark — visual tokens only. */
export const vionaGlobalBrand = {
  wordmarkIvory: '#F6F1E8',
  wordmarkGold: '#F2E4C8',
  wordmarkMuted: 'rgba(232, 224, 210, 0.82)',
  glowGold: 'rgba(238, 206, 128, 0.22)',
  glowIvory: 'rgba(246, 241, 232, 0.16)',
  accentUnderline: 'rgba(242, 212, 136, 0.52)',
  heroLetterSpacing: 8,
  headerLetterSpacing: 5.5,
  compactLetterSpacing: 4,
  heroFontSize: 40,
  headerFontSize: 24,
  compactFontSize: 18,
  subtitleFontSize: 11,
  transitionMs: 170,
} as const;

export type VionaBrandLockupVariant = 'hero' | 'header' | 'compact' | 'iconOnly';
