import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrecisePanel } from '../../components/ui/PrecisePanel';
import { StatusChip } from '../../components/ui/StatusChip';
import { useB2BBookingStore } from '../../state/b2bBooking';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';

function formatTime(iso: string): string {
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function InboundQueueScreen() {
  const bookings = useB2BBookingStore((state) => state.bookings);
  const confirmBooking = useB2BBookingStore((state) => state.confirmBooking);
  const inquiries = bookings.filter((booking) => booking.status === 'inquiry');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Inbound Queue</Text>
          <View style={styles.headerStatusRow}>
            <StatusChip state="Pending" />
            <Text style={styles.pendingCount}>{inquiries.length} cho duyet</Text>
          </View>
        </View>

        {inquiries.length === 0 ? (
          <PrecisePanel style={styles.emptyPanel}>
            <Ionicons name="checkmark-circle-outline" size={28} color={theme.colors.SoftMineralGrey} />
            <Text style={styles.emptyText}>Khong co yeu cau cho duyet moi. AI Le Tan dang truc.</Text>
          </PrecisePanel>
        ) : (
          <View style={styles.list}>
            {inquiries.map((booking) => (
              <PrecisePanel key={booking.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderText}>
                    <Text style={styles.customerName}>{booking.customerName}</Text>
                    <Text style={styles.requestedTime}>
                      {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                    </Text>
                  </View>
                  <StatusChip state="Pending" />
                </View>

                <Text style={styles.summaryText}>
                  {booking.handoffSummary ?? 'AI Le Tan chua gui tom tat cho yeu cau nay.'}
                </Text>

                <View style={styles.footerActions}>
                  <Pressable
                    onPress={() => confirmBooking(booking.id)}
                    style={({ pressed }) => [styles.confirmBtn, pressed && { opacity: 0.8 }]}
                  >
                    <Text style={styles.confirmBtnText}>Xac nhan (Confirm)</Text>
                  </Pressable>
                  <Pressable style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.8 }]}>
                    <Text style={styles.secondaryBtnText}>Tu choi / Goi lai</Text>
                  </Pressable>
                </View>
              </PrecisePanel>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.DeepInkNavy,
  },
  content: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.md,
  },
  header: {
    gap: theme.spacing.xs,
  },
  title: {
    ...theme.typeScale.h2,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.CeolWhite,
  },
  headerStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  pendingCount: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.semibold,
    color: theme.colors.PendingAmber,
  },
  list: {
    gap: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.SoftMineralGrey,
    borderColor: theme.colors.PendingAmber,
    gap: theme.spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.xs,
  },
  cardHeaderText: {
    flex: 1,
    gap: 2,
  },
  customerName: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.bold,
    color: theme.hybrid.panelCoolText,
  },
  requestedTime: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.medium,
    color: theme.hybrid.panelCoolTextMuted,
  },
  summaryText: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.regular,
    color: theme.hybrid.panelCoolText,
    lineHeight: theme.typeScale.body.lineHeight,
  },
  footerActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  confirmBtn: {
    flex: 1,
    minHeight: theme.components.button.height.sm,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.components.button.variant.primary.border,
    backgroundColor: theme.components.button.variant.primary.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.bold,
    color: theme.components.button.variant.primary.text,
  },
  secondaryBtn: {
    flex: 1,
    minHeight: theme.components.button.height.sm,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.components.button.variant.secondary.border,
    backgroundColor: theme.components.button.variant.secondary.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.semibold,
    color: theme.components.button.variant.secondary.text,
  },
  emptyPanel: {
    backgroundColor: theme.colors.executive.panelMuted,
    borderColor: theme.colors.glass.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    minHeight: 180,
  },
  emptyText: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.regular,
    color: theme.colors.SoftMineralGrey,
    textAlign: 'center',
    lineHeight: theme.typeScale.body.lineHeight,
  },
});
