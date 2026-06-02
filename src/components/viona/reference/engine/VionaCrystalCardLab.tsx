/**
 * Lab-only crystal card shell — composes material overlays.
 */
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactElement, ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import {
  vionaCrystalLabBody,
  vionaCrystalLabCard,
  vionaCrystalLabOuterGlowStyle,
  vionaCrystalLabSemanticTokens,
  type VionaCrystalLabSemantic,
} from '../../../../design/vionaCrystalLabTokens';
import { vionaReferenceCardWebGlass } from '../../../../design/vionaReferenceVisualTokens';
import { VionaLuminousFloorLab } from './VionaLuminousFloorLab';
import { VionaRefractionOverlayLab } from './VionaRefractionOverlayLab';
import { VionaSpecularOverlayLab } from './VionaSpecularOverlayLab';

export type VionaCrystalCardLabProps = {
  width: number;
  height: number;
  semantic?: VionaCrystalLabSemantic;
  borderRadius?: number;
  testID?: string;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
  scene?: ReactNode;
};

export function VionaCrystalCardLab({
  width,
  height,
  semantic = 'emerald',
  borderRadius = vionaCrystalLabCard.borderRadius,
  testID,
  style,
  children,
  scene,
}: VionaCrystalCardLabProps): ReactElement {
  const tokens = vionaCrystalLabSemanticTokens(semantic);
  const bw = vionaCrystalLabCard.borderWidth;
  const innerRadius = Math.max(0, borderRadius - bw);
  const innerW = width - bw * 2;
  const innerH = height - bw * 2;

  return (
    <View
      testID={testID}
      style={[{ width, height, borderRadius, alignSelf: 'center' }, vionaCrystalLabOuterGlowStyle(semantic), style]}
    >
      <LinearGradient
        colors={[
          'rgba(105, 235, 175, 0.5)',
          'rgba(72, 210, 165, 0.26)',
          'rgba(0, 0, 0, 0.44)',
          'rgba(0, 0, 0, 0.62)',
        ]}
        locations={[0, 0.3, 0.68, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ width, height, borderRadius, padding: bw }}
      >
        <View
          style={[
            {
              width: innerW,
              height: innerH,
              borderRadius: innerRadius,
              overflow: 'hidden',
              backgroundColor: vionaCrystalLabBody.deep,
            },
            vionaReferenceCardWebGlass(),
          ]}
        >
          <View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, { borderRadius: innerRadius, backgroundColor: vionaCrystalLabBody.crystal }]}
          />
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(0,1,3,0.88)', 'rgba(0,1,3,0.32)', 'transparent']}
            locations={[0, 0.3, 0.5]}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '44%',
              borderTopLeftRadius: innerRadius,
              borderTopRightRadius: innerRadius,
            }}
          />
          <LinearGradient
            pointerEvents="none"
            colors={['transparent', 'rgba(72,210,165,0.04)', 'rgba(72,210,165,0.08)']}
            locations={[0.55, 0.85, 1]}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: '42%',
            }}
          />
          <VionaSpecularOverlayLab borderRadius={innerRadius} semantic={semantic} />
          <VionaRefractionOverlayLab borderRadius={innerRadius} semantic={semantic} />
          <VionaLuminousFloorLab borderRadius={innerRadius} semantic={semantic} heightRatio={0.22} />
          <View style={styles.content}>{children}</View>
          {scene ? <View style={styles.scene}>{scene}</View> : null}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    zIndex: 6,
    paddingTop: 11,
    paddingHorizontal: 11,
    paddingBottom: 8,
  },
  scene: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '72%',
    zIndex: 5,
  },
});
