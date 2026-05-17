import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { VigTokenIcon } from '../../components/ui/VigTokenIcon';
import {
  VionaActionCard,
  VionaActionGrid,
  vionaActionAccentFromHex,
  type VionaStatusPillProps,
} from '../../components/viona';
import type { VionaMiniAppStatus } from '../../components/viona/VionaStatusBadge';
import { brandConfig } from '../../core/brand/brandConfig';
import { useAuth } from '../../context/AuthContext';
import { getFeatureFlags } from '../../core/feature-flags/featureFlags';
import { useMiniAppEntry } from '../../hooks/useMiniAppEntry';
import { formatVioPoints } from '../../core/monetization/vioDisplayLabels';
import { vionaTokens } from '../../design';
import type { RootStackParamList } from '../../navigation/routes';
import { bootstrapLoyaltyProfile } from '../../services/loyalty/LoyaltyService';
import { useKngLoyaltyStore } from '../../state/kngLoyaltyStore';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';
import { applyWebStyles } from '../../utils/applyWebStyles';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export type DashboardB2CScreenProps = Readonly<{
  contentWidth: number;
  /** Preview route only — tighter vertical rhythm; does not affect `/home`. */
  layoutVariant?: 'home' | 'preview';
}>;

function actionBadgeForMiniAppStatus(
  status: VionaMiniAppStatus
): Readonly<{ label: string; tone: VionaStatusPillProps['tone'] }> {
  switch (status) {
    case 'active':
      return { label: 'Active', tone: 'safe' };
    case 'lite':
      return { label: 'Lite', tone: 'lite' };
    case 'beta':
      return { label: 'Beta', tone: 'demo' };
    case 'pilot':
      return { label: 'Pilot', tone: 'pilot' };
    case 'demo':
      return { label: 'Demo', tone: 'demo' };
    case 'gated':
      return { label: 'Gated', tone: 'gated' };
    case 'frozen':
      return { label: 'Paused', tone: 'warning' };
    case 'comingSoon':
      return { label: 'Soon', tone: 'comingSoon' };
  }
}

const ACCENT_LOCAL = vionaActionAccentFromHex(vionaTokens.fashionTech.accentCyan);
const ACCENT_TRAVEL = vionaActionAccentFromHex(vionaTokens.fashionTech.accentGold);
const ACCENT_ACADEMY = vionaActionAccentFromHex(vionaTokens.fashionTech.accentEmerald);

export function DashboardB2CScreen({
  contentWidth,
  layoutVariant = 'home',
}: DashboardB2CScreenProps) {
  const navigation = useNavigation<Nav>();
  const { openMiniApp } = useMiniAppEntry();
  const { user } = useAuth();
  const featureFlags = useMemo(() => getFeatureFlags(), []);
  const isTourist = user?.persona === 'TOURIST';
  const userId = user?.phone?.trim() ?? '';
  const loyaltySnap = useKngLoyaltyStore((s) => (userId.length > 0 ? s.byUser[userId] : undefined));
  const loyaltyPoints = loyaltySnap?.vigTokenBalance ?? 0;

  const liteBadge = useMemo(() => actionBadgeForMiniAppStatus('lite'), []);

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

  const localAction = (
    <VionaActionCard
      key="local"
      iconName="grid-outline"
      kicker="Universe 01"
      title="VIONA LOCAL"
      subtitle="Nails, ẩm thực, chợ sỉ & dịch vụ đồng hương — tốc độ và giá địa phương."
      accent={ACCENT_LOCAL}
      badge={liteBadge}
      tags={['Nails & Beauty', 'Food', 'Wholesale']}
      onPress={openLocal}
      testID="dashboard-b2c-action-local"
    />
  );

  const travelAction = (
    <VionaActionCard
      key="travel"
      iconName="airplane-outline"
      kicker="Universe 02 · Premium"
      title="VIONA TRAVEL"
      subtitle="Homestay Kiều bào, đưa đón sân bay, tour & phiên dịch Minh Khang Live — hệ sinh thái du lịch tách biệt."
      accent={ACCENT_TRAVEL}
      badge={liteBadge}
      tags={['Homestay', 'Translation', 'Tours']}
      onPress={openTravel}
      testID="dashboard-b2c-action-travel"
    />
  );

  const academyAction = (
    <VionaActionCard
      key="academy"
      iconName="school-outline"
      kicker="Universe 03"
      title="VIONA ACADEMY"
      subtitle="Lộ trình AI — tiếng bản địa & tiếng Việt cho gia đình Kiều bào."
      accent={ACCENT_ACADEMY}
      badge={liteBadge}
      tags={['AI Learning', 'Coach']}
      onPress={openAcademy}
      testID="dashboard-b2c-action-academy"
    />
  );

  const isPreview = layoutVariant === 'preview';

  return (
    <View
      style={[
        styles.wrapOuter,
        isPreview && styles.wrapOuterPreview,
        isPreview ? { width: '100%', maxWidth: contentWidth } : { width: contentWidth },
      ]}
    >
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

      <View style={[styles.wrap, isPreview && styles.wrapPreview]}>
        <Text style={[styles.hubEyebrow, isPreview && styles.hubEyebrowPreview]}>
          {isTourist ? 'Travel mode' : 'Đa vũ trụ ứng dụng'}
        </Text>
        <Text style={[styles.hubTitle, isPreview && styles.hubTitlePreview]}>
          {isTourist ? 'Vietnam journey hub' : 'Chọn không gian của bạn'}
        </Text>
        <Text style={[styles.hubSub, isPreview && styles.hubSubPreview]}>
          {isTourist
            ? 'VIONA Travel first · Live translation · VIO Credits in-app for your trip · Academy for quick language wins.'
            : 'VIONA Local cho đời sống hằng ngày · VIONA Travel cho chuyến đi an tâm · VIONA Academy cho học tập AI.'}
        </Text>

        <View style={isPreview ? styles.gridLeadPreview : undefined}>
          <VionaActionGrid widthHint={contentWidth} gap={theme.spacing.lg} testID="dashboard-b2c-action-grid">
          {isTourist ? (
            <>
              {featureFlags.travelEnabled ? travelAction : null}
              {featureFlags.academyEnabled ? academyAction : null}
              {!featureFlags.travelEnabled && !featureFlags.academyEnabled ? localAction : null}
            </>
          ) : (
            <>
              {localAction}
              {featureFlags.travelEnabled ? travelAction : null}
              {featureFlags.academyEnabled ? academyAction : null}
            </>
          )}
        </VionaActionGrid>
        </View>
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
  wrapOuterPreview: {
    alignSelf: 'stretch',
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
  wrapPreview: {
    paddingTop: 0,
  },
  /** Pulls the action row closer to the hub subcopy without overlapping multi-line body text. */
  gridLeadPreview: {
    marginTop: -14,
  },
  hubEyebrow: {
    fontSize: 11,
    letterSpacing: 1,
    color: theme.hybrid.panelCoolTextMuted,
    fontFamily: FontFamily.extrabold,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  hubEyebrowPreview: {
    fontSize: 10,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  hubTitle: {
    fontSize: 24,
    lineHeight: 30,
    color: theme.hybrid.panelCoolText,
    fontFamily: FontFamily.extrabold,
    marginBottom: 8,
  },
  hubTitlePreview: {
    marginBottom: 6,
  },
  hubSub: {
    fontSize: 14,
    lineHeight: 21,
    color: theme.hybrid.panelCoolTextMuted,
    fontFamily: FontFamily.regular,
    marginBottom: theme.spacing.lg,
  },
  hubSubPreview: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: theme.spacing.xs,
  },
});
