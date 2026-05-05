import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { VigTokenIcon } from '../../components/ui/VigTokenIcon';
import { brandConfig } from '../../core/brand/brandConfig';
import { useAuth } from '../../context/AuthContext';
import { getFeatureFlags } from '../../core/feature-flags/featureFlags';
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
    navigation.navigate('LocalUniverse');
  }, [navigation]);

  const openTravel = useCallback(() => {
    if (!featureFlags.travelEnabled) {
      Alert.alert('Travel', 'Travel is not available in this MVP build.');
      return;
    }
    navigation.navigate('TravelHub', {});
  }, [featureFlags.travelEnabled, navigation]);

  const openAcademy = useCallback(() => {
    if (!featureFlags.academyEnabled) {
      Alert.alert('Academy', 'Academy and learning surfaces are not available in this MVP build.');
      return;
    }
    navigation.navigate('AdultLearningHome');
  }, [featureFlags.academyEnabled, navigation]);

  const localCard = (
    <Pressable
      key="local"
      onPress={openLocal}
      style={({ pressed }) => [styles.universeCard, styles.localCard, pressed && styles.cardPressed]}
      className={applyWebStyles('kn-glass')}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardEmoji}>🏙️</Text>
        <View style={styles.cardTitleCol}>
          <Text style={styles.cardKicker}>Universe 01</Text>
          <Text style={styles.cardTitle}>VIONA LOCAL</Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color={theme.hybrid.signalStrong} />
      </View>
      <Text style={styles.cardBody}>Nails, ẩm thực, chợ sỉ & dịch vụ đồng hương — tốc độ và giá địa phương.</Text>
      <View style={styles.pillRow}>
        <View style={styles.pill}>
          <Text style={styles.pillText}>Nails & Beauty</Text>
        </View>
        <View style={styles.pill}>
          <Text style={styles.pillText}>Food</Text>
        </View>
        <View style={styles.pill}>
          <Text style={styles.pillText}>Wholesale</Text>
        </View>
      </View>
    </Pressable>
  );

  const travelCard = (
    <Pressable
      key="travel"
      onPress={openTravel}
      style={({ pressed }) => [styles.universeCard, styles.travelCard, pressed && styles.cardPressed]}
      className={applyWebStyles('kn-glass kn-neon-b2b')}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardEmoji}>✈️</Text>
        <View style={styles.cardTitleCol}>
          <Text style={[styles.cardKicker, styles.travelKicker]}>Universe 02 · Premium</Text>
          <Text style={[styles.cardTitle, styles.travelTitle]}>VIONA TRAVEL</Text>
        </View>
        <Ionicons name="airplane" size={22} color="#C5A059" />
      </View>
      <Text style={[styles.cardBody, styles.travelBody]}>
        Homestay Kiều bào, đưa đón sân bay, tour & phiên dịch Minh Khang Live — hệ sinh thái du lịch tách biệt.
      </Text>
      <View style={styles.pillRow}>
        <View style={[styles.pill, styles.pillGold]}>
          <Text style={styles.pillTextGold}>Homestay</Text>
        </View>
        <View style={[styles.pill, styles.pillGold]}>
          <Text style={styles.pillTextGold}>Translation</Text>
        </View>
        <View style={[styles.pill, styles.pillGold]}>
          <Text style={styles.pillTextGold}>Tours</Text>
        </View>
      </View>
    </Pressable>
  );

  const academyCard = (
    <Pressable
      key="academy"
      onPress={openAcademy}
      style={({ pressed }) => [styles.universeCard, styles.academyCard, pressed && styles.cardPressed]}
      className={applyWebStyles('kn-glass')}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardEmoji}>🎓</Text>
        <View style={styles.cardTitleCol}>
          <Text style={styles.cardKicker}>Universe 03</Text>
          <Text style={styles.cardTitle}>VIONA ACADEMY</Text>
        </View>
        <Ionicons name="school-outline" size={22} color={theme.hybrid.signalStrong} />
      </View>
      <Text style={styles.cardBody}>Lộ trình AI — tiếng bản địa & tiếng Việt cho gia đình Kiều bào.</Text>
      <View style={styles.pillRow}>
        <View style={styles.pill}>
          <Text style={styles.pillText}>AI Learning</Text>
        </View>
        <View style={styles.pill}>
          <Text style={styles.pillText}>Coach</Text>
        </View>
      </View>
    </Pressable>
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
          <>
            {featureFlags.travelEnabled ? travelCard : null}
            {featureFlags.academyEnabled ? academyCard : null}
            {!featureFlags.travelEnabled && !featureFlags.academyEnabled ? localCard : null}
          </>
        ) : (
          <>
            {localCard}
            {featureFlags.travelEnabled ? travelCard : null}
            {featureFlags.academyEnabled ? academyCard : null}
          </>
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
  universeCard: {
    borderRadius: 20,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    minHeight: 148,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.hybrid.panelCoolBorder,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0B1628',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  localCard: {
    borderLeftWidth: 4,
    borderLeftColor: theme.hybrid.signalStrong,
  },
  travelCard: {
    minHeight: 168,
    borderWidth: 2,
    borderColor: 'rgba(197, 160, 89, 0.55)',
    backgroundColor: 'rgba(255, 252, 245, 0.98)',
    shadowColor: '#C5A059',
    shadowOpacity: 0.22,
    shadowRadius: 22,
    elevation: 8,
  },
  academyCard: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.SoftEmerald,
  },
  cardPressed: {
    opacity: 0.92,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: 10,
  },
  cardEmoji: {
    fontSize: 36,
  },
  cardTitleCol: {
    flex: 1,
    minWidth: 0,
  },
  cardKicker: {
    fontSize: 11,
    color: theme.hybrid.panelCoolTextMuted,
    fontFamily: FontFamily.semibold,
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  travelKicker: {
    color: 'rgba(90, 70, 40, 0.75)',
  },
  cardTitle: {
    fontSize: 22,
    fontFamily: FontFamily.extrabold,
    color: theme.hybrid.panelCoolText,
    letterSpacing: 0.3,
  },
  travelTitle: {
    color: '#3d2f1a',
  },
  cardBody: {
    fontSize: 14,
    lineHeight: 21,
    color: theme.hybrid.panelCoolTextMuted,
    fontFamily: FontFamily.regular,
    marginBottom: 12,
  },
  travelBody: {
    color: 'rgba(61, 47, 26, 0.88)',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.hybrid.panelCool,
    borderWidth: 1,
    borderColor: theme.hybrid.panelCoolBorder,
  },
  pillText: {
    fontSize: 12,
    color: theme.hybrid.panelCoolText,
    fontFamily: FontFamily.semibold,
  },
  pillGold: {
    backgroundColor: 'rgba(197, 160, 89, 0.16)',
    borderColor: 'rgba(197, 160, 89, 0.45)',
  },
  pillTextGold: {
    fontSize: 12,
    color: '#5c451f',
    fontFamily: FontFamily.bold,
  },
});
