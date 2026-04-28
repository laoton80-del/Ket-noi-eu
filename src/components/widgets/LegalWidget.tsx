import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AnimatedPressable } from './AnimatedPressable';
import { WidgetCard } from './WidgetCard';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';

type Props = {
  daysToExpiry: number | null;
  visaExpiryDate?: string | null;
  ctaPrice: number;
  onPressAction: () => void;
  /** Countdown / risk line from urgency engine (e.g. hạn cụ thể). */
  urgencyLine?: string | null;
};

function getAlertTone(days: number | null) {
  if (days === null) return theme.colors.executive.panelMuted;
  if (days < 14) return theme.hybrid.chipErrorBg;
  if (days < 30) return theme.colors.executive.panelMuted;
  return theme.colors.executive.panelMuted;
}

function formatExpiryShort(iso?: string | null): string | null {
  if (!iso?.trim()) return null;
  const d = new Date(iso.trim());
  if (Number.isNaN(d.getTime())) return null;
  try {
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return iso.trim();
  }
}

const LegalWidgetComponent: React.FC<Props> = ({
  daysToExpiry,
  visaExpiryDate,
  ctaPrice,
  onPressAction,
  urgencyLine,
}) => {
  const dateLabel = formatExpiryShort(visaExpiryDate);
  const countdown =
    typeof daysToExpiry === 'number'
      ? `Đếm ngược ưu tiên: còn ${daysToExpiry} ngày${dateLabel ? ` · hạn ${dateLabel}` : ''}.`
      : null;

  return (
    <WidgetCard>
      <View style={[styles.banner, { backgroundColor: getAlertTone(daysToExpiry) }]}>
        <Text style={styles.title}>Gia hạn thẻ cư trú của bạn</Text>
        <Text style={styles.subtitle}>
          {typeof daysToExpiry === 'number'
            ? `Khẩn cấp hồ sơ: còn ${daysToExpiry} ngày — nên xử lý trong hôm nay để giảm rủi ro.`
            : 'Hãy kiểm tra lại ngày hết hạn giấy tờ của bạn'}
        </Text>
        {countdown ? <Text style={styles.countdown}>{countdown}</Text> : null}
        {urgencyLine ? <Text style={styles.risk}>{urgencyLine}</Text> : null}

        <AnimatedPressable onPress={onPressAction} style={styles.button}>
          <Text style={styles.buttonText}>
            Bạn cần {ctaPrice} Credits để Leona đặt lịch / gọi gia hạn ngay
          </Text>
        </AnimatedPressable>
      </View>
    </WidgetCard>
  );
};

export const LegalWidget = React.memo(LegalWidgetComponent);

const styles = StyleSheet.create({
  banner: {
    borderRadius: 16,
    padding: 16,
  },
  title: {
    ...theme.typeScale.h2,
    fontFamily: FontFamily.bold,
    marginBottom: 8,
    color: theme.colors.GraphiteBlue,
  },
  subtitle: {
    ...theme.typeScale.body,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.regular,
    marginBottom: 8,
  },
  countdown: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.semibold,
    color: theme.colors.PendingAmber,
    marginBottom: 6,
  },
  risk: {
    ...theme.typeScale.caption,
    color: theme.colors.RouteError,
    fontFamily: FontFamily.semibold,
    marginBottom: 12,
  },
  button: {
    backgroundColor: theme.colors.GraphiteBlue,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  buttonText: {
    color: theme.colors.CeolWhite,
    ...theme.typeScale.body,
    fontFamily: FontFamily.semibold,
    textAlign: 'center',
  },
});

