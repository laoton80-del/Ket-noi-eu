import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, type ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTranslation } from '../../i18n';
import { MAIN_TAB, type RootStackParamList } from '../../navigation/routes';
import { useDemoModeStore } from '../../store/demoModeStore';
import { theme } from '../../theme/theme';
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
      <LinearGradient
        colors={[
          'rgba(197, 160, 89, 0.95)',
          'rgba(85, 144, 224, 0.55)',
          'rgba(197, 160, 89, 0.88)',
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.innerGlow} />
        <Text style={styles.label}>{t('login.demoEntryTitle')}</Text>
        <Text style={styles.hint}>{t('login.demoEntryHint')}</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outer: {
    marginTop: 16,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    shadowColor: theme.colors.SignatureGold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 10,
  },
  outerPressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
  gradient: {
    paddingVertical: 16,
    paddingHorizontal: 18,
    alignItems: 'center',
    gap: 4,
  },
  innerGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  label: {
    fontSize: 15,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.DeepInkNavy,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  hint: {
    fontSize: 11,
    fontFamily: FontFamily.semibold,
    color: 'rgba(10, 22, 40, 0.72)',
    textAlign: 'center',
  },
});
