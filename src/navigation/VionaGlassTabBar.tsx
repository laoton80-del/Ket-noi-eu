import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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
}: Readonly<{
  state: BottomTabBarProps['state'];
  navigation: BottomTabBarProps['navigation'];
  width: number;
  paddingLeft: number;
  paddingRight: number;
  onPressSettings: () => void;
}>) {
  const { t } = useTranslation();
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
      <View style={styles.side}>
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
      <View style={styles.side}>
        {right.map((item) => (
          <DockButton
            key={item.id}
            item={item}
            label={t(`home.dockNav.${item.id}`)}
            hint={item.disabled ? t('home.dockNav.comingSoon') : undefined}
            selected={false}
          />
        ))}
      </View>
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
});
