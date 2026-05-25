/**
 * Guided intent entry — luminous dark premium cutover (visual only; behavior unchanged).
 */
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { PremiumTileMicroSceneKind } from '../design/premiumTileMicroScene';
import {
  premiumLuminousInk,
  premiumModalGlass,
  premiumTileGlass,
  premiumTileWebBackdropBlur,
  premiumUniverseAccentSpec,
  type VionaUniverseAccent,
} from '../design/premiumTileVisualTokens';
import type { GuidedIntentId } from '../onboarding/guidedOnboardingStorage';
import { FontFamily } from '../theme/typography';
import { PremiumAppTile } from './viona/PremiumAppTile';

const OPTIONS: Readonly<
  { id: GuidedIntentId; label: string; icon: keyof typeof Ionicons.glyphMap; accent: VionaUniverseAccent; scene: PremiumTileMicroSceneKind }[]
> = [
  { id: 'call_book', label: 'Gọi / đặt lịch', icon: 'call', accent: 'emerald', scene: 'chat-request-beam' },
  { id: 'language', label: 'Không hiểu tiếng', icon: 'language', accent: 'violet', scene: 'social-nodes' },
  { id: 'documents', label: 'Làm giấy tờ', icon: 'document-text', accent: 'cyan', scene: 'data-doc-matrix' },
  { id: 'services', label: 'Tìm dịch vụ', icon: 'location', accent: 'emerald', scene: 'marketplace-grid' },
];

type Props = {
  visible: boolean;
  onSelectIntent: (id: GuidedIntentId) => void;
  onSkip: () => void;
};

export function IntentEntryModal({ visible, onSelectIntent, onSkip }: Props) {
  if (!visible) return null;

  const emeraldStroke = premiumUniverseAccentSpec('emerald').stroke;

  return (
    <Modal visible animationType="fade" transparent onRequestClose={onSkip}>
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <View
            style={[
              styles.card,
              { borderColor: emeraldStroke },
              premiumTileWebBackdropBlur(premiumTileGlass.backdropBlurDefault),
            ]}
          >
            <LinearGradient
              pointerEvents="none"
              colors={[premiumUniverseAccentSpec('emerald').cornerWash, 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardWash}
            />
            <View pointerEvents="none" style={[styles.cardHighlight, { borderTopColor: premiumModalGlass.innerHighlight }]} />
            <Text style={styles.question}>Bạn đang cần gì nhất lúc này?</Text>
            <Text style={styles.sub}>Chọn một mục — app sẽ đưa bạn thẳng vào việc.</Text>
            <View style={styles.grid}>
              {OPTIONS.map((opt) => (
                <View key={opt.id} style={styles.optionCell}>
                  <PremiumAppTile
                    variant="local"
                    accent={opt.accent}
                    microScene={opt.scene}
                    icon={opt.icon}
                    title={opt.label}
                    width="100%"
                    onPress={() => onSelectIntent(opt.id)}
                    accessibilityLabel={opt.label}
                    testID={`intent-entry-${opt.id}`}
                  />
                </View>
              ))}
            </View>
            <Pressable onPress={onSkip} style={({ pressed }) => [styles.skip, pressed && { opacity: 0.75 }]}>
              <Text style={styles.skipText}>Để sau</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: premiumModalGlass.backdrop,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  safe: { flex: 1, justifyContent: 'center' },
  card: {
    borderRadius: 22,
    padding: 20,
    borderWidth: premiumTileGlass.edgeWidth,
    backgroundColor: premiumModalGlass.surface,
    overflow: 'hidden',
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  cardWash: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.85,
  },
  cardHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  question: {
    fontSize: 22,
    fontFamily: FontFamily.extrabold,
    color: premiumLuminousInk.titleBright,
    textAlign: 'center',
    marginBottom: 8,
  },
  sub: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: FontFamily.semibold,
    color: premiumLuminousInk.subtitle,
    textAlign: 'center',
    marginBottom: 18,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  optionCell: {
    width: '47%',
    minWidth: 140,
  },
  skip: {
    marginTop: 18,
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
    color: premiumLuminousInk.subtitle,
  },
});
