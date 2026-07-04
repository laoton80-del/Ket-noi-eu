import { useCallback, useRef, useState, type ReactElement } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import type { VionaPack18WriteCapabilityContext } from '../../../lib/viona/requests/vionaRequestControlledWritePolicy';
import {
  transitionVionaRequestStatusControlled,
  VIONA_REQUEST_STATUS_ACTION_TARGET_TRIAGE,
} from '../../../services/vionaRequestControlledWriteApi';
import { FontFamily } from '../../../theme/typography';
import { vionaSpacing } from '../vionaDesignTokens';
import { vionaTrust } from '../vionaTrustTokens';

export type VionaRequestStatusActionWriteProps = Readonly<{
  requestId: string;
  writePolicyContext: VionaPack18WriteCapabilityContext;
  onStatusActionCompleted: () => Promise<boolean>;
}>;

function createStatusActionIdempotencyKey(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `status-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export function VionaRequestStatusActionWrite({
  requestId,
  writePolicyContext,
  onStatusActionCompleted,
}: VionaRequestStatusActionWriteProps): ReactElement {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const attemptIdempotencyKeyRef = useRef<string | null>(null);

  const onSubmit = useCallback(async (): Promise<void> => {
    if (submitting) {
      return;
    }

    setError(null);
    setSuccessMessage(null);

    if (attemptIdempotencyKeyRef.current == null) {
      attemptIdempotencyKeyRef.current = createStatusActionIdempotencyKey();
    }

    setSubmitting(true);
    const result = await transitionVionaRequestStatusControlled(
      requestId,
      {
        targetStatus: VIONA_REQUEST_STATUS_ACTION_TARGET_TRIAGE,
        idempotencyKey: attemptIdempotencyKeyRef.current,
      },
      writePolicyContext
    );
    setSubmitting(false);

    if (!result.ok) {
      if (result.status === 401) {
        setError('Sign in required to update status.');
        return;
      }
      if (result.status === 404) {
        setError('Request not found or not accessible.');
        return;
      }
      if (result.status === 400) {
        setError('Unable to update status for this request.');
        return;
      }
      setError(result.error || 'Unable to update status. Try again.');
      return;
    }

    attemptIdempotencyKeyRef.current = null;
    setSuccessMessage(
      result.status === 200 || result.data.action.idempotentReplay
        ? 'Request already marked for review.'
        : 'Request marked for review.'
    );

    const refreshed = await onStatusActionCompleted();
    if (!refreshed) {
      setSuccessMessage(
        'Status updated. Pull to refresh or re-open detail if the badge does not update.'
      );
    }
  }, [onStatusActionCompleted, requestId, submitting, writePolicyContext]);

  return (
    <View style={styles.root}>
      <Text style={styles.heading}>Mark for review</Text>
      <Text style={styles.safetyCopy}>
        Moves this request to triage for review. Does not book services, settle payment, dispatch
        SOS, or assign staff.
      </Text>
      {error != null ? <Text style={styles.error}>{error}</Text> : null}
      {successMessage != null ? <Text style={styles.success}>{successMessage}</Text> : null}
      <Pressable
        onPress={() => void onSubmit()}
        disabled={submitting}
        accessibilityRole="button"
        accessibilityLabel="Send request to review"
        accessibilityState={{ disabled: submitting, busy: submitting }}
        style={({ pressed }) => [
          styles.submitBtn,
          submitting && styles.submitBtnDisabled,
          pressed && !submitting ? { opacity: 0.88 } : null,
        ]}
      >
        {submitting ? (
          <ActivityIndicator color={vionaTrust.surface} size="small" />
        ) : (
          <Text style={styles.submitText}>Send to review</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginTop: vionaSpacing.sm,
    padding: vionaSpacing.sm,
    borderWidth: 1,
    borderColor: vionaTrust.border,
    borderRadius: 8,
    backgroundColor: vionaTrust.surface,
    gap: vionaSpacing.sm,
  },
  heading: {
    fontFamily: FontFamily.extrabold,
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: vionaTrust.ink,
  },
  safetyCopy: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    lineHeight: 15,
    color: vionaTrust.inkMuted,
  },
  error: {
    fontFamily: FontFamily.semibold,
    fontSize: 12,
    color: '#9f1239',
  },
  success: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: vionaTrust.ink,
  },
  submitBtn: {
    minHeight: 44,
    borderRadius: 8,
    backgroundColor: vionaTrust.signal,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  submitBtnDisabled: {
    opacity: 0.55,
  },
  submitText: {
    fontFamily: FontFamily.extrabold,
    fontSize: 13,
    color: vionaTrust.surface,
  },
});
