import { Platform } from 'react-native';

/** Calm SOS shell — serious, readable, not travel-luxury or nightclub neon. */
export const emergencyUiTokens = {
  shellBg: '#09090B',
  shellBgTravel: '#0c1018',
  contentMaxWidth: 520,
  contentPadding: 16,
  gridGap: 10,
  hubTileMinHeight: 118,
  dialBarMinHeight: 64,
  disclaimerPanelBg: 'rgba(15, 23, 42, 0.72)',
  disclaimerPanelBorder: 'rgba(148, 163, 184, 0.22)',
  infoCardBg: 'rgba(17, 24, 39, 0.92)',
  infoCardBorder: 'rgba(55, 65, 81, 0.85)',
  dialBarBg: 'rgba(127, 29, 29, 0.42)',
  dialBarBorder: 'rgba(248, 113, 113, 0.45)',
  dialBarBgPressed: 'rgba(127, 29, 29, 0.55)',
} as const;

export type EmergencyHubAccent = 'emergency' | 'consular' | 'pilot' | 'family';

export const emergencyHubAccentTokens: Record<
  EmergencyHubAccent,
  Readonly<{
    icon: string;
    iconBg: string;
    iconBorder: string;
    cardBg: string;
    cardBorder: string;
  }>
> = {
  emergency: {
    icon: '#FCA5A5',
    iconBg: 'rgba(127, 29, 29, 0.35)',
    iconBorder: 'rgba(248, 113, 113, 0.42)',
    cardBg: 'rgba(15, 23, 42, 0.94)',
    cardBorder: 'rgba(248, 113, 113, 0.32)',
  },
  consular: {
    icon: '#93C5FD',
    iconBg: 'rgba(30, 58, 138, 0.35)',
    iconBorder: 'rgba(96, 165, 250, 0.38)',
    cardBg: 'rgba(15, 23, 42, 0.94)',
    cardBorder: 'rgba(96, 165, 250, 0.28)',
  },
  pilot: {
    icon: '#D8B4FE',
    iconBg: 'rgba(88, 28, 135, 0.32)',
    iconBorder: 'rgba(216, 180, 254, 0.38)',
    cardBg: 'rgba(15, 23, 42, 0.94)',
    cardBorder: 'rgba(192, 132, 252, 0.28)',
  },
  family: {
    icon: '#86EFAC',
    iconBg: 'rgba(22, 101, 52, 0.32)',
    iconBorder: 'rgba(134, 239, 172, 0.38)',
    cardBg: 'rgba(15, 23, 42, 0.94)',
    cardBorder: 'rgba(134, 239, 172, 0.26)',
  },
};

export function emergencyContentColumnStyle(maxWidth = emergencyUiTokens.contentMaxWidth) {
  return {
    width: '100%' as const,
    maxWidth: Platform.OS === 'web' ? maxWidth : maxWidth,
    alignSelf: 'center' as const,
  };
}
