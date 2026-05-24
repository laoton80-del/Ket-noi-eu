import { Ionicons } from '@expo/vector-icons';
import type { ReactElement } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import type {
  LocalInboxDisplayLabels,
  LocalMerchantInboxStatusIconName,
} from '../../screens/b2b/localMerchantInboxUi';
import {
  localAccentIconChipFill,
  localAccentInk,
  localAccentStatusFill,
  localAccentStroke,
  localConstellation,
  type LocalConstellationAccent,
} from './localConstellationTokens';
import { LocalConstellationFrame } from './LocalConstellationFrame';
import { FontFamily } from '../../theme/typography';

const INK = localConstellation.inkStrong;
const INK_MUTED = localConstellation.inkMuted;
const EMERALD = localConstellation.accentEmerald;

export type LocalMerchantRequestStatusCardProps = Readonly<{
  serviceTitle: string;
  requesterLine: string;
  locationLine: string;
  timeLine: string;
  descriptionLine: string | null;
  accent: LocalConstellationAccent;
  statusIcon: LocalMerchantInboxStatusIconName;
  labels: LocalInboxDisplayLabels;
  statusHint: string | null;
  reviewPendingNote: string;
  confirmedNote: string;
  confirmBtnLabel: string;
  rejectBtnLabel: string;
  actionBusy: boolean;
  canConfirm: boolean;
  canReject: boolean;
  onConfirm: () => void;
  onReject: () => void;
}>;

export function LocalMerchantRequestStatusCard({
  serviceTitle,
  requesterLine,
  locationLine,
  timeLine,
  descriptionLine,
  accent,
  statusIcon,
  labels,
  statusHint,
  reviewPendingNote,
  confirmedNote,
  confirmBtnLabel,
  rejectBtnLabel,
  actionBusy,
  canConfirm,
  canReject,
  onConfirm,
  onReject,
}: LocalMerchantRequestStatusCardProps): ReactElement {
  const ink = localAccentInk(accent);
  const subtitle = [requesterLine, locationLine, timeLine].filter((l) => l.length > 0).join(' · ');

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
          {descriptionLine ? (
            <Text style={styles.description} numberOfLines={1}>
              {descriptionLine}
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
          <Ionicons name="shield-checkmark-outline" size={12} color={EMERALD} />
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
          <Ionicons name="information-circle-outline" size={13} color={EMERALD} />
          <Text style={styles.noteChipTextEmphasis} numberOfLines={2}>
            {confirmedNote}
          </Text>
        </View>
      ) : null}

      {canConfirm || canReject ? (
        <View style={styles.actions}>
          {canConfirm ? (
            <Pressable
              disabled={actionBusy}
              onPress={onConfirm}
              accessibilityRole="button"
              accessibilityLabel={confirmBtnLabel}
              style={({ pressed }) => [styles.confirmBtn, pressed && { opacity: 0.88 }, actionBusy && styles.btnDisabled]}
            >
              {actionBusy ? (
                <ActivityIndicator size="small" color={INK} />
              ) : (
                <Ionicons name="checkmark-circle-outline" size={16} color={INK} />
              )}
              <Text style={styles.confirmBtnText}>{confirmBtnLabel}</Text>
            </Pressable>
          ) : null}
          {canReject ? (
            <Pressable
              disabled={actionBusy}
              onPress={onReject}
              accessibilityRole="button"
              accessibilityLabel={rejectBtnLabel}
              style={({ pressed }) => [styles.rejectBtn, pressed && { opacity: 0.88 }, actionBusy && styles.btnDisabled]}
            >
              <Text style={styles.rejectBtnText}>{rejectBtnLabel}</Text>
            </Pressable>
          ) : null}
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
  description: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
    color: INK_MUTED,
    fontStyle: 'italic',
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
    maxWidth: '52%',
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
    color: EMERALD,
    lineHeight: 14,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(72, 210, 165, 0.45)',
    backgroundColor: 'rgba(72, 210, 165, 0.14)',
  },
  confirmBtnText: {
    fontSize: 11,
    fontFamily: FontFamily.extrabold,
    color: INK,
  },
  rejectBtn: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(176, 140, 255, 0.35)',
    backgroundColor: 'rgba(176, 140, 255, 0.08)',
  },
  rejectBtnText: {
    fontSize: 11,
    fontFamily: FontFamily.extrabold,
    color: 'rgba(210, 198, 255, 0.95)',
  },
  btnDisabled: { opacity: 0.5 },
});
