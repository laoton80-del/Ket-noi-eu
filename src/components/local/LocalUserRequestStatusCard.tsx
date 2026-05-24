import { Ionicons } from '@expo/vector-icons';
import type { ReactElement } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import type { LocalUserRequestTimelineItem } from '../../services/localUserRequestApi';
import {
  localAccentIconChipFill,
  localAccentInk,
  localAccentStatusFill,
  localAccentStroke,
  localConstellation,
  type LocalConstellationAccent,
} from './localConstellationTokens';
import { LocalConstellationFrame } from './LocalConstellationFrame';
import type {
  LocalUserRequestDisplayLabels,
  LocalUserRequestStatusIconName,
} from '../../screens/b2c/localUserRequestStatusUi';
import { FontFamily } from '../../theme/typography';

const INK = localConstellation.inkStrong;
const INK_MUTED = localConstellation.inkMuted;

export type LocalUserRequestStatusCardProps = Readonly<{
  serviceTitle: string;
  merchantLine: string;
  locationLine: string;
  timeLine: string;
  accent: LocalConstellationAccent;
  statusIcon: LocalUserRequestStatusIconName;
  labels: LocalUserRequestDisplayLabels;
  statusHint: string | null;
  reviewPendingNote: string;
  confirmedNote: string;
  cancelHint: string;
  showTimelineLabel: string;
  hideTimelineLabel: string;
  timelineTitle: string;
  cancelBtnLabel: string;
  expanded: boolean;
  timelineBusy: boolean;
  actionBusy: boolean;
  canCancel: boolean;
  timeline: readonly LocalUserRequestTimelineItem[] | undefined;
  onToggleTimeline: () => void;
  onCancel: () => void;
  formatTimelineAt: (iso: string) => string;
}>;

export function LocalUserRequestStatusCard({
  serviceTitle,
  merchantLine,
  locationLine,
  timeLine,
  accent,
  statusIcon,
  labels,
  statusHint,
  reviewPendingNote,
  confirmedNote,
  cancelHint,
  showTimelineLabel,
  hideTimelineLabel,
  timelineTitle,
  cancelBtnLabel,
  expanded,
  timelineBusy,
  actionBusy,
  canCancel,
  timeline,
  onToggleTimeline,
  onCancel,
  formatTimelineAt,
}: LocalUserRequestStatusCardProps): ReactElement {
  const ink = localAccentInk(accent);
  const subtitle = [merchantLine, locationLine, timeLine].filter((l) => l.length > 0).join(' · ');

  return (
    <LocalConstellationFrame accent={accent} tier="service" radius={16} style={styles.card} contentStyle={styles.cardInner}>
      <View style={styles.headerRow}>
        <View
          style={[
            styles.iconChip,
            {
              borderColor: localAccentStroke(accent),
              backgroundColor: localAccentIconChipFill(accent, false),
            },
          ]}
        >
          <Ionicons name={statusIcon} size={22} color={ink} accessibilityIgnoresInvertColors />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title} numberOfLines={2}>
            {serviceTitle}
          </Text>
          {subtitle.length > 0 ? (
            <Text style={styles.subtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.chipRow}>
        <View
          style={[
            styles.statusChip,
            {
              borderColor: localAccentStroke(accent),
              backgroundColor: localAccentStatusFill(accent, false),
            },
          ]}
          accessibilityRole="text"
          accessibilityLabel={labels.statusLabel}
        >
          <Text style={[styles.statusChipText, { color: ink }]} numberOfLines={1}>
            {labels.statusLabel}
          </Text>
        </View>
        <View style={styles.walletChip} accessibilityRole="text" accessibilityLabel={labels.walletBadge}>
          <Ionicons name="shield-checkmark-outline" size={12} color={localConstellation.accentEmerald} />
          <Text style={styles.walletChipText} numberOfLines={2}>
            {labels.walletBadge}
          </Text>
        </View>
      </View>

      {statusHint ? (
        <Text style={styles.hintLine} numberOfLines={2}>
          {statusHint}
        </Text>
      ) : null}
      {labels.showReviewPendingNote ? (
        <View style={styles.noteChip}>
          <Ionicons name="hourglass-outline" size={13} color={localConstellation.accentCyan} />
          <Text style={styles.noteChipText} numberOfLines={2}>
            {reviewPendingNote}
          </Text>
        </View>
      ) : null}
      {labels.showConfirmedNote ? (
        <View style={[styles.noteChip, styles.noteChipEmphasis]}>
          <Ionicons name="information-circle-outline" size={13} color={localConstellation.accentEmerald} />
          <Text style={styles.noteChipTextEmphasis} numberOfLines={2}>
            {confirmedNote}
          </Text>
        </View>
      ) : null}
      {labels.showCancelHint ? (
        <Text style={styles.cancelHint} numberOfLines={2}>
          {cancelHint}
        </Text>
      ) : null}

      <View style={styles.actions}>
        <Pressable
          disabled={timelineBusy}
          onPress={onToggleTimeline}
          accessibilityRole="button"
          accessibilityLabel={expanded ? hideTimelineLabel : showTimelineLabel}
          style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.88 }, timelineBusy && styles.btnDisabled]}
        >
          {timelineBusy ? (
            <ActivityIndicator size="small" color={ink} />
          ) : (
            <Ionicons name="time-outline" size={15} color={ink} />
          )}
          <Text style={styles.actionBtnText}>{expanded ? hideTimelineLabel : showTimelineLabel}</Text>
        </Pressable>
        {canCancel ? (
          <Pressable
            disabled={actionBusy}
            onPress={onCancel}
            accessibilityRole="button"
            accessibilityLabel={cancelBtnLabel}
            style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.88 }, actionBusy && styles.btnDisabled]}
          >
            <Text style={styles.cancelBtnText}>{cancelBtnLabel}</Text>
          </Pressable>
        ) : null}
      </View>

      {expanded && timeline ? (
        <View style={styles.timelineBlock}>
          <Text style={styles.timelineTitle}>{timelineTitle}</Text>
          {timeline.map((item) => (
            <View key={`${item.type}-${item.at}`} style={styles.timelineRow}>
              <Text style={styles.timelineItemTitle}>{item.title}</Text>
              <Text style={styles.timelineItemMsg}>{item.message}</Text>
              <Text style={styles.timelineItemAt}>{formatTimelineAt(item.at)}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </LocalConstellationFrame>
  );
}

const styles = StyleSheet.create({
  card: { width: '100%' },
  cardInner: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  iconChip: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: localConstellation.cardEdgeWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  title: {
    fontSize: 13,
    fontFamily: FontFamily.extrabold,
    color: INK,
    letterSpacing: -0.16,
    lineHeight: 17,
  },
  subtitle: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
    color: INK_MUTED,
    lineHeight: 14,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: 6,
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: localConstellation.cardEdgeWidth,
    maxWidth: '58%',
  },
  statusChipText: {
    fontSize: 9,
    fontFamily: FontFamily.extrabold,
    letterSpacing: 0.35,
    textTransform: 'uppercase',
  },
  walletChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
    minWidth: 120,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(72, 210, 165, 0.22)',
    backgroundColor: 'rgba(72, 210, 165, 0.06)',
  },
  walletChipText: {
    flex: 1,
    fontSize: 9,
    fontFamily: FontFamily.semibold,
    color: INK_MUTED,
    lineHeight: 12,
  },
  hintLine: {
    fontSize: 10,
    fontFamily: FontFamily.semibold,
    color: INK_MUTED,
    lineHeight: 14,
  },
  noteChip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(92, 205, 255, 0.22)',
    backgroundColor: 'rgba(92, 205, 255, 0.06)',
  },
  noteChipEmphasis: {
    borderColor: 'rgba(72, 210, 165, 0.28)',
    backgroundColor: 'rgba(72, 210, 165, 0.08)',
  },
  noteChipText: {
    flex: 1,
    fontSize: 10,
    fontFamily: FontFamily.semibold,
    color: INK_MUTED,
    lineHeight: 14,
  },
  noteChipTextEmphasis: {
    flex: 1,
    fontSize: 10,
    fontFamily: FontFamily.extrabold,
    color: localConstellation.accentEmerald,
    lineHeight: 14,
  },
  cancelHint: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
    color: INK_MUTED,
    fontStyle: 'italic',
    lineHeight: 14,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: localConstellation.border,
    backgroundColor: 'rgba(10, 14, 22, 0.45)',
  },
  actionBtnText: {
    fontSize: 11,
    fontFamily: FontFamily.extrabold,
    color: INK,
  },
  cancelBtn: {
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(176, 140, 255, 0.35)',
    backgroundColor: 'rgba(176, 140, 255, 0.08)',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 11,
    fontFamily: FontFamily.extrabold,
    color: 'rgba(210, 198, 255, 0.95)',
  },
  btnDisabled: { opacity: 0.5 },
  timelineBlock: {
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: localConstellation.border,
    gap: 8,
  },
  timelineTitle: {
    fontSize: 9,
    fontFamily: FontFamily.extrabold,
    color: INK_MUTED,
    letterSpacing: 0.45,
    textTransform: 'uppercase',
  },
  timelineRow: {
    gap: 2,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(72, 210, 165, 0.35)',
  },
  timelineItemTitle: {
    fontSize: 11,
    fontFamily: FontFamily.extrabold,
    color: INK,
  },
  timelineItemMsg: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
    color: INK_MUTED,
    lineHeight: 14,
  },
  timelineItemAt: {
    fontSize: 9,
    fontFamily: FontFamily.medium,
    color: INK_MUTED,
    opacity: 0.85,
  },
});
