import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { vionaCinematicTokens } from '../../../design/vionaCinematicTokens';
import { useTranslation } from '../../../i18n';
import { VionaCraneMark } from '../brand/VionaCraneMark';
import { resolveVionaRec2AlfredPresentation } from './vionaRec2HomeContract';
import { VionaRec2AlfredPanel } from './VionaRec2AlfredPanel';

type VionaCinematicCompanionProps = Readonly<{
  reducedMotion?: boolean;
  mode: 'panel' | 'sheet' | 'dock';
  onClose?: () => void;
  open?: boolean;
  pinned?: boolean;
  hoverEnabled?: boolean;
  dockBottom?: number;
  onOpenChange?: (open: boolean) => void;
  onPinnedChange?: (pinned: boolean) => void;
}>;

/** Visual frame around the existing Viona panel. Runtime state stays inside that panel. */
export function VionaCinematicCompanion({
  reducedMotion = false,
  mode,
  onClose,
  open = false,
  pinned = false,
  hoverEnabled = false,
  dockBottom = 12,
  onOpenChange,
  onPinnedChange,
}: VionaCinematicCompanionProps) {
  const { t } = useTranslation();
  const [preview, setPreview] = useState(false);
  const presentation = resolveVionaRec2AlfredPresentation();
  const canPinDock = mode === 'dock' && hoverEnabled && Platform.OS === 'web';
  const dockPinned = canPinDock && pinned;
  const dockTriggerRef = useRef<View>(null);
  const overlayRef = useRef<View>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const focusOnOpenRef = useRef(false);
  const wasOpenRef = useRef(false);

  const closeDock = () => {
    if (onClose) {
      onClose();
      return;
    }
    onPinnedChange?.(false);
    onOpenChange?.(false);
  };

  // A tablet/touch overlay must not retain a desktop pin after a tier change.
  useEffect(() => {
    if (mode === 'dock' && !canPinDock && pinned) onPinnedChange?.(false);
  }, [mode, canPinDock, pinned, onPinnedChange]);

  useEffect(() => {
    if (mode !== 'dock' || Platform.OS !== 'web' || typeof document === 'undefined') {
      wasOpenRef.current = open;
      return;
    }
    const doc = document;
    if (open && !wasOpenRef.current && focusOnOpenRef.current) {
      const active = doc.activeElement;
      const trigger = dockTriggerRef.current as unknown as HTMLElement | null;
      restoreFocusRef.current = active instanceof HTMLElement && active !== doc.body
        ? active
        : trigger;
      focusOnOpenRef.current = false;
      const overlay = overlayRef.current as unknown as HTMLElement | null;
      overlay?.setAttribute?.('tabindex', '-1');
      overlay?.focus?.();
    }
    if (!open && wasOpenRef.current) {
      const restore = restoreFocusRef.current;
      restoreFocusRef.current = null;
      if (restore && doc.contains(restore) && doc.activeElement === doc.body) {
        restore.focus?.();
      }
    }
    wasOpenRef.current = open;
  }, [mode, open]);

  useEffect(() => {
    if (mode !== 'dock' || !open || Platform.OS !== 'web' || typeof document === 'undefined') return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      const active = document.activeElement;
      const overlay = overlayRef.current as unknown as HTMLElement | null;
      const trigger = dockTriggerRef.current as unknown as HTMLElement | null;
      if (active instanceof Node && active !== document.body &&
        !overlay?.contains(active) && !trigger?.contains(active)) return;
      event.preventDefault();
      event.stopPropagation();
      closeDock();
    };
    document.addEventListener('keydown', onEscape);
    return () => document.removeEventListener('keydown', onEscape);
  }, [mode, open, onClose, onOpenChange, onPinnedChange]);

  if (mode === 'dock') {
    const toggle = () => {
      if (open) {
        closeDock();
        return;
      }
      focusOnOpenRef.current = true;
      onOpenChange?.(true);
    };
    return (
      <View pointerEvents="box-none" style={styles.dockHost}>
        {open && !dockPinned ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Đóng Viona / Dismiss Viona"
            onPress={closeDock}
            style={styles.backdrop}
          />
        ) : null}
        {open ? (
          <View
            ref={overlayRef}
            accessibilityLabel="Viona companion"
            accessibilityViewIsModal={!dockPinned}
            style={[styles.overlay, { right: 16, top: 76, bottom: Math.max(12, dockBottom) }]}
          >
            <CompanionToolbar
              pinned={dockPinned}
              onClose={closeDock}
              onPinnedChange={canPinDock ? onPinnedChange : undefined}
            />
            <View style={styles.orb} accessibilityElementsHidden>
              <VionaCraneMark size={36} variant="sapphire" glow={!reducedMotion} />
            </View>
            <VionaRec2AlfredPanel reducedMotion={reducedMotion} />
          </View>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={open ? 'Đóng Viona / Close Viona' : 'Mở Viona / Open Viona'}
          accessibilityState={{ expanded: open }}
          onHoverIn={() => {
            if (hoverEnabled && !open) setPreview(true);
          }}
          onHoverOut={() => setPreview(false)}
          onPress={toggle}
          ref={dockTriggerRef}
          style={[styles.dockHit, { top: 12, right: 12 }]}
          testID="viona-focus-viona-dock"
        >
          <View style={styles.trigger}>
            <VionaCraneMark size={28} variant="sapphire" glow={!reducedMotion} />
          </View>
          {preview && !open ? (
            <View pointerEvents="none" style={styles.preview}>
              <Text style={styles.previewTitle}>{t('home.rec2.alfred.title')}</Text>
              <Text style={styles.previewBody}>
                {t(`home.rec2.alfred.states.${presentation.state}`)}
              </Text>
            </View>
          ) : null}
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.frame, mode === 'panel' && styles.frameFill, mode === 'sheet' && styles.sheet]}>
      {mode === 'panel' ? (
        <CompanionToolbar pinned={pinned} onClose={onClose} onPinnedChange={onPinnedChange} />
      ) : null}
      <View style={styles.orb} accessibilityElementsHidden>
        <VionaCraneMark size={mode === 'panel' ? 42 : 36} variant="sapphire" glow={!reducedMotion} />
      </View>
      <VionaRec2AlfredPanel reducedMotion={reducedMotion} />
      {mode === 'sheet' && onClose ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Close Viona" onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeLabel}>Close</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function CompanionToolbar({
  pinned,
  onClose,
  onPinnedChange,
}: Readonly<{
  pinned: boolean;
  onClose?: () => void;
  onPinnedChange?: (pinned: boolean) => void;
}>) {
  if (!onClose && !onPinnedChange) return null;
  return (
    <View style={styles.toolbar}>
      {onPinnedChange ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={pinned ? 'Unpin Viona' : 'Pin Viona'}
          accessibilityState={{ selected: pinned }}
          onPress={() => onPinnedChange(!pinned)}
          style={styles.toolButton}
        >
          <Ionicons name={pinned ? 'pin' : 'pin-outline'} size={16} color={vionaCinematicTokens.color.ice} />
        </Pressable>
      ) : null}
      {onClose ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Close Viona" onPress={onClose} style={styles.toolButton}>
          <Ionicons name="close" size={18} color={vionaCinematicTokens.color.ice} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: vionaCinematicTokens.layout.companionWidth,
    maxWidth: '100%',
    gap: 12,
  },
  frameFill: { width: '100%' },
  sheet: {
    width: '100%',
    borderRadius: vionaCinematicTokens.radius.lg,
    borderWidth: 1,
    borderColor: vionaCinematicTokens.color.line,
    backgroundColor: vionaCinematicTokens.color.midnight,
    padding: 12,
  },
  orb: {
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(18, 58, 102, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(125, 211, 252, 0.45)',
  },
  closeButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: vionaCinematicTokens.color.line,
  },
  closeLabel: { color: vionaCinematicTokens.color.ice, fontWeight: '700' },
  dockHost: { ...StyleSheet.absoluteFillObject, zIndex: 35 },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 7, 19, 0.28)',
    zIndex: 20,
  },
  overlay: {
    position: 'absolute',
    width: vionaCinematicTokens.layout.companionWidth,
    maxWidth: '92%',
    borderRadius: vionaCinematicTokens.radius.lg,
    borderWidth: 1,
    borderColor: vionaCinematicTokens.color.line,
    backgroundColor: vionaCinematicTokens.color.midnight,
    padding: 12,
    gap: 8,
    zIndex: 30,
  },
  dockHit: {
    position: 'absolute',
    zIndex: 50,
    alignItems: 'flex-end',
  },
  trigger: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(18, 58, 102, 0.94)',
    borderWidth: 1,
    borderColor: 'rgba(125, 211, 252, 0.7)',
  },
  preview: {
    marginTop: 8,
    maxWidth: 220,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: vionaCinematicTokens.color.line,
    backgroundColor: 'rgba(7, 17, 28, 0.96)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  previewTitle: { color: vionaCinematicTokens.color.ice, fontSize: 14, fontWeight: '700' },
  previewBody: { color: vionaCinematicTokens.color.muted, fontSize: 12, lineHeight: 16 },
  toolbar: { flexDirection: 'row', justifyContent: 'flex-end', gap: 6 },
  toolButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: vionaCinematicTokens.color.line,
  },
});
