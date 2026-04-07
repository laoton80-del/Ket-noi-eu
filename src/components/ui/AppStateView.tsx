import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';

export type AppStateVariant =
  | 'loading'
  | 'empty'
  | 'offline'
  | 'maintenance'
  | 'paymentSuccess'
  | 'paymentFailure'
  | 'aiUnavailable';

type AppStateViewProps = {
  variant: AppStateVariant;
  /** Omit when `layout="embedded"` if only a body line is needed. */
  title?: string;
  message: string;
  /** Secondary line (e.g. txn id) */
  detail?: string;
  onRetry?: () => void;
  retryLabel?: string;
  /** Use inside scroll views / cards (no SafeAreaView, no full-height centering). */
  layout?: 'fullscreen' | 'embedded';
  style?: ViewStyle;
};

const ICON_BY_VARIANT: Record<AppStateVariant, keyof typeof Ionicons.glyphMap> = {
  loading: 'ellipsis-horizontal',
  empty: 'book-outline',
  offline: 'wifi-outline',
  maintenance: 'construct-outline',
  paymentSuccess: 'checkmark-circle-outline',
  paymentFailure: 'close-circle-outline',
  aiUnavailable: 'hardware-chip-outline',
};

export function AppStateView({
  variant,
  title,
  message,
  detail,
  onRetry,
  retryLabel = 'Thử lại',
  layout = 'fullscreen',
  style,
}: AppStateViewProps) {
  const icon = ICON_BY_VARIANT[variant];
  const embedded = layout === 'embedded';

  const body = (
    <View style={[embedded ? styles.embeddedInner : styles.inner]}>
      {variant === 'loading' ? (
        <ActivityIndicator
          size={embedded ? 'small' : 'large'}
          color={theme.colors.primaryBright}
          style={embedded ? styles.loaderEmbedded : styles.loader}
        />
      ) : (
        <View style={[styles.iconRing, embedded && styles.iconRingEmbedded]}>
          <Ionicons name={icon} size={embedded ? 28 : 36} color={theme.colors.primaryBright} />
        </View>
      )}
      {title ? (
        <Text style={[styles.title, embedded && styles.titleEmbedded]}>{title}</Text>
      ) : null}
      <Text style={[styles.message, embedded && styles.messageEmbedded]}>{message}</Text>
      {detail ? <Text style={styles.detail}>{detail}</Text> : null}
      {onRetry && variant !== 'loading' ? (
        <Pressable
          onPress={onRetry}
          style={({ pressed }) => [styles.retryBtn, embedded && styles.retryBtnEmbedded, pressed && { opacity: 0.85 }]}
        >
          <Text style={styles.retryText}>{retryLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );

  if (embedded) {
    return (
      <View style={[styles.embeddedWrap, style]}>
        {body}
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, style]}>
      {body}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  inner: {
    flex: 1,
    paddingHorizontal: theme.spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  embeddedWrap: {
    width: '100%',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.executive.card,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
  },
  embeddedInner: {
    alignItems: 'center',
  },
  loader: { marginBottom: theme.spacing.lg },
  loaderEmbedded: { marginBottom: theme.spacing.sm },
  iconRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    backgroundColor: theme.colors.executive.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  iconRingEmbedded: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginBottom: theme.spacing.sm,
  },
  title: {
    fontSize: 15,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.primaryBright,
    textAlign: 'center',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.sm,
  },
  titleEmbedded: {
    fontSize: 13,
    letterSpacing: 0.5,
    marginBottom: theme.spacing.xs,
  },
  message: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    maxWidth: 320,
  },
  messageEmbedded: {
    fontSize: 13,
    lineHeight: 19,
    maxWidth: 280,
  },
  detail: {
    marginTop: theme.spacing.md,
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: theme.spacing.xl,
    minWidth: 160,
    minHeight: 44,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    backgroundColor: theme.colors.executive.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryBtnEmbedded: {
    marginTop: theme.spacing.md,
    minWidth: 140,
    minHeight: 40,
  },
  retryText: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: theme.colors.primaryBright,
  },
});
