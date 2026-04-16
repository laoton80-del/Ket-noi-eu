import { theme } from './theme';

export const gradients = {
  /** Premium gold CTA / highlights */
  goldExecutive: ['#F0E6C8', '#D4AF37', '#9A7B43'] as const,
  goldExecutiveSoft: [
    'rgba(232, 213, 163, 0.35)',
    'rgba(197, 160, 89, 0.12)',
    'rgba(232, 213, 163, 0.28)',
  ] as const,
  goldGlass: [
    theme.colors.glass.gradientStrong,
    theme.colors.glass.gradientSoft,
    theme.colors.glass.gradientStrong,
  ] as const,
  goldGlassSoft: [
    'rgba(197,160,89,0.35)',
    'rgba(197,160,89,0.08)',
    'rgba(197,160,89,0.28)',
  ] as const,
  /** Rail viền bento / khối — Signal Blue (hybrid), thay gold glass ở Home. */
  signalGlassSoft: [
    'rgba(85, 144, 224, 0.32)',
    'rgba(85, 144, 224, 0.08)',
    'rgba(85, 144, 224, 0.24)',
  ] as const,
  dangerButton: ['#E57373', '#C62828', '#8E1A1A'] as const,
  dangerCard: ['rgba(140, 40, 40, 0.9)', 'rgba(198, 40, 40, 0.85)', 'rgba(100, 24, 24, 0.9)'] as const,
  sandCard: ['#1a3352', '#152A45', '#0F2238'] as const,
  bronzeMetal: ['#E8D5A3', '#C5A059', '#7A6128'] as const,
  /** Tab — active gold, idle dark navy */
  tabOrbActive: ['#F0E6C8', '#C5A059', '#8A6B38'] as const,
  tabOrbIdle: ['#152A45', '#0F2238', '#0A1628'] as const,
} as const;
