/**
 * Wave 3B — shared dark premium app shell (layout-only foundation).
 *
 * COLOR: `leadingAccent` sets hub atmosphere wash only; per-tile feature accents stay multi-color semantic.
 * MEANING: text chips carry status; color is secondary (see premiumTileVisualTokens governance).
 */
import { LinearGradient } from 'expo-linear-gradient';
import { type ReactElement, type ReactNode, type RefObject, useMemo } from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
  type ImageSourcePropType,
  type ScrollView as ScrollViewType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  getVionaBackgroundAssetForViewport,
  resolveLocalLuminousBackgroundOpacity,
  type VionaBackgroundUniverse,
} from '../../design/vionaBackgroundAssets';
import {
  premiumTileCanvas,
  premiumUniverseAccentSpec,
  resolvePremiumShellBottomPadding,
  resolvePremiumShellContentRail,
  type VionaUniverseAccent,
} from '../../design/premiumTileVisualTokens';

export type PremiumAppShellProps = Readonly<{
  children: ReactNode;
  /** Hub atmosphere default — not a lock on tile accent colors. */
  leadingAccent?: VionaUniverseAccent;
  scrollable?: boolean;
  headerOffset?: number;
  /** Explicit background override (wins over registry). */
  backgroundAsset?: ImageSourcePropType;
  /** Legacy alias — same as backgroundAsset. */
  backgroundImage?: ImageSourcePropType;
  backgroundImageOpacity?: number;
  /** When set with enableLuminousBackground, resolves asset from registry by viewport. */
  backgroundUniverse?: VionaBackgroundUniverse;
  /** Enables registry background + readability veil (Local-only in Wave 3B pack). */
  enableLuminousBackground?: boolean;
  withMiniappDockClearance?: boolean;
  withTabBarClearance?: boolean;
  bottomClearanceExtra?: number;
  horizontalPadOverride?: number;
  scrollRef?: RefObject<ScrollViewType | null>;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  testID?: string;
}>;

export function PremiumAppShell({
  children,
  leadingAccent = 'emerald',
  scrollable = true,
  headerOffset = 0,
  backgroundAsset,
  backgroundImage,
  backgroundImageOpacity,
  backgroundUniverse,
  enableLuminousBackground = false,
  withMiniappDockClearance = false,
  withTabBarClearance = true,
  bottomClearanceExtra = 0,
  horizontalPadOverride,
  scrollRef,
  style,
  contentStyle,
  testID,
}: PremiumAppShellProps): ReactElement {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const rail = resolvePremiumShellContentRail(width);
  const horizontalPad = horizontalPadOverride ?? rail.horizontalPad;
  const bottomPad = resolvePremiumShellBottomPadding(width, insets.bottom, {
    withMiniappDock: withMiniappDockClearance,
    withTabBar: withTabBarClearance,
    extra: bottomClearanceExtra,
  });
  const accentSpec = premiumUniverseAccentSpec(leadingAccent);

  const registryBackground = useMemo(() => {
    if (!enableLuminousBackground || !backgroundUniverse) return null;
    return getVionaBackgroundAssetForViewport(backgroundUniverse, width, height);
  }, [backgroundUniverse, enableLuminousBackground, height, width]);

  const resolvedBackground =
    backgroundAsset ?? backgroundImage ?? registryBackground?.source ?? null;
  const resolvedOpacity =
    backgroundImageOpacity ??
    (enableLuminousBackground && backgroundUniverse
      ? resolveLocalLuminousBackgroundOpacity(width)
      : 0.22);
  const showLuminousVeil = enableLuminousBackground && resolvedBackground != null;

  const contentWrapStyle: ViewStyle = {
    width: '100%',
    maxWidth: rail.innerWidth,
    alignSelf: 'center',
    paddingHorizontal: horizontalPad,
    paddingTop: headerOffset + (rail.isMobile ? 6 : 10),
    paddingBottom: bottomPad,
    minWidth: 0,
  };

  const body = (
    <View style={[contentWrapStyle, contentStyle]}>
      {children}
    </View>
  );

  return (
    <View testID={testID} style={[styles.root, style]}>
      <View style={styles.canvas} />
      <View
        pointerEvents="none"
        style={[styles.ambientWash, { backgroundColor: accentSpec.cornerWash }]}
      />
      {resolvedBackground ? (
        <Image
          source={resolvedBackground}
          resizeMode="cover"
          style={[styles.backgroundImage, { opacity: resolvedOpacity }]}
          accessibilityIgnoresInvertColors
        />
      ) : null}
      {showLuminousVeil ? (
        <>
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(5, 11, 20, 0.12)', 'rgba(5, 11, 20, 0.55)']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.readabilityVeil}
          />
          <View pointerEvents="none" style={styles.contentFieldVeil} />
        </>
      ) : null}
      {scrollable ? (
        <ScrollView
          ref={scrollRef}
          style={[styles.scroll, Platform.OS === 'web' && styles.scrollWeb]}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {body}
        </ScrollView>
      ) : (
        <View style={styles.scroll}>{body}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: premiumTileCanvas.base,
    width: '100%',
    maxWidth: '100%',
    overflow: 'hidden',
  },
  canvas: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: premiumTileCanvas.base,
  },
  ambientWash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '38%',
    opacity: 0.35,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  readabilityVeil: {
    ...StyleSheet.absoluteFillObject,
  },
  contentFieldVeil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: premiumTileCanvas.veil,
    opacity: 0.38,
  },
  scroll: {
    flex: 1,
    width: '100%',
    maxWidth: '100%',
  },
  scrollWeb: {
    overflowX: 'hidden',
  } as ViewStyle,
  scrollContent: {
    flexGrow: 1,
    width: '100%',
    maxWidth: '100%',
  },
});
