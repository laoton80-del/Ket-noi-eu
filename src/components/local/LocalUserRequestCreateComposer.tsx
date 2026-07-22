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
  loadLocalCreateBusinessOptions,
  localCreateProviderSelectionEnabled,
  shouldApplyProviderListResult,
  type LocalCreateBusinessOption,
  type LocalCreateBusinessSourceLoader,
  type LocalCreateProviderSourceStatus,
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
  /**
   * Retained for host compatibility. Must NOT be used as provider authority
   * (history is not Local eligibility).
   */
  knownBusinesses: readonly LocalKnownBusinessOption[];
  t: (key: string, options?: Record<string, unknown>) => string;
  onCreated: (result: LocalUserRequestCreateResult) => Promise<void>;
  onRefreshListForUnknownResult: (form: LocalCreateFormValues) => Promise<string | null>;
  onAuthRequired: () => void;
  /** Injectable for tests. */
  loadBusinessOptions?: LocalCreateBusinessSourceLoader;
  submitDeps?: LocalCreateSubmitDeps;
}>;

function providerFeedbackKey(
  status: LocalCreateProviderSourceStatus
): string | null {
  switch (status) {
    case 'PROVIDER_IDLE':
      return 'chooseServiceType';
    case 'PROVIDER_EMPTY':
      return 'providersEmpty';
    case 'PROVIDER_AUTH_REQUIRED_OR_EXPIRED':
      return 'providerAuthRequired';
    case 'PROVIDER_NETWORK_ERROR':
      return 'providerNetworkError';
    case 'PROVIDER_SERVER_ERROR':
      return 'providerServerError';
    default:
      return null;
  }
}

export function LocalUserRequestCreateComposer({
  knownBusinesses: _knownBusinesses,
  t,
  onCreated,
  onRefreshListForUnknownResult,
  onAuthRequired,
  loadBusinessOptions = loadLocalCreateBusinessOptions,
  submitDeps,
}: LocalUserRequestCreateComposerProps): ReactElement {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<LocalCreateFormValues>(defaultLocalCreateFormValues);
  const [uiState, setUiState] = useState<LocalCreateUiState>('IDLE');
  const [refreshWarning, setRefreshWarning] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [options, setOptions] = useState<readonly LocalCreateBusinessOption[]>([]);
  const [providerStatus, setProviderStatus] =
    useState<LocalCreateProviderSourceStatus>('PROVIDER_IDLE');
  const inFlightRef = useRef(false);
  const mountedRef = useRef(true);
  const providerGenerationRef = useRef(0);
  const providerRefreshBudgetRef = useRef(0);
  const formServiceTypeRef = useRef<LocalServiceTypeClient | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    formServiceTypeRef.current = form.serviceType;
  }, [form.serviceType]);

  const selectionEnabled = localCreateProviderSelectionEnabled(providerStatus, options);
  const fieldsEditable = fieldsEditableInLocalCreateState(uiState);
  const providerSelectable = selectionEnabled && fieldsEditable;
  const canSubmit =
    selectionEnabled &&
    form.serviceType != null &&
    canSubmitLocalCreate(uiState, form, options);
  const feedbackKey = feedbackKeyForCreateState(uiState);
  const selected = findLocalCreateBusinessOption(form.businessId, options);

  const feedbackText = useMemo(() => {
    if (refreshWarning) {
      return t('local.userRequestStatus.create.refreshWarning');
    }
    if (feedbackKey === 'validation' && form.businessId && !selected) {
      return t('local.userRequestStatus.create.feedback.providerUnavailable');
    }
    if (feedbackKey === 'serverValidation') {
      return t('local.userRequestStatus.create.feedback.providerUnavailable');
    }
    const providerKey = providerFeedbackKey(providerStatus);
    if (providerKey && uiState !== 'CREATED_SUCCESS') {
      return t(`local.userRequestStatus.create.feedback.${providerKey}`);
    }
    if (!feedbackKey) return null;
    return t(`local.userRequestStatus.create.feedback.${feedbackKey}`);
  }, [
    feedbackKey,
    form.businessId,
    providerStatus,
    refreshWarning,
    selected,
    t,
    uiState,
  ]);

  const clearProviderAuthority = useCallback(() => {
    setOptions([]);
    setForm((prev) => ({ ...prev, businessId: '' }));
  }, []);

  const loadProvidersForServiceType = useCallback(
    async (
      serviceType: LocalServiceTypeClient,
      mode: 'user' | 'post_reject_refresh' = 'user'
    ) => {
      if (mode === 'post_reject_refresh') {
        if (providerRefreshBudgetRef.current <= 0) return;
        providerRefreshBudgetRef.current -= 1;
      }

      providerGenerationRef.current += 1;
      const generation = providerGenerationRef.current;
      setProviderStatus('PROVIDER_LOADING');
      setOptions([]);
      setForm((prev) => ({ ...prev, businessId: '' }));

      const result = await loadBusinessOptions({ serviceType });
      if (!mountedRef.current) return;
      if (
        !shouldApplyProviderListResult({
          responseGeneration: generation,
          activeGeneration: providerGenerationRef.current,
          responseServiceType: serviceType,
          activeServiceType: formServiceTypeRef.current,
        })
      ) {
        return;
      }

      setProviderStatus(result.status);
      setOptions(result.options);
      if (!localCreateProviderSelectionEnabled(result.status, result.options)) {
        setForm((prev) => ({ ...prev, businessId: '' }));
      }
      if (result.status === 'PROVIDER_AUTH_REQUIRED_OR_EXPIRED') {
        clearProviderAuthority();
        onAuthRequired();
      }
    },
    [clearProviderAuthority, loadBusinessOptions, onAuthRequired]
  );

  const patchForm = useCallback(
    (patch: Partial<LocalCreateFormValues>) => {
      if (!fieldsEditableInLocalCreateState(uiState)) return;
      if (patch.businessId != null && !localCreateProviderSelectionEnabled(providerStatus, options)) {
        return;
      }

      if (patch.serviceType !== undefined && patch.serviceType !== form.serviceType) {
        const nextType = patch.serviceType;
        setForm((prev) => ({
          ...prev,
          ...patch,
          businessId: '',
        }));
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
        providerRefreshBudgetRef.current = 0;
        if (nextType == null) {
          providerGenerationRef.current += 1;
          setProviderStatus('PROVIDER_IDLE');
          setOptions([]);
          return;
        }
        void loadProvidersForServiceType(nextType, 'user');
        return;
      }

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
    },
    [form.serviceType, loadProvidersForServiceType, options, providerStatus, uiState]
  );

  const resetComposer = useCallback(() => {
    providerGenerationRef.current += 1;
    providerRefreshBudgetRef.current = 0;
    setForm(defaultLocalCreateFormValues());
    setUiState('IDLE');
    setRefreshWarning(false);
    setCreatedId(null);
    setOptions([]);
    setProviderStatus('PROVIDER_IDLE');
    inFlightRef.current = false;
  }, []);

  const openComposer = useCallback(() => {
    resetComposer();
    setOpen(true);
  }, [resetComposer]);

  const resolvedSubmitDeps: LocalCreateSubmitDeps = useMemo(
    () =>
      submitDeps ?? {
        getJwt: getRestApiJwt,
        createRequest: createUserLocalServiceRequest,
      },
    [submitDeps]
  );

  const submit = useCallback(async () => {
    if (inFlightRef.current || uiState === 'SUBMITTING') return;
    if (uiState === 'NETWORK_RESULT_UNKNOWN') return;
    if (!localCreateProviderSelectionEnabled(providerStatus, options)) return;
    if (form.serviceType == null) return;

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
      clearProviderAuthority();
      setProviderStatus('PROVIDER_AUTH_REQUIRED_OR_EXPIRED');
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
      return;
    }

    if (result.uiState === 'SERVER_VALIDATION_ERROR' && form.serviceType) {
      // Authoritative stale provider / unsupported type — no auto POST retry.
      setForm((prev) => ({ ...prev, businessId: '' }));
      setUiState(result.uiState);
      providerRefreshBudgetRef.current = 1;
      await loadProvidersForServiceType(form.serviceType, 'post_reject_refresh');
      return;
    }

    setUiState(result.uiState);
  }, [
    clearProviderAuthority,
    form,
    loadProvidersForServiceType,
    onAuthRequired,
    onCreated,
    onRefreshListForUnknownResult,
    options,
    providerStatus,
    resolvedSubmitDeps,
    uiState,
  ]);

  const acknowledgeNetworkAndResubmit = useCallback(() => {
    if (uiState !== 'NETWORK_RESULT_UNKNOWN') return;
    setUiState('IDLE');
  }, [uiState]);

  const retryProviders = useCallback(() => {
    if (form.serviceType == null) return;
    if (
      providerStatus !== 'PROVIDER_NETWORK_ERROR' &&
      providerStatus !== 'PROVIDER_SERVER_ERROR' &&
      providerStatus !== 'PROVIDER_AUTH_REQUIRED_OR_EXPIRED' &&
      providerStatus !== 'PROVIDER_EMPTY'
    ) {
      return;
    }
    void loadProvidersForServiceType(form.serviceType, 'user');
  }, [form.serviceType, loadProvidersForServiceType, providerStatus]);

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

  const showRetry =
    form.serviceType != null &&
    (providerStatus === 'PROVIDER_NETWORK_ERROR' ||
      providerStatus === 'PROVIDER_SERVER_ERROR' ||
      providerStatus === 'PROVIDER_AUTH_REQUIRED_OR_EXPIRED' ||
      providerStatus === 'PROVIDER_EMPTY');

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

      <Text style={styles.label}>{t('local.userRequestStatus.create.serviceTypeLabel')}</Text>
      <View style={styles.chipWrap} testID="local-create-service-type-list">
        {LOCAL_CREATE_SERVICE_TYPE_OPTIONS.map((value) => {
          const active = form.serviceType === value;
          return (
            <Pressable
              key={value}
              disabled={!fieldsEditable}
              onPress={() => patchForm({ serviceType: value })}
              accessibilityRole="button"
              accessibilityLabel={t(`local.userRequestStatus.create.serviceType.${value}`)}
              accessibilityState={{ selected: active, disabled: !fieldsEditable }}
              style={[styles.typeChip, active && styles.typeChipActive, !fieldsEditable && styles.disabled]}
            >
              <Text style={[styles.typeChipText, active && styles.typeChipTextActive]}>
                {t(`local.userRequestStatus.create.serviceType.${value}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>{t('local.userRequestStatus.create.providerLabel')}</Text>
      {providerStatus === 'PROVIDER_LOADING' ? (
        <ActivityIndicator
          testID="local-create-providers-loading"
          color={EMERALD}
          accessibilityLabel={t('local.userRequestStatus.create.providersLoading')}
        />
      ) : selectionEnabled ? (
        <View
          style={styles.chipWrap}
          testID="local-create-provider-list"
          accessibilityLabel={t('local.userRequestStatus.create.providerListA11y')}
        >
          {options.map((biz) => {
            const active = form.businessId === biz.businessId;
            return (
              <Pressable
                key={biz.businessId}
                disabled={!providerSelectable}
                onPress={() => patchForm({ businessId: biz.businessId })}
                accessibilityRole="button"
                accessibilityLabel={biz.displayName}
                accessibilityState={{ selected: active, disabled: !providerSelectable }}
                style={[
                  styles.bizChip,
                  active && styles.bizChipActive,
                  !providerSelectable && styles.disabled,
                ]}
              >
                <Text style={[styles.bizChipText, active && styles.bizChipTextActive]} numberOfLines={1}>
                  {biz.displayName}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <View testID="local-create-provider-unavailable" style={styles.unavailableBox}>
          <Text style={styles.unavailableText}>
            {t(
              `local.userRequestStatus.create.feedback.${
                providerFeedbackKey(providerStatus) ?? 'chooseServiceType'
              }`
            )}
          </Text>
        </View>
      )}
      {selected ? (
        <Text style={styles.selectedLine} testID="local-create-selected-name">
          {t('local.userRequestStatus.create.selectedProvider', { name: selected.displayName })}
        </Text>
      ) : null}

      <Text style={styles.label}>{t('local.userRequestStatus.create.titleLabel')}</Text>
      <TextInput
        testID="local-create-title"
        value={form.title}
        editable={fieldsEditable}
        onChangeText={(title) => patchForm({ title })}
        placeholder={t('local.userRequestStatus.create.titlePlaceholder')}
        placeholderTextColor={INK_MUTED}
        style={[styles.input, !fieldsEditable && styles.disabled]}
        accessibilityLabel={t('local.userRequestStatus.create.titleLabel')}
      />

      <Text style={styles.label}>{t('local.userRequestStatus.create.descriptionLabel')}</Text>
      <TextInput
        testID="local-create-description"
        value={form.description}
        editable={fieldsEditable}
        onChangeText={(description) => patchForm({ description })}
        placeholder={t('local.userRequestStatus.create.descriptionPlaceholder')}
        placeholderTextColor={INK_MUTED}
        multiline
        style={[styles.input, styles.inputMultiline, !fieldsEditable && styles.disabled]}
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

      {showRetry ? (
        <Pressable
          testID="local-create-retry-providers"
          onPress={retryProviders}
          accessibilityRole="button"
          accessibilityLabel={t('local.userRequestStatus.create.retryProviders')}
          style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.88 }]}
        >
          <Text style={styles.secondaryBtnText}>
            {t('local.userRequestStatus.create.retryProviders')}
          </Text>
        </Pressable>
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
        disabled={!canSubmit || uiState === 'SUBMITTING' || providerStatus === 'PROVIDER_LOADING'}
        onPress={() => void submit()}
        accessibilityRole="button"
        accessibilityState={{
          disabled: !canSubmit || uiState === 'SUBMITTING' || providerStatus === 'PROVIDER_LOADING',
          busy: uiState === 'SUBMITTING',
        }}
        accessibilityLabel={t('local.userRequestStatus.create.submitA11y')}
        style={({ pressed }) => [
          styles.submitBtn,
          (!canSubmit || uiState === 'SUBMITTING' || providerStatus === 'PROVIDER_LOADING') &&
            styles.submitDisabled,
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
          }}
          accessibilityRole="button"
          style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.88 }]}
        >
          <Text style={styles.secondaryBtnText}>{t('local.userRequestStatus.create.createAnother')}</Text>
        </Pressable>
      ) : null}

      {createdId ? (
        <Text testID="local-create-created-id" style={styles.createdIdHidden}>
          {createdId}
        </Text>
      ) : null}
    </View>
  );
}

/** Exported for tests — default service type wire value when a type is chosen. */
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
    gap: 8,
  },
  bizChip: {
    maxWidth: '100%',
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: localConstellation.border,
    backgroundColor: 'rgba(0,0,0,0.22)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  bizChipActive: {
    borderColor: 'rgba(72, 210, 165, 0.55)',
    backgroundColor: 'rgba(72, 210, 165, 0.12)',
  },
  bizChipText: {
    fontFamily: FontFamily.semibold,
    fontSize: 12,
    color: INK,
  },
  bizChipTextActive: {
    color: EMERALD,
  },
  typeChip: {
    minHeight: 40,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: localConstellation.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  typeChipActive: {
    borderColor: 'rgba(72, 210, 165, 0.55)',
    backgroundColor: 'rgba(72, 210, 165, 0.12)',
  },
  typeChipText: {
    fontFamily: FontFamily.semibold,
    fontSize: 11,
    color: INK_MUTED,
  },
  typeChipTextActive: {
    color: EMERALD,
  },
  selectedLine: {
    fontFamily: FontFamily.semibold,
    fontSize: 11,
    color: EMERALD,
  },
  unavailableBox: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 120, 120, 0.25)',
    backgroundColor: 'rgba(255, 80, 80, 0.06)',
    padding: 12,
  },
  unavailableText: {
    fontFamily: FontFamily.semibold,
    fontSize: 12,
    color: INK_MUTED,
    lineHeight: 16,
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
    color: '#ff9b9b',
  },
  submitBtn: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(72, 210, 165, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(72, 210, 165, 0.45)',
    marginTop: 4,
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
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: localConstellation.border,
    paddingHorizontal: 12,
  },
  secondaryBtnText: {
    fontFamily: FontFamily.semibold,
    fontSize: 12,
    color: INK,
  },
  disabled: {
    opacity: 0.5,
  },
  createdIdHidden: {
    height: 0,
    opacity: 0,
    fontSize: 1,
  },
});
