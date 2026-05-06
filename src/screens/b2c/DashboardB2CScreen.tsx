import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { VigTokenIcon } from '../../components/ui/VigTokenIcon';
import { VionaMiniAppCard } from '../../components/viona/VionaMiniAppCard';
import { brandConfig } from '../../core/brand/brandConfig';
import { useAuth } from '../../context/AuthContext';
import { getFeatureFlags } from '../../core/feature-flags/featureFlags';
import { useMiniAppEntry } from '../../hooks/useMiniAppEntry';
import { formatVioPoints } from '../../core/monetization/vioDisplayLabels';
import type { RootStackParamList } from '../../navigation/routes';
import { bootstrapLoyaltyProfile } from '../../services/loyalty/LoyaltyService';
import { useKngLoyaltyStore } from '../../state/kngLoyaltyStore';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';
import { applyWebStyles } from '../../utils/applyWebStyles';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export type DashboardB2CScreenProps = Readonly<{
  contentWidth: number;
}>;

export function DashboardB2CScreen({ contentWidth }: DashboardB2CScreenProps) {
  const navigation = useNavigation<Nav>();
  const { openMiniApp } = useMiniAppEntry();
  const { user } = useAuth();
  const featureFlags = useMemo(() => getFeatureFlags(), []);
  const isTourist = user?.persona === 'TOURIST';
  const userId = user?.phone?.trim() ?? '';
  const loyaltySnap = useKngLoyaltyStore((s) => (userId.length > 0 ? s.byUser[userId] : undefined));
  const loyaltyPoints = loyaltySnap?.vigTokenBalance ?? 0;

  useEffect(() => {
    if (userId.length === 0) return;
    void bootstrapLoyaltyProfile(userId);
  }, [userId]);

  const openLoyalty = useCallback(() => {
    if (!featureFlags.vigTokenEconomyEnabled) {
      Alert.alert('Rewards', 'Token economy surfaces are not available in this MVP build.');
      return;
    }
    navigation.navigate('LoyaltyRewards');
  }, [featureFlags.vigTokenEconomyEnabled, navigation]);

  const openLocal = useCallback(() => {
    openMiniApp('local', () => navigation.navigate('LocalUniverse'));
  }, [navigation, openMiniApp]);

  const openTravel = useCallback(() => {
    openMiniApp('travel', () => navigation.navigate('TravelHub', {}));
  }, [navigation, openMiniApp]);

  const openAcademy = useCallback(() => {
    openMiniApp('academy', () => navigation.navigate('AdultLearningHome'));
  }, [navigation, openMiniApp]);

  const localCard = (
    <VionaMiniAppCard
      key="local"
      kicker="Universe 01"
      title="VIONA LOCAL"
      description="Nails, ẩm thực, chợ sỉ & dịch vụ đồng hương — tốc độ và giá địa phương."
      iconName="grid-outline"
      status="lite"
      tags={['Nails & Beauty', 'Food', 'Wholesale']}
      onPress={openLocal}
      surfaceVariant="light"
    />
  );

  const travelCard = (
    <VionaMiniAppCard
      key="travel"
      kicker="Universe 02 · Premium"
      title="VIONA TRAVEL"
      description="Homestay Kiều bào, đưa đón sân bay, tour & phiên dịch Minh Khang Live — hệ sinh thái du lịch tách biệt."
      iconName="airplane-outline"
      status="lite"
      tags={['Homestay', 'Translation', 'Tours']}
      onPress={openTravel}
      surfaceVariant="premium"
    />
  );

  const academyCard = (
    <VionaMiniAppCard
      key="academy"
      kicker="Universe 03"
      title="VIONA ACADEMY"
      description="Lộ trình AI — tiếng bản địa & tiếng Việt cho gia đình Kiều bào."
      iconName="school-outline"
      status="lite"
      tags={['AI Learning', 'Coach']}
      onPress={openAcademy}
      surfaceVariant="light"
    />
  );

  return (
    <View style={[styles.wrapOuter, { width: contentWidth }]}>
      {featureFlags.vigTokenEconomyEnabled ? (
        <Pressable
          onPress={openLoyalty}
          style={({ pressed }) => [styles.vipBadge, pressed && { opacity: 0.9 }]}
          className={applyWebStyles('kn-glass')}
          accessibilityRole="button"
          accessibilityLabel={
            userId.length > 0
              ? `${brandConfig.displayName} Rewards — ${formatVioPoints(loyaltyPoints)}`
              : `${brandConfig.displayName} Rewards — đăng nhập`
          }
        >
          <VigTokenIcon size={16} />
          <Text style={styles.vipBadgeText} numberOfLines={1}>
            {userId.length > 0 ? formatVioPoints(loyaltyPoints) : `${brandConfig.displayName} Rewards · Đăng nhập`}
          </Text>
        </Pressable>
      ) : null}

      <View style={styles.wrap}>
        <Text style={styles.hubEyebrow}>{isTourist ? 'Travel mode' : 'Đa vũ trụ ứng dụng'}</Text>
        <Text style={styles.hubTitle}>{isTourist ? 'Vietnam journey hub' : 'Chọn không gian của bạn'}</Text>
        <Text style={styles.hubSub}>
          {isTourist
            ? 'VIONA Travel first · Live translation · VIO Credits in-app for your trip · Academy for quick language wins.'
            : 'VIONA Local cho đời sống hằng ngày · VIONA Travel cho chuyến đi an tâm · VIONA Academy cho học tập AI.'}
        </Text>

        {isTourist ? (
          <View style={styles.miniAppList}>
            {featureFlags.travelEnabled ? travelCard : null}
            {featureFlags.academyEnabled ? academyCard : null}
            {!featureFlags.travelEnabled && !featureFlags.academyEnabled ? localCard : null}
          </View>
        ) : (
          <View style={styles.miniAppList}>
            {localCard}
            {featureFlags.travelEnabled ? travelCard : null}
            {featureFlags.academyEnabled ? academyCard : null}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapOuter: {
    position: 'relative',
    alignSelf: 'center',
    marginBottom: theme.spacing.lg,
  },
  vipBadge: {
    position: 'absolute',
    top: -4,
    right: 0,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.hybrid.panelCoolBorder,
    backgroundColor: '#FFFFFF',
    maxWidth: '72%',
    shadowColor: '#0B1628',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  vipBadgeText: {
    fontSize: 12,
    fontFamily: FontFamily.extrabold,
    color: theme.hybrid.panelCoolText,
    flexShrink: 1,
  },
  wrap: {
    paddingTop: 36,
  },
  miniAppList: {
    flexDirection: 'column',
    gap: theme.spacing.md,
  },
  hubEyebrow: {
    fontSize: 11,
    letterSpacing: 1,
    color: theme.hybrid.panelCoolTextMuted,
    fontFamily: FontFamily.extrabold,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  hubTitle: {
    fontSize: 24,
    lineHeight: 30,
    color: theme.hybrid.panelCoolText,
    fontFamily: FontFamily.extrabold,
    marginBottom: 8,
  },
  hubSub: {
    fontSize: 14,
    lineHeight: 21,
    color: theme.hybrid.panelCoolTextMuted,
    fontFamily: FontFamily.regular,
    marginBottom: theme.spacing.lg,
  },
});
