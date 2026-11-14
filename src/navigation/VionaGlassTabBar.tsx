import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Modal, Platform, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { vionaCinematicTokens } from '../design/vionaCinematicTokens';
import { useTranslation } from '../i18n';
import { MAIN_TAB } from './routes';
import { resolveVionaCollapsedOrb } from './vionaBottomShellGeometry';
import { getVionaDockStatus, subscribeVionaDockStatus, type VionaDockStatus } from './vionaDockStatus';

const SOS_HOLD_MS = 600;
const SOS_NAV_MUTED = '#7F94B2';
const SOS_CORAL = '#E5705A';
const SOS_CORAL_BRIGHT = '#F0997B';
const SOS_GOLD = '#D4AF7C';
const SOS_RING_SIZE = 36;
const SOS_ICON_SIZE = 24;
const SOS_RING_STROKE = 3;
const SOS_RING_RADIUS = (SOS_RING_SIZE - SOS_RING_STROKE) / 2;
const SOS_RING_CIRC = 2 * Math.PI * SOS_RING_RADIUS;

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
  const split = width >= 768;
  const wide = width >= 1024;
  const orb = resolveVionaCollapsedOrb(width);
  const bandWidth = wide ? 760 : Math.max(0, width - 8);
  const sideWidth = Math.floor((bandWidth - orb.size) / 2);
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
    ...(split ? [] : [{ id: 'notifications' as const, icon: 'notifications-outline' as const, disabled: true }]),
    { id: 'settings', icon: 'settings-outline', onPress: onPressSettings },
  ];

  return (
    <View
      style={[
        styles.row,
        split ? styles.splitRow : { paddingLeft: 4, paddingRight: Math.min(paddingRight, 4) },
      ]}
    >
      {split ? (
        <>
          <DockStatus />
          <View style={{ width: orb.size, flexShrink: 0 }} />
          <View style={styles.splitRight}>
            <View pointerEvents="none" style={styles.orbGap} />
            {[...left, { id: 'settings' as const, icon: 'settings-outline' as const, onPress: onPressSettings }].map((item) => (
              <DockButton
                key={item.id}
                item={item}
                label={t(`home.dockNav.${item.id}`)}
                hint={item.disabled ? t('home.dockNav.comingSoon') : undefined}
                selected={item.id === 'home' && focusedName === MAIN_TAB.B2C.home}
                iconSize={22}
                quiet
              />
            ))}
            <View style={styles.splitSos}>
              <View style={styles.sosDivider} />
              <SosEndCap compact={false} onActivate={onConfirmSos} onOpenConfirm={() => setConfirmOpen(true)} />
            </View>
          </View>
        </>
      ) : null}
      {split ? null : (
      <View style={[styles.band, wide && styles.bandWide]}>
        <View
          style={[
            styles.side,
            { width: sideWidth },
            wide ? styles.sideWide : styles.sideMobile,
            !wide ? { paddingLeft: Math.min(paddingLeft, 96), justifyContent: 'flex-start', gap: 4 } : null,
          ]}
        >
          {left.map((item) => (
            <DockButton
              key={item.id}
              item={item}
              label={t(`home.dockNav.${item.id}`)}
              hint={item.disabled ? t('home.dockNav.comingSoon') : undefined}
              overlayHint={compact}
              iconOnly={compact && item.id === 'messages'}
              selected={item.id === 'home' && focusedName === MAIN_TAB.B2C.home}
            />
          ))}
        </View>
        <View style={{ width: orb.size, flexShrink: 0 }} />
        <View style={[styles.side, { width: sideWidth }, wide ? styles.sideWide : styles.sideMobile]}>
          {right.map((item) => (
            <DockButton
              key={item.id}
              item={item}
              label={t(`home.dockNav.${item.id}`)}
              hint={item.disabled ? t('home.dockNav.comingSoon') : undefined}
              overlayHint={compact}
              selected={false}
            />
          ))}
          <View style={[styles.sosCluster, !wide && styles.sosClusterCompact]}>
            <View style={styles.sosDivider} />
            <SosEndCap compact={compact} onActivate={onConfirmSos} onOpenConfirm={() => setConfirmOpen(true)} />
          </View>
        </View>
      </View>
      )}
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

function SosEndCap({
  compact,
  onActivate,
  onOpenConfirm,
}: Readonly<{
  compact: boolean;
  onActivate: () => void;
  onOpenConfirm: () => void;
}>) {
  const { t } = useTranslation();
  const [progress, setProgress] = useState(0);
  const [holding, setHolding] = useState(false);
  const [hintOn, setHintOn] = useState(false);
  const [ack, setAck] = useState(false);
  const startRef = useRef<number | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const firedRef = useRef(false);
  const viaPointerRef = useRef(false);
  const readerRef = useRef(false);
  const midHapticRef = useRef(false);
  const reducedRef = useRef(false);
  const [hovered, setHovered] = useState(false);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTick = useCallback(() => {
    if (tickRef.current != null) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  useEffect(() => {
    void AccessibilityInfo.isScreenReaderEnabled().then((enabled) => {
      readerRef.current = enabled;
    });
    const readerSub = AccessibilityInfo.addEventListener?.('screenReaderChanged', (enabled) => {
      readerRef.current = enabled;
    });
    void AccessibilityInfo.isReduceMotionEnabled?.().then((enabled) => {
      reducedRef.current = enabled;
    });
    return () => {
      readerSub?.remove?.();
      clearTick();
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    };
  }, [clearTick]);

  const showHint = useCallback(() => {
    setHintOn(true);
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    hintTimerRef.current = setTimeout(() => setHintOn(false), 1400);
  }, []);

  const unwind = useCallback((from: number) => {
    clearTick();
    const started = Date.now();
    tickRef.current = setInterval(() => {
      const t = Math.min(1, (Date.now() - started) / 160);
      setProgress(from * (1 - t));
      if (t < 1) return;
      clearTick();
      setProgress(0);
    }, 16);
  }, [clearTick]);

  const onPressIn = useCallback(() => {
    viaPointerRef.current = true;
    firedRef.current = false;
    midHapticRef.current = false;
    setHolding(true);
    setAck(false);
    startRef.current = Date.now();
    setProgress(0);
    clearTick();
    if (Platform.OS !== 'web') void Haptics.selectionAsync();
    tickRef.current = setInterval(() => {
      const start = startRef.current;
      if (start == null) return;
      const next = Math.min(1, (Date.now() - start) / SOS_HOLD_MS);
      setProgress(next);
      if (next >= 0.5 && !midHapticRef.current && Platform.OS !== 'web') {
        midHapticRef.current = true;
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      if (next < 1 || firedRef.current) return;
      firedRef.current = true;
      clearTick();
      startRef.current = null;
      setHolding(false);
      if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onActivate();
      if (reducedRef.current) {
        setProgress(0);
        setAck(false);
        return;
      }
      setAck(true);
      setTimeout(() => {
        setAck(false);
        setProgress(0);
      }, 180);
    }, 16);
  }, [clearTick, onActivate]);

  const onPressOut = useCallback(() => {
    if (firedRef.current) return;
    const elapsed = Date.now() - (startRef.current ?? Date.now());
    const from = Math.min(1, elapsed / SOS_HOLD_MS);
    startRef.current = null;
    setHolding(false);
    unwind(from);
    if (!readerRef.current && viaPointerRef.current && elapsed < 250) showHint();
  }, [showHint, unwind]);

  const onPress = useCallback(() => {
    if (readerRef.current || !viaPointerRef.current) {
      firedRef.current = true;
      clearTick();
      startRef.current = null;
      setHolding(false);
      setProgress(0);
      setHintOn(false);
      onOpenConfirm();
    }
    viaPointerRef.current = false;
  }, [clearTick, onOpenConfirm]);

  const resting = !(holding || progress > 0.02);
  const tone = resting ? (hovered ? '#E4EEF8' : SOS_NAV_MUTED) : SOS_CORAL_BRIGHT;

  return (
    <View style={styles.sosWrap}>
      {hintOn ? <Text style={styles.holdCue}>{t('sos.holdCue')}</Text> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('sos.edgeA11y')}
        accessibilityHint={t('sos.holdCue')}
        onAccessibilityTap={onOpenConfirm}
        onHoverIn={Platform.OS === 'web' ? () => setHovered(true) : undefined}
        onHoverOut={Platform.OS === 'web' ? () => setHovered(false) : undefined}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={onPress}
        style={[
          styles.sos,
          compact && styles.sosCompact,
          ack && styles.sosAck,
          Platform.OS === 'web' && styles.sosEase,
          hovered && resting && styles.sosHover,
        ]}
      >
        <View style={styles.sosIcon}>
          {progress > 0.02 ? (
            <Svg width={SOS_RING_SIZE} height={SOS_RING_SIZE} style={styles.sosRing}>
              <Circle
                cx={SOS_RING_SIZE / 2}
                cy={SOS_RING_SIZE / 2}
                r={SOS_RING_RADIUS}
                stroke={SOS_CORAL}
                strokeWidth={SOS_RING_STROKE}
                fill="none"
                strokeDasharray={`${SOS_RING_CIRC} ${SOS_RING_CIRC}`}
                strokeDashoffset={SOS_RING_CIRC * (1 - progress)}
                strokeLinecap="round"
                rotation={-90}
                originX={SOS_RING_SIZE / 2}
                originY={SOS_RING_SIZE / 2}
              />
              {progress >= 1 ? <Circle cx={SOS_RING_SIZE / 2} cy={SOS_RING_STROKE / 2 + 1} r={2} fill={SOS_GOLD} /> : null}
            </Svg>
          ) : null}
          <Ionicons
            name="shield"
            size={SOS_ICON_SIZE}
            color={tone}
            style={Platform.OS === 'web' ? styles.sosTone : undefined}
          />
        </View>
        <Text style={[styles.sosLabel, compact && styles.sosLabelCompact, Platform.OS === 'web' && styles.sosTone, { color: tone }]}>SOS</Text>
      </Pressable>
    </View>
  );
}

function isTechnicalPlace(label: string): boolean {
  return /cinematic|not connected|weather source|nguồn thời tiết|chưa có nguồn/i.test(label);
}

function useDockStatus(): VionaDockStatus | null {
  const [status, setStatus] = useState<VionaDockStatus | null>(() => getVionaDockStatus());
  useEffect(() => {
    setStatus(getVionaDockStatus());
    return subscribeVionaDockStatus(setStatus);
  }, []);
  return status;
}

function DockStatus() {
  const { i18n } = useTranslation();
  const status = useDockStatus();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);
  if (!status) return <View style={styles.splitLeft} />;

  const locale = (i18n.resolvedLanguage ?? i18n.language ?? 'en').trim() || 'en';
  const rawPlace = status.regionLabel?.trim() || '';
  const placeIsReal = !status.previewMode && !!rawPlace && !isTechnicalPlace(rawPlace);
  const date = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(now);
  const time = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(now);
  const temperature = status.weather?.temperatureC;
  const weatherLive = typeof temperature === 'number' && Number.isFinite(temperature);

  return (
    <View style={styles.splitLeft}>
      {placeIsReal ? (
        <>
          <View style={styles.statusPlace}>
            <Ionicons name="location-outline" size={14} color={vionaCinematicTokens.color.cyan} />
            <Text style={styles.statusPlaceText} numberOfLines={1}>
              {rawPlace}
            </Text>
          </View>
          <View style={styles.goldTick} />
        </>
      ) : null}
      {weatherLive ? (
        <>
          <View style={styles.statusPlace}>
            <Ionicons name="partly-sunny-outline" size={14} color={vionaCinematicTokens.color.ice} />
            <Text style={styles.statusClock}>{`${temperature}°`}</Text>
          </View>
          <View style={styles.goldTick} />
        </>
      ) : null}
      <Text style={styles.statusClock} numberOfLines={1}>{`${date} · ${time}`}</Text>
    </View>
  );
}

function DockButton({
  item,
  label,
  hint,
  overlayHint,
  iconOnly,
  iconSize = 20,
  quiet = false,
  selected,
}: Readonly<{
  item: NavItem;
  label: string;
  hint?: string;
  overlayHint?: boolean;
  iconOnly?: boolean;
  iconSize?: number;
  quiet?: boolean;
  selected: boolean;
}>) {
  const idle = quiet ? SOS_NAV_MUTED : 'rgba(230, 244, 255, 0.55)';
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
        size={iconSize}
        color={selected ? '#00D1FF' : idle}
        style={selected ? styles.iconGlow : undefined}
      />
      {iconOnly ? null : <Text style={[styles.label, quiet && styles.labelQuiet, selected && styles.labelSelected]}>{label}</Text>}
      {hint && !overlayHint && !iconOnly ? <Text style={styles.hint}>{hint}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splitRow: { paddingLeft: 16, paddingRight: 16, justifyContent: 'flex-start' },
  splitLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
    gap: 10,
  },
  splitRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minWidth: 0,
  },
  orbGap: { width: 0, height: 1, flexGrow: 0, flexShrink: 0 },
  statusPlace: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1, minWidth: 0 },
  statusPlaceText: {
    flexShrink: 1,
    color: vionaCinematicTokens.color.ice,
    fontSize: 12,
    fontFamily: vionaCinematicTokens.fontFamily.medium,
  },
  statusClock: {
    color: 'rgba(230, 244, 255, 0.86)',
    fontSize: 12,
    fontFamily: vionaCinematicTokens.fontFamily.medium,
    flexShrink: 0,
  },
  statusWeatherIdle: { color: 'rgba(230, 244, 255, 0.4)' },
  goldTick: { width: 1, height: 16, backgroundColor: SOS_GOLD, opacity: 0.4, flexShrink: 0 },
  band: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  bandWide: { maxWidth: 760 },
  side: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
    flexShrink: 0,
  },
  sideWide: {
    justifyContent: 'space-evenly',
    gap: 12,
  },
  sideMobile: {
    justifyContent: 'space-evenly',
    gap: 4,
  },
  button: {
    flexShrink: 0,
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
  labelQuiet: {
    color: SOS_NAV_MUTED,
    fontSize: 10,
    fontFamily: vionaCinematicTokens.fontFamily.semibold,
    fontWeight: '600',
  },
  hint: {
    color: 'rgba(230, 244, 255, 0.4)',
    fontSize: 8,
    fontFamily: vionaCinematicTokens.fontFamily.medium,
  },
  splitSos: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 },
  sosCluster: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 0 },
  sosClusterCompact: { gap: 6 },
  sosDivider: {
    width: 1,
    height: 28,
    backgroundColor: SOS_GOLD,
    opacity: 0.85,
  },
  sosWrap: { position: 'relative', justifyContent: 'center' },
  sos: {
    minWidth: 56,
    minHeight: 56,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    backgroundColor: 'transparent',
    borderRadius: 14,
  },
  sosEase: Platform.OS === 'web'
    ? ({
        transitionProperty: 'background-color, box-shadow',
        transitionDuration: '150ms',
        transitionTimingFunction: 'ease',
      } as ViewStyle)
    : {},
  sosHover: {
    backgroundColor: 'rgba(229, 112, 90, 0.16)',
    shadowColor: '#E5705A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    ...(Platform.OS === 'web' ? ({ boxShadow: '0 0 16px rgba(229, 112, 90, 0.36)' } as ViewStyle) : null),
  },
  sosTone: Platform.OS === 'web' ? ({ transition: 'color 150ms ease' } as ViewStyle) : {},
  sosCompact: { minWidth: 56, paddingHorizontal: 2 },
  sosAck: { opacity: 0.55 },
  sosIcon: { width: SOS_RING_SIZE, height: SOS_RING_SIZE, alignItems: 'center', justifyContent: 'center' },
  sosRing: { position: 'absolute', left: 0, top: 0 },
  sosLabel: {
    color: SOS_NAV_MUTED,
    fontSize: 10,
    fontFamily: vionaCinematicTokens.fontFamily.semibold,
    fontWeight: '600',
  },
  sosLabelCompact: { fontSize: 10 },
  holdCue: {
    position: 'absolute',
    bottom: 58,
    right: 0,
    width: 128,
    textAlign: 'right',
    color: '#E6F4FF',
    fontSize: 11,
    fontFamily: vionaCinematicTokens.fontFamily.medium,
  },
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
