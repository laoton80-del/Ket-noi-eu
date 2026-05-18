import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { KngTravelHospitalityMerchant } from '../../../data/kngTravelHospitality';
import { theme } from '../../../theme/theme';
import { FontFamily } from '../../../theme/typography';
import { applyWebStyles } from '../../../utils/applyWebStyles';

export type HomestayCrossSellWidgetProps = Readonly<{
  destinationDisplay: string;
  listings: readonly KngTravelHospitalityMerchant[];
  onSelectListing: (m: KngTravelHospitalityMerchant) => void;
  onOpenInterpreter: () => void;
  onBrowseHomestays: () => void;
}>;

function buildHeadline(destinationDisplay: string): string {
  const d = destinationDisplay.trim();
  const label = d.length > 0 ? d : 'điểm đến của bạn';
  return `Bay đến ${label}? Đừng quên đặt phòng nhà người Việt và mang theo Trợ lý Minh Khang!`;
}

export function HomestayCrossSellWidget({
  destinationDisplay,
  listings,
  onSelectListing,
  onOpenInterpreter,
  onBrowseHomestays,
}: HomestayCrossSellWidgetProps) {
  return (
    <View style={styles.wrap} className={applyWebStyles('kn-glass kn-neon-b2b')}>
      <View style={styles.iconRow}>
        <Ionicons name="airplane" size={18} color="#C5A059" />
        <Text style={styles.kicker}>VIONA Travel Lite · Cross-sell</Text>
      </View>
      <Text style={styles.headline}>{buildHeadline(destinationDisplay)}</Text>
      <Text style={styles.sub}>
        Homestay của người Việt tại {destinationDisplay.trim() || 'điểm đến'} — đặt phòng sớm khi vé đã chốt.
      </Text>

      {listings.length > 0 ? (
        <View style={styles.list}>
          {listings.map((m) => (
            <Pressable
              key={m.id}
              onPress={() => onSelectListing(m)}
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.9 }]}
              accessibilityRole="button"
              accessibilityLabel={`Mở ${m.name}`}
            >
              <View style={styles.rowIcon}>
                <Ionicons name="home" size={20} color={theme.hybrid.signalStrong} />
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle}>{m.name}</Text>
                <Text style={styles.rowMeta}>{m.cityLabel} · ★ {m.rating.toFixed(2)}</Text>
                <Text style={styles.rowTag}>{m.tagline}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(248,244,236,0.65)" />
            </Pressable>
          ))}
        </View>
      ) : (
        <Text style={styles.empty}>
          Chưa có homestay mock khớp từ khóa — bạn vẫn có thể xem toàn bộ lưu trú Kiều bào trong mạng VIONA Travel Lite.
        </Text>
      )}

      <View style={styles.ctaRow}>
        <Pressable
          onPress={onOpenInterpreter}
          style={({ pressed }) => [styles.ctaSecondary, pressed && { opacity: 0.9 }]}
          accessibilityRole="button"
        >
          <Ionicons name="mic" size={18} color="#FAF6EE" />
          <Text style={styles.ctaSecondaryText}>Mở Minh Khang Live</Text>
        </Pressable>
        <Pressable
          onPress={onBrowseHomestays}
          style={({ pressed }) => [styles.ctaPrimary, pressed && { opacity: 0.92 }]}
          accessibilityRole="button"
        >
          <Text style={styles.ctaPrimaryText}>Xem homestay</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(197, 160, 89, 0.45)',
    backgroundColor: 'rgba(12, 22, 40, 0.55)',
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  kicker: {
    fontSize: 11,
    letterSpacing: 0.8,
    color: 'rgba(232, 213, 163, 0.9)',
    fontFamily: FontFamily.extrabold,
    textTransform: 'uppercase',
  },
  headline: {
    fontSize: 16,
    lineHeight: 23,
    color: '#FFF8E8',
    fontFamily: FontFamily.extrabold,
    marginBottom: 8,
  },
  sub: {
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(248,244,236,0.78)',
    fontFamily: FontFamily.regular,
    marginBottom: theme.spacing.md,
  },
  list: {
    gap: 10,
    marginBottom: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: theme.radius.md,
    backgroundColor: 'rgba(6, 12, 24, 0.35)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(232, 213, 163, 0.22)',
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(85, 144, 224, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    fontSize: 15,
    color: '#FAF6EE',
    fontFamily: FontFamily.bold,
  },
  rowMeta: {
    fontSize: 12,
    color: 'rgba(232, 213, 163, 0.95)',
    fontFamily: FontFamily.semibold,
    marginTop: 2,
  },
  rowTag: {
    fontSize: 12,
    color: 'rgba(248,244,236,0.7)',
    fontFamily: FontFamily.regular,
    marginTop: 4,
  },
  empty: {
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(248,244,236,0.72)',
    fontFamily: FontFamily.regular,
    marginBottom: theme.spacing.md,
  },
  ctaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  ctaPrimary: {
    flexGrow: 1,
    minHeight: 46,
    borderRadius: theme.radius.md,
    backgroundColor: '#C5A059',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  ctaPrimaryText: {
    fontSize: 14,
    color: '#0A1628',
    fontFamily: FontFamily.extrabold,
  },
  ctaSecondary: {
    flexGrow: 1,
    minHeight: 46,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(248,244,236,0.35)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(8, 16, 32, 0.45)',
  },
  ctaSecondaryText: {
    fontSize: 14,
    color: '#FAF6EE',
    fontFamily: FontFamily.bold,
  },
});
