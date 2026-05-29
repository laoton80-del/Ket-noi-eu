/**
 * Local hub flagship card — Home world-card grammar (edge-lit, icon + copy, optional photo).
 * Theme-invariant: premium dark-glass host + edge-lit interior on web regardless of app daylight toggle.
 */
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ComponentProps, ReactElement } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { vionaTokens } from '../../../design';
import {
  FASHION_HOME_DAYLIGHT_WORLD_BOTTOM_VEIL,
  FASHION_HOME_DAYLIGHT_WORLD_CORNER_LIT_TL,
  type FashionHomeWorldCardDaylightAccent,
  fashionHomeWebDaylightTransitionStyle,
  fashionHomeWebDaylightWorldCardInnerRimStyle,
  fashionHomeWebDaylightWorldCardMaterialStyle,
  fashionHomeWebWorldCardHostHoverMotionStyle,
  fashionHomeWorldCardGlassHostStyle,
} from '../fashionHomeDesktopShell';
import { VionaFashionWorldCard } from '../VionaFashionWorldCard';
import { LocalLightingNetworkEdge, type LocalLightingNetworkTier } from './LocalLightingNetworkEdge';
import type { ImageSourcePropType, ImageStyle, StyleProp } from 'react-native';

export type LocalHomeParityAccent = 'emerald' | 'cyan' | 'gold' | 'violet';

const FASHION_ACCENT: Record<
  LocalHomeParityAccent,
  FashionHomeWorldCardDaylightAccent
> = {
  emerald: 'local',
  cyan: 'travel',
  gold: 'business',
  violet: 'academy',
};

const ICON_COLOR: Record<LocalHomeParityAccent, string> = {
  emerald: '#78E8C4',
  cyan: '#8CD4FF',
  gold: '#E8C878',
  violet: '#C8A8F0',
};

/** Semantic secondary tone for the lighting-network nodes (emerald→cyan, cyan→blue, etc.). */
const NETWORK_SECONDARY: Record<LocalHomeParityAccent, string> = {
  emerald: '#8CD4FF',
  cyan: '#66B6FF',
  gold: '#F0B35D',
  violet: '#B56DFF',
};

export type LocalHomeParityCardProps = Readonly<{
  accent: LocalHomeParityAccent;
  title: string;
  subtitle: string;
  statusLabel: string;
  statusTone: 'lite' | 'pilot' | 'demo' | 'comingSoon' | 'safe';
  icon: ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  accessibilityLabel: string;
  testID: string;
  backgroundImage?: ImageSourcePropType;
  imageStyle?: StyleProp<ImageStyle>;
  /** @deprecated Ignored — Local cards use theme-invariant premium glass. */
  daylight?: boolean;
  edgeLitHoverBoost?: boolean;
  stretchInColumn?: boolean;
  /** Lighting-network intensity: `card` (hero cards, medium) or `classified` (lighter). */
  networkTier?: Extract<LocalLightingNetworkTier, 'card' | 'classified'>;
}>;

function LocalWorldCardGlassLayers({
  accent,
  hoverBoost,
}: {
  accent: FashionHomeWorldCardDaylightAccent;
  hoverBoost: boolean;
}): ReactElement {
  return (
    <View pointerEvents="none" style={glassStyles.layers}>
      {Platform.OS === 'web' ? (
        <LinearGradient
          colors={[...FASHION_HOME_DAYLIGHT_WORLD_CORNER_LIT_TL[accent]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.55, y: 0.55 }}
          pointerEvents="none"
          style={[glassStyles.cornerLitTl, hoverBoost && glassStyles.cornerBoost]}
        />
      ) : null}
      <LinearGradient
        colors={[...FASHION_HOME_DAYLIGHT_WORLD_BOTTOM_VEIL[accent]]}
        locations={[0, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        pointerEvents="none"
        style={glassStyles.bottomVeil}
      />
    </View>
  );
}

export function LocalHomeParityCard({
  accent,
  title,
  subtitle,
  statusLabel,
  statusTone,
  icon,
  onPress,
  accessibilityLabel,
  testID,
  backgroundImage,
  imageStyle,
  edgeLitHoverBoost = false,
  stretchInColumn = false,
  networkTier = 'card',
}: LocalHomeParityCardProps): ReactElement {
  const fashionAccent = FASHION_ACCENT[accent];
  const webPremium = Platform.OS === 'web';

  return (
    <View
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      accessible
      style={[
        { width: '100%', minWidth: 0 },
        webPremium && fashionHomeWorldCardGlassHostStyle(),
        // Concentric corners: host clip + rim must match the inner world-card radius
        // (radius.lg) so the 1px semantic rim reads as one crisp, even edge.
        webPremium && { borderRadius: vionaTokens.radius.lg },
        // Home parity: persistent base transition so the material glow, semantic rim and
        // hover lift ease in AND out smoothly (matches Home's world-card tint transition).
        webPremium && fashionHomeWebDaylightTransitionStyle(),
        webPremium && fashionHomeWebDaylightWorldCardMaterialStyle(fashionAccent, edgeLitHoverBoost),
        webPremium && fashionHomeWebDaylightWorldCardInnerRimStyle(fashionAccent, edgeLitHoverBoost),
        webPremium && fashionHomeWebWorldCardHostHoverMotionStyle(edgeLitHoverBoost),
      ]}
    >
      {webPremium ? (
        <LocalWorldCardGlassLayers accent={fashionAccent} hoverBoost={edgeLitHoverBoost} />
      ) : null}
      <VionaFashionWorldCard
        accent={fashionAccent}
        title={title}
        subtitle={subtitle}
        backgroundImage={backgroundImage}
        imageStyle={imageStyle}
        icon={<Ionicons name={icon} size={22} color={ICON_COLOR[accent]} />}
        status={{ label: statusLabel, tone: statusTone }}
        onPress={onPress}
        stretchInColumn={stretchInColumn}
        glassMaterialMode={webPremium ? 'edgeLit' : 'default'}
        edgeLitHoverBoost={webPremium && edgeLitHoverBoost}
      />
      <LocalLightingNetworkEdge
        accent={ICON_COLOR[accent]}
        secondaryAccent={NETWORK_SECONDARY[accent]}
        tier={networkTier}
        boosted={edgeLitHoverBoost}
        radius={vionaTokens.radius.lg}
      />
    </View>
  );
}

const glassStyles = StyleSheet.create({
  layers: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: vionaTokens.radius.lg,
    zIndex: 1,
    overflow: 'hidden',
  },
  cornerLitTl: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '52%',
    height: '48%',
    opacity: 0.88,
  },
  cornerBoost: {
    opacity: 1,
  },
  bottomVeil: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '42%',
  },
});
