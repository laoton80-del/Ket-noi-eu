import { Ionicons } from '@expo/vector-icons';
import { useCallback, useMemo, useRef, useState, type ReactElement } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { localConstellation } from './localConstellationTokens';
import {
  LOCAL_CREATE_CLIENT_SOURCE,
  LOCAL_SERVICE_TYPE,
  type LocalServiceTypeClient,
  type LocalUserRequestCreateResult,
} from '../../domain/local/localServiceRequestClientContract';
import { FontFamily } from '../../theme/typography';
import { createUserLocalServiceRequest } from '../../services/localUserRequestApi';
import { getRestApiJwt } from '../../services/apiClient';
import {
  assertLocalCreateBodySafe,
  buildLocalCreateRequestBody,
  canSubmitLocalCreate,
  defaultLocalCreateFormValues,
  feedbackKeyForCreateState,
  fieldsEditableInLocalCreateState,
  LOCAL_CREATE_SERVICE_TYPE_OPTIONS,
  mapCreateApiResultToUiState,
  validateLocalCreateForm,
  type LocalCreateFormValues,
  type LocalCreateUiState,
} from '../../screens/b2c/localUserRequestCreateFlow';

const INK = localConstellation.inkStrong;
const INK_MUTED = localConstellation.inkMuted;
const EMERALD = localConstellation.accentEmerald;

export type LocalKnownBusinessOption = Readonly<{
  id: string;
  name: string;
}>;

export type LocalUserRequestCreateComposerProps = Readonly<{
  knownBusinesses: readonly LocalKnownBusinessOption[];
  t: (key: string, options?: Record<string, unknown>) => string;
  onCreated: (result: LocalUserRequestCreateResult) => Promise<void>;
  onRefreshListForUnknownResult: (form: LocalCreateFormValues) => Promise<string | null>;
  onAuthRequired: () => void;
}>;

export function LocalUserRequestCreateComposer({
  knownBusinesses,
  t,
  onCreated,
  onRefreshListForUnknownResult,
  onAuthRequired,
}: LocalUserRequestCreateComposerProps): ReactElement {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<LocalCreateFormValues>(defaultLocalCreateFormValues);
  const [uiState, setUiState] = useState<LocalCreateUiState>('IDLE');
  const [refreshWarning, setRefreshWarning] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  const editable = fieldsEditableInLocalCreateState(uiState);
  const canSubmit = canSubmitLocalCreate(uiState, form);
  const feedbackKey = feedbackKeyForCreateState(uiState);

  const feedbackText = useMemo(() => {
    if (refreshWarning) {
      return t('local.userRequestStatus.create.refreshWarning');
    }
    if (!feedbackKey) return null;
    return t(`local.userRequestStatus.create.feedback.${feedbackKey}`);
  }, [feedbackKey, refreshWarning, t]);

  const patchForm = useCallback((patch: Partial<LocalCreateFormValues>) => {
    if (!fieldsEditableInLocalCreateState(uiState)) return;
    setForm((prev) => ({ ...prev, ...patch }));
    setUiState((prev) =>
      prev === 'VALIDATION_ERROR' ||
      prev === 'SERVER_VALIDATION_ERROR' ||
      prev === 'RATE_LIMITED' ||
      prev === 'SERVER_ERROR' ||
      prev === 'AUTH_REQUIRED_OR_EXPIRED'
        ? 'IDLE'
        : prev
    );
    setRefreshWarning(false);
  }, [uiState]);

  const resetComposer = useCallback(() => {
    setForm(defaultLocalCreateFormValues());
    setUiState('IDLE');
    setRefreshWarning(false);
    setCreatedId(null);
    inFlightRef.current = false;
  }, []);

  const submit = useCallback(async () => {
    if (inFlightRef.current || uiState === 'SUBMITTING') return;
    if (uiState === 'NETWORK_RESULT_UNKNOWN') return;

    const fieldErrors = validateLocalCreateForm(form);
    if (fieldErrors) {
      setUiState('VALIDATION_ERROR');
      return;
    }

    const jwt = await getRestApiJwt();
    if (!jwt) {
      setUiState('AUTH_REQUIRED_OR_EXPIRED');
      onAuthRequired();
      return;
    }

    const body = buildLocalCreateRequestBody(form);
    assertLocalCreateBodySafe(body);

    inFlightRef.current = true;
    setUiState('SUBMITTING');
    setRefreshWarning(false);

    const result = await createUserLocalServiceRequest(body);
    const next = mapCreateApiResultToUiState(result);
    inFlightRef.current = false;

    if (next === 'CREATED_SUCCESS' && result.ok) {
      setCreatedId(result.data.id);
      setUiState('CREATED_SUCCESS');
      try {
        await onCreated(result.data);
      } catch {
        setRefreshWarning(true);
      }
      return;
    }

    if (next === 'AUTH_REQUIRED_OR_EXPIRED') {
      setUiState(next);
      onAuthRequired();
      return;
    }

    if (next === 'NETWORK_RESULT_UNKNOWN') {
      setUiState(next);
      const recoveredId = await onRefreshListForUnknownResult(form);
      if (recoveredId) {
        setCreatedId(recoveredId);
        setUiState('CREATED_SUCCESS');
      }
      return;
    }

    setUiState(next);
  }, [form, onAuthRequired, onCreated, onRefreshListForUnknownResult, uiState]);

  const acknowledgeNetworkAndResubmit = useCallback(() => {
    if (uiState !== 'NETWORK_RESULT_UNKNOWN') return;
    setUiState('IDLE');
  }, [uiState]);

  if (!open) {
    return (
      <Pressable
        testID="local-user-request-create-open"
        onPress={() => {
          resetComposer();
          setOpen(true);
        }}
        accessibilityRole="button"
        accessibilityLabel={t('local.userRequestStatus.create.openA11y')}
        style={({ pressed }) => [styles.openBtn, pressed && { opacity: 0.88 }]}
      >
        <Ionicons name="add-circle-outline" size={18} color={EMERALD} />
        <Text style={styles.openBtnText}>{t('local.userRequestStatus.create.openBtn')}</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.panel} testID="local-user-request-create-composer">
      <View style={styles.panelHeader}>
        <Text style={styles.panelTitle}>{t('local.userRequestStatus.create.title')}</Text>
        <Pressable
          onPress={() => {
            setOpen(false);
            resetComposer();
          }}
          accessibilityRole="button"
          accessibilityLabel={t('local.userRequestStatus.create.closeA11y')}
          style={styles.closeBtn}
        >
          <Ionicons name="close" size={20} color={INK_MUTED} />
        </Pressable>
      </View>
      <Text style={styles.hint}>{t('local.userRequestStatus.create.hint')}</Text>
      <Text style={styles.sourceFixed}>
        {t('local.userRequestStatus.create.sourceFixed', { source: LOCAL_CREATE_CLIENT_SOURCE })}
      </Text>

      {knownBusinesses.length > 0 ? (
        <View style={styles.knownRow}>
          <Text style={styles.label}>{t('local.userRequestStatus.create.knownBusinesses')}</Text>
          <View style={styles.chipWrap}>
            {knownBusinesses.map((biz) => {
              const active = form.businessId === biz.id;
              return (
                <Pressable
                  key={biz.id}
                  disabled={!editable}
                  onPress={() => patchForm({ businessId: biz.id })}
                  accessibilityRole="button"
                  accessibilityLabel={biz.name}
                  style={[styles.bizChip, active && styles.bizChipActive, !editable && styles.disabled]}
                >
                  <Text style={[styles.bizChipText, active && styles.bizChipTextActive]} numberOfLines={1}>
                    {biz.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      <Text style={styles.label}>{t('local.userRequestStatus.create.businessIdLabel')}</Text>
      <TextInput
        testID="local-create-business-id"
        value={form.businessId}
        editable={editable}
        onChangeText={(businessId) => patchForm({ businessId })}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder={t('local.userRequestStatus.create.businessIdPlaceholder')}
        placeholderTextColor={INK_MUTED}
        style={[styles.input, !editable && styles.disabled]}
        accessibilityLabel={t('local.userRequestStatus.create.businessIdLabel')}
      />

      <Text style={styles.label}>{t('local.userRequestStatus.create.serviceTypeLabel')}</Text>
      <View style={styles.chipWrap}>
        {LOCAL_CREATE_SERVICE_TYPE_OPTIONS.map((value) => {
          const active = form.serviceType === value;
          return (
            <Pressable
              key={value}
              disabled={!editable}
              onPress={() => patchForm({ serviceType: value })}
              accessibilityRole="button"
              accessibilityLabel={value}
              style={[styles.typeChip, active && styles.typeChipActive, !editable && styles.disabled]}
            >
              <Text style={[styles.typeChipText, active && styles.typeChipTextActive]}>
                {t(`local.userRequestStatus.create.serviceType.${value}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>{t('local.userRequestStatus.create.titleLabel')}</Text>
      <TextInput
        testID="local-create-title"
        value={form.title}
        editable={editable}
        onChangeText={(title) => patchForm({ title })}
        placeholder={t('local.userRequestStatus.create.titlePlaceholder')}
        placeholderTextColor={INK_MUTED}
        style={[styles.input, !editable && styles.disabled]}
        accessibilityLabel={t('local.userRequestStatus.create.titleLabel')}
      />

      <Text style={styles.label}>{t('local.userRequestStatus.create.descriptionLabel')}</Text>
      <TextInput
        testID="local-create-description"
        value={form.description}
        editable={editable}
        onChangeText={(description) => patchForm({ description })}
        placeholder={t('local.userRequestStatus.create.descriptionPlaceholder')}
        placeholderTextColor={INK_MUTED}
        multiline
        style={[styles.input, styles.inputMultiline, !editable && styles.disabled]}
        accessibilityLabel={t('local.userRequestStatus.create.descriptionLabel')}
      />

      {feedbackText ? (
        <Text
          testID="local-create-feedback"
          style={[
            styles.feedback,
            uiState === 'CREATED_SUCCESS' ? styles.feedbackOk : styles.feedbackErr,
          ]}
        >
          {feedbackText}
          {createdId ? ` (${createdId.slice(0, 8)}…)` : ''}
        </Text>
      ) : null}

      {uiState === 'NETWORK_RESULT_UNKNOWN' ? (
        <Pressable
          testID="local-create-ack-unknown"
          onPress={acknowledgeNetworkAndResubmit}
          accessibilityRole="button"
          style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.88 }]}
        >
          <Text style={styles.secondaryBtnText}>
            {t('local.userRequestStatus.create.ackUnknownToRetry')}
          </Text>
        </Pressable>
      ) : null}

      <Pressable
        testID="local-create-submit"
        disabled={!canSubmit || uiState === 'SUBMITTING'}
        onPress={() => void submit()}
        accessibilityRole="button"
        accessibilityState={{ disabled: !canSubmit || uiState === 'SUBMITTING', busy: uiState === 'SUBMITTING' }}
        accessibilityLabel={t('local.userRequestStatus.create.submitA11y')}
        style={({ pressed }) => [
          styles.submitBtn,
          (!canSubmit || uiState === 'SUBMITTING') && styles.submitDisabled,
          pressed && canSubmit && uiState !== 'SUBMITTING' && { opacity: 0.9 },
        ]}
      >
        {uiState === 'SUBMITTING' ? (
          <ActivityIndicator color={EMERALD} accessibilityLabel={t('local.userRequestStatus.create.submitting')} />
        ) : (
          <Text style={styles.submitText}>{t('local.userRequestStatus.create.submitBtn')}</Text>
        )}
      </Pressable>

      {uiState === 'CREATED_SUCCESS' ? (
        <Pressable
          testID="local-create-another"
          onPress={resetComposer}
          accessibilityRole="button"
          style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.88 }]}
        >
          <Text style={styles.secondaryBtnText}>{t('local.userRequestStatus.create.createAnother')}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Exported for tests — default service type wire value. */
export const LOCAL_CREATE_DEFAULT_SERVICE_TYPE: LocalServiceTypeClient =
  LOCAL_SERVICE_TYPE.GENERIC_REQUEST;

const styles = StyleSheet.create({
  openBtn: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(72, 210, 165, 0.35)',
    backgroundColor: 'rgba(72, 210, 165, 0.08)',
    paddingHorizontal: 14,
  },
  openBtnText: {
    fontFamily: FontFamily.extrabold,
    fontSize: 12,
    color: EMERALD,
  },
  panel: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: localConstellation.border,
    backgroundColor: 'rgba(10, 14, 22, 0.72)',
    padding: 14,
    gap: 8,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  panelTitle: {
    fontFamily: FontFamily.extrabold,
    fontSize: 13,
    color: INK,
  },
  closeBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    fontFamily: FontFamily.semibold,
    fontSize: 11,
    color: INK_MUTED,
    lineHeight: 15,
  },
  sourceFixed: {
    fontFamily: FontFamily.semibold,
    fontSize: 10,
    color: EMERALD,
  },
  knownRow: {
    gap: 6,
  },
  label: {
    fontFamily: FontFamily.extrabold,
    fontSize: 11,
    color: INK,
    marginTop: 4,
  },
  input: {
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: localConstellation.border,
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: INK,
    fontFamily: FontFamily.semibold,
    fontSize: 13,
  },
  inputMultiline: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  bizChip: {
    maxWidth: '100%',
    minHeight: 36,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: localConstellation.border,
  },
  bizChipActive: {
    borderColor: 'rgba(72, 210, 165, 0.5)',
    backgroundColor: 'rgba(72, 210, 165, 0.12)',
  },
  bizChipText: {
    fontFamily: FontFamily.semibold,
    fontSize: 11,
    color: INK_MUTED,
  },
  bizChipTextActive: {
    color: EMERALD,
  },
  typeChip: {
    minHeight: 36,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: localConstellation.border,
  },
  typeChipActive: {
    borderColor: 'rgba(72, 210, 165, 0.5)',
    backgroundColor: 'rgba(72, 210, 165, 0.12)',
  },
  typeChipText: {
    fontFamily: FontFamily.extrabold,
    fontSize: 10,
    color: INK_MUTED,
  },
  typeChipTextActive: {
    color: EMERALD,
  },
  feedback: {
    fontFamily: FontFamily.semibold,
    fontSize: 11,
    lineHeight: 15,
  },
  feedbackOk: {
    color: EMERALD,
  },
  feedbackErr: {
    color: 'rgba(255, 138, 138, 0.95)',
  },
  submitBtn: {
    marginTop: 6,
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(72, 210, 165, 0.4)',
    backgroundColor: 'rgba(72, 210, 165, 0.14)',
  },
  submitDisabled: {
    opacity: 0.45,
  },
  submitText: {
    fontFamily: FontFamily.extrabold,
    fontSize: 13,
    color: EMERALD,
  },
  secondaryBtn: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontFamily: FontFamily.extrabold,
    fontSize: 11,
    color: localConstellation.accentCyan,
  },
  disabled: {
    opacity: 0.7,
  },
});
