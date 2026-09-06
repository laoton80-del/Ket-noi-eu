import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { vionaNativeClearPremiumTokens as tkn } from '../../../design/vionaNativeClearPremiumTokens';
import { FontFamily } from '../../../theme/typography';

export type NativeTravelGateMode = 'loading' | 'prompt' | 'ready';
export type NativeTravelContextDensity = 'compact' | 'compactRow' | 'regular' | 'wide';
export type NativeTravelDemoPlacement = 'inline' | 'deferred';

export type VionaNativeTravelContextStripProps = Readonly<{
  gate: NativeTravelGateMode;
  loadingLabel: string;
  consentTitle: string;
  consentSubtitle: string;
  consentSupport: string;
  consentAllowLabel: string;
  consentDeclineLabel: string;
  onAllowLocation: () => void;
  onContinueWithoutLocation: () => void;
  destinationLabel: string;
  destinationPlaceholder: string;
  destinationQuery: string;
  onDestinationChange: (value: string) => void;
  weatherLine: string;
  fxLine: string;
  enableLocationLabel: string;
  onEnableLocation: () => void;
  locationEnabled: boolean;
  density?: NativeTravelContextDensity;
  demoPlacement?: NativeTravelDemoPlacement;
}>;

/**
 * Native Travel context strip. Presentation only: loading, consent, destination/weather/FX.
 * Density and demo-line placement are P2-C presentation branches. No fetch. No new permission flow.
 */
export function VionaNativeTravelContextStrip({
  gate,
  loadingLabel,
  consentTitle,
  consentSubtitle,
  consentSupport,
  consentAllowLabel,
  consentDeclineLabel,
  onAllowLocation,
  onContinueWithoutLocation,
  destinationLabel,
  destinationPlaceholder,
  destinationQuery,
  onDestinationChange,
  weatherLine,
  fxLine,
  enableLocationLabel,
  onEnableLocation,
  locationEnabled,
  density = 'regular',
  demoPlacement = 'inline',
}: VionaNativeTravelContextStripProps) {
  const compact = density === 'compact';
  const compactRow = density === 'compactRow';
  const wide = density === 'wide';
  const showDemo = demoPlacement === 'inline';

  return (
    <View testID="viona-native-travel-context-strip" style={[styles.root, compact && styles.rootCompact]}>
      {gate === 'loading' ? (
        <View style={[styles.loadingBox, compact && styles.loadingCompact]} accessibilityLabel={loadingLabel}>
          <ActivityIndicator color={tkn.accent.travel} />
          <Text style={styles.loadingLabel}>{loadingLabel}</Text>
        </View>
      ) : null}

      {gate === 'prompt' ? (
        <View style={[styles.card, compact && styles.cardCompact]}>
          <Text style={styles.title}>{consentTitle}</Text>
          <Text style={styles.body}>{consentSubtitle}</Text>
          <Text style={styles.support}>{consentSupport}</Text>
          <Pressable
            testID="travel-native-consent-allow"
            onPress={onAllowLocation}
            accessibilityRole="button"
            accessibilityLabel={consentAllowLabel}
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
          >
            <Text style={styles.primaryLabel}>{consentAllowLabel}</Text>
          </Pressable>
          <Pressable
            testID="travel-native-consent-decline"
            onPress={onContinueWithoutLocation}
            accessibilityRole="button"
            accessibilityLabel={consentDeclineLabel}
            style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
          >
            <Text style={styles.secondaryLabel}>{consentDeclineLabel}</Text>
          </Pressable>
        </View>
      ) : null}

      {gate === 'ready' ? (
        <View
          style={[
            styles.card,
            compact && styles.cardCompact,
            compactRow && styles.cardRow,
            wide && styles.cardWide,
          ]}
        >
          {compactRow || wide ? (
            <View style={styles.split}>
              <View style={styles.splitMain}>
                {compactRow ? null : <Text style={styles.kicker}>{destinationLabel}</Text>}
                <TextInput
                  testID="travel-native-destination-input"
                  value={destinationQuery}
                  onChangeText={onDestinationChange}
                  placeholder={destinationPlaceholder}
                  placeholderTextColor={tkn.ink.secondary}
                  accessibilityLabel={destinationLabel}
                  style={[styles.input, compactRow && styles.inputCompact]}
                />
              </View>
              <View style={styles.splitMeta}>
                {showDemo ? (
                  <>
                    <Text style={styles.meta}>{weatherLine}</Text>
                    <Text style={styles.meta}>{fxLine}</Text>
                  </>
                ) : null}
                {locationEnabled ? null : (
                  <Pressable
                    testID="travel-native-enable-location"
                    onPress={onEnableLocation}
                    accessibilityRole="button"
                    accessibilityLabel={enableLocationLabel}
                    style={({ pressed }) => [styles.secondaryBtn, styles.secondaryInline, pressed && styles.pressed]}
                  >
                    <Text style={styles.secondaryLabel}>{enableLocationLabel}</Text>
                  </Pressable>
                )}
              </View>
            </View>
          ) : (
            <>
              <Text style={styles.kicker}>{destinationLabel}</Text>
              <TextInput
                testID="travel-native-destination-input"
                value={destinationQuery}
                onChangeText={onDestinationChange}
                placeholder={destinationPlaceholder}
                placeholderTextColor={tkn.ink.secondary}
                accessibilityLabel={destinationLabel}
                style={[styles.input, compact && styles.inputCompact]}
              />
              {showDemo ? (
                <>
                  <Text style={styles.meta}>{weatherLine}</Text>
                  <Text style={styles.meta}>{fxLine}</Text>
                </>
              ) : null}
              {locationEnabled ? null : (
                <Pressable
                  testID="travel-native-enable-location"
                  onPress={onEnableLocation}
                  accessibilityRole="button"
                  accessibilityLabel={enableLocationLabel}
                  style={({ pressed }) => [styles.secondaryBtn, compact && styles.secondaryInline, pressed && styles.pressed]}
                >
                  <Text style={styles.secondaryLabel}>{enableLocationLabel}</Text>
                </Pressable>
              )}
            </>
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginBottom: tkn.spacing[16],
    width: '100%',
  },
  rootCompact: {
    marginBottom: tkn.spacing[8],
  },
  loadingBox: {
    minHeight: 88,
    alignItems: 'center',
    justifyContent: 'center',
    gap: tkn.spacing[8],
    backgroundColor: tkn.bg.surface,
    borderRadius: tkn.radius.lg,
    borderWidth: 1,
    borderColor: tkn.line.subtle,
    padding: tkn.spacing[16],
  },
  loadingCompact: {
    minHeight: tkn.hit.min,
    padding: tkn.spacing[12],
  },
  loadingLabel: {
    fontFamily: FontFamily.medium,
    color: tkn.ink.secondary,
    fontSize: tkn.type.body.fontSize,
    lineHeight: tkn.type.body.lineHeight,
  },
  card: {
    backgroundColor: tkn.bg.surface,
    borderRadius: tkn.radius.xl,
    borderWidth: 1,
    borderColor: tkn.line.subtle,
    padding: tkn.spacing[16],
    gap: tkn.spacing[8],
    width: '100%',
  },
  cardCompact: {
    padding: tkn.spacing[12],
    gap: tkn.spacing[4],
    borderRadius: tkn.radius.lg,
  },
  cardRow: {
    paddingVertical: tkn.spacing[4],
    paddingHorizontal: tkn.spacing[12],
  },
  cardWide: {
    alignSelf: 'stretch',
    width: '100%',
  },
  split: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tkn.spacing[16],
    width: '100%',
  },
  splitMain: {
    flex: 1,
    minWidth: 0,
    gap: tkn.spacing[4],
  },
  splitMeta: {
    flexShrink: 0,
    maxWidth: 280,
    gap: tkn.spacing[4],
  },
  kicker: {
    fontFamily: FontFamily.semibold,
    color: tkn.accent.travel,
    fontSize: tkn.type.chip.fontSize,
    lineHeight: tkn.type.chip.lineHeight,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: FontFamily.bold,
    color: tkn.ink.primary,
    fontSize: tkn.type.greeting.fontSize,
    lineHeight: tkn.type.greeting.lineHeight,
  },
  body: {
    fontFamily: FontFamily.regular,
    color: tkn.ink.secondary,
    fontSize: tkn.type.body.fontSize,
    lineHeight: tkn.type.body.lineHeight,
  },
  support: {
    fontFamily: FontFamily.regular,
    color: tkn.ink.secondary,
    fontSize: tkn.type.meta.fontSize,
    lineHeight: tkn.type.meta.lineHeight,
  },
  meta: {
    fontFamily: FontFamily.regular,
    color: tkn.ink.secondary,
    fontSize: tkn.type.meta.fontSize,
    lineHeight: tkn.type.meta.lineHeight,
  },
  input: {
    minHeight: tkn.hit.min,
    borderRadius: tkn.radius.md,
    borderWidth: 1,
    borderColor: tkn.line.subtle,
    backgroundColor: tkn.bg.muted,
    paddingHorizontal: tkn.spacing[12],
    fontFamily: FontFamily.medium,
    color: tkn.ink.primary,
    fontSize: tkn.type.body.fontSize,
  },
  inputCompact: {
    minHeight: tkn.hit.min,
    paddingVertical: 0,
  },
  primaryBtn: {
    minHeight: tkn.hit.min,
    borderRadius: tkn.radius.md,
    backgroundColor: tkn.accent.travel,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: tkn.spacing[16],
  },
  primaryLabel: {
    fontFamily: FontFamily.semibold,
    color: tkn.ink.inverse,
    fontSize: tkn.type.button.fontSize,
    lineHeight: tkn.type.button.lineHeight,
  },
  secondaryBtn: {
    minHeight: tkn.hit.min,
    borderRadius: tkn.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: tkn.spacing[16],
  },
  secondaryInline: {
    alignSelf: 'flex-start',
    paddingHorizontal: 0,
  },
  secondaryLabel: {
    fontFamily: FontFamily.semibold,
    color: tkn.accent.travel,
    fontSize: tkn.type.body.fontSize,
    lineHeight: tkn.type.body.lineHeight,
  },
  pressed: {
    opacity: 0.88,
  },
});
