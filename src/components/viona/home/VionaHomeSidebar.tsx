import { Ionicons } from '@expo/vector-icons';
import { type ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { vionaCinematicTokens } from '../../../design/vionaCinematicTokens';
import { useTranslation } from '../../../i18n';
import { VionaCraneMark } from '../brand/VionaCraneMark';
import {
  invokeVionaRec2UniverseCallback,
  type VionaRec2UniverseCallbacks,
  type VionaRec2UniverseContract,
  type VionaRec2UniverseId,
} from './vionaRec2HomeContract';

type IconName = ComponentProps<typeof Ionicons>['name'];

const UNIVERSE_ICONS: Record<VionaRec2UniverseId, IconName> = {
  local: 'location-outline',
  travel: 'airplane-outline',
  academy: 'school-outline',
  business: 'briefcase-outline',
  account: 'person-circle-outline',
  sos: 'shield-checkmark-outline',
};

const LATER_ITEMS: readonly Readonly<{ id: 'messages' | 'calendar' | 'apps' | 'community'; icon: IconName }>[] = [
  { id: 'messages', icon: 'chatbubbles-outline' },
  { id: 'calendar', icon: 'calendar-outline' },
  { id: 'apps', icon: 'grid-outline' },
  { id: 'community', icon: 'people-outline' },
];

export function VionaHomeSidebar({
  universes,
  callbacks,
  reducedMotion = false,
}: Readonly<{
  universes: readonly VionaRec2UniverseContract[];
  callbacks: VionaRec2UniverseCallbacks;
  reducedMotion?: boolean;
}>) {
  const { t } = useTranslation();
  return (
    <View style={styles.rail}>
      <View style={styles.brand}>
        <VionaCraneMark size={28} variant="sapphire" glow={!reducedMotion} />
        <Text style={styles.brandName}>VIONA</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        <SidebarRow icon="home" label={t('home.rec2.sidebar.home')} selected onPress={() => undefined} />
        {universes.map((universe) => {
          const interactive = universe.availability === 'available' && typeof callbacks[universe.id] === 'function';
          return (
            <SidebarRow
              key={universe.id}
              icon={UNIVERSE_ICONS[universe.id]}
              label={t(`home.rec2.universes.${universe.id}.title`)}
              disabled={!interactive}
              hint={interactive ? undefined : t(`home.rec2.availability.${universe.availability}`)}
              accent={universe.id === 'sos' ? vionaCinematicTokens.universe.sos.accent : undefined}
              onPress={interactive ? () => invokeVionaRec2UniverseCallback(universe, callbacks) : undefined}
            />
          );
        })}
        <View style={styles.rule} />
        {LATER_ITEMS.map((item) => (
          <SidebarRow
            key={item.id}
            icon={item.icon}
            label={t(`home.rec2.sidebar.${item.id}`)}
            disabled
            hint={t('home.rec2.sidebar.openingGradually')}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function SidebarRow({
  icon,
  label,
  selected = false,
  disabled = false,
  hint,
  accent,
  onPress,
}: Readonly<{
  icon: IconName;
  label: string;
  selected?: boolean;
  disabled?: boolean;
  hint?: string;
  accent?: string;
  onPress?: () => void;
}>) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={hint ? `${label}. ${hint}` : label}
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        selected && styles.rowSelected,
        disabled && styles.rowDisabled,
        pressed && !!onPress && styles.rowPressed,
      ]}
    >
      <Ionicons name={icon} size={18} color={accent ?? (selected ? vionaCinematicTokens.color.gold : vionaCinematicTokens.color.ice)} />
      <View style={styles.copy}>
        <Text style={[styles.label, accent ? { color: accent } : null]}>{label}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  rail: {
    width: vionaCinematicTokens.layout.railWidth,
    borderRightWidth: 1,
    borderRightColor: vionaCinematicTokens.color.line,
    backgroundColor: vionaCinematicTokens.color.backgroundDeep,
    paddingVertical: 16,
    paddingHorizontal: 10,
    gap: 12,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 8 },
  brandName: {
    color: vionaCinematicTokens.color.ice,
    fontFamily: vionaCinematicTokens.fontFamily.semibold,
    letterSpacing: 3,
    fontSize: 16,
  },
  list: { gap: 4, paddingBottom: 24 },
  rule: {
    height: 1,
    backgroundColor: vionaCinematicTokens.color.line,
    marginVertical: 8,
  },
  row: {
    minHeight: 42,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  rowSelected: { backgroundColor: 'rgba(231, 194, 122, 0.12)' },
  rowDisabled: { opacity: 0.55 },
  rowPressed: { opacity: 0.8 },
  copy: { flex: 1, gap: 1 },
  label: {
    color: vionaCinematicTokens.color.ice,
    fontFamily: vionaCinematicTokens.fontFamily.medium,
    fontSize: 13,
  },
  hint: { color: vionaCinematicTokens.color.muted, fontSize: 10 },
});
