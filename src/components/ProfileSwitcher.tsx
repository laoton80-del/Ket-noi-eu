import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useMemo, useState, type ReactElement } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/routes';
import type { ActiveRole } from '../store/userStore';
import { useTranslation } from '../i18n';
import { SmartTrioLanguageChip } from './smartTrio/SmartTrioLanguageChip';
import { ACTIVE_ROLE_LABEL, useUserStore } from '../store/userStore';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const ROLE_META: Readonly<
  Record<
    ActiveRole,
    Readonly<{ label: string; hint: string; icon: keyof typeof Ionicons.glyphMap }>
  >
> = {
  B2C: { label: 'Consumer', hint: 'Home · Local · Travel · AI', icon: 'person' },
  B2B: { label: 'Merchant', hint: 'Dashboard · menu · orders · wallet', icon: 'storefront' },
  BROKER: { label: 'Broker', hint: 'Radar · QR · commissions · wallet', icon: 'briefcase' },
  ADMIN: {
    label: 'Command Center',
    hint: 'God-Eye · financial radar · ecosystem health',
    icon: 'shield',
  },
};

function triggerHaptic(style: 'light' | 'medium' = 'medium'): void {
  if (Platform.OS === 'web') return;
  void Haptics.impactAsync(
    style === 'light' ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium
  );
}

export type ProfileSwitcherProps = Readonly<{
  tabBarLift: number;
}>;

type VigGate = 'merchant' | 'broker' | null;

export function ProfileSwitcher({ tabBarLift }: ProfileSwitcherProps): ReactElement | null {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width > 768;
  const [open, setOpen] = useState(false);
  const [vigGate, setVigGate] = useState<VigGate>(null);

  const allowedRoles = useUserStore((s) => s.allowedRoles);
  const currentActiveRole = useUserStore((s) => s.currentActiveRole);
  const switchRole = useUserStore((s) => s.switchRole);
  const hasSeenMerchantVigPrompt = useUserStore((s) => s.hasSeenMerchantVigPrompt);
  const hasSeenBrokerVigPrompt = useUserStore((s) => s.hasSeenBrokerVigPrompt);
  const markMerchantVigPromptSeen = useUserStore((s) => s.markMerchantVigPromptSeen);
  const markBrokerVigPromptSeen = useUserStore((s) => s.markBrokerVigPromptSeen);

  const canSwitch = allowedRoles.length > 1;
  const sortedRoles = useMemo(() => [...allowedRoles], [allowedRoles]);

  const chipLabel = useMemo(() => {
    switch (currentActiveRole) {
      case 'B2C':
        return t('home.roleB2C');
      case 'B2B':
        return t('home.roleB2B');
      case 'BROKER':
        return t('home.roleBroker');
      case 'ADMIN':
        return t('home.roleAdmin');
      default:
        return ACTIVE_ROLE_LABEL[currentActiveRole];
    }
  }, [currentActiveRole, t]);

  const isAdminUndercover =
    user?.serverRole === 'ADMIN' && currentActiveRole !== 'ADMIN';

  const finalizeSwitch = useCallback(
    (role: ActiveRole) => {
      triggerHaptic('light');
      switchRole(role);
    },
    [switchRole]
  );

  const onPickRole = useCallback(
    (role: ActiveRole) => {
      if (role === currentActiveRole) {
        setOpen(false);
        return;
      }
      triggerHaptic();

      if (user?.serverRole !== 'ADMIN') {
        if (role === 'B2B' && !hasSeenMerchantVigPrompt) {
          setOpen(false);
          setVigGate('merchant');
          return;
        }
        if (role === 'BROKER' && !hasSeenBrokerVigPrompt) {
          setOpen(false);
          setVigGate('broker');
          return;
        }
      }

      finalizeSwitch(role);
      setOpen(false);
    },
    [
      currentActiveRole,
      finalizeSwitch,
      hasSeenBrokerVigPrompt,
      hasSeenMerchantVigPrompt,
      user?.serverRole,
    ]
  );

  const onVigContinue = useCallback(() => {
    if (vigGate === 'merchant') {
      markMerchantVigPromptSeen();
      finalizeSwitch('B2B');
    } else if (vigGate === 'broker') {
      markBrokerVigPromptSeen();
      finalizeSwitch('BROKER');
    }
    setVigGate(null);
  }, [finalizeSwitch, markBrokerVigPromptSeen, markMerchantVigPromptSeen, vigGate]);

  const onVigDismiss = useCallback(() => {
    triggerHaptic('light');
    setVigGate(null);
  }, []);

  const openAccount = useCallback(() => {
    triggerHaptic();
    setOpen(false);
    navigation.navigate('PersonalHub');
  }, [navigation]);

  const chipLiftStyle = useMemo(() => {
    if (isDesktopWeb) {
      /** Keep profile chip in header zone on wide layouts. */
      return { top: insets.top + 36, right: Math.max(insets.right, 16) };
    }
    return { bottom: tabBarLift + Math.max(insets.bottom, 8) };
  }, [isDesktopWeb, insets.bottom, insets.right, insets.top, tabBarLift]);

  const narrowProfileChip = width < 420;
  const singleAccountLabel = narrowProfileChip ? t('home.accountChipShort') : t('home.accountChip');

  if (!canSwitch) {
    return (
      <>
        <SmartTrioLanguageChip
          tabBarLift={tabBarLift}
          placement="floating"
          isDesktopWeb={isDesktopWeb}
        />
        <Pressable
          onPress={() => {
            triggerHaptic();
            openAccount();
          }}
          style={[
            styles.singleChip,
            isDesktopWeb ? styles.singleChipDesktop : styles.singleChipMobile,
            isDesktopWeb && styles.singleChipDesktopSizing,
            chipLiftStyle,
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('home.accountChipA11y')}
        >
          <Ionicons name="person-circle" size={22} color="#FFFFFF" />
          <Text
            style={styles.singleChipText}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.82}
          >
            {singleAccountLabel}
          </Text>
        </Pressable>
      </>
    );
  }

  return (
    <>
      <Pressable
        onPress={() => {
          triggerHaptic();
          setOpen(true);
        }}
        style={[
          styles.chip,
          isAdminUndercover && styles.chipAdminUndercover,
          isDesktopWeb ? styles.chipDesktop : styles.chipMobile,
          isDesktopWeb && styles.chipDesktopSizing,
          chipLiftStyle,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Switch active profile"
      >
        {isAdminUndercover ? (
          <Ionicons name="ribbon" size={18} color="#FF6B8A" />
        ) : (
          <Ionicons name="shuffle-outline" size={18} color="#FFFFFF" />
        )}
        <Text style={styles.chipText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82}>
          {chipLabel}
        </Text>
        <Ionicons name="chevron-up" size={16} color="rgba(255,255,255,0.85)" />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
            {Platform.OS === 'ios' ? (
              <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFillObject} />
            ) : (
              <View style={[StyleSheet.absoluteFillObject, styles.backdropAndroid]} />
            )}
          </Pressable>
          <Animated.View
            entering={FadeInDown.springify().damping(20).stiffness(280)}
            exiting={FadeOut.duration(100)}
            style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + tabBarLift }]}
          >
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Profile switcher</Text>
            <Text style={styles.sheetSub}>Instant · same app · {ACTIVE_ROLE_LABEL[currentActiveRole]} mode</Text>

            <SmartTrioLanguageChip tabBarLift={tabBarLift} placement="sheet" isDesktopWeb={isDesktopWeb} />

            {sortedRoles.map((role) => {
              const meta = ROLE_META[role];
              const active = role === currentActiveRole;
              return (
                <Pressable
                  key={role}
                  onPress={() => onPickRole(role)}
                  style={({ pressed }) => [
                    styles.roleRow,
                    active && styles.roleRowActive,
                    pressed && { opacity: 0.88 },
                  ]}
                >
                  <View style={[styles.roleIcon, active && styles.roleIconActive]}>
                    <Ionicons name={meta.icon} size={22} color={active ? '#0B1628' : '#FFFFFF'} />
                  </View>
                  <View style={styles.roleMeta}>
                    <Text style={styles.roleLabel}>{meta.label}</Text>
                    <Text style={styles.roleHint}>{meta.hint}</Text>
                  </View>
                  {active ? (
                    <Ionicons name="checkmark-circle" size={22} color="#7AE4FF" />
                  ) : (
                    <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.35)" />
                  )}
                </Pressable>
              );
            })}

            <Pressable
              onPress={openAccount}
              style={({ pressed }) => [styles.accountRow, pressed && { opacity: 0.9 }]}
            >
              <Ionicons name="settings-outline" size={20} color="#C9D6FF" />
              <Text style={styles.accountLabel}>{t('home.accountWalletHubRow')}</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>

      <Modal visible={vigGate !== null} transparent animationType="fade" onRequestClose={onVigDismiss}>
        <Pressable style={styles.vigBackdrop} onPress={onVigDismiss}>
          <Animated.View entering={FadeIn.duration(180)} style={styles.vigCenter}>
            <Pressable onPress={(e) => e.stopPropagation()}>
              <LinearGradient
                colors={
                  vigGate === 'broker' ? ['#1a0f00', '#2d1810', '#0a0908'] : ['#0a1f14', '#0d2818', '#07140f']
                }
                style={styles.vigCard}
              >
                <View style={styles.vigIconRing}>
                  <Ionicons name="diamond" size={32} color="#F5D286" />
                </View>
                <Text style={styles.vigTitle}>{t('home.profileRoleGateTitle')}</Text>
                <Text style={styles.vigBody}>
                  {vigGate === 'broker'
                    ? t('home.profileRoleGateBrokerBody')
                    : t('home.profileRoleGateMerchantBody')}
                </Text>
                <Pressable
                  onPress={onVigContinue}
                  style={({ pressed }) => [styles.vigPrimary, pressed && { opacity: 0.92 }]}
                >
                  <Text style={styles.vigPrimaryLabel}>
                    {vigGate === 'broker'
                      ? t('home.profileRoleGateContinueBroker')
                      : t('home.profileRoleGateContinueMerchant')}
                  </Text>
                  <Ionicons name="arrow-forward" size={20} color="#0B1628" />
                </Pressable>
                <Pressable onPress={onVigDismiss} style={styles.vigSecondary}>
                  <Text style={styles.vigSecondaryLabel}>{t('home.profileRoleGateLater')}</Text>
                </Pressable>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  chipMobile: {
    alignSelf: 'center',
  },
  chipDesktop: {
    alignSelf: 'flex-end',
  },
  chip: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: 'rgba(15, 28, 52, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(111, 156, 255, 0.35)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 45,
    maxWidth: '92%',
  },
  chipDesktopSizing: {
    maxWidth: 260,
  },
  chipText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
  chipAdminUndercover: {
    borderColor: 'rgba(255, 51, 102, 0.85)',
    borderWidth: 2,
    backgroundColor: 'rgba(40, 8, 18, 0.94)',
    shadowColor: '#FF3366',
    shadowOpacity: 0.35,
  },
  singleChipMobile: {
    alignSelf: 'center',
  },
  singleChipDesktop: {
    alignSelf: 'flex-end',
  },
  singleChip: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: 'rgba(15, 28, 52, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    zIndex: 45,
    maxWidth: '92%',
  },
  singleChipDesktopSizing: {
    maxWidth: 200,
  },
  singleChipText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject },
  backdropAndroid: { backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 18,
    paddingTop: 12,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: 'rgba(18, 24, 38, 0.97)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 10,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginBottom: 6,
  },
  sheetTitle: { fontSize: 20, fontWeight: '900', color: '#FFFFFF' },
  sheetSub: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.45)', marginBottom: 6 },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  roleRowActive: {
    borderColor: 'rgba(122, 228, 255, 0.45)',
    backgroundColor: 'rgba(122, 228, 255, 0.08)',
  },
  roleIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  roleIconActive: { backgroundColor: '#7AE4FF' },
  roleMeta: { flex: 1, gap: 2 },
  roleLabel: { fontSize: 15, fontWeight: '900', color: '#FFFFFF' },
  roleHint: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.45)' },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    justifyContent: 'center',
    marginTop: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  accountLabel: { fontSize: 14, fontWeight: '800', color: '#C9D6FF' },
  vigBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    padding: 22,
  },
  vigCenter: { alignItems: 'center' },
  vigCard: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(245, 210, 134, 0.35)',
    gap: 14,
  },
  vigIconRing: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 210, 134, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 210, 134, 0.4)',
  },
  vigTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 28,
  },
  vigBody: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.72)',
    textAlign: 'center',
    lineHeight: 22,
  },
  vigPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F5D286',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 4,
  },
  vigPrimaryLabel: { fontSize: 16, fontWeight: '900', color: '#0B1628' },
  vigSecondary: { paddingVertical: 12, alignItems: 'center' },
  vigSecondaryLabel: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.55)' },
});
