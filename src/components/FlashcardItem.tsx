import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { FontFamily } from '../theme/typography';

const AUDIO_CTA_COPY = 'Mở khóa gói học tập để nghe';

type FlashcardItemProps = {
  prompt: string;
  targetWord: string;
  phonetic?: string;
  knowledge: string;
  audioUnlocked: boolean;
  contentUnlocked?: boolean;
  onPressLockedContent?: () => void;
  onPressAudio: () => void;
};

export function FlashcardItem({
  prompt,
  targetWord,
  phonetic,
  knowledge,
  audioUnlocked,
  contentUnlocked = true,
  onPressLockedContent,
  onPressAudio,
}: FlashcardItemProps) {
  const rotate = useSharedValue(0);

  const frontStyle = useAnimatedStyle(() => {
    const deg = interpolate(rotate.value, [0, 1], [0, 180]);
    return {
      transform: [{ perspective: 1000 }, { rotateY: `${deg}deg` }],
      opacity: rotate.value < 0.5 ? 1 : 0,
    };
  });

  const backStyle = useAnimatedStyle(() => {
    const deg = interpolate(rotate.value, [0, 1], [180, 360]);
    return {
      transform: [{ perspective: 1000 }, { rotateY: `${deg}deg` }],
      opacity: rotate.value < 0.5 ? 0 : 1,
    };
  });

  const onFlip = () => {
    if (!contentUnlocked) {
      onPressLockedContent?.();
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    rotate.value = withSpring(rotate.value > 0.5 ? 0 : 1, {
      stiffness: 180,
      damping: 16,
      mass: 0.9,
    });
  };

  return (
    <Pressable onPress={onFlip} style={({ pressed }) => [styles.wrap, pressed && { opacity: 0.92 }]}>
      <Animated.View style={[styles.card, styles.frontCard, frontStyle]}>
        <Pressable
          onPress={(event) => {
            event.stopPropagation();
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onPressAudio();
          }}
          style={({ pressed }) => [styles.speakerBtn, pressed && { opacity: 0.84 }]}
        >
          <Ionicons name={audioUnlocked ? 'volume-high' : 'lock-closed'} size={18} color="#FFFFFF" />
        </Pressable>
        {!audioUnlocked ? (
          <View style={styles.audioBadgeWrap}>
            <View style={styles.audioBadge}>
              <Ionicons name="diamond" size={11} color="#5F420A" />
              <Text style={styles.audioBadgeText}>Nghe phát âm</Text>
            </View>
            <Text style={styles.audioCtaText}>{AUDIO_CTA_COPY}</Text>
          </View>
        ) : null}
        <Text numberOfLines={4} style={styles.promptText}>
          {prompt}
        </Text>
        {contentUnlocked ? (
          <>
            <Text numberOfLines={2} style={styles.targetWordText}>
              {targetWord}
            </Text>
            {phonetic ? <Text style={styles.phoneticText}>{phonetic}</Text> : null}
          </>
        ) : (
          <View style={styles.lockedContentWrap}>
            <Ionicons name="lock-closed" size={16} color="#8A6A28" />
            <Text style={styles.lockedContentText}>Nội dung bị khóa</Text>
          </View>
        )}
      </Animated.View>
      <Animated.View style={[styles.card, styles.backCard, backStyle]}>
        {contentUnlocked ? (
          <>
            <View>
              <Text style={styles.backTitle}>Tu dich</Text>
              <Text numberOfLines={3} style={styles.meaningText}>
                {targetWord}
              </Text>
            </View>
            <View>
              <Text style={styles.backTitle}>Ghi chu</Text>
              <Text numberOfLines={3} style={styles.knowledgeText}>
                {knowledge}
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.backLockedWrap}>
            <Ionicons name="lock-closed" size={18} color="#A63F3F" />
            <Text style={styles.backLockedText}>Mở khóa để xem toàn bộ kiến thức.</Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '48%',
    height: 200,
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 18,
    padding: 12,
    backfaceVisibility: 'hidden',
    shadowColor: '#8B7355',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 5,
  },
  frontCard: {
    backgroundColor: '#FFFDF8',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  speakerBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C83D3D',
    shadowColor: '#7D2727',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 3,
  },
  promptText: {
    fontSize: 18,
    color: '#2B241B',
    fontFamily: FontFamily.extrabold,
    textAlign: 'center',
    lineHeight: 24,
  },
  targetWordText: {
    marginTop: 10,
    fontSize: 14,
    color: '#5B4A36',
    fontFamily: FontFamily.bold,
    textAlign: 'center',
    lineHeight: 20,
  },
  phoneticText: {
    marginTop: 4,
    fontSize: 12,
    color: '#7F6A50',
    fontFamily: FontFamily.medium,
    textAlign: 'center',
  },
  audioBadgeWrap: {
    position: 'absolute',
    left: 10,
    top: 12,
    alignItems: 'flex-start',
    zIndex: 3,
  },
  audioBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F5D47A',
    borderWidth: 1,
    borderColor: '#C79A32',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  audioBadgeText: {
    color: '#5F420A',
    fontSize: 10,
    fontFamily: FontFamily.bold,
  },
  audioCtaText: {
    marginTop: 3,
    marginLeft: 2,
    color: '#8A6A28',
    fontSize: 10,
    fontFamily: FontFamily.semibold,
  },
  backCard: {
    backgroundColor: '#FFFAF1',
    borderWidth: 1.5,
    borderColor: 'rgba(226, 92, 92, 0.55)',
    justifyContent: 'space-between',
  },
  lockedContentWrap: {
    marginTop: 10,
    minHeight: 28,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(199,154,50,0.45)',
    backgroundColor: 'rgba(245,212,122,0.2)',
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lockedContentText: {
    fontSize: 11,
    color: '#8A6A28',
    fontFamily: FontFamily.semibold,
  },
  backTitle: {
    fontSize: 12,
    color: '#A63F3F',
    fontFamily: FontFamily.bold,
    marginBottom: 4,
    marginTop: 2,
  },
  meaningText: {
    fontSize: 13,
    color: '#2B241B',
    fontFamily: FontFamily.medium,
    lineHeight: 18,
  },
  knowledgeText: {
    fontSize: 12,
    color: '#5B4A36',
    fontFamily: FontFamily.regular,
    lineHeight: 17,
  },
  backLockedWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  backLockedText: {
    fontSize: 12,
    color: '#7D2F2F',
    fontFamily: FontFamily.semibold,
    textAlign: 'center',
  },
});
