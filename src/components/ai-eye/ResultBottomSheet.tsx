import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import type { VisionResultPayload } from '../../api/visionPipeline';
import { FontFamily } from '../../theme/typography';

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
              <Ionicons name="diamond" size={10} color="#D4AF37" />
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
    borderColor: 'rgba(212, 175, 55, 0.38)',
    backgroundColor: '#F8F2E6',
    shadowColor: '#5B4730',
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
    backgroundColor: 'rgba(125, 96, 42, 0.35)',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 30,
  },
  sectionTitle: {
    fontSize: 15,
    color: '#2A231A',
    fontFamily: FontFamily.bold,
    marginTop: 10,
    marginBottom: 6,
  },
  translation: {
    fontSize: 14,
    lineHeight: 21,
    color: '#4A443D',
    fontStyle: 'italic',
    fontFamily: FontFamily.regular,
  },
  knowledgeCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
    backgroundColor: 'rgba(255,255,255,0.64)',
    padding: 12,
  },
  knowledgeText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#D4AF37',
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
    fontSize: 14,
    lineHeight: 20,
    color: '#D65A5A',
    fontFamily: FontFamily.regular,
  },
  saveOuter: {
    marginTop: 16,
    borderRadius: 14,
    padding: 2,
    backgroundColor: 'rgba(212,175,55,0.75)',
  },
  saveInner: {
    height: 46,
    borderRadius: 12,
    backgroundColor: '#C93A3A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    color: '#FFEAD1',
    fontFamily: FontFamily.bold,
    fontSize: 14,
  },
});
