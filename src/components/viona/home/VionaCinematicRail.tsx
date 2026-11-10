import { Ionicons } from '@expo/vector-icons';
import { type ComponentProps, useEffect, useRef } from 'react';
import { Animated, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { vionaCinematicTokens } from '../../../design/vionaCinematicTokens';
import { useTranslation } from '../../../i18n';
import { VionaBrandLockup } from '../VionaBrandLockup';
import {
  invokeVionaRec2UniverseCallback,
  type VionaRec2UniverseCallbacks,
  type VionaRec2UniverseContract,
  type VionaRec2UniverseId,
} from './vionaRec2HomeContract';

type IconName = ComponentProps<typeof Ionicons>['name'];

const ICONS: Record<VionaRec2UniverseId, IconName> = {
  local: 'location-outline',
  travel: 'airplane-outline',
  academy: 'school-outline',
  business: 'briefcase-outline',
  account: 'person-circle-outline',
  sos: 'shield-checkmark-outline',
};

const DRAWER_WIDTH = vionaCinematicTokens.layout.railWidth;
const CLOSE_DELAY_MS = 400;

type VionaCinematicRailProps = Readonly<{
  universes: readonly VionaRec2UniverseContract[];
  callbacks: VionaRec2UniverseCallbacks;
  onOpenLanguage?: () => void;
  open: boolean;
  pinned: boolean;
  hoverEnabled?: boolean;
  reducedMotion?: boolean;
  onOpenChange: (open: boolean) => void;
  onPinnedChange: (pinned: boolean) => void;
}>;

export function VionaCinematicRail({
  universes,
  callbacks,
  onOpenLanguage,
  open,
  pinned,
  hoverEnabled = false,
  reducedMotion = false,
  onOpenChange,
  onPinnedChange,
}: VionaCinematicRailProps) {
  const { t } = useTranslation();
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoveringRef = useRef(false);
  const blockHoverOpenRef = useRef(false);
  const focusOnOpenRef = useRef(false);
  const wasOpenRef = useRef(false);
  const drawerRef = useRef<View>(null);
  const handleRef = useRef<View>(null);
  const anchorRef = useRef<View>(null);
  const restoreFocusRef = useRef<{ focus?: () => void } | null>(null);
  const openReasonRef = useRef<'hover' | 'explicit' | 'keyboard' | null>(null);
  const keyboardInsideRef = useRef(false);
  const lastActivationRef = useRef(0);
  const onOpenChangeRef = useRef(onOpenChange);
  const onPinnedChangeRef = useRef(onPinnedChange);
  const canPin = hoverEnabled && Platform.OS === 'web';
  const effectivePinned = canPin && pinned;
  const pinnedRef = useRef(effectivePinned);
  const openRef = useRef(open);
  onOpenChangeRef.current = onOpenChange;
  onPinnedChangeRef.current = onPinnedChange;
  pinnedRef.current = effectivePinned;
  openRef.current = open;
  const slide = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;

  const clearCloseTimer = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const scheduleHoverClose = () => {
    if (closeTimer.current || pinnedRef.current || keyboardInsideRef.current) return;
    if (openReasonRef.current !== 'hover') return;
    closeTimer.current = setTimeout(() => {
      closeTimer.current = null;
      if (
        pinnedRef.current ||
        hoveringRef.current ||
        keyboardInsideRef.current ||
        openReasonRef.current !== 'hover'
      ) {
        return;
      }
      onOpenChangeRef.current(false);
    }, CLOSE_DELAY_MS);
  };

  useEffect(() => clearCloseTimer, []);

  // The touch drawer never reserves a permanent rail, including after a resize.
  useEffect(() => {
    if (!canPin && pinned) onPinnedChangeRef.current(false);
  }, [canPin, pinned]);

  useEffect(() => {
    if (!open) openReasonRef.current = null;
  }, [open]);

  useEffect(() => {
    if (!hoverEnabled || Platform.OS !== 'web' || typeof window === 'undefined') return;
    const onMove = (event: MouseEvent) => {
      if (!openRef.current || openReasonRef.current !== 'hover') return;
      const node = anchorRef.current as unknown as { getBoundingClientRect?: () => DOMRect } | null;
      const rect = node?.getBoundingClientRect?.();
      const inside = !!rect
        && event.clientX >= rect.left
        && event.clientX <= rect.right
        && event.clientY >= rect.top
        && event.clientY <= rect.bottom;
      hoveringRef.current = inside;
      if (inside) {
        clearCloseTimer();
        return;
      }
      scheduleHoverClose();
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [hoverEnabled]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const node = handleRef.current as unknown as HTMLElement | null;
    if (!node?.addEventListener) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const active = document.activeElement;
      if (active !== node && !node.contains(active)) return;
      event.preventDefault();
      event.stopPropagation();
      const now = Date.now();
      if (now - lastActivationRef.current < 350) return;
      lastActivationRef.current = now;
      clearCloseTimer();
      if (openRef.current) {
        onPinnedChangeRef.current(false);
        openReasonRef.current = null;
        onOpenChangeRef.current(false);
        return;
      }
      blockHoverOpenRef.current = false;
      focusOnOpenRef.current = true;
      openReasonRef.current = 'keyboard';
      onOpenChangeRef.current(true);
    };
    node.addEventListener('keydown', onKey);
    return () => node.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!open || Platform.OS !== 'web') {
      keyboardInsideRef.current = false;
      return;
    }
    const node = anchorRef.current as unknown as HTMLElement | null;
    if (!node?.addEventListener) return;
    const onFocusIn = () => {
      keyboardInsideRef.current = true;
      clearCloseTimer();
    };
    const onFocusOut = (event: FocusEvent) => {
      const next = event.relatedTarget;
      if (next instanceof Node && node.contains(next)) return;
      keyboardInsideRef.current = false;
      scheduleHoverClose();
    };
    node.addEventListener('focusin', onFocusIn);
    node.addEventListener('focusout', onFocusOut);
    return () => {
      node.removeEventListener('focusin', onFocusIn);
      node.removeEventListener('focusout', onFocusOut);
    };
  }, [open]);

  useEffect(() => {
    if (!open && hoveringRef.current) blockHoverOpenRef.current = true;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    slide.setValue(reducedMotion ? 1 : 0);
    Animated.timing(slide, {
      toValue: 1,
      duration: reducedMotion ? 0 : 220,
      useNativeDriver: true,
    }).start();
  }, [open, reducedMotion, slide]);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      wasOpenRef.current = open;
      return;
    }
    const doc = typeof document === 'undefined' ? null : document;
    if (open && !wasOpenRef.current && focusOnOpenRef.current) {
      const active = doc?.activeElement;
      restoreFocusRef.current =
        active instanceof HTMLElement ? active : null;
      focusOnOpenRef.current = false;
      const node = drawerRef.current as unknown as HTMLElement | null;
      node?.setAttribute?.('tabindex', '-1');
      node?.focus?.();
    }
    if (!open && wasOpenRef.current) {
      const restore = restoreFocusRef.current;
      restoreFocusRef.current = null;
      if (restore && doc?.contains(restore as Node) &&
        (doc.activeElement === doc.body || doc.activeElement === restore)) restore.focus?.();
    }
    wasOpenRef.current = open;
  }, [open]);

  useEffect(() => {
    if (!open || Platform.OS !== 'web' || typeof document === 'undefined') return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      const active = document.activeElement;
      const anchor = anchorRef.current as unknown as HTMLElement | null;
      if (active instanceof Node && active !== document.body && !anchor?.contains(active)) return;
      event.preventDefault();
      event.stopPropagation();
      clearCloseTimer();
      openReasonRef.current = null;
      onPinnedChangeRef.current(false);
      onOpenChangeRef.current(false);
    };
    document.addEventListener('keydown', onEscape);
    return () => document.removeEventListener('keydown', onEscape);
  }, [open]);

  const hoverIn = () => {
    if (!hoverEnabled) return;
    hoveringRef.current = true;
    clearCloseTimer();
    if (blockHoverOpenRef.current || pinnedRef.current || openRef.current) return;
    openReasonRef.current = 'hover';
    focusOnOpenRef.current = false;
    onOpenChangeRef.current(true);
  };

  const hoverOut = () => {
    if (!hoverEnabled) return;
    hoveringRef.current = false;
    blockHoverOpenRef.current = false;
    scheduleHoverClose();
  };

  const toggle = () => {
    const now = Date.now();
    if (now - lastActivationRef.current < 350) return;
    lastActivationRef.current = now;
    clearCloseTimer();
    if (openRef.current) {
      onPinnedChangeRef.current(false);
      openReasonRef.current = null;
      onOpenChangeRef.current(false);
      return;
    }
    blockHoverOpenRef.current = false;
    focusOnOpenRef.current = true;
    openReasonRef.current = 'explicit';
    onOpenChangeRef.current(true);
  };

  const dismiss = () => {
    clearCloseTimer();
    openReasonRef.current = null;
    onOpenChangeRef.current(false);
  };

  return (
    <View pointerEvents="box-none" style={styles.host}>
      {open && !effectivePinned ? (
        <Pressable
          accessibilityRole="button"
           accessibilityLabel="Đóng điều hướng / Dismiss navigation"
          onPress={dismiss}
          style={styles.backdrop}
        />
      ) : null}
      <View ref={anchorRef} pointerEvents="box-none" style={styles.anchor}>
        {open ? (
          <Animated.View
            ref={drawerRef}
            accessibilityLabel="Điều hướng VIONA / VIONA navigation"
            accessibilityViewIsModal={!effectivePinned}
            style={[
              styles.drawer,
              {
                transform: [
                  {
                    translateX: slide.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-28, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.brandRow}>
              <VionaBrandLockup variant="iconOnly" />
              {canPin ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={pinned ? 'Bỏ ghim điều hướng / Unpin navigation' : 'Ghim điều hướng / Pin navigation'}
                  accessibilityState={{ selected: pinned }}
                  onHoverIn={hoverIn}
                  onHoverOut={hoverOut}
                  onPress={() => onPinnedChange(!pinned)}
                  style={styles.pinButton}
                >
                  <Ionicons
                    name={pinned ? 'pin' : 'pin-outline'}
                    size={16}
                    color={vionaCinematicTokens.color.ice}
                  />
                </Pressable>
              ) : null}
            </View>
            <ScrollView
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              style={styles.listScroll}
            >
              {universes.map((universe) => {
                const interactive =
                  universe.availability === 'available' && typeof callbacks[universe.id] === 'function';
                const tone = vionaCinematicTokens.universe[universe.id];
                return (
                  <Pressable
                    key={universe.id}
                    accessibilityRole="button"
                    accessibilityLabel={t(`home.rec2.universes.${universe.id}.title`)}
                    accessibilityState={{ disabled: !interactive }}
                    disabled={!interactive}
                    onHoverIn={hoverIn}
                    onHoverOut={hoverOut}
                    onPress={() => invokeVionaRec2UniverseCallback(universe, callbacks)}
                    style={({ pressed }) => [styles.item, pressed && interactive && styles.itemPressed]}
                  >
                    <Ionicons name={ICONS[universe.id]} size={18} color={tone.accent} />
                    <Text style={styles.itemLabel}>{t(`home.rec2.universes.${universe.id}.title`)}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('home.rec2.language')}
              accessibilityState={{ disabled: !onOpenLanguage }}
              disabled={!onOpenLanguage}
              onHoverIn={hoverIn}
              onHoverOut={hoverOut}
              onPress={onOpenLanguage}
              style={styles.language}
            >
              <Ionicons name="language-outline" size={18} color={vionaCinematicTokens.color.ice} />
              <Text style={styles.itemLabel}>{t('home.rec2.language')}</Text>
            </Pressable>
          </Animated.View>
        ) : null}
        <Pressable
          accessibilityRole="button"
           accessibilityLabel={open ? 'Đóng điều hướng / Close navigation' : 'Mở điều hướng / Open navigation'}
          accessibilityState={{ expanded: open }}
          onHoverIn={hoverIn}
          onHoverOut={hoverOut}
          onPress={toggle}
          ref={handleRef}
          style={styles.handle}
          testID="viona-focus-nav-handle"
        >
          <Ionicons
            name={open ? 'close' : 'menu-outline'}
            size={22}
            color={vionaCinematicTokens.color.ice}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 60,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 7, 19, 0.28)',
    zIndex: 20,
  },
  anchor: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    zIndex: 40,
  },
  handle: {
    position: 'absolute',
    left: 12,
    top: 12,
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(125, 211, 252, 0.45)',
    backgroundColor: 'rgba(7, 17, 28, 0.94)',
    zIndex: 50,
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: 'rgba(7, 17, 28, 0.96)',
    borderRightWidth: 1,
    borderRightColor: vionaCinematicTokens.color.line,
    paddingTop: 72,
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
    zIndex: 30,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 6 },
  word: { color: vionaCinematicTokens.color.ice, fontSize: 16, letterSpacing: 2, fontWeight: '600', flex: 1 },
  pinButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listScroll: { flex: 1 },
  list: { gap: 4, paddingBottom: 12 },
  item: {
    minHeight: 44,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
  },
  itemPressed: { backgroundColor: 'rgba(47, 123, 255, 0.16)' },
  itemLabel: { color: vionaCinematicTokens.color.ice, fontSize: 14, fontWeight: '600', flexShrink: 1 },
  language: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
  },
});
