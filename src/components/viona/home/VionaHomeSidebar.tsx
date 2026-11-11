import { Ionicons } from '@expo/vector-icons';
import { type ComponentProps } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { vionaCinematicTokens } from '../../../design/vionaCinematicTokens';
import { useTranslation } from '../../../i18n';
import { VionaBrandLockup } from '../VionaBrandLockup';
import {
  type VionaRec2UniverseCallbacks,
  type VionaRec2UniverseContract,
} from './vionaRec2HomeContract';

type IconName = ComponentProps<typeof Ionicons>['name'];

const UTILITY_ITEMS: readonly Readonly<{ id: 'saved' | 'history' | 'notifications' | 'invite' | 'help'; icon: IconName }>[] = [
  { id: 'saved', icon: 'bookmark-outline' },
  { id: 'history', icon: 'time-outline' },
  { id: 'notifications', icon: 'notifications-outline' },
  { id: 'invite', icon: 'person-add-outline' },
  { id: 'help', icon: 'help-circle-outline' },
];

const LATER_ITEMS: readonly Readonly<{ id: 'messages' | 'calendar' | 'apps' | 'community'; icon: IconName }>[] = [
  { id: 'messages', icon: 'chatbubbles-outline' },
  { id: 'calendar', icon: 'calendar-outline' },
  { id: 'apps', icon: 'grid-outline' },
  { id: 'community', icon: 'people-outline' },
];

export function VionaHomeSidebar({
  universes: _universes,
  callbacks: _callbacks,
  reducedMotion: _reducedMotion = false,
}: Readonly<{
  universes: readonly VionaRec2UniverseContract[];
  callbacks: VionaRec2UniverseCallbacks;
  reducedMotion?: boolean;
}>) {
  const { t } = useTranslation();
  return (
    <LinearGradient colors={['#0B1C33', '#07111C', '#020713']} style={styles.rail}>
      <View style={styles.brand}>
        <VionaBrandLockup variant="iconOnly" />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        <SidebarRow icon="home" label={t('home.rec2.sidebar.home')} selected onPress={() => undefined} />
        {UTILITY_ITEMS.map((item) => (
          <SidebarRow
            key={item.id}
            icon={item.icon}
            label={t(`home.rec2.sidebar.${item.id}`)}
            disabled
            hint={t('home.dockNav.comingSoon')}
          />
        ))}
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
        <View style={styles.rule} />
        <SidebarRow
          icon="log-out-outline"
          label={t('home.rec2.sidebar.logout')}
          disabled
          muted
          hint={t('home.dockNav.comingSoon')}
        />
      </ScrollView>
    </LinearGradient>
  );
}

function SidebarRow({
  icon,
  label,
  selected = false,
  disabled = false,
  hint,
  accent,
  muted = false,
  onPress,
}: Readonly<{
  icon: IconName;
  label: string;
  selected?: boolean;
  disabled?: boolean;
  hint?: string;
  accent?: string;
  muted?: boolean;
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
        disabled && !muted && styles.rowDisabled,
        pressed && !!onPress && styles.rowPressed,
      ]}
    >
      <Ionicons name={icon} size={18} color={accent ?? (muted ? vionaCinematicTokens.color.muted : selected ? vionaCinematicTokens.color.gold : vionaCinematicTokens.color.ice)} />
      <View style={styles.copy}>
        <Text style={[styles.label, muted && styles.labelMuted, accent ? { color: accent } : null]}>{label}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  rail: {
    width: vionaCinematicTokens.layout.railWidth,
    borderRightWidth: 1,
    borderRightColor: 'rgba(230, 244, 255, 0.12)',
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
  labelMuted: { color: vionaCinematicTokens.color.muted },
  hint: { color: vionaCinematicTokens.color.muted, fontSize: 10 },
});
