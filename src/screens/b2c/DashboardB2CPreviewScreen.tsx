import { useMemo, type ReactElement } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DashboardB2CScreen } from './DashboardB2CScreen';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';

/** Dev & staging — production stays off unless explicitly enabled. */
export function isDashboardB2CPreviewRouteEnabled(): boolean {
  if (__DEV__) return true;
  const v = process.env.EXPO_PUBLIC_DASHBOARD_PREVIEW_ENABLED;
  return v === '1' || v === 'true';
}

/** Wide content rail so `VionaActionGrid` measures ≥760px on desktop (three columns). */
const PREVIEW_MAX_CONTENT = 1100;

export function DashboardB2CPreviewScreen(): ReactElement {
  const { width } = useWindowDimensions();
  const pad = theme.spacing.lg;
  const contentWidth = useMemo(
    () => Math.min(Math.max(width - pad * 2, 0), PREVIEW_MAX_CONTENT),
    [width, pad]
  );

  if (!isDashboardB2CPreviewRouteEnabled()) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.disabledWrap}>
          <Text style={styles.disabledTitle}>Dashboard preview is off</Text>
          <Text style={styles.disabledBody}>
            AF.UI.2 review URL only. Set{' '}
            <Text style={styles.mono}>EXPO_PUBLIC_DASHBOARD_PREVIEW_ENABLED=true</Text> for a staging build, or open this
            path from a dev client.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.banner, { maxWidth: contentWidth }]}>
          <Text style={styles.bannerLabel}>Dev / review preview</Text>
          <Text style={styles.bannerSub}>DashboardB2CScreen — not linked from production navigation</Text>
        </View>
        <View style={[styles.dashboardStripe, { maxWidth: contentWidth }]}>
          <DashboardB2CScreen contentWidth={contentWidth} layoutVariant="preview" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
    width: '100%',
    alignSelf: 'stretch',
  },
  scroll: {
    flex: 1,
    width: '100%',
    alignSelf: 'stretch',
  },
  scrollContent: {
    paddingTop: theme.spacing.xs,
    paddingBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    width: '100%',
    alignItems: 'stretch',
  },
  banner: {
    alignSelf: 'stretch',
    width: '100%',
    marginBottom: theme.spacing.xs,
    paddingVertical: 6,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
  },
  bannerLabel: {
    fontFamily: FontFamily.semibold,
    fontSize: 13,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  bannerSub: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  dashboardStripe: {
    alignSelf: 'stretch',
    width: '100%',
  },
  disabledWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  disabledTitle: {
    fontFamily: FontFamily.semibold,
    fontSize: 18,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  disabledBody: {
    fontFamily: FontFamily.regular,
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.text.secondary,
  },
  mono: {
    fontFamily: FontFamily.medium,
    color: theme.colors.primaryBright,
  },
});
