/**
 * Sci-fi / cyberpunk card shell — gradient-wrapper edge (no `borderWidth`).
 * Web: multi-layer `box-shadow` + `backdrop-filter` via `assets/global.css`.
 * Native: `LinearGradient` rim + `expo-blur` glass fill.
 */
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { type ReactElement, type ReactNode, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { FontFamily } from '../../theme/typography';
import { applyWebStyles } from '../../utils/applyWebStyles';
import {
  neonCardBoxShadow,
  resolveNeonCardTheme,
  type NeonCardThemeColor,
} from './neonCardTheme';

const RADIUS = 16;
const INNER_RADIUS = RADIUS - 1;
const GLASS_FILL = 'rgba(5, 8, 16, 0.85)';

export type NeonCardProps = Readonly<{
  themeColor?: NeonCardThemeColor;
  title?: string;
  description?: string;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  onPress?: () => void;
}>;

export function NeonCard({
  themeColor = 'emerald-400',
  title,
  description,
  children,
  style,
  contentStyle,
  onPress,
}: NeonCardProps): ReactElement {
  const [hovered, setHovered] = useState(false);
  const theme = resolveNeonCardTheme(themeColor);
  const { rgb } = theme;
  const webShadow = neonCardBoxShadow(rgb, hovered);

  const shell = (
    <View
      style={[
        styles.glowShell,
        {
          shadowColor: theme.accent,
          shadowOpacity: hovered ? 0.55 : 0.32,
          shadowRadius: hovered ? 22 : 14,
          shadowOffset: { width: 0, height: 0 },
          elevation: hovered ? 8 : 4,
        },
        Platform.OS === 'web'
          ? ({
              boxShadow: webShadow,
              transitionProperty: 'box-shadow',
              transitionDuration: '200ms',
              transitionTimingFunction: 'ease-out',
            } as ViewStyle)
          : null,
        style,
      ]}
      className={applyWebStyles('kn-neon-card-glow')}
    >
      <LinearGradient
        colors={[theme.accent, 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientWrap}
      >
        <View style={styles.innerClip} className={applyWebStyles('kn-neon-card-inner')}>
          {Platform.OS === 'ios' || Platform.OS === 'android' ? (
            <BlurView
              pointerEvents="none"
              intensity={Platform.OS === 'ios' ? 24 : 18}
              tint="dark"
              style={StyleSheet.absoluteFillObject}
            />
          ) : null}
          <View style={[styles.innerSurface, contentStyle]}>
            {title ? <Text style={styles.title}>{title}</Text> : null}
            {description ? <Text style={styles.description}>{description}</Text> : null}
            {children}
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => [onPress && pressed ? styles.pressed : null]}
    >
      {shell}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  glowShell: {
    borderRadius: RADIUS,
    overflow: 'visible',
  },
  gradientWrap: {
    padding: 1,
    borderRadius: RADIUS,
  },
  innerClip: {
    width: '100%',
    minHeight: '100%',
    borderRadius: INNER_RADIUS,
    overflow: 'hidden',
    backgroundColor: GLASS_FILL,
  },
  innerSurface: {
    width: '100%',
    minHeight: '100%',
    padding: 16,
    backgroundColor: Platform.OS === 'web' ? 'transparent' : GLASS_FILL,
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        } as ViewStyle)
      : {}),
  },
  title: {
    fontFamily: FontFamily.semibold,
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: 0.35,
    color: '#F1F5F9',
    marginBottom: 6,
  },
  description: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(148, 163, 184, 0.88)',
    marginBottom: 12,
  },
  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.995 }],
  },
});
