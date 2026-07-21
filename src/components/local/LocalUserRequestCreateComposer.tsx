import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
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
  findLocalCreateBusinessOption,
  loadLocalCreateBusinessOptionsFromTourismDiscover,
  mergeHistoryBusinessHints,
  type LocalCreateBusinessOption,
  type LocalCreateBusinessSourceLoader,
} from '../../services/local/localCreateBusinessSource';
import {
  canSubmitLocalCreate,
  defaultLocalCreateFormValues,
  feedbackKeyForCreateState,
  fieldsEditableInLocalCreateState,
  LOCAL_CREATE_SERVICE_TYPE_OPTIONS,
  runLocalCreateSubmit,
  type LocalCreateFormValues,
  type LocalCreateSubmitDeps,
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
  /** History hints only — never the sole first-time source. */
  knownBusinesses: readonly LocalKnownBusinessOption[];
  t: (key: string, options?: Record<string, unknown>) => string;
  onCreated: (result: LocalUserRequestCreateResult) => Promise<void>;
  onRefreshListForUnknownResult: (form: LocalCreateFormValues) => Promise<string | null>;
  onAuthRequired: () => void;
  /** Injectable for tests. */
  loadBusinessOptions?: LocalCreateBusinessSourceLoader;
  submitDeps?: LocalCreateSubmitDeps;
}>;

export function LocalUserRequestCreateComposer({
  knownBusinesses,
  t,
  onCreated,
  onRefreshListForUnknownResult,
  onAuthRequired,
  loadBusinessOptions = loadLocalCreateBusinessOptionsFromTourismDiscover,
  submitDeps,
}: LocalUserRequestCreateComposerProps): ReactElement {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<LocalCreateFormValues>(defaultLocalCreateFormValues);
  const [uiState, setUiState] = useState<LocalCreateUiState>('IDLE');
  const [refreshWarning, setRefreshWarning] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [options, setOptions] = useState<readonly LocalCreateBusinessOption[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [optionsError, setOptionsError] = useState(false);
  const inFlightRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const editable = fieldsEditableInLocalCreateState(uiState);
  const canSubmit = canSubmitLocalCreate(uiState, form, options);
  const feedbackKey = feedbackKeyForCreateState(uiState);
  const selected = findLocalCreateBusinessOption(form.businessId, options);

  const feedbackText = useMemo(() => {
    if (refreshWarning) {
      return t('local.userRequestStatus.create.refreshWarning');
    }
    if (optionsError) {
      return t('local.userRequestStatus.create.feedback.providersLoadError');
    }
    if (!optionsLoading && open && options.length === 0) {
      return t('local.userRequestStatus.create.feedback.providersEmpty');
    }
    if (feedbackKey === 'validation' && form.businessId && !selected) {
      return t('local.userRequestStatus.create.feedback.providerUnavailable');
    }
    if (!feedbackKey) return null;
    return t(`local.userRequestStatus.create.feedback.${feedbackKey}`);
  }, [
    feedbackKey,
    form.businessId,
    open,
    options.length,
    optionsError,
    optionsLoading,
    refreshWarning,
    selected,
    t,
  ]);

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

  const loadOptions = useCallback(async () => {
    setOptionsLoading(true);
    setOptionsError(false);
    const result = await loadBusinessOptions();
    if (!mountedRef.current) return;
    setOptionsLoading(false);
    if (!result.ok) {
      setOptionsError(true);
      setOptions(
        mergeHistoryBusinessHints(
          [],
          knownBusinesses.map((b) => ({ id: b.id, name: b.name }))
        )
      );
      return;
    }
    setOptions(
      mergeHistoryBusinessHints(
        result.data,
        knownBusinesses.map((b) => ({ id: b.id, name: b.name }))
      )
    );
  }, [knownBusinesses, loadBusinessOptions]);

  const openComposer = useCallback(() => {
    resetComposer();
    setOpen(true);
    void loadOptions();
  }, [loadOptions, resetComposer]);

  const resolvedSubmitDeps: LocalCreateSubmitDeps = useMemo(
    () =>
      submitDeps ?? {
        getJwt: getRestApiJwt,
        createRequest: createUserLocalServiceRequest,
      },
    [submitDeps]
  );

  const submit = useCallback(async () => {
    // UI may soft-check; authoritative lock is set inside runLocalCreateSubmit
    // synchronously before any await (JWT / POST).
    if (inFlightRef.current || uiState === 'SUBMITTING') return;
    if (uiState === 'NETWORK_RESULT_UNKNOWN') return;

    setUiState('SUBMITTING');
    setRefreshWarning(false);

    const result = await runLocalCreateSubmit({
      form,
      options,
      inFlight: inFlightRef,
      deps: resolvedSubmitDeps,
    });

    if (!mountedRef.current) return;

    if (result.uiState === 'CREATED_SUCCESS' && result.created) {
      setCreatedId(result.created.id);
      setUiState('CREATED_SUCCESS');
      try {
        await onCreated(result.created);
      } catch {
        if (mountedRef.current) setRefreshWarning(true);
      }
      return;
    }

    if (result.uiState === 'AUTH_REQUIRED_OR_EXPIRED') {
      setUiState(result.uiState);
      onAuthRequired();
      return;
    }

    if (result.uiState === 'NETWORK_RESULT_UNKNOWN') {
      setUiState(result.uiState);
      const recoveredId = await onRefreshListForUnknownResult(form);
      if (!mountedRef.current) return;
      if (recoveredId) {
        setCreatedId(recoveredId);
        setUiState('CREATED_SUCCESS');
      }
      return;
    }

    if (result.uiState === 'SUBMITTING' && !result.created) {
      // Duplicate entry while another submit owns the lock — do not clear SUBMITTING.
      return;
    }

    setUiState(result.uiState);
  }, [
    form,
    onAuthRequired,
    onCreated,
    onRefreshListForUnknownResult,
    options,
    resolvedSubmitDeps,
    uiState,
  ]);

  const acknowledgeNetworkAndResubmit = useCallback(() => {
    if (uiState !== 'NETWORK_RESULT_UNKNOWN') return;
    setUiState('IDLE');
  }, [uiState]);

  if (!open) {
    return (
      <Pressable
        testID="local-user-request-create-open"
        onPress={openComposer}
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

      <Text style={styles.label}>{t('local.userRequestStatus.create.providerLabel')}</Text>
      {optionsLoading ? (
        <ActivityIndicator
          color={EMERALD}
          accessibilityLabel={t('local.userRequestStatus.create.providersLoading')}
        />
      ) : (
        <View style={styles.chipWrap} testID="local-create-provider-list">
          {options.map((biz) => {
            const active = form.businessId === biz.businessId;
            return (
              <Pressable
                key={biz.businessId}
                disabled={!editable}
                onPress={() => patchForm({ businessId: biz.businessId })}
                accessibilityRole="button"
                accessibilityLabel={biz.displayName}
                accessibilityState={{ selected: active }}
                style={[styles.bizChip, active && styles.bizChipActive, !editable && styles.disabled]}
              >
                <Text style={[styles.bizChipText, active && styles.bizChipTextActive]} numberOfLines={1}>
                  {biz.displayName}
                </Text>
                <Text style={styles.bizChipCat} numberOfLines={1}>
                  {biz.categoryLabel}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
      {selected ? (
        <Text style={styles.selectedLine} testID="local-create-selected-name">
          {t('local.userRequestStatus.create.selectedProvider', { name: selected.displayName })}
        </Text>
      ) : null}

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
        disabled={!canSubmit || uiState === 'SUBMITTING' || optionsLoading}
        onPress={() => void submit()}
        accessibilityRole="button"
        accessibilityState={{
          disabled: !canSubmit || uiState === 'SUBMITTING' || optionsLoading,
          busy: uiState === 'SUBMITTING',
        }}
        accessibilityLabel={t('local.userRequestStatus.create.submitA11y')}
        style={({ pressed }) => [
          styles.submitBtn,
          (!canSubmit || uiState === 'SUBMITTING' || optionsLoading) && styles.submitDisabled,
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
          onPress={() => {
            resetComposer();
            void loadOptions();
          }}
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
    minHeight: 44,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: localConstellation.border,
    gap: 2,
  },
  bizChipActive: {
    borderColor: 'rgba(72, 210, 165, 0.5)',
    backgroundColor: 'rgba(72, 210, 165, 0.12)',
  },
  bizChipText: {
    fontFamily: FontFamily.extrabold,
    fontSize: 12,
    color: INK_MUTED,
  },
  bizChipTextActive: {
    color: EMERALD,
  },
  bizChipCat: {
    fontFamily: FontFamily.semibold,
    fontSize: 9,
    color: INK_MUTED,
  },
  selectedLine: {
    fontFamily: FontFamily.semibold,
    fontSize: 11,
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
