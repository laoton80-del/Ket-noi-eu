import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { vionaNativeClearPremiumTokens as tkn } from '../../../design/vionaNativeClearPremiumTokens';
import { FontFamily } from '../../../theme/typography';

export type NativeTravelGateMode = 'loading' | 'prompt' | 'ready';

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
}>;

/**
 * Native Travel context strip. Presentation only: loading, consent, destination/weather/FX.
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
}: VionaNativeTravelContextStripProps) {
  return (
    <View testID="viona-native-travel-context-strip" style={styles.root}>
      {gate === 'loading' ? (
        <View style={styles.loadingBox} accessibilityLabel={loadingLabel}>
          <ActivityIndicator color={tkn.accent.travel} />
          <Text style={styles.loadingLabel}>{loadingLabel}</Text>
        </View>
      ) : null}

      {gate === 'prompt' ? (
        <View style={styles.card}>
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
        <View style={styles.card}>
          <Text style={styles.kicker}>{destinationLabel}</Text>
          <TextInput
            testID="travel-native-destination-input"
            value={destinationQuery}
            onChangeText={onDestinationChange}
            placeholder={destinationPlaceholder}
            placeholderTextColor={tkn.ink.secondary}
            accessibilityLabel={destinationLabel}
            style={styles.input}
          />
          <Text style={styles.meta}>{weatherLine}</Text>
          <Text style={styles.meta}>{fxLine}</Text>
          {locationEnabled ? null : (
            <Pressable
              testID="travel-native-enable-location"
              onPress={onEnableLocation}
              accessibilityRole="button"
              accessibilityLabel={enableLocationLabel}
              style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
            >
              <Text style={styles.secondaryLabel}>{enableLocationLabel}</Text>
            </Pressable>
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
