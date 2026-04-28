import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import type { VisionResultPayload } from '../../api/visionPipeline';
import { FontFamily } from '../../theme/typography';
import { theme } from '../../theme/theme';

type ResultBottomSheetProps = {
  visible: boolean;
  result: VisionResultPayload | null;
  onSave: () => void;
};

export function ResultBottomSheet({ visible, result, onSave }: ResultBottomSheetProps) {
  const translateY = useSharedValue(520);

  useEffect(() => {
    translateY.value = withTiming(visible ? 0 : 520, { duration: 280 });
  }, [translateY, visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View pointerEvents={visible ? 'auto' : 'none'} style={[styles.sheet, animatedStyle]}>
      <View style={styles.drag} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>📝 Dịch đề</Text>
        <Text style={styles.translation}>{result?.dichDe ?? ''}</Text>

        <Text style={styles.sectionTitle}>🧠 Kiến thức trọng tâm</Text>
        <View style={styles.knowledgeCard}>
          <Text style={styles.knowledgeText}>{result?.kienThuc ?? ''}</Text>
        </View>

        <Text style={styles.sectionTitle}>💡 Hướng dẫn Bố Mẹ</Text>
        <View style={styles.promptList}>
          {(result?.cauHoiGoiMo ?? []).map((item) => (
            <View key={item} style={styles.promptRow}>
              <Ionicons name="diamond" size={10} color={theme.colors.SignatureGold} />
              <Text style={styles.promptText}>{item}</Text>
            </View>
          ))}
        </View>

        <Pressable onPress={onSave} style={({ pressed }) => [styles.saveOuter, pressed && { opacity: 0.84 }]}>
          <View style={styles.saveInner}>
            <Text style={styles.saveText}>Lưu thành Thẻ học 3D</Text>
          </View>
        </Pressable>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '57%',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    backgroundColor: theme.colors.CeolWhite,
    shadowColor: theme.colors.glass.shadow,
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 8,
  },
  drag: {
    alignSelf: 'center',
    marginTop: 8,
    width: 54,
    height: 5,
    borderRadius: 4,
    backgroundColor: theme.colors.glass.borderSoft,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 30,
  },
  sectionTitle: {
    ...theme.typeScale.body,
    color: theme.colors.GraphiteBlue,
    fontFamily: FontFamily.bold,
    marginTop: 10,
    marginBottom: 6,
  },
  translation: {
    ...theme.typeScale.body,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
    fontFamily: FontFamily.regular,
  },
  knowledgeCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.SoftMineralGrey,
    padding: 12,
  },
  knowledgeText: {
    ...theme.typeScale.body,
    color: theme.colors.SignatureGold,
    fontFamily: FontFamily.bold,
  },
  promptList: { gap: 8, marginTop: 2 },
  promptRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  promptText: {
    flex: 1,
    ...theme.typeScale.body,
    color: theme.colors.RouteError,
    fontFamily: FontFamily.regular,
  },
  saveOuter: {
    marginTop: 16,
    borderRadius: 14,
    padding: 2,
    backgroundColor: theme.colors.glass.gradientStrong,
  },
  saveInner: {
    height: 46,
    borderRadius: 12,
    backgroundColor: theme.colors.RouteError,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    color: theme.colors.CeolWhite,
    ...theme.typeScale.body,
  },
});
