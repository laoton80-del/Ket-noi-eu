import { Ionicons } from '@expo/vector-icons';
import {
  useNavigation,
  useRoute,
  type NavigationProp,
  type ParamListBase,
  type RouteProp,
} from '@react-navigation/native';
import { useMemo, type ReactElement } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { VionaRec2UniverseId } from '../../components/viona/home/vionaRec2HomeContract';
import { vionaTokens } from '../../design';
import { useTranslation } from '../../i18n';
import { MAIN_TAB, type RootStackParamList } from '../../navigation/routes';
import {
  vionaLaunchModule,
  vionaLaunchModules,
  type VionaLaunchModule,
} from '../../navigation/vionaLaunchManifest';
import { FontFamily } from '../../theme/typography';

const ACCENT: Readonly<Record<VionaRec2UniverseId, string>> = {
  local: '#F3A431',
  travel: '#39BFFF',
  academy: '#AE62FF',
  business: '#38D59A',
  account: '#5B9DFF',
  sos: '#FF5B65',
};

function openHome(navigation: NavigationProp<ParamListBase>): void {
  const names = navigation.getState()?.routeNames ?? [];
  if (names.includes(MAIN_TAB.B2C.home)) {
    navigation.navigate(MAIN_TAB.B2C.home);
    return;
  }
  navigation.navigate('Tabs', { screen: MAIN_TAB.B2C.home });
}

function openModule(navigation: NavigationProp<ParamListBase>, moduleId: string): void {
  navigation.navigate('UniverseModuleNote', { moduleId });
}

export function VionaUniverseLandingScreen({
  universe,
}: Readonly<{ universe: VionaRec2UniverseId }>): ReactElement {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const insets = useSafeAreaInsets();
  const accent = ACCENT[universe];
  const modules = useMemo(() => vionaLaunchModules(universe), [universe]);
  const build = modules.filter((row) => row.readiness === 'build');
  const gated = modules.filter((row) => row.readiness === 'gated');
  const title = t(`home.rec2.universes.${universe}.title`, { defaultValue: universe });

  return (
    <View
      style={[styles.screen, { paddingTop: insets.top + 12, backgroundColor: vionaTokens.fashionTech.canvas }]}
      testID={`viona-universe-landing-${universe}`}
    >
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('universeLanding.backHome', { defaultValue: 'Home' })}
          onPress={() => openHome(navigation)}
          style={styles.homeLink}
          testID={`viona-universe-home-${universe}`}
        >
          <Ionicons name="arrow-back" size={18} color={accent} />
          <Text style={[styles.homeLinkText, { color: accent }]}>
            {t('universeLanding.backHome', { defaultValue: 'Home' })}
          </Text>
        </Pressable>
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        <Text style={styles.lead}>
          {t(`home.rec2.universes.${universe}.subtitle`, { defaultValue: '' })}
        </Text>
      </View>
      <ScrollView contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 28 }]}>
        <Text style={styles.section}>
          {t('universeLanding.buildSection', { defaultValue: 'Launch modules' })}
        </Text>
        {build.map((row) => (
          <ModuleRow
            key={row.id}
            accent={accent}
            row={row}
            onPress={() => openModule(navigation, row.id)}
          />
        ))}
        <Text style={styles.section}>
          {t('universeLanding.gatedSection', { defaultValue: 'Coming soon' })}
        </Text>
        {gated.map((row) => (
          <GatedRow key={row.id} row={row} />
        ))}
      </ScrollView>
    </View>
  );
}

function ModuleRow({
  accent,
  row,
  onPress,
}: Readonly<{ accent: string; row: VionaLaunchModule; onPress: () => void }>): ReactElement {
  const { t } = useTranslation();
  const commitment =
    row.commitment === 'C'
      ? t('universeLanding.required', { defaultValue: 'Required for this launch' })
      : t('universeLanding.evidence', { defaultValue: 'Included when evidence is ready' });
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${row.id}. ${row.name ?? ''}`}
      onPress={onPress}
      style={styles.row}
      testID={`viona-universe-module-${row.id}`}
    >
      <View style={[styles.mark, { backgroundColor: accent }]} />
      <View style={styles.rowCopy}>
        <Text style={styles.rowTitle}>{row.name}</Text>
        <Text style={styles.rowMeta}>
          {row.id}
          {row.mark ? ` · ${row.mark}` : ''} · {commitment}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={vionaTokens.fashionTech.mutedOnDark} />
    </Pressable>
  );
}

function GatedRow({ row }: Readonly<{ row: VionaLaunchModule }>): ReactElement {
  const { t } = useTranslation();
  const label = t('universeLanding.comingSoon', { defaultValue: 'Coming soon' });
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={`${row.id}. ${label}`}
      accessibilityState={{ disabled: true }}
      style={styles.gatedRow}
      testID={`viona-universe-gated-${row.id}`}
    >
      <Text style={styles.gatedId}>{row.id}</Text>
      <Text style={styles.gatedLabel}>{label}</Text>
    </View>
  );
}

export function LocalUniverseLandingScreen(): ReactElement {
  return <VionaUniverseLandingScreen universe="local" />;
}

export function TravelUniverseLandingScreen(): ReactElement {
  return <VionaUniverseLandingScreen universe="travel" />;
}

export function AcademyUniverseLandingScreen(): ReactElement {
  return <VionaUniverseLandingScreen universe="academy" />;
}

export function UniverseLandingRouteScreen(): ReactElement {
  const route = useRoute<RouteProp<RootStackParamList, 'UniverseLanding'>>();
  return <VionaUniverseLandingScreen universe={route.params.universe} />;
}

export function UniverseModuleNoteScreen(): ReactElement {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const route = useRoute<RouteProp<RootStackParamList, 'UniverseModuleNote'>>();
  const insets = useSafeAreaInsets();
  const row = vionaLaunchModule(route.params.moduleId);
  const known = row?.readiness === 'build';
  return (
    <View
      style={[styles.screen, { paddingTop: insets.top + 12, backgroundColor: vionaTokens.fashionTech.canvas }]}
      testID="viona-universe-module-note"
    >
      <Pressable
        accessibilityRole="button"
        onPress={() => navigation.goBack()}
        style={styles.homeLink}
      >
        <Ionicons name="arrow-back" size={18} color={vionaTokens.fashionTech.accentCyan} />
        <Text style={[styles.homeLinkText, { color: vionaTokens.fashionTech.accentCyan }]}>
          {t('universeLanding.back', { defaultValue: 'Back' })}
        </Text>
      </Pressable>
      <Text accessibilityRole="header" style={styles.title}>
        {known ? row?.name : t('universeLanding.missing', { defaultValue: 'This module is not in the launch manifest.' })}
      </Text>
      <Text style={styles.lead}>{known ? row?.id : route.params.moduleId}</Text>
      <Text style={styles.note}>
        {known
          ? t('universeLanding.phase2', {
              defaultValue:
                'The detailed screen is stage 2. This page has no live data and does not start a booking, payment, or emergency action.',
            })
          : t('universeLanding.missing', { defaultValue: 'This module is not in the launch manifest.' })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    gap: 8,
    marginBottom: 8,
  },
  homeLink: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 6,
    minHeight: 44,
  },
  homeLinkText: {
    fontFamily: FontFamily.semibold,
    fontSize: 15,
  },
  title: {
    color: vionaTokens.fashionTech.textPrimary,
    fontFamily: FontFamily.bold,
    fontSize: 32,
  },
  lead: {
    color: vionaTokens.fashionTech.mutedOnDark,
    fontFamily: FontFamily.regular,
    fontSize: 15,
    lineHeight: 22,
  },
  list: {
    gap: 10,
    paddingTop: 12,
  },
  section: {
    color: vionaTokens.fashionTech.textPrimary,
    fontFamily: FontFamily.semibold,
    fontSize: 13,
    letterSpacing: 0.4,
    marginTop: 12,
    textTransform: 'uppercase',
  },
  row: {
    alignItems: 'center',
    backgroundColor: vionaTokens.fashionTech.surface,
    borderColor: vionaTokens.fashionTech.borderSubtle,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    minHeight: 72,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  mark: {
    borderRadius: 4,
    height: 28,
    width: 4,
  },
  rowCopy: {
    flex: 1,
    gap: 4,
  },
  rowTitle: {
    color: vionaTokens.fashionTech.textPrimary,
    fontFamily: FontFamily.semibold,
    fontSize: 16,
  },
  rowMeta: {
    color: vionaTokens.fashionTech.mutedOnDark,
    fontFamily: FontFamily.regular,
    fontSize: 12,
  },
  gatedRow: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: vionaTokens.fashionTech.borderSubtle,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 56,
    opacity: 0.72,
    paddingHorizontal: 14,
  },
  gatedId: {
    color: vionaTokens.fashionTech.textPrimary,
    fontFamily: FontFamily.semibold,
    fontSize: 15,
  },
  gatedLabel: {
    color: vionaTokens.fashionTech.mutedOnDark,
    fontFamily: FontFamily.regular,
    fontSize: 13,
  },
  note: {
    color: vionaTokens.fashionTech.textPrimary,
    fontFamily: FontFamily.regular,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 18,
  },
});
