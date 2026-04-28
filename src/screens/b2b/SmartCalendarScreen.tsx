import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrecisePanel } from '../../components/ui/PrecisePanel';
import { StatusChip, type StatusChipState } from '../../components/ui/StatusChip';
import { useB2BBookingStore, type Booking, type Service } from '../../state/b2bBooking';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';

const CALENDAR_START_HOUR = 8;
const CALENDAR_END_HOUR = 18;
const HOUR_BLOCK_HEIGHT = 72;
const ROW_LABEL_WIDTH = 58;
const BOOKING_HORIZONTAL_INSET = 10;

function minutesSinceStart(iso: string): number {
  const date = new Date(iso);
  return (date.getHours() - CALENDAR_START_HOUR) * 60 + date.getMinutes();
}

function durationMinutes(startIso: string, endIso: string): number {
  return Math.max(15, Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000));
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function resolveServiceName(booking: Booking, services: Service[]): string {
  const span = durationMinutes(booking.startTime, booking.endTime);
  const exact = services.find((service) => service.durationMinutes === span);
  if (exact) return exact.name;
  const nearest = services.reduce<Service | null>((acc, service) => {
    if (!acc) return service;
    return Math.abs(service.durationMinutes - span) < Math.abs(acc.durationMinutes - span) ? service : acc;
  }, null);
  return nearest?.name ?? 'General Service';
}

function bookingChipState(status: Booking['status']): StatusChipState {
  if (status === 'inquiry') return 'Pending';
  if (status === 'no_show') return 'Error';
  return 'Cleared';
}

export function SmartCalendarScreen() {
  const bookings = useB2BBookingStore((state) => state.bookings);
  const services = useB2BBookingStore((state) => state.services);
  const hours = Array.from({ length: CALENDAR_END_HOUR - CALENDAR_START_HOUR + 1 }, (_, idx) => CALENDAR_START_HOUR + idx);
  const totalHeight = (CALENDAR_END_HOUR - CALENDAR_START_HOUR) * HOUR_BLOCK_HEIGHT;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Business Calendar</Text>
          <View style={styles.statusRow}>
            <StatusChip state="Cleared" />
            <Text style={styles.statusLabel}>AI Receptionist: Active</Text>
          </View>
        </View>

        <PrecisePanel style={styles.timelineShell}>
          <View style={styles.timelineBody}>
            <View style={styles.timeColumn}>
              {hours.map((hour) => (
                <Text key={`hour_${hour}`} style={styles.timeLabel}>
                  {String(hour).padStart(2, '0')}:00
                </Text>
              ))}
            </View>

            <View style={styles.slotTrack}>
              {hours.map((hour, idx) => {
                if (idx === hours.length - 1) return null;
                return <View key={`line_${hour}`} style={styles.hourLine} />;
              })}

              {bookings.map((booking) => {
                const top = (minutesSinceStart(booking.startTime) / 60) * HOUR_BLOCK_HEIGHT;
                const height = (durationMinutes(booking.startTime, booking.endTime) / 60) * HOUR_BLOCK_HEIGHT;
                const serviceName = resolveServiceName(booking, services);
                const isInquiry = booking.status === 'inquiry';
                const bookingToneStyle = isInquiry ? styles.bookingBlockInquiry : styles.bookingBlockConfirmed;
                return (
                  <PrecisePanel
                    key={booking.id}
                    style={[
                      styles.bookingBlock,
                      bookingToneStyle,
                      {
                        top,
                        height,
                      },
                    ]}
                  >
                    <View style={styles.bookingTopRow}>
                      <Text style={styles.bookingName}>{booking.customerName}</Text>
                      <StatusChip state={bookingChipState(booking.status)} />
                    </View>
                    <Text style={styles.bookingMeta}>
                      {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                    </Text>
                    <Text style={styles.bookingMeta}>{serviceName}</Text>
                  </PrecisePanel>
                );
              })}
            </View>
          </View>

          <View style={styles.trackOverlay} pointerEvents="none">
            <View style={[styles.trackOverlayInner, { height: totalHeight }]} />
          </View>
        </PrecisePanel>
      </ScrollView>

      <Pressable style={({ pressed }) => [styles.fab, pressed && { opacity: 0.8 }]}>
        <Ionicons name="add" size={18} color={theme.components.button.variant.primary.text} />
        <Text style={styles.fabText}>Add Manual Booking</Text>
      </Pressable>
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
    paddingBottom: theme.spacing.xxl * 4,
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
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  statusLabel: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.semibold,
    color: theme.colors.SoftEmerald,
  },
  timelineShell: {
    backgroundColor: theme.colors.SoftMineralGrey,
    borderColor: theme.colors.glass.borderSoft,
    overflow: 'hidden',
    padding: 0,
  },
  timelineBody: {
    flexDirection: 'row',
    minHeight: (CALENDAR_END_HOUR - CALENDAR_START_HOUR) * HOUR_BLOCK_HEIGHT,
  },
  timeColumn: {
    width: ROW_LABEL_WIDTH,
    paddingTop: theme.spacing.sm,
    paddingLeft: theme.spacing.sm,
    justifyContent: 'space-between',
  },
  timeLabel: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.semibold,
    color: theme.hybrid.panelCoolTextMuted,
    minHeight: HOUR_BLOCK_HEIGHT,
  },
  slotTrack: {
    flex: 1,
    borderLeftWidth: 1,
    borderLeftColor: theme.colors.glass.borderSoft,
    position: 'relative',
  },
  hourLine: {
    height: HOUR_BLOCK_HEIGHT,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.glass.borderSoft,
  },
  bookingBlock: {
    position: 'absolute',
    left: BOOKING_HORIZONTAL_INSET,
    right: BOOKING_HORIZONTAL_INSET,
    justifyContent: 'center',
    gap: 2,
  },
  bookingBlockConfirmed: {
    borderColor: theme.hybrid.signalSubtleBorder,
    backgroundColor: theme.colors.CeolWhite,
  },
  bookingBlockInquiry: {
    borderColor: theme.colors.PendingAmber,
    backgroundColor: theme.colors.SoftMineralGrey,
    borderStyle: 'dashed',
  },
  bookingTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.xs,
  },
  bookingName: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.bold,
    color: theme.hybrid.panelCoolText,
    flex: 1,
  },
  bookingMeta: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.regular,
    color: theme.hybrid.panelCoolTextMuted,
  },
  trackOverlay: {
    position: 'absolute',
    left: ROW_LABEL_WIDTH,
    right: 0,
    top: 0,
    bottom: 0,
  },
  trackOverlayInner: {
    borderLeftWidth: 0,
  },
  fab: {
    position: 'absolute',
    right: theme.spacing.md,
    bottom: theme.spacing.lg,
    minHeight: theme.components.button.height.md,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.components.button.variant.primary.border,
    backgroundColor: theme.components.button.variant.primary.background,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  fabText: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.semibold,
    color: theme.components.button.variant.primary.text,
  },
});
