import { useCallback, type ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTranslation } from '../../i18n';
import { MAIN_TAB, type RootStackParamList } from '../../navigation/routes';
import { useDemoModeStore } from '../../store/demoModeStore';
import { vionaTokens } from '../../design';
import { FontFamily } from '../../theme/typography';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type DemoTriggerButtonProps = Readonly<{
  navigation: Nav;
}>;

/** Zero-friction demo entry — opens main tabs in demo mode (no backend charges). */
export function DemoTriggerButton({ navigation }: DemoTriggerButtonProps): ReactElement {
  const { t } = useTranslation();
  const setDemoMode = useDemoModeStore((s) => s.setDemoMode);

  const onPress = useCallback(() => {
    setDemoMode(true);
    navigation.reset({
      index: 0,
      routes: [{ name: 'Tabs', params: { screen: MAIN_TAB.B2C.home } }],
    });
  }, [navigation, setDemoMode]);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.outer, pressed && styles.outerPressed]}
      accessibilityRole="button"
      accessibilityLabel={t('login.demoEntryA11y')}
    >
      <View style={styles.demoTechLine} pointerEvents="none" />
      <View style={styles.demoWash} pointerEvents="none" />
      <View style={styles.contentRow}>
        <View style={styles.demoBadge}>
          <Text style={styles.demoBadgeIcon}>▶</Text>
        </View>
        <View style={styles.textStack}>
          <Text style={styles.label}>{t('login.demoEntryTitle')}</Text>
          <Text style={styles.hint}>{t('login.demoEntryHint')}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const ft = vionaTokens.fashionTech;
const LUM_CYAN_EDGE = `${ft.accentCyan}ea`;
const LUM_VIOLET_EDGE = `${ft.accentViolet}ea`;
const LUM_GLOW_CYAN = 'rgba(128, 210, 255, 0.14)';
const LUM_GLOW_VIOLET = 'rgba(168, 141, 255, 0.12)';

const styles = StyleSheet.create({
  outer: {
    marginTop: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: LUM_CYAN_EDGE,
    backgroundColor: 'rgba(12, 18, 28, 0.96)',
    paddingVertical: 14,
    paddingHorizontal: 14,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: LUM_GLOW_CYAN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 1,
  },
  demoTechLine: {
    position: 'absolute',
    left: 14,
    right: 14,
    top: 0,
    height: 1,
    backgroundColor: 'rgba(255, 232, 188, 0.2)',
  },
  demoWash: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(112, 200, 255, 0.03)',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  demoBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: LUM_VIOLET_EDGE,
    backgroundColor: 'rgba(12, 18, 28, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: LUM_GLOW_VIOLET,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 1,
  },
  demoBadgeIcon: {
    fontSize: 14,
    color: '#f4f6fa',
    fontFamily: FontFamily.extrabold,
    marginLeft: 2,
  },
  textStack: {
    flex: 1,
    gap: 2,
  },
  outerPressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
  label: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
    color: ft.textPrimary,
    letterSpacing: 0.1,
  },
  hint: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: ft.textSecondary,
  },
});
