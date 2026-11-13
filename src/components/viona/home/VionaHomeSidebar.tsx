import { Ionicons } from '@expo/vector-icons';
import { type ComponentProps, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { vionaCinematicTokens } from '../../../design/vionaCinematicTokens';
import { useTranslation } from '../../../i18n';
const GOLD_MARK = require('../../../../assets/brand/viona/viona-symbol-gold.png');
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
  const [moreOpen, setMoreOpen] = useState(false);
  return (
    <LinearGradient colors={['#0B1C33', '#07111C', '#020713']} style={styles.rail}>
      <View style={styles.brand}>
        <Image source={GOLD_MARK} resizeMode="contain" accessibilityIgnoresInvertColors style={styles.brandMark} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        <SidebarRow icon="home" label={t('home.rec2.sidebar.home')} selected onPress={() => undefined} />
        <SidebarRow
          icon={moreOpen ? 'chevron-up' : 'ellipsis-horizontal'}
          label={t('home.rec2.sidebar.moreFeatures')}
          onPress={() => setMoreOpen((open) => !open)}
        />
        {moreOpen ? (
          <>
            {UTILITY_ITEMS.map((item) => (
              <SidebarRow
                key={item.id}
                icon={item.icon}
                label={t(`home.rec2.sidebar.${item.id}`)}
                disabled
              />
            ))}
            {LATER_ITEMS.map((item) => (
              <SidebarRow
                key={item.id}
                icon={item.icon}
                label={t(`home.rec2.sidebar.${item.id}`)}
                disabled
              />
            ))}
          </>
        ) : null}
        <View style={styles.rule} />
        <SidebarRow
          icon="log-out-outline"
          label={t('home.rec2.sidebar.logout')}
          onPress={() => undefined}
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
        disabled && styles.rowDisabled,
        pressed && !!onPress && styles.rowPressed,
      ]}
    >
      <Ionicons name={icon} size={18} color={accent ?? (muted ? vionaCinematicTokens.color.muted : selected ? vionaCinematicTokens.color.cyan : vionaCinematicTokens.color.ice)} />
      <View style={styles.copy}>
        <Text style={[styles.label, (muted || disabled) && styles.labelMuted, accent ? { color: accent } : null]}>{label}</Text>
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
  rowSelected: { backgroundColor: 'rgba(0, 209, 255, 0.12)' },
  brandMark: { width: 40, height: 40 },
  groupLabel: {
    color: vionaCinematicTokens.color.muted,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 14,
    marginBottom: 4,
    paddingHorizontal: 10,
  },
  rowDisabled: { opacity: 0.38 },
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
