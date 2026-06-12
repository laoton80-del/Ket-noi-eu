/**
 * VIONA Wave 3B — transparent flagship micro-scene asset layer (PNG primary).
 * Falls back to procedural vector scenes when dedicated artwork is not imported.
 */
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactElement, ReactNode } from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import {
  getLocalFlagshipSceneAssetMeta,
  getVionaLocalFlagshipSceneAsset,
  vionaLocalFlagshipSceneLayout,
  type LocalFlagshipSceneAssetKey,
  type LocalFlagshipScenePosition,
} from '../../../design/vionaLocalFlagshipSceneAssets';
import {
  premiumUniverseAccentSpec,
  type VionaUniverseAccent,
} from '../../../design/premiumTileVisualTokens';
import { isLocalFlagshipArtScene, LocalFlagshipMicroScene } from './LocalFlagshipMicroScene';
import { LocalVectorMicroScene } from './LocalVectorMicroScene';
import type { LocalVectorMicroSceneKey } from './localVectorMicroSceneKeys';

export type LocalFlagshipSceneAssetLayerProps = Readonly<{
  sceneKey: LocalFlagshipSceneAssetKey;
  accent?: VionaUniverseAccent;
  width?: number | `${number}%`;
  height?: number | `${number}%`;
  style?: StyleProp<ViewStyle>;
  /** Explicit fallback (e.g. lab SVG hero). Overrides vector registry when asset missing. */
  fallback?: ReactNode;
  replicaFlagship?: boolean;
  testID?: string;
}>;

function positionStyle(position: LocalFlagshipScenePosition): ViewStyle {
  switch (position) {
    case 'lower-left':
      return { alignItems: 'flex-start' };
    case 'lower-right':
      return { alignItems: 'flex-end' };
    default:
      return { alignItems: 'center' };
  }
}

function ProceduralFallback({
  sceneKey,
  accent,
  replicaFlagship,
}: {
  sceneKey: LocalFlagshipSceneAssetKey;
  accent: VionaUniverseAccent;
  replicaFlagship: boolean;
}): ReactElement {
  const meta = getLocalFlagshipSceneAssetMeta(sceneKey);
  const vectorKey = meta.fallbackSceneKey as LocalVectorMicroSceneKey;
  if (replicaFlagship && isLocalFlagshipArtScene(vectorKey)) {
    return <LocalFlagshipMicroScene sceneKey={vectorKey} />;
  }
  return (
    <LocalVectorMicroScene
      sceneKey={vectorKey}
      accent={accent}
      prominent
      replicaFlagship={replicaFlagship}
      sceneScale="primary"
    />
  );
}

export function LocalFlagshipSceneAssetLayer({
  sceneKey,
  accent: accentOverride,
  width = '100%',
  height = '100%',
  style,
  fallback,
  replicaFlagship = true,
  testID,
}: LocalFlagshipSceneAssetLayerProps): ReactElement {
  const meta = getLocalFlagshipSceneAssetMeta(sceneKey);
  const accent = accentOverride ?? meta.accent;
  const spec = premiumUniverseAccentSpec(accent);
  const asset = getVionaLocalFlagshipSceneAsset(sceneKey);

  if (!asset) {
    return (
      <View
        testID={testID}
        style={[styles.shell, { width, height }, positionStyle(meta.recommendedPosition), style]}
      >
        <View style={styles.textSafe} pointerEvents="none" />
        {fallback ?? (
          <ProceduralFallback sceneKey={sceneKey} accent={accent} replicaFlagship={replicaFlagship} />
        )}
      </View>
    );
  }

  const glowColor = spec.glowHover;

  return (
    <View
      testID={testID}
      style={[styles.shell, { width, height }, positionStyle(meta.recommendedPosition), style]}
    >
      <View style={styles.textSafe} pointerEvents="none" />
      <LinearGradient
        pointerEvents="none"
        colors={['transparent', glowColor, 'transparent']}
        locations={[0.35, 0.72, 1]}
        style={styles.meshVeil}
      />
      <View
        pointerEvents="none"
        style={[
          styles.platformGlow,
          {
            width: `${Math.round(vionaLocalFlagshipSceneLayout.platformGlowWidthRatio * 100)}%`,
            backgroundColor: glowColor,
            opacity: 0.34,
          },
        ]}
      />
      <View
        style={[
          styles.assetWrap,
          {
            transform: [{ scale: meta.recommendedScale }],
          },
          Platform.OS === 'web'
            ? ({
                boxShadow: `0 0 22px ${glowColor}, 0 10px 32px rgba(0,0,0,0.45)`,
              } as ViewStyle)
            : {
                shadowColor: spec.glow,
                shadowOpacity: 0.42,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 6 },
                elevation: 6,
              },
        ]}
      >
        <Image
          source={asset.source}
          accessibilityIgnoresInvertColors
          resizeMode="contain"
          style={[styles.assetImage, { opacity: meta.recommendedOpacity }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    justifyContent: 'flex-end',
    overflow: 'visible',
  },
  textSafe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: `${Math.round(vionaLocalFlagshipSceneLayout.textSafeTopRatio * 100)}%`,
    zIndex: 2,
  },
  meshVeil: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: `${Math.round(vionaLocalFlagshipSceneLayout.sceneBandHeightRatio * 100)}%`,
    opacity: vionaLocalFlagshipSceneLayout.meshVeilOpacity,
    zIndex: 1,
  },
  platformGlow: {
    position: 'absolute',
    bottom: 6,
    height: vionaLocalFlagshipSceneLayout.platformGlowHeight,
    borderRadius: 999,
    zIndex: 3,
  },
  assetWrap: {
    width: '92%',
    height: `${Math.round(vionaLocalFlagshipSceneLayout.sceneBandHeightRatio * 100)}%`,
    justifyContent: 'flex-end',
    alignItems: 'center',
    zIndex: 4,
  },
  assetImage: {
    width: '100%',
    height: '100%',
  },
});
