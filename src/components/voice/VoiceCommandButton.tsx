import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';

export function VoiceCommandButton() {
  const [listening, setListening] = useState(false);
  const pulse = useSharedValue(0);

  const waveStyle = useAnimatedStyle(() => ({
    opacity: 0.28 + pulse.value * 0.6,
    transform: [{ scale: 1 + pulse.value * 0.4 }],
  }));

  const toggleListening = () => {
    if (!listening) {
      setListening(true);
      pulse.value = withRepeat(withTiming(1, { duration: 700 }), -1, true);
      void Haptics.selectionAsync();
      return;
    }

    setListening(false);
    pulse.value = withTiming(0, { duration: 180 });
    void Haptics.selectionAsync();
  };

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      {listening ? (
        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.overlayBubble}>
          <Text style={styles.overlayText}>Đang nghe... (Đang đặt lịch cho Anna lúc 3h...)</Text>
        </Animated.View>
      ) : null}

      <Pressable onPress={toggleListening} style={({ pressed }) => [styles.micButton, pressed && { opacity: 0.84 }]}>
        {listening ? <Animated.View style={StyleSheet.flatten([styles.wave, waveStyle])} /> : null}
        <Ionicons name={listening ? 'mic' : 'mic-outline'} size={20} color={theme.colors.CeolWhite} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  overlayBubble: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.executive.panelMuted,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    maxWidth: 280,
  },
  overlayText: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.medium,
    color: theme.colors.text.primary,
  },
  micButton: {
    width: 54,
    height: 54,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.hybrid.signalSubtleBorder,
    backgroundColor: theme.hybrid.signalStrong,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  wave: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.CeolWhite,
  },
});
