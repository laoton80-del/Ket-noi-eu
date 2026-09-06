import { Ionicons } from '@expo/vector-icons';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from 'react-native';

import { vionaNativeClearPremiumTokens as tkn } from '../../../design/vionaNativeClearPremiumTokens';
import { FontFamily } from '../../../theme/typography';

export type NativeTravelLensItem = Readonly<{
  id: string;
  title: string;
  subtitle: string;
  accessibilityLabel: string;
  image: ImageSourcePropType;
  selected: boolean;
  onPress: () => void;
}>;

export type NativeTravelDiscoveryPreview = Readonly<{
  id: string;
  label: string;
}>;

export type NativeTravelConnectedItem = Readonly<{
  id: 'local' | 'academy' | 'business';
  title: string;
  subtitle: string;
  accessibilityLabel: string;
  onPress: () => void;
}>;

export type NativeTravelGatedItem = Readonly<{
  id: string;
  label: string;
  accessibilityLabel: string;
  onPress: () => void;
}>;

export type VionaNativeTravelSecondaryStackProps = Readonly<{
  lensTitle: string;
  lensSubtitle: string;
  lensItems: readonly NativeTravelLensItem[];
  discoveryTitle: string;
  discoveryPreviews: readonly NativeTravelDiscoveryPreview[];
  localFixerLabel: string;
  localFixerA11y: string;
  onOpenLocalFixer: () => void;
  connectedTitle: string;
  connectedItems: readonly NativeTravelConnectedItem[];
  pilotTitle: string;
  pilotSubtitle: string;
  pilotPills: readonly string[];
  gatedTitle: string;
  gatedItems: readonly NativeTravelGatedItem[];
  backLabel: string;
  homeLabel: string;
  onBack: () => void;
  onHome: () => void;
  reduceMotion: boolean;
  contentWidth?: number;
  wide?: boolean;
  lensImageHeight?: number;
}>;

/**
 * Native Travel secondary stack. Presentation only for lens, discovery, LocalFixer,
 * connected universes, honesty pills, existing gated AI entries, and escape actions.
 * Width, grouping, Travel Lens crop, and spacing are P2-C presentation branches.
 */
export function VionaNativeTravelSecondaryStack({
  lensTitle,
  lensSubtitle,
  lensItems,
  discoveryTitle,
  discoveryPreviews,
  localFixerLabel,
  localFixerA11y,
  onOpenLocalFixer,
  connectedTitle,
  connectedItems,
  pilotTitle,
  pilotSubtitle,
  pilotPills,
  gatedTitle,
  gatedItems,
  backLabel,
  homeLabel,
  onBack,
  onHome,
  reduceMotion,
  contentWidth = 0,
  wide = false,
  lensImageHeight = 72,
}: VionaNativeTravelSecondaryStackProps) {
  const lensColumns = lensItems.length > 0 ? Math.min(3, lensItems.length) : 3;
  const lensGap = tkn.spacing[8];
  const lensWidth =
    contentWidth > 0
      ? Math.max(96, Math.floor((contentWidth - lensGap * (lensColumns - 1)) / lensColumns))
      : 0;
  const connectedColumns = wide ? Math.min(3, Math.max(1, connectedItems.length)) : 1;
  const connectedWidth =
    wide && contentWidth > 0
      ? Math.max(
          tkn.hit.min,
          Math.floor((contentWidth - tkn.spacing[8] * (connectedColumns - 1)) / connectedColumns)
        )
      : 0;

  return (
    <View testID="viona-native-travel-secondary-stack" style={styles.root}>
      <Text style={styles.kicker}>{lensTitle}</Text>
      <Text style={styles.body}>{lensSubtitle}</Text>
      <View style={styles.lensRow}>
        {lensItems.map((item) => (
          <Pressable
            key={item.id}
            testID={`travel-native-lens-${item.id}`}
            onPress={item.onPress}
            accessibilityRole="button"
            accessibilityLabel={item.accessibilityLabel}
            accessibilityState={{ selected: item.selected }}
            style={({ pressed }) => [
              styles.lensCard,
              lensWidth > 0
                ? { width: lensWidth, flexGrow: 0, flexShrink: 0 }
                : styles.lensCardFallback,
              item.selected && styles.lensSelected,
              pressed && (reduceMotion ? styles.pressedFade : styles.pressedScale),
            ]}
          >
            <Image
              source={item.image}
              resizeMode="cover"
              style={[styles.lensImage, { height: lensImageHeight }]}
            />
            <Text style={styles.lensTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.lensSub} numberOfLines={2}>
              {item.subtitle}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.kicker}>{discoveryTitle}</Text>
      <View style={styles.chipRow}>
        {discoveryPreviews.map((preview) => (
          <View key={preview.id} testID={`travel-native-discovery-${preview.id}`} style={styles.previewChip}>
            <Text style={styles.previewLabel} numberOfLines={2}>
              {preview.label}
            </Text>
          </View>
        ))}
      </View>
      <Pressable
        testID="travel-native-local-fixer"
        onPress={onOpenLocalFixer}
        accessibilityRole="button"
        accessibilityLabel={localFixerA11y}
        style={({ pressed }) => [styles.actionRow, pressed && styles.pressedFade]}
      >
        <Ionicons name="people-outline" size={18} color={tkn.accent.travel} />
        <Text style={styles.actionLabel}>{localFixerLabel}</Text>
      </Pressable>

      <Text style={styles.kicker}>{connectedTitle}</Text>
      <View style={[styles.connectedRow, !wide && styles.connectedStack]}>
        {connectedItems.map((item) => (
          <Pressable
            key={item.id}
            testID={`travel-native-connected-${item.id}`}
            onPress={item.onPress}
            accessibilityRole="button"
            accessibilityLabel={item.accessibilityLabel}
            style={({ pressed }) => [
              styles.actionRow,
              connectedWidth > 0 ? { width: connectedWidth, flexGrow: 0, flexShrink: 0 } : styles.actionRowFill,
              pressed && styles.pressedFade,
            ]}
          >
            <Text style={styles.actionLabel}>{item.title}</Text>
            <Text style={styles.actionSub} numberOfLines={2}>
              {item.subtitle}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.pilot}>
        <Text style={styles.pilotTitle}>{pilotTitle}</Text>
        <Text style={styles.body}>{pilotSubtitle}</Text>
        <View style={styles.chipRow}>
          {pilotPills.map((pill) => (
            <View key={pill} style={styles.previewChip}>
              <Text style={styles.previewLabel}>{pill}</Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={styles.kicker}>{gatedTitle}</Text>
      <View style={styles.chipRow}>
        {gatedItems.map((item) => (
          <Pressable
            key={item.id}
            testID={`travel-native-gated-${item.id}`}
            onPress={item.onPress}
            accessibilityRole="button"
            accessibilityLabel={item.accessibilityLabel}
            style={({ pressed }) => [styles.gatedChip, pressed && styles.pressedFade]}
          >
            <Text style={styles.gatedLabel}>{item.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.escape}>
        <Pressable
          testID="travel-native-back"
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel={backLabel}
          style={({ pressed }) => [styles.escapeBtn, pressed && styles.pressedFade]}
        >
          <Text style={styles.escapeLabel}>{backLabel}</Text>
        </Pressable>
        <Pressable
          testID="travel-native-home"
          onPress={onHome}
          accessibilityRole="button"
          accessibilityLabel={homeLabel}
          style={({ pressed }) => [styles.escapeBtn, pressed && styles.pressedFade]}
        >
          <Text style={styles.escapeLabel}>{homeLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    gap: tkn.spacing[8],
    paddingBottom: tkn.spacing[32],
  },
  kicker: {
    marginTop: tkn.spacing[8],
    fontFamily: FontFamily.semibold,
    color: tkn.accent.travel,
    fontSize: tkn.type.chip.fontSize,
    lineHeight: tkn.type.chip.lineHeight,
    textTransform: 'uppercase',
  },
  body: {
    fontFamily: FontFamily.regular,
    color: tkn.ink.secondary,
    fontSize: tkn.type.body.fontSize,
    lineHeight: tkn.type.body.lineHeight,
  },
  lensRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tkn.spacing[8],
    width: '100%',
  },
  lensCard: {
    borderRadius: tkn.radius.lg,
    overflow: 'hidden',
    backgroundColor: tkn.bg.surface,
    borderWidth: 1,
    borderColor: tkn.line.subtle,
    minWidth: 96,
  },
  lensCardFallback: {
    width: '31%',
  },
  lensSelected: {
    borderColor: tkn.accent.travel,
    borderWidth: 2,
  },
  lensImage: {
    width: '100%',
    height: 64,
  },
  lensTitle: {
    fontFamily: FontFamily.semibold,
    color: tkn.ink.primary,
    fontSize: tkn.type.meta.fontSize,
    lineHeight: tkn.type.meta.lineHeight,
    paddingHorizontal: tkn.spacing[8],
    paddingTop: tkn.spacing[8],
  },
  lensSub: {
    fontFamily: FontFamily.regular,
    color: tkn.ink.secondary,
    fontSize: tkn.type.chip.fontSize,
    lineHeight: tkn.type.chip.lineHeight,
    paddingHorizontal: tkn.spacing[8],
    paddingBottom: tkn.spacing[8],
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tkn.spacing[8],
  },
  previewChip: {
    borderRadius: tkn.radius.pill,
    borderWidth: 1,
    borderColor: tkn.line.subtle,
    backgroundColor: tkn.bg.muted,
    paddingHorizontal: tkn.spacing[12],
    paddingVertical: tkn.spacing[8],
    minHeight: tkn.hit.min,
    justifyContent: 'center',
  },
  previewLabel: {
    fontFamily: FontFamily.medium,
    color: tkn.ink.primary,
    fontSize: tkn.type.chip.fontSize,
    lineHeight: tkn.type.chip.lineHeight,
  },
  connectedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tkn.spacing[8],
    width: '100%',
  },
  connectedStack: {
    flexDirection: 'column',
  },
  actionRow: {
    minHeight: tkn.hit.min,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tkn.spacing[8],
    borderRadius: tkn.radius.lg,
    borderWidth: 1,
    borderColor: tkn.line.subtle,
    backgroundColor: tkn.bg.surface,
    paddingHorizontal: tkn.spacing[12],
  },
  actionRowFill: {
    width: '100%',
  },
  actionLabel: {
    fontFamily: FontFamily.semibold,
    color: tkn.ink.primary,
    fontSize: tkn.type.title.fontSize,
    lineHeight: tkn.type.title.lineHeight,
    flex: 1,
  },
  actionSub: {
    fontFamily: FontFamily.regular,
    color: tkn.ink.secondary,
    fontSize: tkn.type.meta.fontSize,
    lineHeight: tkn.type.meta.lineHeight,
    flexShrink: 1,
  },
  pilot: {
    borderRadius: tkn.radius.lg,
    backgroundColor: tkn.bg.muted,
    padding: tkn.spacing[16],
    gap: tkn.spacing[8],
  },
  pilotTitle: {
    fontFamily: FontFamily.semibold,
    color: tkn.ink.primary,
    fontSize: tkn.type.title.fontSize,
    lineHeight: tkn.type.title.lineHeight,
  },
  gatedChip: {
    minHeight: tkn.hit.min,
    borderRadius: tkn.radius.pill,
    borderWidth: 1,
    borderColor: tkn.accent.travel,
    paddingHorizontal: tkn.spacing[12],
    justifyContent: 'center',
  },
  gatedLabel: {
    fontFamily: FontFamily.semibold,
    color: tkn.accent.travel,
    fontSize: tkn.type.chip.fontSize,
    lineHeight: tkn.type.chip.lineHeight,
  },
  escape: {
    flexDirection: 'row',
    gap: tkn.spacing[8],
    marginTop: tkn.spacing[8],
  },
  escapeBtn: {
    flex: 1,
    minHeight: tkn.hit.min,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: tkn.radius.md,
    backgroundColor: tkn.bg.surface,
    borderWidth: 1,
    borderColor: tkn.line.subtle,
  },
  escapeLabel: {
    fontFamily: FontFamily.semibold,
    color: tkn.ink.primary,
    fontSize: tkn.type.body.fontSize,
    lineHeight: tkn.type.body.lineHeight,
  },
  pressedScale: {
    transform: [{ scale: 0.98 }],
  },
  pressedFade: {
    opacity: 0.88,
  },
});
