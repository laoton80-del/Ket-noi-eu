import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrecisePanel } from '../../components/ui/PrecisePanel';
import { StatusChip, type StatusChipState } from '../../components/ui/StatusChip';
import { AI_TEACHER_PREMIUM_USD, PRICING_BASELINE_CURRENCY } from '../../config/pricingConfig';
import type { RootStackParamList } from '../../navigation/routes';
import { useAiStream } from '../../services/academy/AiStreamClient';
import { getAiTeacherPrompt } from '../../services/academy/TeacherPrompt';
import { useRegionState } from '../../state/region';
import { b2cTheme } from '../../theme/appModeThemes';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';
import { formatCurrency } from '../../utils/currencyFormatter';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function LiveAiTeacherScreen() {
  const navigation = useNavigation<Nav>();
  const stream = useAiStream();
  const { currentCountry, localLanguage } = useRegionState();
  const [whiteboardText, setWhiteboardText] = useState('');
  const [avatarSpeech, setAvatarSpeech] = useState('');
  const [isCharging, setIsCharging] = useState(false);

  useEffect(() => {
    stream.onMessage((message) => {
      setAvatarSpeech(message.speech);
      setWhiteboardText(message.whiteboard);
    });
  }, [stream]);

  const statusState: StatusChipState = useMemo(() => {
    if (stream.state === 'live') return 'Cleared';
    if (stream.state === 'connecting') return 'Pending';
    if (stream.state === 'error') return 'Error';
    return 'Processing';
  }, [stream.state]);

  const aiTeacherPrompt = useMemo(
    () => getAiTeacherPrompt(localLanguage, currentCountry),
    [localLanguage, currentCountry]
  );

  const handleConnectToggle = async () => {
    if (isCharging) return;
    if (stream.state === 'live' || stream.state === 'connecting') {
      stream.disconnect();
      return;
    }
    setIsCharging(true);
    try {
      await stream.connect(aiTeacherPrompt);
    } catch {
      Alert.alert('Không thể bắt đầu phiên', 'Không thể kết nối phiên học lúc này. Vui lòng thử lại.');
    } finally {
      setIsCharging(false);
    }
  };

  const isConnected = stream.state === 'live' || stream.state === 'connecting';
  const mainActionLabel = isCharging ? 'Đang xử lý...' : isConnected ? 'Ngắt kết nối' : 'Bắt đầu phiên';

  const handleMicPress = () => {
    if (isCharging || stream.state !== 'live') return;
    stream.sendAudio('sample_base64_audio');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Gia sư AI trực tiếp</Text>
          <Text style={styles.contextText}>Ngữ cảnh: {currentCountry}</Text>
        </View>
        <StatusChip state={statusState} />
      </View>

      <View
        style={[
          styles.premiumUpsell,
          { backgroundColor: b2cTheme.colors.card, borderColor: b2cTheme.colors.border },
        ]}
      >
        <View style={styles.premiumUpsellHeader}>
          <Ionicons name="school" size={18} color={b2cTheme.colors.primary} />
          <Text style={styles.premiumUpsellTitle}>Cô giáo AI — Thẻ Học Giả</Text>
        </View>
        <Text style={styles.premiumUpsellKicker}>Premium Learner</Text>
        <Text style={styles.premiumUpsellPrice}>
          {formatCurrency(AI_TEACHER_PREMIUM_USD, PRICING_BASELINE_CURRENCY)} / tháng — đăng ký qua Ví (upsell)
        </Text>
        <Text style={styles.premiumUpsellCreditsNote}>
          Bài học & mic trong app: trừ Xu (Credits); không hiển thị fiat theo phút tại màn hình này.
        </Text>
        <Text style={styles.premiumUpsellHero}>
          Luyện hội thoại không giới hạn 24/7 — Unlimited 24/7 speaking practice.
        </Text>
        <Text style={styles.premiumUpsellLine}>Nhập vai tình huống thực tế — Real-life roleplay scenarios.</Text>
        <Pressable
          onPress={() => navigation.navigate('Wallet')}
          style={({ pressed }) => [styles.premiumUpsellCta, pressed && { opacity: 0.88 }]}
          accessibilityRole="button"
          accessibilityLabel="Đăng ký Thẻ Học Giả"
        >
          <Text style={styles.premiumUpsellCtaText}>Xem đăng ký & thanh toán</Text>
          <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
        </Pressable>
      </View>

      <View style={styles.videoStage}>
        <View style={[styles.avatarPlaceholder, stream.state === 'live' && styles.avatarLiveGlow]}>
          <Ionicons name="videocam" size={40} color={theme.colors.SignatureGold} />
          <Text style={styles.avatarTitle}>Luồng avatar AI</Text>
          <Text style={styles.avatarHint}>Video avatar WebRTC sẽ hiển thị tại đây.</Text>
        </View>
        <Text style={styles.avatarSpeech} numberOfLines={3}>
          {avatarSpeech || 'Gia sư AI đang sẵn sàng hội thoại thời gian thực.'}
        </Text>
      </View>

      {whiteboardText.trim() ? (
        <PrecisePanel style={styles.whiteboardPanel}>
          <Text style={styles.whiteboardTitle}>Bảng ghi chú</Text>
          <Text style={styles.whiteboardLine}>{whiteboardText}</Text>
        </PrecisePanel>
      ) : null}

      <View style={styles.controlsWrap}>
        <Pressable
          style={({ pressed }) => [
            styles.mainActionBtn,
            isConnected ? styles.disconnectBtn : styles.connectBtn,
            isCharging && styles.mainActionDisabled,
            pressed && { opacity: 0.8 },
          ]}
          onPress={() => {
            void handleConnectToggle();
          }}
          disabled={isCharging}
        >
          {isCharging ? (
            <View style={styles.processingWrap}>
              <ActivityIndicator size="small" color={theme.colors.CeolWhite} />
              <Text style={styles.mainActionText}>{mainActionLabel}</Text>
            </View>
          ) : (
            <Text style={styles.mainActionText}>{mainActionLabel}</Text>
          )}
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.controlButton, styles.controlActive, pressed && { opacity: 0.8 }]}
          onPress={handleMicPress}
          disabled={isCharging}
        >
          <Ionicons name="mic" size={20} color={theme.colors.onAccent} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.DeepInkNavy,
  },
  header: {
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: theme.colors.SignatureGold,
    ...theme.typeScale.body,
    fontFamily: FontFamily.bold,
  },
  headerCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: 12,
  },
  contextText: {
    marginTop: 2,
    color: theme.colors.SignatureGold,
    ...theme.typeScale.caption,
    fontFamily: FontFamily.medium,
    opacity: 0.9,
  },
  premiumUpsell: {
    marginHorizontal: 14,
    marginBottom: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  premiumUpsellHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  premiumUpsellTitle: {
    flex: 1,
    color: b2cTheme.colors.text,
    ...theme.typeScale.body,
    fontFamily: FontFamily.extrabold,
  },
  premiumUpsellKicker: {
    color: b2cTheme.colors.primary,
    ...theme.typeScale.caption,
    fontFamily: FontFamily.bold,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  premiumUpsellPrice: {
    color: b2cTheme.colors.primary,
    ...theme.typeScale.h2,
    fontFamily: FontFamily.bold,
  },
  premiumUpsellCreditsNote: {
    color: 'rgba(11, 22, 40, 0.72)',
    ...theme.typeScale.caption,
    fontFamily: FontFamily.regular,
    lineHeight: 18,
  },
  premiumUpsellHero: {
    color: b2cTheme.colors.text,
    ...theme.typeScale.body,
    fontFamily: FontFamily.extrabold,
    lineHeight: 22,
  },
  premiumUpsellLine: {
    color: 'rgba(11, 22, 40, 0.62)',
    ...theme.typeScale.caption,
    fontFamily: FontFamily.medium,
    lineHeight: 18,
  },
  premiumUpsellCta: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 42,
    borderRadius: 12,
    backgroundColor: b2cTheme.colors.primary,
    paddingHorizontal: 14,
    alignSelf: 'stretch',
  },
  premiumUpsellCtaText: {
    color: '#FFFFFF',
    ...theme.typeScale.caption,
    fontFamily: FontFamily.bold,
  },
  videoStage: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 120,
    justifyContent: 'center',
  },
  avatarPlaceholder: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    backgroundColor: theme.colors.overlay.ringCore,
    minHeight: 320,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  avatarLiveGlow: {
    borderColor: theme.colors.SignalBlue,
    shadowColor: theme.colors.SignatureGold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  avatarTitle: {
    marginTop: 12,
    color: theme.colors.text.primary,
    ...theme.typeScale.h2,
    fontFamily: FontFamily.extrabold,
  },
  avatarHint: {
    marginTop: 8,
    color: theme.colors.text.secondary,
    ...theme.typeScale.caption,
    textAlign: 'center',
    fontFamily: FontFamily.medium,
  },
  avatarSpeech: {
    marginTop: 12,
    color: theme.colors.text.secondary,
    ...theme.typeScale.caption,
    textAlign: 'center',
  },
  whiteboardPanel: {
    position: 'absolute',
    right: 12,
    bottom: 126,
    width: '56%',
    backgroundColor: theme.colors.CeolWhite,
  },
  whiteboardTitle: {
    color: theme.colors.SignatureGold,
    ...theme.typeScale.caption,
    fontFamily: FontFamily.semibold,
    marginBottom: 8,
  },
  whiteboardLine: {
    color: theme.colors.GraphiteBlue,
    ...theme.typeScale.caption,
    fontFamily: FontFamily.medium,
  },
  controlsWrap: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 24,
    minHeight: 72,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.hybrid.borderOnInk,
    backgroundColor: theme.colors.overlay.ringSoft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  mainActionBtn: {
    minWidth: 126,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  connectBtn: {
    backgroundColor: theme.hybrid.signal,
    borderColor: theme.colors.SignalBlue,
  },
  disconnectBtn: {
    backgroundColor: theme.colors.RouteError,
    borderColor: theme.colors.RouteError,
  },
  mainActionText: {
    color: theme.colors.CeolWhite,
    ...theme.typeScale.caption,
    fontFamily: FontFamily.bold,
  },
  mainActionDisabled: {
    opacity: 0.78,
  },
  processingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlButton: {
    minWidth: 64,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.overlay.ringSoft,
  },
  controlActive: {
    borderWidth: 1,
    borderColor: theme.hybrid.signatureLine,
  },
});
