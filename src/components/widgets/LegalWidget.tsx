import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AnimatedPressable } from './AnimatedPressable';
import { WidgetCard } from './WidgetCard';

type Props = {
  daysToExpiry: number | null;
  visaExpiryDate?: string | null;
  ctaPrice: number;
  onPressAction: () => void;
  /** Countdown / risk line from urgency engine (e.g. hạn cụ thể). */
  urgencyLine?: string | null;
};

function getAlertTone(days: number | null) {
  if (days === null) return '#FFF4E5';
  if (days < 14) return '#FDE8E8';
  if (days < 30) return '#FDECEC';
  return '#FFF4E5';
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
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 8,
  },
  countdown: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 6,
  },
  risk: {
    fontSize: 13,
    color: '#B91C1C',
    fontWeight: '600',
    marginBottom: 12,
    lineHeight: 18,
  },
  button: {
    backgroundColor: '#111827',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
});

