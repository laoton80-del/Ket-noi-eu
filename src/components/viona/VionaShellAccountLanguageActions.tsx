import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { type ReactElement, useCallback } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { useTranslation } from '../../utils/i18n';
import { FontFamily } from '../../theme/typography';

export type VionaShellAccountLanguageLayout = 'bottomChip' | 'leftRail';

export type VionaShellAccountLanguageActionsProps = Readonly<{
  layout?: VionaShellAccountLanguageLayout;
  showRolePicker: boolean;
  onPressAccount: () => void;
  onPressLanguage: () => void;
  onPressRole: () => void;
}>;

const MIN_TOUCH = 44;
const ACCENT = '#7AE4FF';
const isNative = Platform.OS !== 'web';

function triggerHaptic(): void {
  if (Platform.OS === 'web') return;
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

/**
 * Tab-chrome Account / Language / Role actions (bottom bar or desktop left rail).
 * Not an absolute floating overlay over application content.
 * P4-A: native-gated Account chip geometry only. Web chrome styles stay unchanged.
 */
export function VionaShellAccountLanguageActions({
  layout = 'bottomChip',
  showRolePicker,
  onPressAccount,
  onPressLanguage,
  onPressRole,
}: VionaShellAccountLanguageActionsProps): ReactElement {
  const { t } = useTranslation();
  const isLeftRail = layout === 'leftRail';
  const nativeBottomAccount = isNative && !isLeftRail;

  const onAccount = useCallback(() => {
    triggerHaptic();
    onPressAccount();
  }, [onPressAccount]);

  const onLanguage = useCallback(() => {
    triggerHaptic();
    onPressLanguage();
  }, [onPressLanguage]);

  const onRole = useCallback(() => {
    triggerHaptic();
    onPressRole();
  }, [onPressRole]);

  return (
    <View
      style={[styles.row, isLeftRail && styles.rowRail]}
      testID="viona-shell-account-language-actions"
      accessibilityRole="toolbar"
    >
      <Pressable
        testID="viona-shell-account-action"
        onPress={onAccount}
        style={({ pressed }) => [styles.hit, isLeftRail && styles.hitRail, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={t('home.accountChipA11y')}
      >
        <View
          style={[
            styles.chip,
            isLeftRail && styles.chipRail,
            nativeBottomAccount && styles.nativeAccountChip,
          ]}
        >
          <Ionicons name="person-circle" size={isLeftRail ? 16 : 18} color="#FFFFFF" />
          <Text
            style={[
              styles.label,
              isLeftRail && styles.labelRail,
              nativeBottomAccount && styles.nativeAccountLabel,
            ]}
            numberOfLines={1}
          >
            {t('home.accountChipShort')}
          </Text>
        </View>
      </Pressable>

      <Pressable
        testID="viona-shell-language-action"
        onPress={onLanguage}
        style={({ pressed }) => [styles.hit, isLeftRail && styles.hitRail, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={t('smartTrio.switcher.title')}
      >
        <View style={[styles.chip, styles.chipLanguage, isLeftRail && styles.chipRail]}>
          <Ionicons name="globe-outline" size={isLeftRail ? 16 : 18} color={ACCENT} />
          {isLeftRail ? (
            <Text style={[styles.label, styles.labelLanguage, styles.labelRail]} numberOfLines={1}>
              {t('shell.utility.language')}
            </Text>
          ) : null}
        </View>
      </Pressable>

      {showRolePicker ? (
        <Pressable
          testID="viona-shell-role-action"
          onPress={onRole}
          style={({ pressed }) => [styles.hit, isLeftRail && styles.hitRail, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Switch active profile"
        >
          <View style={[styles.chip, styles.chipRole, isLeftRail && styles.chipRail]}>
            <Ionicons name="shuffle-outline" size={isLeftRail ? 16 : 18} color="#FFFFFF" />
            {isLeftRail ? (
              <Text style={[styles.label, styles.labelRail]} numberOfLines={1}>
                {t('shell.utility.switchRole')}
              </Text>
            ) : null}
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowRail: {
    flexDirection: 'column',
    width: '100%',
    gap: 8,
  },
  hit: {
    minWidth: MIN_TOUCH,
    minHeight: MIN_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hitRail: {
    width: '100%',
  },
  pressed: {
    opacity: 0.88,
  },
  chip: {
    minHeight: MIN_TOUCH,
    minWidth: 44,
    maxWidth: 56,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(15, 28, 52, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  chipLanguage: {
    borderColor: 'rgba(122, 228, 255, 0.36)',
  },
  chipRole: {
    borderColor: 'rgba(111, 156, 255, 0.35)',
  },
  chipRail: {
    maxWidth: 78,
    width: '100%',
    paddingHorizontal: 6,
  },
  nativeAccountChip: {
    maxWidth: 128,
    minWidth: MIN_TOUCH,
    paddingHorizontal: 8,
    flexShrink: 0,
  },
  label: {
    fontFamily: FontFamily.extrabold,
    fontSize: 8,
    letterSpacing: 0.2,
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  nativeAccountLabel: {
    fontSize: 11,
    letterSpacing: 0.1,
    flexShrink: 0,
  },
  labelLanguage: {
    color: ACCENT,
  },
  labelRail: {
    fontSize: 8,
  },
});
