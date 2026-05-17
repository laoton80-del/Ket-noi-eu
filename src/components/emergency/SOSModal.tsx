import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from '../../i18n';
import { useDeviceLayout } from '../../hooks/useDeviceLayout';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';

type SOSModalProps = {
  visible: boolean;
  onClose: () => void;
  /** @deprecated Use in-sheet alerts only — no auto-dial in global SOS guidance. */
  onEmergencyCall?: () => void;
  onEmbassyCall?: () => void;
  locationText?: string;
};

const HOLD_DURATION_MS = 3000;
const HOLD_TICK_MS = 100;

export function SOSModal({
  visible,
  onClose,
  onEmergencyCall,
  onEmbassyCall,
  locationText,
}: SOSModalProps) {
  const { t } = useTranslation();
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const { isLandscape, isTablet, isWeb, isPortrait } = useDeviceLayout();
  const shouldUseHorizontalActions = isLandscape && (isTablet || isWeb || !isPortrait);

  const resolvedLocation = locationText ?? t('sos.legacyModalLocationFallback');

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
      return;
    }
    Alert.alert(t('sos.legacyEmergencyAlertTitle'), t('sos.legacyEmergencyAlertBody'));
  };

  const onEmbassyPress = () => {
    if (onEmbassyCall) {
      onEmbassyCall();
      return;
    }
    Alert.alert(t('sos.legacyEmbassyAlertTitle'), t('sos.legacyEmbassyAlertBody'));
  };

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.headerRow}>
            <Ionicons name="warning" size={26} color={theme.colors.RouteError} />
            <Text style={styles.headerTitle}>{t('sos.legacyModalHeader')}</Text>
          </View>

          <View style={styles.locationCard}>
            <Text style={styles.locationLabel}>{t('sos.legacyModalLocationLabel')}</Text>
            <Text style={styles.locationText}>{resolvedLocation}</Text>
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
            <Text style={styles.primaryActionTitle}>{t('sos.legacyHoldTitle')}</Text>
            <Text style={styles.primaryActionSub}>
              {isHolding
                ? t('sos.legacyModalHolding', { percent: progressValue })
                : t('sos.legacyModalHoldSeconds')}
            </Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: progressWidth }]} />
            </View>
          </Pressable>

          <View style={[styles.secondaryActions, shouldUseHorizontalActions && styles.secondaryActionsRow]}>
            <Pressable
              onPress={onEmbassyPress}
              style={({ pressed }) => [
                styles.secondaryBtn,
                shouldUseHorizontalActions && styles.secondaryBtnRowItem,
                pressed && { opacity: 0.84 },
              ]}
            >
              <Text style={styles.secondaryBtnText}>{t('sos.legacyEmbassy')}</Text>
            </Pressable>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.cancelBtn,
                shouldUseHorizontalActions && styles.secondaryBtnRowItem,
                pressed && { opacity: 0.84 },
              ]}
            >
              <Text style={styles.cancelBtnText}>{t('sos.close')}</Text>
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
