/**
 * B2B Salon Booking — Cyber-Functional dark dashboard (dual-panel: waitlist + tech timeline).
 * High-contrast neon accents for fast scanning in salon lighting.
 */
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { V7_GLOBAL_SLOT_MERCHANT_ID } from '../../services/booking/V7ConcurrencyManager';
import { scheduleBookingOfflineFailsafe } from '../../services/booking/V7OfflineFailsafe';
import { simulateLeonaBooking } from '../../services/mock/MockAIEngine';
import type { RootStackParamList } from '../../navigation/routes';
import { useB2bMerchantPromoSettingsStore } from '../../state/b2bMerchantPromoSettings';
import type { ServiceTagId, TimelineBlock, WaitlistEntry } from './b2bBookingTypes';

type RootNav = NativeStackNavigationProp<RootStackParamList>;

const BG_TOP = '#121212';
const BG_BOTTOM = '#1A1A24';
const NEON_GREEN = '#00FF00';
const NEON_ORANGE = '#FFA500';
const DANGER_RED = '#FF3333';
const HOUR_ROW_PX = 48;
const SCHEDULE_START_HOUR = 12;
const SCHEDULE_END_HOUR = 20;
const TECH_COLUMN_WIDTH = 148;

type WaitlistStatus = WaitlistEntry['status'];

const TAG_STYLES: Readonly<
  Record<ServiceTagId, Readonly<{ bg: string; border: string; label: string }>>
> = {
  manicure: {
    bg: 'rgba(147, 51, 234, 0.28)',
    border: 'rgba(168, 85, 247, 0.45)',
    label: 'Manicure',
  },
  gel_x: {
    bg: 'rgba(20, 184, 166, 0.28)',
    border: 'rgba(45, 212, 191, 0.5)',
    label: 'Gel X',
  },
  pedicure: {
    bg: 'rgba(59, 130, 246, 0.22)',
    border: 'rgba(96, 165, 250, 0.45)',
    label: 'Pedicure',
  },
};

const INITIAL_WAITLIST: readonly WaitlistEntry[] = [
  {
    id: 'w1',
    clientName: 'Nguyễn Thị Mai',
    status: 'confirmed',
    tags: ['manicure', 'gel_x'],
    priceLabel: '450.000 ₫',
  },
  {
    id: 'w2',
    clientName: 'Trần Lan Anh',
    status: 'waiting',
    tags: ['pedicure'],
    priceLabel: '280.000 ₫',
  },
  {
    id: 'w3',
    clientName: 'Lê Minh Tuấn',
    status: 'waiting',
    tags: ['manicure'],
    priceLabel: '320.000 ₫',
  },
  {
    id: 'w4',
    clientName: 'Phạm Thu Hà',
    status: 'confirmed',
    tags: ['gel_x'],
    priceLabel: '520.000 ₫',
  },
];

const INITIAL_TIMELINE: readonly TimelineBlock[] = [
  {
    id: 't1',
    techIndex: 0,
    clientName: 'Mai',
    status: 'confirmed',
    tag: 'manicure',
    startHour: 12,
    startMinute: 30,
    endHour: 13,
    endMinute: 30,
  },
  {
    id: 't2',
    techIndex: 1,
    clientName: 'Lan Anh',
    status: 'waiting',
    tag: 'pedicure',
    startHour: 13,
    startMinute: 0,
    endHour: 14,
    endMinute: 0,
  },
  {
    id: 't3',
    techIndex: 2,
    clientName: 'Tuấn',
    status: 'waiting',
    tag: 'gel_x',
    startHour: 14,
    startMinute: 0,
    endHour: 15,
    endMinute: 30,
  },
  {
    id: 't4',
    techIndex: 0,
    clientName: 'Thu Hà',
    status: 'confirmed',
    tag: 'gel_x',
    startHour: 15,
    startMinute: 0,
    endHour: 16,
    endMinute: 0,
  },
];

function toMinutesOfDay(hour: number, minute: number): number {
  return hour * 60 + minute;
}

function gridStartMinutes(): number {
  return SCHEDULE_START_HOUR * 60;
}

function offsetTopForTime(hour: number, minute: number): number {
  const start = gridStartMinutes();
  const t = toMinutesOfDay(hour, minute);
  const deltaMin = t - start;
  return (deltaMin / 60) * HOUR_ROW_PX;
}

function blockHeightMinutes(
  sh: number,
  sm: number,
  eh: number,
  em: number
): number {
  const a = toMinutesOfDay(sh, sm);
  const b = toMinutesOfDay(eh, em);
  return Math.max(8, ((b - a) / 60) * HOUR_ROW_PX);
}

function statusDotColor(status: WaitlistStatus): string {
  return status === 'confirmed' ? NEON_GREEN : NEON_ORANGE;
}

function statusLabelVi(status: WaitlistStatus): string {
  return status === 'confirmed' ? 'Đã xác nhận' : 'Đang chờ';
}

/** Row labels 12:00 … 19:00 — eight one-hour slots until 20:00. */
function hourTickLabels(): readonly string[] {
  const out: string[] = [];
  for (let h = SCHEDULE_START_HOUR; h < SCHEDULE_END_HOUR; h += 1) {
    out.push(`${h}:00`);
  }
  return out;
}

function AiPulseDot({ processing }: Readonly<{ processing: boolean }>): ReactElement {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: processing ? 0.42 : 0.35,
          duration: processing ? 280 : 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: processing ? 280 : 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => {
      loop.stop();
    };
  }, [pulse, processing]);

  return (
    <Animated.View style={[styles.aiDot, { opacity: pulse }]}>
      <View style={[styles.aiDotInner, processing && styles.aiDotInnerLive]} />
    </Animated.View>
  );
}

/** Match short timeline names (e.g. "Lan Anh") to full waitlist names. */
function timelineMatchesWaitlist(timelineName: string, fullWaitlistName: string): boolean {
  const full = fullWaitlistName.trim().toLowerCase();
  const short = timelineName.trim().toLowerCase();
  if (short.length < 2) return false;
  return full.includes(short) || short.split(/\s+/).some((p) => p.length > 1 && full.includes(p));
}

function syncTimelineForWaitlistConfirm(fullName: string, blocks: readonly TimelineBlock[]): TimelineBlock[] {
  return blocks.map((b) => {
    if (b.status !== 'waiting') return b;
    return timelineMatchesWaitlist(b.clientName, fullName) ? { ...b, status: 'confirmed' as const } : b;
  });
}

function syncWaitlistForTimelineConfirm(blk: TimelineBlock, rows: readonly WaitlistEntry[]): WaitlistEntry[] {
  return rows.map((r) => {
    if (r.status !== 'waiting') return r;
    return timelineMatchesWaitlist(blk.clientName, r.clientName) ? { ...r, status: 'confirmed' as const } : r;
  });
}

function techIdFromIndex(techIndex: number): string {
  return `tech-${techIndex}`;
}

function blockSlotStartMs(blk: TimelineBlock): number {
  const d = new Date();
  d.setHours(blk.startHour, blk.startMinute, 0, 0);
  return d.getTime();
}

function slotContextForWaitlistRow(
  row: WaitlistEntry,
  timeline: readonly TimelineBlock[]
): { merchantId: string; techId: string; slotStartMs: number } {
  const waitingBlk = timeline.find(
    (b) => b.status === 'waiting' && timelineMatchesWaitlist(b.clientName, row.clientName)
  );
  if (waitingBlk) {
    return {
      merchantId: V7_GLOBAL_SLOT_MERCHANT_ID,
      techId: techIdFromIndex(waitingBlk.techIndex),
      slotStartMs: blockSlotStartMs(waitingBlk),
    };
  }
  const d = new Date();
  d.setHours(14, 0, 0, 0);
  return { merchantId: V7_GLOBAL_SLOT_MERCHANT_ID, techId: 'tech-0', slotStartMs: d.getTime() };
}

export function B2BBookingDashboard(): ReactElement {
  const navigation = useNavigation<RootNav>();
  const humanTouchPendingCount = useB2bMerchantPromoSettingsStore((s) => s.humanTouchQueue.length);

  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>(() => [...INITIAL_WAITLIST]);
  const [timeline, setTimeline] = useState<TimelineBlock[]>(() => [...INITIAL_TIMELINE]);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [hudMessage, setHudMessage] = useState<string | null>(null);
  const aiBusyRef = useRef(false);

  const onConfirmWaitlist = useCallback(async (row: WaitlistEntry) => {
    if (row.status !== 'waiting' || aiBusyRef.current) return;
    aiBusyRef.current = true;
    setAiProcessing(true);
    setHudMessage('Leona đang xác nhận (mock)…');
    const primaryTag = row.tags[0] ?? 'manicure';
    const serviceName = TAG_STYLES[primaryTag].label;
    const slot = slotContextForWaitlistRow(row, timeline);
    try {
      const result = await simulateLeonaBooking(row.clientName, serviceName, slot);
      if (result.status === 'Success') {
        setWaitlist((prev) =>
          prev.map((r) => (r.id === row.id ? { ...r, status: 'confirmed' as const } : r))
        );
        setTimeline((prev) => syncTimelineForWaitlistConfirm(row.clientName, prev));
        setHudMessage(`Đã xác nhận · ${result.clientName} · ${result.serviceName}`);
      } else if (result.status === 'SlotLocked') {
        setHudMessage(result.pivotHint ?? 'Khung giờ đã bận — đề xuất giờ khác.');
      }
    } finally {
      setAiProcessing(false);
      aiBusyRef.current = false;
      setTimeout(() => setHudMessage(null), 2_600);
    }
  }, [timeline]);

  const onConfirmTimeline = useCallback(async (blk: TimelineBlock) => {
    if (blk.status !== 'waiting' || aiBusyRef.current) return;
    aiBusyRef.current = true;
    setAiProcessing(true);
    setHudMessage('Leona đang xác nhận (mock)…');
    const serviceName = TAG_STYLES[blk.tag].label;
    const slot = {
      merchantId: V7_GLOBAL_SLOT_MERCHANT_ID,
      techId: techIdFromIndex(blk.techIndex),
      slotStartMs: blockSlotStartMs(blk),
    };
    try {
      const result = await simulateLeonaBooking(blk.clientName, serviceName, slot);
      if (result.status === 'Success') {
        setTimeline((prev) =>
          prev.map((b) => (b.id === blk.id ? { ...b, status: 'confirmed' as const } : b))
        );
        setWaitlist((prev) => syncWaitlistForTimelineConfirm(blk, prev));
        setHudMessage(`Đã xác nhận · ${result.clientName} · ${result.serviceName}`);
        const bookingId = `bk-tl-${blk.id}-${Date.now()}`;
        scheduleBookingOfflineFailsafe(V7_GLOBAL_SLOT_MERCHANT_ID, {
          bookingId,
          summaryLine: `ViGlobal: ${result.clientName} · ${result.serviceName}`,
          emergencyPhoneE164: process.env.EXPO_PUBLIC_V7_MERCHANT_EMERGENCY_PHONE_E164?.trim() || undefined,
        });
      } else if (result.status === 'SlotLocked') {
        setHudMessage(result.pivotHint ?? 'Khung giờ đã bận — đề xuất giờ khác.');
      }
    } finally {
      setAiProcessing(false);
      aiBusyRef.current = false;
      setTimeout(() => setHudMessage(null), 2_600);
    }
  }, []);

  const ticks = useMemo(() => hourTickLabels(), []);
  const slotCount = SCHEDULE_END_HOUR - SCHEDULE_START_HOUR;
  const gridHeight = slotCount * HOUR_ROW_PX;

  const blocksByTech = useMemo(() => {
    const map: [TimelineBlock[], TimelineBlock[], TimelineBlock[]] = [[], [], []];
    for (const b of timeline) {
      map[b.techIndex].push(b);
    }
    return map;
  }, [timeline]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.bgGradient}>
        <View style={styles.bgLayerTop} />
        <View style={styles.bgLayerBottom} />
      </View>

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <AiPulseDot processing={aiProcessing} />
          <View style={styles.headerTextCol}>
            <Text style={styles.headerAiText} numberOfLines={1}>
              Lễ tân AI đang hoạt động
            </Text>
            {hudMessage ? (
              <Text style={styles.leonaNotice} numberOfLines={2}>
                {hudMessage}
              </Text>
            ) : (
              <Text style={styles.leonaHint} numberOfLines={2}>
                Mock engine · chạm lịch “Đang chờ” để Leona xác nhận (1,5s)
              </Text>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={styles.sosBtn}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="SOS và Needs Human Touch"
          onPress={() => navigation.navigate('B2BPromotionSettings')}
        >
          {humanTouchPendingCount > 0 ? (
            <View style={styles.sosBadge}>
              <Text style={styles.sosBadgeText}>{humanTouchPendingCount}</Text>
            </View>
          ) : null}
          <Text style={styles.sosBtnText}>SOS</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dualRow}>
        <View style={styles.panelWait}>
          <View style={styles.panelTitleRow}>
            <Text style={styles.panelTitle}>Hàng chờ</Text>
            <TouchableOpacity style={styles.addClientBtnWrap} activeOpacity={0.88}>
              <View style={styles.addClientGlowOuter}>
                <View style={styles.addClientGlowInner}>
                  <Text style={styles.addClientText}>+ Thêm khách</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.waitScroll}
            contentContainerStyle={styles.waitScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {waitlist.map((row) => (
              <Pressable
                key={row.id}
                onPress={() => void onConfirmWaitlist(row)}
                disabled={row.status === 'confirmed' || aiProcessing}
                style={({ pressed }) => [
                  styles.clientCard,
                  row.status === 'confirmed' && styles.clientCardConfirmed,
                  pressed && row.status === 'waiting' && !aiProcessing && styles.clientCardPressed,
                ]}
              >
                <View style={styles.clientCardGlow} />
                <View style={styles.clientCardInner}>
                  <View style={styles.clientTopRow}>
                    <Text style={styles.clientName} numberOfLines={1}>
                      {row.clientName}
                    </Text>
                    <View style={styles.clientTopRight}>
                      <View
                        style={[
                          styles.statusDot,
                          { backgroundColor: statusDotColor(row.status) },
                        ]}
                      />
                      <Text
                        style={[
                          styles.statusText,
                          { color: statusDotColor(row.status) },
                        ]}
                        numberOfLines={1}
                      >
                        {statusLabelVi(row.status)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.tagRow}>
                    {row.tags.map((tid) => (
                      <View
                        key={`${row.id}_${tid}`}
                        style={[
                          styles.servicePill,
                          {
                            backgroundColor: TAG_STYLES[tid].bg,
                            borderColor: TAG_STYLES[tid].border,
                          },
                        ]}
                      >
                        <Text style={styles.servicePillText}>{TAG_STYLES[tid].label}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.clientBottomRow}>
                    <Text style={styles.priceText}>{row.priceLabel}</Text>
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      activeOpacity={0.88}
                      onPress={() => {
                        /* Mock phase — no cancel wiring */
                      }}
                    >
                      <Text style={styles.cancelBtnText}>Hủy</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.panelSchedule}>
          <Text style={styles.panelTitleSchedule}>Tech Schedule</Text>

          <View style={styles.timelineShell}>
            <View style={styles.timeAxis}>
              <View style={{ height: 28 }} />
              <View style={{ height: gridHeight }}>
                {ticks.map((label) => (
                  <View key={label} style={styles.timeTickRow}>
                    <Text style={styles.timeTickText}>{label}</Text>
                  </View>
                ))}
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.techScrollContent}
            >
              {[0, 1, 2].map((techIdx) => (
                <View key={`tech_${techIdx}`} style={styles.techColumn}>
                  <Text style={styles.techHead} numberOfLines={1}>
                    Tech {techIdx + 1}
                  </Text>
                  <View style={[styles.techGrid, { height: gridHeight }]}>
                    {Array.from({ length: slotCount }, (_, i) => (
                      <View key={`${techIdx}_grid_${i}`} style={styles.gridLine} />
                    ))}
                    {blocksByTech[techIdx].map((blk) => {
                      const top = offsetTopForTime(blk.startHour, blk.startMinute);
                      const h = blockHeightMinutes(
                        blk.startHour,
                        blk.startMinute,
                        blk.endHour,
                        blk.endMinute
                      );
                      const tag = TAG_STYLES[blk.tag];
                      const confirmed = blk.status === 'confirmed';
                      return (
                        <Pressable
                          key={blk.id}
                          onPress={() => void onConfirmTimeline(blk)}
                          disabled={confirmed || aiProcessing}
                          style={({ pressed }) => [
                            styles.timelineBlock,
                            confirmed && styles.timelineBlockConfirmed,
                            {
                              top,
                              height: h,
                              borderColor: confirmed ? NEON_GREEN : tag.border,
                              backgroundColor: confirmed ? 'rgba(0, 255, 0, 0.14)' : tag.bg,
                            },
                            pressed && !confirmed && !aiProcessing && styles.timelineBlockPressed,
                          ]}
                        >
                          <View style={styles.timelineBlockHeader}>
                            <View
                              style={[
                                styles.tinyDot,
                                { backgroundColor: statusDotColor(blk.status) },
                              ]}
                            />
                            <Text style={styles.timelineName} numberOfLines={1}>
                              {blk.clientName}
                            </Text>
                          </View>
                          <Text style={styles.timelineTag} numberOfLines={1}>
                            {tag.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG_TOP,
  },
  bgGradient: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  bgLayerTop: {
    flex: 1,
    backgroundColor: BG_TOP,
  },
  bgLayerBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '52%',
    backgroundColor: BG_BOTTOM,
    opacity: 0.94,
  },
  header: {
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 10,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    minWidth: 0,
  },
  headerTextCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  leonaNotice: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(0, 255, 100, 0.95)',
    lineHeight: 14,
  },
  leonaHint: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(148, 163, 184, 0.95)',
  },
  aiDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 255, 0, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: NEON_GREEN,
    shadowColor: NEON_GREEN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  aiDotInnerLive: {
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  headerAiText: {
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(232, 237, 247, 0.92)',
    letterSpacing: 0.2,
  },
  sosBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: DANGER_RED,
    borderWidth: 1,
    borderColor: 'rgba(255, 80, 80, 0.85)',
    position: 'relative',
  },
  sosBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: '#FFF8E1',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
  },
  sosBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#B91C1C',
  },
  sosBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0A0A0A',
    letterSpacing: 0.6,
  },
  dualRow: {
    zIndex: 1,
    flex: 1,
    flexDirection: 'row',
    minHeight: 0,
    paddingHorizontal: 8,
    paddingBottom: 8,
    gap: 8,
  },
  panelWait: {
    flex: 3,
    minWidth: 0,
    borderRadius: 14,
    overflow: 'hidden',
  },
  panelTitleRow: {
    gap: 8,
    marginBottom: 8,
  },
  panelTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: 'rgba(232, 237, 247, 0.55)',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  panelTitleSchedule: {
    fontSize: 13,
    fontWeight: '900',
    color: 'rgba(232, 237, 247, 0.55)',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  addClientBtnWrap: {
    alignSelf: 'stretch',
  },
  addClientGlowOuter: {
    borderRadius: 12,
    padding: 2,
    backgroundColor: 'rgba(99, 102, 241, 0.35)',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.65,
    shadowRadius: 10,
    elevation: 8,
  },
  addClientGlowInner: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(37, 99, 235, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.55)',
    alignItems: 'center',
  },
  addClientText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#EEF2FF',
    letterSpacing: 0.3,
  },
  waitScroll: {
    flex: 1,
  },
  waitScrollContent: {
    gap: 10,
    paddingBottom: 16,
  },
  clientCard: {
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  clientCardConfirmed: {
    borderWidth: 2,
    borderColor: NEON_GREEN,
    shadowColor: NEON_GREEN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 10,
  },
  clientCardPressed: {
    opacity: 0.92,
  },
  clientCardGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    shadowColor: '#A78BFA',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  clientCardInner: {
    padding: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(22, 22, 28, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  clientTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 8,
  },
  clientName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '900',
    color: '#F4F7FF',
    minWidth: 0,
  },
  clientTopRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexShrink: 0,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    maxWidth: 88,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  servicePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  servicePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(248, 250, 252, 0.95)',
  },
  clientBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  priceText: {
    fontSize: 13,
    fontWeight: '900',
    color: 'rgba(226, 232, 240, 0.9)',
  },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: DANGER_RED,
  },
  cancelBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0C0C0C',
  },
  panelSchedule: {
    flex: 7,
    minWidth: 0,
    borderRadius: 14,
    paddingLeft: 4,
  },
  timelineShell: {
    flex: 1,
    flexDirection: 'row',
    minHeight: 0,
  },
  timeAxis: {
    width: 44,
    flexShrink: 0,
  },
  timeTickRow: {
    height: HOUR_ROW_PX,
    justifyContent: 'flex-start',
    paddingTop: 0,
  },
  timeTickText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(148, 163, 184, 0.95)',
    fontVariant: ['tabular-nums'],
  },
  techScrollContent: {
    paddingRight: 8,
    alignItems: 'flex-start',
  },
  techColumn: {
    width: TECH_COLUMN_WIDTH,
    marginRight: 8,
  },
  techHeadSpacer: {
    height: 28,
  },
  techHead: {
    fontSize: 12,
    fontWeight: '900',
    color: '#CBD5E1',
    marginBottom: 6,
    paddingLeft: 2,
    height: 22,
  },
  techGrid: {
    position: 'relative',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: 'rgba(18, 18, 22, 0.65)',
    overflow: 'hidden',
  },
  gridLine: {
    height: HOUR_ROW_PX,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  timelineBlock: {
    position: 'absolute',
    left: 4,
    right: 4,
    borderRadius: 10,
    borderWidth: 1,
    padding: 6,
    justifyContent: 'center',
  },
  timelineBlockConfirmed: {
    borderWidth: 2,
    shadowColor: NEON_GREEN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.42,
    shadowRadius: 10,
    elevation: 8,
  },
  timelineBlockPressed: {
    opacity: 0.88,
  },
  timelineBlockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  tinyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  timelineName: {
    flex: 1,
    fontSize: 11,
    fontWeight: '900',
    color: '#F8FAFC',
    minWidth: 0,
  },
  timelineTag: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(241, 245, 249, 0.88)',
  },
});
