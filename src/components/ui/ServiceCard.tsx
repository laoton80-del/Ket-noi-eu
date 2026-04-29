import type { ComponentProps } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { SOSLottiePlayer } from './SOSLottiePlayer';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';

type ServiceCardProps = {
  title: string;
  subtitle: string;
  animationSource: NonNullable<ComponentProps<typeof SOSLottiePlayer>['source']>;
  onPress?: () => void;
};

export function ServiceCard({ title, subtitle, animationSource, onPress }: ServiceCardProps) {
  const webGlassStyle =
    Platform.OS === 'web'
      ? ({ backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' } as unknown as ViewStyle)
      : undefined;

  return (
    <Pressable style={({ pressed }) => [styles.card, webGlassStyle, pressed && styles.pressed]} onPress={onPress}>
      <View style={styles.mediaWrap}>
        <SOSLottiePlayer source={animationSource} style={styles.lottie} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.hybrid.signalSubtleBorder,
    backgroundColor: theme.colors.glass.surface,
    shadowColor: theme.colors.glass.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 6,
  },
  mediaWrap: {
    height: 150,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.glass.surfaceStrong,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.glass.borderSoft,
    paddingHorizontal: theme.spacing.sm,
  },
  lottie: {
    height: 150,
    width: '100%',
  },
  body: {
    padding: 10,
    gap: 4,
  },
  title: {
    color: theme.colors.CeolWhite,
    fontSize: 14,
    fontFamily: FontFamily.bold,
  },
  subtitle: {
    color: theme.colors.text.secondary,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: FontFamily.regular,
  },
  pressed: {
    opacity: 0.78,
  },
});
