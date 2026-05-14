import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, type ReactElement, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { vionaTokens } from '../../design';
import { useTranslation } from '../../i18n';
import { FontFamily } from '../../theme/typography';
import {
  FASHION_HOME_COMMAND_RAIL_BORDER,
  FASHION_HOME_COMMAND_RAIL_GRADIENT,
  FASHION_HOME_COMMAND_RAIL_HIGHLIGHT,
  FASHION_HOME_GLOW_CYAN,
  FASHION_HOME_LINE_CYAN,
  FASHION_HOME_LINE_GOLD_SOFT,
  premiumCrispEdgeStroke,
  premiumFrameEdgeOverlay,
} from './fashionHomeDesktopShell';
import { vionaGlobalTopRailWebRightReservePx } from './globalLightNetworkTokens';
import { VionaBrandLockup } from './VionaBrandLockup';

const LOGO_COMPACT_BREAKPOINT = 1060;
const LEGACY_HIDE_STYLE_ID = 'viona-global-top-rail-legacy-hide';

export type VionaGlobalTopRailFullscreenControl = Readonly<{
  isActive: boolean;
  onPress: () => void;
  accessibilityLabel: string;
  label: string;
}>;

export type VionaGlobalTopRailProps = Readonly<{
  density?: 'comfortable' | 'compact';
  onPressLogo: () => void;
  /** Primary contextual line (section title, greeting, etc.). */
  titleLine1: string;
  /** Secondary line; omitted when empty. */
  titleLine2?: string;
  titleA11y: string;
  onPressLanguage: () => void;
  onPressSafety: () => void;
  onPressAccount: () => void;
  onPressVio?: () => void;
  /** When false, hides the VIO Credits pill (e.g. surfaces without wallet shortcut). */
  showVioCredits?: boolean;
  fullscreenControl?: VionaGlobalTopRailFullscreenControl;
  showRolePicker?: boolean;
  onPressRole?: () => void;
  showBack?: boolean;
  onPressBack?: () => void;
  /** Optional settings / app-preferences control (e.g. Merchant hub). */
  onPressSettings?: () => void;
  settingsA11y?: string;
  /** Shown next to settings icon on non-compact layouts. */
  settingsLabel?: string;
  /** Extra pills after account (rare). */
  trailingSlot?: ReactNode;
}>;

export function VionaGlobalTopRail({
  density = 'comfortable',
  onPressLogo,
  titleLine1,
  titleLine2 = '',
  titleA11y,
  onPressLanguage,
  onPressSafety,
  onPressAccount,
  onPressVio,
  showVioCredits = true,
  fullscreenControl,
  showRolePicker = false,
  onPressRole,
  showBack = false,
  onPressBack,
  onPressSettings,
  settingsA11y,
  settingsLabel = 'Settings',
  trailingSlot,
}: VionaGlobalTopRailProps): ReactElement {
  const { t } = useTranslation();
  const { width: windowWidth } = useWindowDimensions();
  const compactDensity = density === 'compact';
  const useCompactLogo = compactDensity || (windowWidth > 0 && windowWidth < LOGO_COMPACT_BREAKPOINT);
  const showContext = titleLine1.trim().length > 0 || titleLine2.trim().length > 0;

  return (
    <View style={[styles.barShell, compactDensity && styles.barShellCompact]}>
      <LinearGradient
        colors={[...FASHION_HOME_COMMAND_RAIL_GRADIENT]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.bar, compactDensity && styles.barCompact]}
      >
        <View style={styles.barInnerHighlight} pointerEvents="none" />
        <View style={[styles.barRow, compactDensity && styles.barRowCompact]}>
          <View style={[styles.brandRail, compactDensity && styles.brandRailCompact]}>
            {showBack && onPressBack ? (
              <Pressable
                onPress={onPressBack}
                style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={t('checkout.back')}
              >
                <Ionicons name="chevron-back" size={22} color={vionaTokens.fashionTech.champagne} />
              </Pressable>
            ) : null}
            <Pressable
              onPress={onPressLogo}
              style={({ pressed }) => [styles.logoPressable, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="VIONA Hub"
            >
              <VionaBrandLockup variant={useCompactLogo ? 'compact' : 'header'} />
            </Pressable>
            {showContext ? (
              <>
                <View style={styles.greetingDivider} pointerEvents="none" />
                <View style={styles.greetingBlock} accessibilityRole="text" accessibilityLabel={titleA11y}>
                  <Text
                    style={[styles.greetingLine1, compactDensity && styles.greetingLine1Compact]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {titleLine1}
                  </Text>
                  {titleLine2.trim().length > 0 ? (
                    <Text
                      style={[styles.wishLine, compactDensity && styles.wishLineCompact]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {titleLine2}
                    </Text>
                  ) : null}
                </View>
              </>
            ) : null}
          </View>
          <View style={[styles.utilityTrack, compactDensity && styles.utilityTrackCompact]}>
            <View
              style={[
                styles.utilityCluster,
                compactDensity && styles.utilityClusterCompact,
                Platform.OS === 'web' ? { paddingRight: vionaGlobalTopRailWebRightReservePx(windowWidth) } : null,
              ]}
            >
              {showRolePicker && onPressRole ? (
                <Pressable
                  onPress={onPressRole}
                  style={({ pressed }) => [
                    styles.utilBtn,
                    compactDensity && styles.utilBtnCompact,
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons
                    name="shuffle-outline"
                    size={compactDensity ? 15 : 16}
                    color={vionaTokens.fashionTech.champagne}
                  />
                  <Text style={styles.utilLabel} numberOfLines={1} ellipsizeMode="tail">
                    {t('shell.utility.switchRole')}
                  </Text>
                </Pressable>
              ) : null}
              <Pressable
                onPress={onPressLanguage}
                style={({ pressed }) => [
                  styles.utilBtn,
                  compactDensity && styles.utilBtnCompact,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons
                  name="globe-outline"
                  size={compactDensity ? 15 : 16}
                  color={vionaTokens.fashionTech.champagne}
                />
                <Text style={styles.utilLabel} numberOfLines={1} ellipsizeMode="tail">
                  {t('shell.utility.language')}
                </Text>
              </Pressable>
              {fullscreenControl ? (
                <Pressable
                  onPress={fullscreenControl.onPress}
                  style={({ pressed }) => [
                    styles.utilBtn,
                    compactDensity && styles.utilBtnCompact,
                    compactDensity ? styles.fullscreenBtnCompact : styles.fullscreenBtn,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={fullscreenControl.accessibilityLabel}
                >
                  <Ionicons
                    name={fullscreenControl.isActive ? 'contract-outline' : 'expand-outline'}
                    size={compactDensity ? 15 : 16}
                    color={vionaTokens.fashionTech.champagne}
                  />
                  {compactDensity ? null : (
                    <Text style={styles.utilLabel} numberOfLines={1} ellipsizeMode="tail">
                      {fullscreenControl.label}
                    </Text>
                  )}
                </Pressable>
              ) : null}
              {showVioCredits && onPressVio ? (
                <Pressable
                  onPress={onPressVio}
                  style={({ pressed }) => [
                    styles.utilBtn,
                    compactDensity && styles.utilBtnCompact,
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons
                    name="wallet-outline"
                    size={compactDensity ? 15 : 16}
                    color={vionaTokens.fashionTech.champagne}
                  />
                  <Text style={styles.utilLabel} numberOfLines={1} ellipsizeMode="tail">
                    {t('shell.utility.vioCredits')}
                  </Text>
                </Pressable>
              ) : null}
              {onPressSettings ? (
                <Pressable
                  onPress={onPressSettings}
                  style={({ pressed }) => [
                    styles.utilBtn,
                    compactDensity && styles.utilBtnCompact,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={settingsA11y ?? t('b2b.settingsA11y')}
                >
                  <Ionicons
                    name="settings-outline"
                    size={compactDensity ? 15 : 16}
                    color={vionaTokens.fashionTech.champagne}
                  />
                  {compactDensity ? null : (
                    <Text style={styles.utilLabel} numberOfLines={1} ellipsizeMode="tail">
                      {settingsLabel}
                    </Text>
                  )}
                </Pressable>
              ) : null}
              <Pressable
                onPress={onPressSafety}
                style={({ pressed }) => [
                  styles.utilBtn,
                  compactDensity && styles.utilBtnCompact,
                  styles.sosBtn,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={t('sos.a11yChip')}
              >
                <Ionicons name="shield" size={compactDensity ? 15 : 16} color={vionaTokens.fashionTech.sosNeon} />
                <Text style={[styles.utilLabel, styles.sosLabel]} numberOfLines={1} ellipsizeMode="tail">
                  {t('sos.chip')}
                </Text>
              </Pressable>
              <Pressable
                onPress={onPressAccount}
                style={({ pressed }) => [
                  styles.utilBtn,
                  compactDensity && styles.utilBtnCompact,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons
                  name="person-circle-outline"
                  size={compactDensity ? 15 : 16}
                  color={vionaTokens.fashionTech.champagne}
                />
                <Text style={styles.utilLabel} numberOfLines={1} ellipsizeMode="tail">
                  {t('shell.utility.accountProfile')}
                </Text>
              </Pressable>
              {trailingSlot}
            </View>
          </View>
        </View>
      </LinearGradient>
      <View
        pointerEvents="none"
        style={[
          styles.railEdgeOverlay,
          premiumFrameEdgeOverlay(vionaTokens.radius.lg),
          premiumCrispEdgeStroke(FASHION_HOME_COMMAND_RAIL_BORDER),
        ]}
      />
    </View>
  );
}

export type VionaGlobalTopRailLegacyLabels = Readonly<{
  languageTitle: string;
  accountA11y: string;
  accountChip: string;
  accountChipShort: string;
  sosFabLabel: string;
}>;

/**
 * Web-only: while a section screen owns {@link VionaGlobalTopRail}, hide duplicate floating
 * language / account / SOS FAB hosts rendered outside the screen (same approach as Local hub).
 */
export function useVionaGlobalTopRailWebLegacySuppression(config: {
  rootId: string;
  enabled: boolean;
  labels: VionaGlobalTopRailLegacyLabels;
  /** When ancestors add large top padding for legacy floating chrome, reset while this screen is focused. */
  scenePadMin?: number;
}): void {
  const { rootId, enabled, labels, scenePadMin = 40 } = config;

  useFocusEffect(
    useCallback(() => {
      if (!enabled || Platform.OS !== 'web' || typeof document === 'undefined') return undefined;

      const hiddenHosts = new Set<HTMLElement>();
      const scenePadHosts = new Set<HTMLElement>();

      const sectionRoot = () => document.getElementById(rootId);

      const isInsideSectionRoot = (node: Element) => node.closest(`#${rootId}`) != null;

      const containsSectionRoot = (node: Element) => node.querySelector(`#${rootId}`) != null;

      const matchesLegacyControl = (ariaLabel: string, text: string) => {
        const haystack = `${ariaLabel} ${text}`.trim();
        return (
          ariaLabel === labels.sosFabLabel ||
          text === labels.sosFabLabel ||
          ariaLabel === labels.accountA11y ||
          ariaLabel === labels.accountChip ||
          text === labels.accountChip ||
          text === labels.accountChipShort ||
          ariaLabel === labels.languageTitle ||
          (haystack.includes(labels.languageTitle) && haystack.length <= 180)
        );
      };

      const hideHost = (host: HTMLElement) => {
        const root = sectionRoot();
        if (root && (root === host || root.contains(host) || host.contains(root))) return;
        if (hiddenHosts.has(host)) return;
        hiddenHosts.add(host);
        host.dataset.vionaFloatingLegacyHide = 'true';
        host.style.setProperty('display', 'none', 'important');
      };

      const pickOutsideLegacyHost = (node: Element): HTMLElement | null => {
        const root = sectionRoot();
        let current: HTMLElement | null = node instanceof HTMLElement ? node : node.parentElement;
        while (current && current !== document.body) {
          if (current.id === rootId) return null;
          if (root?.contains(current)) return null;
          const style = window.getComputedStyle(current);
          const positioned =
            style.position === 'fixed' || style.position === 'absolute' || style.position === 'sticky';
          const rect = current.getBoundingClientRect();
          if (positioned && rect.width >= 20 && rect.height >= 16) {
            return current;
          }
          current = current.parentElement;
        }
        return null;
      };

      const resetSceneTopPadding = () => {
        let current: HTMLElement | null = sectionRoot();
        while (current?.parentElement) {
          current = current.parentElement;
          const pad = Number.parseFloat(window.getComputedStyle(current).paddingTop || '0');
          if (pad < scenePadMin) continue;
          if (scenePadHosts.has(current)) continue;
          scenePadHosts.add(current);
          current.dataset.vionaScenePadPrev = current.style.paddingTop;
          current.style.paddingTop = '0px';
        }
      };

      const scanLegacyChrome = () => {
        const root = sectionRoot();
        const candidates = new Set<HTMLElement>();

        const consider = (node: Element) => {
          if (isInsideSectionRoot(node)) return;
          const element = node as HTMLElement;
          if (containsSectionRoot(element)) return;
          const ariaLabel = element.getAttribute('aria-label') ?? '';
          const text = (element.textContent ?? '').replace(/\s+/g, ' ').trim();
          if (!matchesLegacyControl(ariaLabel, text)) return;
          const host = pickOutsideLegacyHost(element);
          if (!host || (root && (root.contains(host) || host.contains(root)))) return;
          candidates.add(host);
        };

        document.querySelectorAll('[aria-label]').forEach(consider);
        document.querySelectorAll('[role="button"], button, [tabindex="0"]').forEach(consider);

        document.querySelectorAll('body *').forEach((node) => {
          const element = node as HTMLElement;
          if (isInsideSectionRoot(element)) return;
          if (containsSectionRoot(element)) return;
          const style = window.getComputedStyle(element);
          if (style.position !== 'fixed' && style.position !== 'absolute' && style.position !== 'sticky') {
            return;
          }
          const ariaLabel =
            element.getAttribute('aria-label') ??
            element.querySelector('[aria-label]')?.getAttribute('aria-label') ??
            '';
          const text = (element.textContent ?? '').replace(/\s+/g, ' ').trim();
          if (!matchesLegacyControl(ariaLabel, text)) return;
          if (root?.contains(element) || (root && element.contains(root))) return;
          candidates.add(element);
        });

        candidates.forEach((host) => hideHost(host));
      };

      const ensureLegacyHideStyle = () => {
        if (document.getElementById(LEGACY_HIDE_STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = LEGACY_HIDE_STYLE_ID;
        style.textContent = `
          body[data-viona-global-top-rail-active="true"] [data-viona-floating-legacy-hide="true"] {
            display: none !important;
          }
        `;
        document.head.appendChild(style);
      };

      ensureLegacyHideStyle();
      document.body.dataset.vionaGlobalTopRailActive = 'true';
      resetSceneTopPadding();
      scanLegacyChrome();
      const t1 = window.setTimeout(() => {
        resetSceneTopPadding();
        scanLegacyChrome();
      }, 250);
      const t2 = window.setTimeout(() => {
        resetSceneTopPadding();
        scanLegacyChrome();
      }, 1200);
      const t3 = window.setTimeout(() => {
        resetSceneTopPadding();
        scanLegacyChrome();
      }, 3000);
      const observer = new MutationObserver(() => {
        resetSceneTopPadding();
        scanLegacyChrome();
      });
      observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-label', 'style', 'class'] });

      return () => {
        window.clearTimeout(t1);
        window.clearTimeout(t2);
        window.clearTimeout(t3);
        observer.disconnect();
        delete document.body.dataset.vionaGlobalTopRailActive;
        scenePadHosts.forEach((host) => {
          host.style.paddingTop = host.dataset.vionaScenePadPrev ?? '';
          delete host.dataset.vionaScenePadPrev;
        });
        scenePadHosts.clear();
        hiddenHosts.forEach((host) => {
          host.style.removeProperty('display');
          delete host.dataset.vionaFloatingLegacyHide;
        });
        hiddenHosts.clear();
      };
    }, [enabled, labels, rootId, scenePadMin])
  );
}

const styles = StyleSheet.create({
  barShell: {
    width: '100%',
    alignSelf: 'stretch',
    borderRadius: vionaTokens.radius.lg,
    marginBottom: vionaTokens.spacing[2],
    backgroundColor: 'transparent',
    position: 'relative',
  },
  barShellCompact: {
    marginBottom: vionaTokens.spacing[2],
  },
  bar: {
    width: '100%',
    alignSelf: 'stretch',
    paddingVertical: vionaTokens.spacing[6],
    paddingHorizontal: vionaTokens.spacing[6],
    position: 'relative',
    borderRadius: vionaTokens.radius.lg,
    overflow: 'hidden',
  },
  railEdgeOverlay: {
    pointerEvents: 'none',
  },
  barCompact: {
    paddingVertical: vionaTokens.spacing[4],
  },
  barInnerHighlight: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 1,
    backgroundColor: FASHION_HOME_COMMAND_RAIL_HIGHLIGHT,
    zIndex: 2,
  },
  barRow: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: vionaTokens.spacing[8],
  },
  barRowCompact: {
    gap: vionaTokens.spacing[6],
  },
  brandRail: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    gap: vionaTokens.spacing[6],
    flex: 1,
    minWidth: 168,
  },
  brandRailCompact: {
    minWidth: 160,
    gap: vionaTokens.spacing[6],
  },
  backBtn: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    marginRight: -2,
    flexShrink: 0,
  },
  logoPressable: {
    paddingVertical: 0,
    paddingHorizontal: 0,
    marginLeft: -4,
    marginRight: -4,
    flexShrink: 0,
    backgroundColor: 'transparent',
  },
  greetingDivider: {
    width: 1,
    alignSelf: 'stretch',
    minHeight: 34,
    backgroundColor: FASHION_HOME_LINE_GOLD_SOFT,
  },
  greetingBlock: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 0,
    paddingVertical: 0,
  },
  greetingLine1: {
    fontFamily: FontFamily.semibold,
    fontSize: 14,
    letterSpacing: 0.1,
    lineHeight: 18,
    color: vionaTokens.fashionTech.inkOnDark,
    flexShrink: 1,
  },
  greetingLine1Compact: {
    fontSize: 13,
    lineHeight: 17,
  },
  wishLine: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    letterSpacing: 0.12,
    lineHeight: 15,
    color: vionaTokens.fashionTech.mutedOnDark,
    flexShrink: 1,
  },
  wishLineCompact: {
    fontSize: 10,
    lineHeight: 14,
  },
  utilityTrack: {
    alignSelf: 'center',
    borderRadius: vionaTokens.radius.pill,
    borderWidth: 0,
    backgroundColor: 'transparent',
    paddingVertical: 0,
    paddingHorizontal: 0,
    flexShrink: 0,
  },
  utilityTrackCompact: {
    alignSelf: 'stretch',
    width: '100%',
  },
  utilityCluster: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: vionaTokens.spacing[6],
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: 168,
  },
  utilityClusterCompact: {
    minWidth: 160,
    justifyContent: 'flex-start',
  },
  utilBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 30,
    paddingVertical: 0,
    paddingHorizontal: 11,
    borderRadius: vionaTokens.radius.pill,
    borderWidth: 1,
    borderColor: FASHION_HOME_LINE_CYAN,
    backgroundColor: 'rgba(8, 12, 20, 0.78)',
    shadowColor: FASHION_HOME_GLOW_CYAN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 1,
    maxWidth: 170,
  },
  utilBtnCompact: {
    minHeight: 32,
    paddingHorizontal: 9,
    maxWidth: 154,
  },
  fullscreenBtn: {
    maxWidth: 148,
  },
  fullscreenBtnCompact: {
    maxWidth: 44,
    paddingHorizontal: 8,
  },
  sosBtn: {
    borderColor: vionaTokens.fashionTech.sosNeonGlow,
    backgroundColor: 'rgba(28, 8, 12, 0.78)',
    shadowColor: 'rgba(255, 92, 108, 0.14)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 1,
  },
  sosLabel: {
    color: vionaTokens.fashionTech.sosNeon,
    fontFamily: FontFamily.semibold,
    letterSpacing: 0.35,
  },
  utilLabel: {
    fontFamily: FontFamily.semibold,
    fontSize: 11,
    color: vionaTokens.fashionTech.inkOnDark,
    flexShrink: 1,
  },
  pressed: {
    transform: [{ scale: 0.985 }],
  },
});
