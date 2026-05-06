import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useDeviceLayout } from '../../hooks/useDeviceLayout';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';

type SOSModalProps = {
  visible: boolean;
  onClose: () => void;
  onEmergencyCall?: () => void;
  onEmbassyCall?: () => void;
  locationText?: string;
};

const HOLD_DURATION_MS = 2000;
const HOLD_TICK_MS = 100;

export function SOSModal({
  visible,
  onClose,
  onEmergencyCall,
  onEmbassyCall,
  locationText = 'Vị trí của bạn: Đang lấy tọa độ...',
}: SOSModalProps) {
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const { isLandscape, isTablet, isWeb, isPortrait } = useDeviceLayout();
  const shouldUseHorizontalActions = isLandscape && (isTablet || isWeb || !isPortrait);

  useEffect(() => {
    if (!visible) {
      setIsHolding(false);
      setHoldProgress(0);
    }
  }, [visible]);

  useEffect(() => {
    if (!isHolding) return;
    const step = HOLD_TICK_MS / HOLD_DURATION_MS;
    const id = setInterval(() => {
      setHoldProgress((prev) => Math.min(1, prev + step));
    }, HOLD_TICK_MS);
    return () => clearInterval(id);
  }, [isHolding]);

  const progressValue = useMemo(() => Math.round(holdProgress * 100), [holdProgress]);
  const progressWidth = `${progressValue}%` as `${number}%`;

  const resetHold = () => {
    setIsHolding(false);
    setHoldProgress(0);
  };

  const triggerEmergency = () => {
    resetHold();
    if (onEmergencyCall) {
      onEmergencyCall();
    }
  };

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.headerRow}>
            <Ionicons name="warning" size={26} color={theme.colors.RouteError} />
            <Text style={styles.headerTitle}>TRƯỜNG HỢP KHẨN CẤP</Text>
          </View>

          <View style={styles.locationCard}>
            <Text style={styles.locationLabel}>VỊ TRÍ HIỆN TẠI</Text>
            <Text style={styles.locationText}>{locationText}</Text>
          </View>

          <Pressable
            delayLongPress={HOLD_DURATION_MS}
            onPressIn={() => {
              setIsHolding(true);
              setHoldProgress(0);
            }}
            onPressOut={resetHold}
            onLongPress={triggerEmergency}
            style={({ pressed }) => [styles.primaryAction, pressed && styles.primaryActionPressed]}
          >
            <Text style={styles.primaryActionTitle}>GIỮ ĐỂ GỌI KHẨN CẤP</Text>
            <Text style={styles.primaryActionSub}>
              {isHolding ? `Đang giữ... ${progressValue}%` : 'Nhấn và giữ 2 giây để xác nhận cuộc gọi'}
            </Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: progressWidth }]} />
            </View>
          </Pressable>

          <View style={[styles.secondaryActions, shouldUseHorizontalActions && styles.secondaryActionsRow]}>
            <Pressable
              onPress={onEmbassyCall}
              style={({ pressed }) => [
                styles.secondaryBtn,
                shouldUseHorizontalActions && styles.secondaryBtnRowItem,
                pressed && { opacity: 0.84 },
              ]}
            >
              <Text style={styles.secondaryBtnText}>Gọi Đại sứ quán</Text>
            </Pressable>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.cancelBtn,
                shouldUseHorizontalActions && styles.secondaryBtnRowItem,
                pressed && { opacity: 0.84 },
              ]}
            >
              <Text style={styles.cancelBtnText}>Đóng (Hủy)</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay.dim,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.backgroundDeep,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  headerTitle: {
    ...theme.typeScale.h2,
    color: theme.hybrid.chipErrorText,
    fontFamily: FontFamily.extrabold,
  },
  locationCard: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.RouteError,
    backgroundColor: theme.hybrid.chipErrorBg,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  locationLabel: {
    ...theme.typeScale.caption,
    color: theme.hybrid.chipErrorText,
    fontFamily: FontFamily.semibold,
  },
  locationText: {
    ...theme.typeScale.body,
    color: theme.colors.CeolWhite,
    fontFamily: FontFamily.bold,
  },
  primaryAction: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.RouteError,
    backgroundColor: theme.colors.RouteError,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    gap: theme.spacing.sm,
    shadowColor: theme.colors.glass.shadow,
    shadowOffset: theme.elevation.modal.shadowOffset,
    shadowOpacity: theme.elevation.modal.shadowOpacity,
    shadowRadius: theme.elevation.modal.shadowRadius,
    elevation: theme.elevation.modal.elevation,
  },
  primaryActionPressed: {
    opacity: 0.9,
  },
  primaryActionTitle: {
    ...theme.typeScale.h2,
    color: theme.colors.CeolWhite,
    fontFamily: FontFamily.extrabold,
  },
  primaryActionSub: {
    ...theme.typeScale.caption,
    color: theme.colors.CeolWhite,
    fontFamily: FontFamily.medium,
  },
  progressTrack: {
    width: '100%',
    height: 8,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.executive.panelMuted,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.CeolWhite,
  },
  secondaryActions: {
    gap: theme.spacing.sm,
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  secondaryBtnRowItem: {
    flex: 1,
  },
  secondaryBtn: {
    minHeight: theme.components.button.height.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.RouteError,
    backgroundColor: theme.hybrid.chipErrorBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    ...theme.typeScale.body,
    color: theme.hybrid.chipErrorText,
    fontFamily: FontFamily.bold,
  },
  cancelBtn: {
    minHeight: theme.components.button.height.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.executive.panelMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    ...theme.typeScale.body,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.semibold,
  },
});
