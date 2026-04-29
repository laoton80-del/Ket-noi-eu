import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  Layout,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useRoute, type ParamListBase, type RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';

type AICopilotFabProps = {
  onSuggestionPress?: (suggestion: string) => void;
};

const SUGGESTION_BY_ROUTE: Record<string, string> = {
  GlobalWallet: 'Lặp lại giao dịch gần nhất?',
  Wallet: 'Kiểm tra gói nạp phù hợp?',
  SmartCalendar: 'Xem tóm tắt hôm nay?',
  InboundQueue: 'Tự động phân loại yêu cầu?',
};

export function AICopilotFab({ onSuggestionPress }: AICopilotFabProps) {
  const route = useRoute<RouteProp<ParamListBase>>();
  const [expanded, setExpanded] = useState(false);
  const scale = useSharedValue(1);

  const suggestion = useMemo(() => {
    return SUGGESTION_BY_ROUTE[route.name] ?? 'Bạn cần gợi ý nhanh theo ngữ cảnh này?';
  }, [route.name]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onToggle = () => {
    setExpanded((prev) => !prev);
    scale.value = withSpring(1.06, { damping: 12, stiffness: 220 }, () => {
      scale.value = withSpring(1, { damping: 14, stiffness: 240 });
    });
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <Animated.View style={StyleSheet.flatten([styles.wrap, animatedStyle])} pointerEvents="box-none">
      {expanded ? (
        <Animated.View entering={FadeIn} exiting={FadeOut} layout={Layout.springify()} style={styles.suggestionWrap}>
          <BlurView intensity={28} tint="dark" style={styles.suggestionBlur}>
            <Pressable
              onPress={() => {
                onSuggestionPress?.(suggestion);
                void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }}
              style={({ pressed }) => [styles.suggestionPress, pressed && { opacity: 0.86 }]}
            >
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </Pressable>
          </BlurView>
        </Animated.View>
      ) : null}

      <Pressable onPress={onToggle} style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}>
        <BlurView intensity={36} tint="dark" style={styles.fabBlur}>
          <Ionicons name="sparkles-outline" size={20} color={theme.colors.primaryBright} />
        </BlurView>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: theme.spacing.md,
    bottom: theme.spacing.xxl,
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
    zIndex: 1200,
  },
  suggestionWrap: {
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    maxWidth: 280,
  },
  suggestionBlur: {
    minHeight: 48,
    justifyContent: 'center',
  },
  suggestionPress: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  suggestionText: {
    ...theme.typeScale.caption,
    color: theme.colors.text.primary,
    fontFamily: FontFamily.medium,
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: theme.radius.pill,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.hybrid.signalSubtleBorder,
    shadowColor: theme.colors.glass.shadow,
    shadowOffset: theme.elevation.fab.shadowOffset,
    shadowOpacity: theme.elevation.fab.shadowOpacity,
    shadowRadius: theme.elevation.fab.shadowRadius,
    elevation: theme.elevation.fab.elevation,
  },
  fabPressed: {
    opacity: 0.9,
  },
  fabBlur: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.glass.surfaceStrong,
  },
});
