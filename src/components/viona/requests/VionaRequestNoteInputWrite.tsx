import { useCallback, useRef, useState, type ReactElement } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { appendVionaRequestNote } from '../../../services/vionaRequestApi';
import { FontFamily } from '../../../theme/typography';
import { vionaSpacing } from '../vionaDesignTokens';
import { vionaTrust } from '../vionaTrustTokens';
import {
  validateVionaRequestNoteInput,
  VIONA_REQUEST_NOTE_DISPLAY_MAX_LENGTH,
} from './vionaRequestNoteAuditDisplay';

export type VionaRequestNoteInputWriteProps = Readonly<{
  requestId: string;
  onNoteSubmitted: () => Promise<boolean>;
}>;

function createSubmitIdempotencyKey(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `note-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

function validationMessage(reason: 'empty' | 'too_long' | 'unsafe'): string {
  switch (reason) {
    case 'empty':
      return 'Enter a note before submitting.';
    case 'too_long':
      return `Note must be ${VIONA_REQUEST_NOTE_DISPLAY_MAX_LENGTH} characters or fewer.`;
    case 'unsafe':
      return 'Note contains unsupported content.';
    default:
      return 'Invalid note.';
  }
}

export function VionaRequestNoteInputWrite({
  requestId,
  onNoteSubmitted,
}: VionaRequestNoteInputWriteProps): ReactElement {
  const [noteText, setNoteText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const attemptIdempotencyKeyRef = useRef<string | null>(null);

  const resetAttemptKey = useCallback((): void => {
    attemptIdempotencyKeyRef.current = null;
  }, []);

  const onSubmit = useCallback(async (): Promise<void> => {
    if (submitting) {
      return;
    }

    setError(null);
    setSuccessMessage(null);

    const validation = validateVionaRequestNoteInput(noteText);
    if (!validation.ok) {
      setError(validationMessage(validation.reason));
      return;
    }

    if (attemptIdempotencyKeyRef.current == null) {
      attemptIdempotencyKeyRef.current = createSubmitIdempotencyKey();
    }

    setSubmitting(true);
    const result = await appendVionaRequestNote(requestId, {
      note: validation.value,
      idempotencyKey: attemptIdempotencyKeyRef.current,
    });
    setSubmitting(false);

    if (!result.ok) {
      if (result.status === 401) {
        setError('Sign in required to add a note.');
        return;
      }
      if (result.status === 404) {
        setError('Request not found or not accessible.');
        return;
      }
      setError(result.error || 'Unable to record note. Try again.');
      return;
    }

    attemptIdempotencyKeyRef.current = null;
    setNoteText('');
    setSuccessMessage(
      result.status === 200 || result.data.action.idempotentReplay
        ? 'Note already recorded.'
        : 'Note recorded in audit trail.'
    );

    const refreshed = await onNoteSubmitted();
    if (!refreshed) {
      setSuccessMessage(
        'Note recorded. Pull to refresh or re-open detail if the timeline does not update.'
      );
    }
  }, [noteText, onNoteSubmitted, requestId, submitting]);

  const trimmedLength = noteText.trim().length;
  const submitDisabled = submitting || trimmedLength === 0;

  return (
    <View style={styles.root}>
      <Text style={styles.heading}>Add note</Text>
      <Text style={styles.safetyCopy}>
        Audited note action only. Does not change request status, booking, payment, or SOS.
      </Text>
      <TextInput
        value={noteText}
        onChangeText={(value) => {
          setNoteText(value);
          setError(null);
          setSuccessMessage(null);
          resetAttemptKey();
        }}
        editable={!submitting}
        multiline
        placeholder="Write a note…"
        placeholderTextColor={vionaTrust.inkMuted}
        style={styles.input}
        accessibilityLabel="Request note text"
      />
      <Text style={styles.counter}>
        {trimmedLength}/{VIONA_REQUEST_NOTE_DISPLAY_MAX_LENGTH}
      </Text>
      {error != null ? <Text style={styles.error}>{error}</Text> : null}
      {successMessage != null ? <Text style={styles.success}>{successMessage}</Text> : null}
      <Pressable
        onPress={() => void onSubmit()}
        disabled={submitDisabled}
        accessibilityRole="button"
        accessibilityLabel="Submit request note"
        accessibilityState={{ disabled: submitDisabled, busy: submitting }}
        style={({ pressed }) => [
          styles.submitBtn,
          submitDisabled && styles.submitBtnDisabled,
          pressed && !submitDisabled ? { opacity: 0.88 } : null,
        ]}
      >
        {submitting ? (
          <ActivityIndicator color={vionaTrust.surface} size="small" />
        ) : (
          <Text style={styles.submitText}>Submit note</Text>
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
  input: {
    minHeight: 88,
    borderWidth: 1,
    borderColor: vionaTrust.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontFamily: FontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    color: vionaTrust.ink,
    backgroundColor: vionaTrust.surfaceMuted,
    textAlignVertical: 'top',
  },
  counter: {
    fontFamily: FontFamily.regular,
    fontSize: 10,
    color: vionaTrust.inkMuted,
    alignSelf: 'flex-end',
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
