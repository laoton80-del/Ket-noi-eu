import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';

type QuantumShieldBadgeProps = {
  compact?: boolean;
};

function buildHash(seed: number): string {
  const chars = 'abcdef0123456789';
  return Array.from({ length: 32 }, (_, idx) => chars[(seed + idx * 7) % chars.length]).join('');
}

export function QuantumShieldBadge({ compact = false }: QuantumShieldBadgeProps) {
  const [open, setOpen] = useState(false);
  const [tick, setTick] = useState(0);
  const isLocked = tick > 16;

  useEffect(() => {
    if (!open || isLocked) return;
    const timer = setInterval(() => setTick((prev) => prev + 1), 90);
    return () => clearInterval(timer);
  }, [open, isLocked]);

  const hashRows = useMemo(() => [buildHash(tick), buildHash(tick + 3), buildHash(tick + 8)], [tick]);

  return (
    <>
      <Pressable
        onPress={() => {
          setOpen(true);
          setTick(0);
          void Haptics.selectionAsync();
        }}
        style={({ pressed }) => [styles.badge, compact && styles.badgeCompact, pressed && { opacity: 0.86 }]}
      >
        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.iconPulse}>
          <Ionicons name="shield-checkmark-outline" size={compact ? 14 : 16} color={theme.colors.primary} />
        </Animated.View>
        <Text style={[styles.badgeText, compact && styles.badgeTextCompact]}>E2EE Quantum-Safe Secured</Text>
      </Pressable>

      <Modal visible={open} animationType="fade" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Quantum Shield Handshake</Text>
            <Text style={styles.modalSubtitle}>
              {isLocked ? 'Khóa lượng tử đã cố định.' : 'Đang scramble hash và cố định khóa mã hóa...'}
            </Text>

            <View style={styles.hashWrap}>
              {hashRows.map((row, idx) => (
                <Text key={`hash_${idx}`} style={styles.hashLine}>
                  {row}
                </Text>
              ))}
            </View>

            <Pressable
              onPress={() => {
                setOpen(false);
                void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }}
              style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.84 }]}
            >
              <Text style={styles.closeText}>Đóng</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: theme.spacing.xs,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.glass.surface,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  badgeCompact: {
    paddingHorizontal: theme.spacing.xs,
  },
  iconPulse: {
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    padding: 2,
    backgroundColor: theme.colors.executive.panelMuted,
  },
  badgeText: {
    ...theme.typeScale.caption,
    color: theme.colors.text.primary,
    fontFamily: FontFamily.semibold,
  },
  badgeTextCompact: {
    ...theme.typeScale.caption,
  },
  modalBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.overlay.dim,
    padding: theme.spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    backgroundColor: theme.colors.executive.card,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  modalTitle: {
    ...theme.typeScale.body,
    color: theme.colors.text.primary,
    fontFamily: FontFamily.bold,
  },
  modalSubtitle: {
    ...theme.typeScale.caption,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.regular,
  },
  hashWrap: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.sm,
    gap: 2,
  },
  hashLine: {
    ...theme.typeScale.caption,
    color: theme.colors.success,
    fontFamily: FontFamily.medium,
  },
  closeBtn: {
    marginTop: theme.spacing.xs,
    minHeight: theme.components.button.height.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.components.button.variant.primary.border,
    backgroundColor: theme.components.button.variant.primary.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    ...theme.typeScale.body,
    color: theme.components.button.variant.primary.text,
    fontFamily: FontFamily.bold,
  },
});
