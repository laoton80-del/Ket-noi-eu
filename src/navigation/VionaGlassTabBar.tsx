import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { vionaCinematicTokens } from '../design/vionaCinematicTokens';
import { useTranslation } from '../i18n';
import { MAIN_TAB } from './routes';
import { resolveVionaCollapsedOrb } from './vionaBottomShellGeometry';

type NavItem = Readonly<{
  id: 'home' | 'messages' | 'notifications' | 'settings';
  icon: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  onPress?: () => void;
}>;

export function VionaGlassTabBar({
  state,
  navigation,
  width,
  paddingLeft,
  paddingRight,
  onPressSettings,
  onConfirmSos,
}: Readonly<{
  state: BottomTabBarProps['state'];
  navigation: BottomTabBarProps['navigation'];
  width: number;
  paddingLeft: number;
  paddingRight: number;
  onPressSettings: () => void;
  onConfirmSos: () => void;
}>) {
  const { t } = useTranslation();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const compact = width < 420;
  const wide = width >= 1024;
  const orb = resolveVionaCollapsedOrb(width);
  const focusedName = state.routes[state.index]?.name;
  const homeRoute = state.routes.find((route) => route.name === MAIN_TAB.B2C.home);

  const openHome = () => {
    if (!homeRoute) return;
    const event = navigation.emit({
      type: 'tabPress',
      target: homeRoute.key,
      canPreventDefault: true,
    });
    if (!event.defaultPrevented) navigation.navigate(homeRoute.name);
  };

  const left: readonly NavItem[] = [
    { id: 'home', icon: 'home-outline', onPress: openHome },
    { id: 'messages', icon: 'chatbubble-outline', disabled: true },
  ];
  const right: readonly NavItem[] = [
    { id: 'notifications', icon: 'notifications-outline', disabled: true },
    { id: 'settings', icon: 'settings-outline', onPress: onPressSettings },
  ];

  return (
    <View style={[styles.row, { paddingLeft, paddingRight }]}>
      <View style={[styles.side, wide && styles.sideLeft]}>
        {left.map((item) => (
          <DockButton
            key={item.id}
            item={item}
            label={t(`home.dockNav.${item.id}`)}
            hint={item.disabled ? t('home.dockNav.comingSoon') : undefined}
            selected={item.id === 'home' && focusedName === MAIN_TAB.B2C.home}
          />
        ))}
      </View>
      <View style={{ width: orb.size }} />
      <View style={[styles.side, wide && styles.sideRight]}>
        {right.map((item) => (
          <DockButton
            key={item.id}
            item={item}
            label={t(`home.dockNav.${item.id}`)}
            hint={item.disabled ? t('home.dockNav.comingSoon') : undefined}
            selected={false}
          />
        ))}
        <View style={styles.sosDivider} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('sos.edgeA11y')}
          onPress={() => setConfirmOpen(true)}
          style={[styles.sos, compact && styles.sosCompact]}
        >
          <Ionicons name="shield-outline" size={compact ? 16 : 18} color="#E6F4FF" />
          <Text style={[styles.sosLabel, compact && styles.sosLabelCompact]}>SOS</Text>
        </Pressable>
      </View>
      <Modal transparent visible={confirmOpen} animationType="none" onRequestClose={() => setConfirmOpen(false)}>
        <View style={styles.scrim}>
          <Pressable accessibilityRole="button" accessibilityLabel={t('sos.confirmCancel')} onPress={() => setConfirmOpen(false)} style={styles.scrimDismiss} />
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{t('sos.confirmTitle')}</Text>
            <Text style={styles.sheetBody}>{t('sos.confirmBody')}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setConfirmOpen(false);
                onConfirmSos();
              }}
              style={styles.confirm}
            >
              <Text style={styles.confirmLabel}>{t('sos.confirmYes')}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => setConfirmOpen(false)} style={styles.cancel}>
              <Text style={styles.cancelLabel}>{t('sos.confirmCancel')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function DockButton({
  item,
  label,
  hint,
  selected,
}: Readonly<{
  item: NavItem;
  label: string;
  hint?: string;
  selected: boolean;
}>) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={hint ? `${label}. ${hint}` : label}
      accessibilityState={{ disabled: !!item.disabled, selected }}
      disabled={!!item.disabled}
      onPress={item.onPress}
      style={styles.button}
    >
      <Ionicons
        name={item.icon}
        size={20}
        color={selected ? '#00D1FF' : 'rgba(230, 244, 255, 0.55)'}
        style={selected ? styles.iconGlow : undefined}
      />
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  side: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  sideLeft: { justifyContent: 'flex-end', gap: 8 },
  sideRight: { justifyContent: 'flex-start', gap: 8 },
  button: {
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    paddingVertical: 4,
  },
  iconGlow: {
    textShadowColor: 'rgba(0, 209, 255, 0.85)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  label: {
    color: 'rgba(230, 244, 255, 0.55)',
    fontSize: 10,
    fontFamily: vionaCinematicTokens.fontFamily.medium,
  },
  labelSelected: { color: '#00D1FF' },
  hint: {
    color: 'rgba(230, 244, 255, 0.4)',
    fontSize: 8,
    fontFamily: vionaCinematicTokens.fontFamily.medium,
  },
  sosDivider: {
    width: 1,
    height: 28,
    marginLeft: 4,
    backgroundColor: 'rgba(230, 244, 255, 0.22)',
  },
  sos: {
    minWidth: 52,
    minHeight: 48,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    borderBottomWidth: 2,
    borderBottomColor: '#D4AF7C',
    backgroundColor: 'rgba(90, 36, 44, 0.55)',
  },
  sosCompact: { minWidth: 44, paddingHorizontal: 4 },
  sosLabel: {
    color: '#E6F4FF',
    fontSize: 11,
    fontFamily: vionaCinematicTokens.fontFamily.semibold,
    fontWeight: '600',
  },
  sosLabelCompact: { fontSize: 9 },
  scrim: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(4, 12, 24, 0.62)',
    padding: 24,
  },
  scrimDismiss: { ...StyleSheet.absoluteFillObject },
  sheet: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 124, 0.45)',
    backgroundColor: '#0E1C31',
    padding: 18,
    gap: 12,
  },
  sheetTitle: {
    color: '#E6F4FF',
    fontSize: 18,
    fontFamily: vionaCinematicTokens.fontFamily.semibold,
    fontWeight: '600',
  },
  sheetBody: { color: 'rgba(230, 244, 255, 0.78)', fontSize: 13, lineHeight: 18 },
  confirm: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7A3038',
    borderWidth: 1.5,
    borderColor: '#D4AF7C',
  },
  confirmLabel: { color: '#E6F4FF', fontSize: 15, fontFamily: vionaCinematicTokens.fontFamily.semibold, fontWeight: '600' },
  cancel: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  cancelLabel: { color: 'rgba(230, 244, 255, 0.72)', fontSize: 14 },
});
