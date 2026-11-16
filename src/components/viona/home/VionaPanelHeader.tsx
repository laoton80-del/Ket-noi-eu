import { Inter_600SemiBold, useFonts } from '@expo-google-fonts/inter';
import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
// react-dom is present for web; this app does not ship its type package.
// @ts-expect-error module has no declaration file
import { createPortal } from 'react-dom';

import { vionaCinematicTokens } from '../../../design/vionaCinematicTokens';

const GOLD_MARK = require('../../../../assets/brand/viona/viona-symbol-gold.png');

export const VIONA_PANEL_HEADER_HEIGHT = 56;
export const VIONA_PANEL_MARK_SIZE = 36;

export const vionaSidePanelColors = ['rgba(18, 42, 74, 0.72)', 'rgba(10, 26, 51, 0.58)', 'rgba(7, 17, 28, 0.78)'] as const;

/** Same card frame for the left nav rail and the right Viona panel. */
export const vionaSidePanelFrame: ViewStyle = {
  borderRadius: 22,
  borderWidth: 1,
  borderColor: 'rgba(0, 209, 255, 0.16)',
  overflow: 'hidden',
  ...(Platform.OS === 'web'
    ? ({ backdropFilter: 'blur(18px) saturate(140%)', WebkitBackdropFilter: 'blur(18px) saturate(140%)' } as ViewStyle)
    : {}),
  ...vionaCinematicTokens.elevation.cardOnShell,
};

const TOOLTIP_CARD_GAP = 10;
const WORDMARK_SIZE = 15;
/** Measured top-bar tracking: 5px / 26px = 0.1923em. */
const TOP_BAR_TRACKING_EM = 0.1923;
const WORDMARK_LETTER_SPACING = Math.round(WORDMARK_SIZE * TOP_BAR_TRACKING_EM);

/** Same face as the top-bar wordmark: Inter SemiBold. Tracking is 0.1923em. */
function vionaWordmarkFont(fontsLoaded: boolean): string | undefined {
  if (Platform.OS === 'web') return 'Inter_600SemiBold, Inter, system-ui, sans-serif';
  return fontsLoaded ? 'Inter_600SemiBold' : undefined;
}

/** Shared top row for the left nav rail and the right Viona panel. */
export function VionaPanelHeader({
  closeLabel,
  onClose,
  showMark = true,
  showCloseLabel = false,
  testID,
}: Readonly<{
  closeLabel: string;
  onClose?: () => void;
  showMark?: boolean;
  showCloseLabel?: boolean;
  testID?: string;
}>) {
  const [fontsLoaded] = useFonts({ Inter_600SemiBold });
  const anchorRef = useRef<View>(null);
  const [tip, setTip] = useState(false);
  const [anchor, setAnchor] = useState<{ right: number; bottom: number } | null>(null);
  const showTip = () => {
    setTip(true);
    const host = anchorRef.current as unknown as HTMLElement | null;
    if (Platform.OS === 'web' && host?.getBoundingClientRect) {
      const button = host.getBoundingClientRect();
      let cardTop = button.top;
      let node: HTMLElement | null = host;
      while (node) {
        if (getComputedStyle(node).borderTopLeftRadius === '22px') {
          cardTop = node.getBoundingClientRect().top;
          break;
        }
        node = node.parentElement;
      }
      setAnchor({
        right: window.innerWidth - button.right,
        bottom: window.innerHeight - cardTop + TOOLTIP_CARD_GAP,
      });
      return;
    }
    anchorRef.current?.measureInWindow((_x, _y, width, height) => {
      setAnchor({ right: width, bottom: height + TOOLTIP_CARD_GAP });
    });
  };
  const hideTip = () => setTip(false);
  const portaledTip =
    Platform.OS === 'web' && tip && anchor && typeof document !== 'undefined'
      ? createPortal(
          <Text
            pointerEvents="none"
            style={[
              styles.tipText,
              {
                position: 'fixed',
                zIndex: 4000,
                right: anchor.right,
                bottom: anchor.bottom,
              } as ViewStyle,
            ]}
          >
            {closeLabel}
          </Text>,
          document.body,
        )
      : null;
  return (
    <View style={styles.header}>
      {showMark ? (
        <View style={styles.brand}>
          <Image
            source={GOLD_MARK}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
            style={styles.mark}
          />
          <Text
            style={[
              styles.wordmark,
              {
                fontFamily: vionaWordmarkFont(fontsLoaded),
                letterSpacing: WORDMARK_LETTER_SPACING,
              },
            ]}
            numberOfLines={1}
          >
            Viona
          </Text>
        </View>
      ) : null}
      {onClose ? (
        <View ref={anchorRef} collapsable={false} style={styles.closeWrap}>
          {tip && Platform.OS !== 'web' ? (
            <Text style={styles.tip} numberOfLines={1}>
              {closeLabel}
            </Text>
          ) : null}
          <Pressable
            testID={testID}
            accessibilityRole="button"
            accessibilityLabel={closeLabel}
            onPress={onClose}
            onHoverIn={showTip}
            onHoverOut={hideTip}
            hitSlop={8}
            style={showCloseLabel ? styles.closeWithLabel : styles.close}
          >
            <Ionicons name="close" size={18} color={vionaCinematicTokens.color.ice} />
            {showCloseLabel ? (
              <Text style={styles.closeLabel} numberOfLines={1}>
                {closeLabel}
              </Text>
            ) : null}
          </Pressable>
        </View>
      ) : null}
      {portaledTip}
    </View>
  );
}

const tipChrome = {
  color: vionaCinematicTokens.color.ice,
  backgroundColor: 'rgba(2, 7, 19, 0.92)',
  borderRadius: 8,
  paddingHorizontal: 8,
  paddingVertical: 4,
  fontSize: 11,
  lineHeight: 14,
} as const;

const styles = StyleSheet.create({
  header: {
    height: VIONA_PANEL_HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    zIndex: 2,
  },
  mark: { width: VIONA_PANEL_MARK_SIZE, height: VIONA_PANEL_MARK_SIZE },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
    minWidth: 0,
  },
  wordmark: {
    color: vionaCinematicTokens.color.accentGold,
    fontWeight: '600',
    fontSize: WORDMARK_SIZE,
    lineHeight: 18,
    textTransform: 'uppercase',
  },
  closeWrap: { marginLeft: 'auto', position: 'relative', alignItems: 'flex-end', justifyContent: 'center' },
  close: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeWithLabel: {
    minHeight: 32,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 8,
  },
  closeLabel: {
    color: vionaCinematicTokens.color.ice,
    fontFamily: vionaCinematicTokens.fontFamily.medium,
    fontSize: 13,
    lineHeight: 16,
  },
  tip: {
    position: 'absolute',
    right: 0,
    bottom: '100%',
    marginBottom: TOOLTIP_CARD_GAP,
    zIndex: 8,
    ...tipChrome,
  },
  tipText: {
    zIndex: 500,
    ...tipChrome,
  },
});
