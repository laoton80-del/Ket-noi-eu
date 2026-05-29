/**
 * Local hub flagship card — Home world-card grammar (edge-lit, icon + copy, optional photo).
 * Theme-invariant: premium dark-glass host + edge-lit interior on web regardless of app daylight toggle.
 */
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ComponentProps, ReactElement } from 'react';
import { useMemo, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { vionaTokens } from '../../../design';
import type { LocalHeroVisualKey } from '../../../design/vionaLocalHeroAssets';
import {
  FASHION_HOME_DAYLIGHT_WORLD_BOTTOM_VEIL,
  FASHION_HOME_DAYLIGHT_WORLD_CORNER_LIT_TL,
  type FashionHomeWorldCardDaylightAccent,
  type FashionHomeWebMagneticOffset,
  createFashionHomeWebWorldCardPointerHandlers,
  fashionHomeWebDaylightTransitionStyle,
  fashionHomeWebDaylightWorldCardInnerRimStyle,
  fashionHomeWebDaylightWorldCardMaterialStyle,
  fashionHomeWebWorldCardHostMotionStyle,
  fashionHomeWorldCardGlassHostStyle,
  useFashionHomePrefersReducedMotion,
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
  /** @deprecated Prefer internal pointer hover; kept for host-driven hero sync fallback. */
  edgeLitHoverBoost?: boolean;
  /** Drives dynamic hero crossfade when this card is hovered (web). */
  heroKey?: LocalHeroVisualKey;
  onHeroHoverChange?: (key: LocalHeroVisualKey | null) => void;
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
  edgeLitHoverBoost: edgeLitHoverBoostProp,
  heroKey,
  onHeroHoverChange,
  stretchInColumn = false,
  networkTier = 'card',
}: LocalHomeParityCardProps): ReactElement {
  const fashionAccent = FASHION_ACCENT[accent];
  const webPremium = Platform.OS === 'web';
  const reduceMotion = useFashionHomePrefersReducedMotion();
  const [pointerHovered, setPointerHovered] = useState(false);
  const [magnetic, setMagnetic] = useState<FashionHomeWebMagneticOffset | null>(null);
  const hoverBoost = edgeLitHoverBoostProp ?? pointerHovered;

  const hostHandlers = useMemo(
    () =>
      webPremium
        ? createFashionHomeWebWorldCardPointerHandlers({
            accent: fashionAccent,
            reduceMotion,
            onActiveAccent: (active) => {
              const isActive = active === fashionAccent;
              setPointerHovered(isActive);
              if (heroKey != null && onHeroHoverChange) {
                onHeroHoverChange(isActive ? heroKey : null);
              }
            },
            onMagnetic: setMagnetic,
          })
        : {},
    [webPremium, fashionAccent, reduceMotion, heroKey, onHeroHoverChange]
  );

  return (
    <View
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      accessible
      {...hostHandlers}
      style={[
        { width: '100%', minWidth: 0 },
        webPremium && fashionHomeWorldCardGlassHostStyle(),
        webPremium && { borderRadius: vionaTokens.radius.lg },
        webPremium && fashionHomeWebDaylightTransitionStyle(),
        webPremium && fashionHomeWebDaylightWorldCardMaterialStyle(fashionAccent, hoverBoost),
        webPremium && fashionHomeWebDaylightWorldCardInnerRimStyle(fashionAccent, hoverBoost),
        webPremium &&
          fashionHomeWebWorldCardHostMotionStyle(
            fashionAccent,
            pointerHovered ? fashionAccent : null,
            magnetic,
            reduceMotion
          ),
      ]}
    >
      {webPremium ? (
        <LocalWorldCardGlassLayers accent={fashionAccent} hoverBoost={hoverBoost} />
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
        edgeLitHoverBoost={webPremium && hoverBoost}
      />
      <LocalLightingNetworkEdge
        accent={ICON_COLOR[accent]}
        secondaryAccent={NETWORK_SECONDARY[accent]}
        tier={networkTier}
        boosted={hoverBoost}
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
    opacity: 1.01,
  },
  bottomVeil: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '42%',
  },
});
