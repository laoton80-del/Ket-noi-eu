import { type ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FontFamily } from '../../../theme/typography';
import type { VionaRequestStatus } from '../../../domain/requests/vionaRequestTypes';
import { getRequestStatusSafetyLabel } from '../../../domain/requests/vionaRequestSafetyCopy';
import { vionaSpacing } from '../vionaDesignTokens';
import { vionaTrust } from '../vionaTrustTokens';

export type VionaRequestStatusBadgeProps = Readonly<{
  status: VionaRequestStatus;
}>;

function toneForStatus(
  status: VionaRequestStatus
): Readonly<{ bg: string; border: string; text: string }> {
  if (status === 'needsHumanConfirmation' || status === 'failed') {
    return {
      bg: 'rgba(200, 75, 90, 0.12)',
      border: 'rgba(200, 75, 90, 0.35)',
      text: '#9f1239',
    };
  }
  if (status === 'partnerResponded' || status === 'sentToPartner') {
    return {
      bg: 'rgba(37, 99, 235, 0.12)',
      border: 'rgba(37, 99, 235, 0.35)',
      text: '#1d4ed8',
    };
  }
  if (status === 'completed' || status === 'submitted') {
    return {
      bg: 'rgba(34, 197, 94, 0.12)',
      border: 'rgba(22, 163, 74, 0.35)',
      text: '#166534',
    };
  }
  if (status === 'cancelled') {
    return {
      bg: vionaTrust.surfaceMuted,
      border: vionaTrust.border,
      text: vionaTrust.inkMuted,
    };
  }
  return {
    bg: 'rgba(201, 169, 98, 0.12)',
    border: 'rgba(201, 169, 98, 0.35)',
    text: vionaTrust.ink,
  };
}

export function VionaRequestStatusBadge({ status }: VionaRequestStatusBadgeProps): ReactElement {
  const pal = toneForStatus(status);
  const label = getRequestStatusSafetyLabel(status);
  return (
    <View style={[styles.wrap, { backgroundColor: pal.bg, borderColor: pal.border }]}>
      <Text
        style={[styles.text, { color: pal.text }]}
        accessibilityLabel={`Request status: ${label}`}
      >
        {status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'flex-start',
    paddingHorizontal: vionaSpacing.sm,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  text: {
    fontSize: 10,
    fontFamily: FontFamily.extrabold,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});
