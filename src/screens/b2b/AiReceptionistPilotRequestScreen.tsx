import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState, type ReactElement } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../navigation/routes';
import { useTranslation } from '../../i18n';
import {
  buildPilotLeadStructuredAppendix,
  getAiReceptionistPlaybook,
  getIndustryDefinition,
  INDUSTRY_GROUP_ORDER,
  industryGroupNameKey,
  listIndustriesByGroup,
} from '../../core/industries';
import type { IndustryId } from '../../core/industries';
import { useSmartTrio } from '../../context/SmartTrioContext';
import { isRestApiConfigured } from '../../services/apiClient';
import {
  submitAiReceptionistPilotLead,
  type AiReceptionistLeadDesiredAutomation,
  type AiReceptionistLeadIndustry,
} from '../../services/api/aiReceptionistLeadApi';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Automation = 'intake_only' | 'booking_request' | 'auto_booking_later' | 'multi_language_support';

const AUTOMATION_IDS: readonly Automation[] = [
  'intake_only',
  'booking_request',
  'auto_booking_later',
  'multi_language_support',
] as const;

function mapIndustryIdToPilotLeadIndustry(id: IndustryId): AiReceptionistLeadIndustry {
  switch (id) {
    case 'nailSalon':
    case 'lashBrow':
    case 'waxing':
      return 'Nail salon';
    case 'spaMassage':
      return 'Spa';
    case 'hairBarber':
      return 'Barber';
    case 'restaurantTakeaway':
    case 'bakery':
      return 'Restaurant';
    default:
      return 'Other';
  }
}

function buildIndustryAppendix(industryId: IndustryId, t: (key: string, opts?: Record<string, unknown>) => string): string {
  const def = getIndustryDefinition(industryId);
  const pb = getAiReceptionistPlaybook(industryId);
  const label = t(def.nameKey);
  return [
    '---',
    'VIONA Industry Registry (structured)',
    `industryId: ${industryId}`,
    `industryLabel: ${label}`,
    `bookingMode: ${pb.bookingMode}`,
    `riskLevel: ${pb.riskLevel}`,
    `confirmationPolicy: ${pb.confirmationPolicy}`,
    `disallowedViaAI: ${pb.blockedActions.join(', ')}`,
  ].join('\n');
}

function buildSmartTrioAppendixLine(
  customerLocale: string,
  merchantLocale: string,
  nativeLocale: string,
  appLocale: string,
  marketCode: string
): string {
  return `customerLocale=${customerLocale}; merchantLocale=${merchantLocale}; nativeLocale=${nativeLocale}; appLocale=${appLocale}; market=${marketCode}`;
}

export function AiReceptionistPilotRequestScreen(): ReactElement {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const { customerLocale, merchantLocale, nativeLocale, appLocale, marketCode } = useSmartTrio();

  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState<IndustryId>('nailSalon');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [languagesNeeded, setLanguagesNeeded] = useState('');
  const [estimatedMissedCallsPerDay, setEstimatedMissedCallsPerDay] = useState('');
  const [desiredAutomation, setDesiredAutomation] = useState<readonly Automation[]>([]);
  const [preferredPilotDate, setPreferredPilotDate] = useState('');
  const [notes, setNotes] = useState('');
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [manualOpsAck, setManualOpsAck] = useState(false);
  const [noAutonomousAck, setNoAutonomousAck] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);
  const [manualOpsAckError, setManualOpsAckError] = useState<string | null>(null);
  const [noAutonomousAckError, setNoAutonomousAckError] = useState<string | null>(null);
  const [isSubmittedLocalDraft, setIsSubmittedLocalDraft] = useState(false);
  const [submittedStatus, setSubmittedStatus] = useState<'submitted_for_manual_review' | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const industryLabel = useMemo(() => t(getIndustryDefinition(industry).nameKey), [industry, t]);

  const smartTrioDisplay = useMemo(
    () =>
      t('aiReceptionist.pilot.languageContext', {
        customer: t(`smartTrio.language.${customerLocale}`),
        merchant: t(`smartTrio.language.${merchantLocale}`),
        native: t(`smartTrio.language.${nativeLocale}`),
      }),
    [t, customerLocale, merchantLocale, nativeLocale]
  );

  const desiredAutomationLabels = useMemo(() => {
    const labels = desiredAutomation.map((id) => t(`aiReceptionist.pilot.automation.${id}`));
    return labels.length > 0 ? labels.join(', ') : t('aiReceptionist.pilot.automationNotSelected');
  }, [desiredAutomation, t]);

  const previewYes = useMemo(() => t('aiReceptionist.pilot.previewYes'), [t]);
  const previewNo = useMemo(() => t('aiReceptionist.pilot.previewNo'), [t]);

  const na = (value: string): string => {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : t('aiReceptionist.pilot.na');
  };

  const toggleAutomation = (id: Automation): void => {
    setDesiredAutomation((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const automationToApi: Record<Automation, AiReceptionistLeadDesiredAutomation> = {
    intake_only: 'Intake only',
    booking_request: 'Booking request',
    auto_booking_later: 'Auto booking later',
    multi_language_support: 'Multi-language support',
  };

  const handleSubmit = async (): Promise<void> => {
    setConsentError(null);
    setManualOpsAckError(null);
    setNoAutonomousAckError(null);
    setSubmitError(null);
    setSubmittedStatus(null);

    if (!manualOpsAck) {
      setManualOpsAckError(t('aiReceptionist.pilot.errorManualOpsAck'));
      return;
    }
    if (!noAutonomousAck) {
      setNoAutonomousAckError(t('aiReceptionist.pilot.errorNoAutonomousAck'));
      return;
    }
    if (!consentAccepted) {
      setConsentError(t('aiReceptionist.pilot.consentError'));
      return;
    }

    const normalizedPhone = contactPhone.trim();
    const normalizedEmail = contactEmail.trim();
    if (!normalizedPhone && !normalizedEmail) {
      setSubmitError(t('aiReceptionist.pilot.errorContactRequired'));
      return;
    }

    const normalizedMissedCalls = estimatedMissedCallsPerDay.trim();
    if (!/^\d{1,4}$/.test(normalizedMissedCalls)) {
      setSubmitError(t('aiReceptionist.pilot.errorMissedCallsInvalid'));
      return;
    }

    const industryAppendix = buildIndustryAppendix(industry, t);
    const trioOpsLine = buildSmartTrioAppendixLine(
      customerLocale,
      merchantLocale,
      nativeLocale,
      appLocale,
      marketCode
    );
    const postureAppendix = buildPilotLeadStructuredAppendix(t, trioOpsLine);
    const mergedNotes = [notes.trim(), industryAppendix, postureAppendix].filter((s) => s.length > 0).join('\n\n');

    if (!isRestApiConfigured()) {
      setIsSubmittedLocalDraft(true);
      setSubmitError(t('aiReceptionist.pilot.errorRelayNotConfigured'));
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitAiReceptionistPilotLead({
        businessName: businessName.trim(),
        industry: mapIndustryIdToPilotLeadIndustry(industry),
        city: city.trim(),
        country: country.trim(),
        contactName: contactName.trim(),
        contactPhone: normalizedPhone || undefined,
        contactEmail: normalizedEmail || undefined,
        languagesNeeded: languagesNeeded.trim(),
        estimatedMissedCallsPerDay: normalizedMissedCalls,
        desiredAutomation: desiredAutomation.map((item) => automationToApi[item]),
        preferredPilotDate: preferredPilotDate.trim() || undefined,
        notes: mergedNotes || undefined,
        consentAccepted: true,
      });

      if (result.ok) {
        setIsSubmittedLocalDraft(false);
        setSubmittedStatus(result.data.status);
        setSubmitError(null);
        return;
      }

      setIsSubmittedLocalDraft(true);
      if (result.status === 503 || /LEAD_CAPTURE_NOT_CONFIGURED/i.test(result.error)) {
        setSubmitError(t('aiReceptionist.pilot.errorRelayNotConfigured'));
      } else if (result.status === 400) {
        setSubmitError(t('aiReceptionist.pilot.errorReviewFields'));
      } else if (result.status === 401) {
        setSubmitError(t('aiReceptionist.pilot.errorSession'));
      } else if (result.unreachable) {
        setSubmitError(t('aiReceptionist.pilot.errorUnreachable'));
      } else {
        setSubmitError(t('aiReceptionist.pilot.errorSendFailed'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitDisabled = !consentAccepted || !manualOpsAck || !noAutonomousAck || isSubmitting;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.84 }]}
          >
            <Ionicons name="chevron-back" size={20} color="#E8EDF7" />
          </Pressable>
          <View style={styles.headerTextWrap}>
            <Text style={styles.kicker}>{t('aiReceptionist.pilot.screenKicker')}</Text>
            <Text style={styles.title}>{t('aiReceptionist.pilot.screenTitle')}</Text>
          </View>
        </View>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>{t('aiReceptionist.pilot.badgeLabel')}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('aiReceptionist.pilot.safetyCardTitle')}</Text>
          <Text style={styles.cardBody}>{t('aiReceptionist.pilot.statusLabel')}</Text>
          <Text style={styles.cardBody}>{t('aiReceptionist.pilot.safetyBody1')}</Text>
          <Text style={styles.cardBody}>{t('aiReceptionist.pilot.safetyBody2')}</Text>
          <Text style={styles.cardBody}>{t('aiReceptionist.pilot.safetyBody3')}</Text>
          <Text style={styles.cardBody}>{t('aiReceptionist.pilot.safetyBody4')}</Text>
          <Text style={styles.cardBody}>{t('aiReceptionist.pilot.manualOpsRequired')}</Text>
          <Text style={styles.cardBody}>{t('aiReceptionist.pilot.noAutoBooking')}</Text>
          <Text style={styles.cardBody}>{t('aiReceptionist.pilot.noPayment')}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('aiReceptionist.pilot.languageExpectationsTitle')}</Text>
          <Text style={styles.cardBody}>{t('aiReceptionist.pilot.languageExpectationsBody')}</Text>
          <Text style={styles.cardBody}>{smartTrioDisplay}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('aiReceptionist.pilot.formCardTitle')}</Text>

          <Text style={styles.label}>{t('aiReceptionist.pilot.formBusinessName')}</Text>
          <TextInput
            value={businessName}
            onChangeText={setBusinessName}
            style={styles.input}
            placeholder={t('aiReceptionist.pilot.placeholderBusinessName')}
            placeholderTextColor="#8EA0BC"
          />

          <Text style={styles.label}>{t('aiReceptionist.pilot.industryLabel')}</Text>
          {INDUSTRY_GROUP_ORDER.map((groupId) => (
            <View key={groupId} style={styles.industryGroup}>
              <Text style={styles.industryGroupTitle}>{t(industryGroupNameKey(groupId))}</Text>
              <View style={styles.chipRow}>
                {listIndustriesByGroup(groupId).map((def) => {
                  const active = def.id === industry;
                  return (
                    <Pressable
                      key={def.id}
                      onPress={() => setIndustry(def.id)}
                      style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && { opacity: 0.88 }]}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{t(def.nameKey)}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}

          <Text style={styles.label}>{t('aiReceptionist.pilot.formCity')}</Text>
          <TextInput value={city} onChangeText={setCity} style={styles.input} placeholder={t('aiReceptionist.pilot.placeholderCity')} placeholderTextColor="#8EA0BC" />
          <Text style={styles.label}>{t('aiReceptionist.pilot.formCountry')}</Text>
          <TextInput
            value={country}
            onChangeText={setCountry}
            style={styles.input}
            placeholder={t('aiReceptionist.pilot.placeholderCountry')}
            placeholderTextColor="#8EA0BC"
          />

          <Text style={styles.label}>{t('aiReceptionist.pilot.formContactName')}</Text>
          <TextInput
            value={contactName}
            onChangeText={setContactName}
            style={styles.input}
            placeholder={t('aiReceptionist.pilot.placeholderContactName')}
            placeholderTextColor="#8EA0BC"
          />
          <Text style={styles.label}>{t('aiReceptionist.pilot.formContactPhone')}</Text>
          <TextInput
            value={contactPhone}
            onChangeText={setContactPhone}
            style={styles.input}
            placeholder={t('aiReceptionist.pilot.placeholderContactPhone')}
            placeholderTextColor="#8EA0BC"
            keyboardType="phone-pad"
          />
          <Text style={styles.label}>{t('aiReceptionist.pilot.formContactEmail')}</Text>
          <TextInput
            value={contactEmail}
            onChangeText={setContactEmail}
            style={styles.input}
            placeholder={t('aiReceptionist.pilot.placeholderContactEmail')}
            placeholderTextColor="#8EA0BC"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>{t('aiReceptionist.pilot.formLanguagesNeeded')}</Text>
          <TextInput
            value={languagesNeeded}
            onChangeText={setLanguagesNeeded}
            style={styles.input}
            placeholder={t('aiReceptionist.pilot.placeholderLanguages')}
            placeholderTextColor="#8EA0BC"
          />

          <Text style={styles.label}>{t('aiReceptionist.pilot.formMissedCalls')}</Text>
          <TextInput
            value={estimatedMissedCallsPerDay}
            onChangeText={setEstimatedMissedCallsPerDay}
            style={styles.input}
            placeholder={t('aiReceptionist.pilot.placeholderMissedCalls')}
            placeholderTextColor="#8EA0BC"
            keyboardType="number-pad"
          />

          <Text style={styles.label}>{t('aiReceptionist.pilot.formDesiredAutomation')}</Text>
          <View style={styles.chipRow}>
            {AUTOMATION_IDS.map((id) => {
              const active = desiredAutomation.includes(id);
              return (
                <Pressable
                  key={id}
                  onPress={() => toggleAutomation(id)}
                  style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && { opacity: 0.88 }]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {t(`aiReceptionist.pilot.automation.${id}`)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>{t('aiReceptionist.pilot.formPreferredDate')}</Text>
          <TextInput
            value={preferredPilotDate}
            onChangeText={setPreferredPilotDate}
            style={styles.input}
            placeholder={t('aiReceptionist.pilot.placeholderPreferredDate')}
            placeholderTextColor="#8EA0BC"
          />

          <Text style={styles.label}>{t('aiReceptionist.pilot.formNotes')}</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            style={[styles.input, styles.textArea]}
            placeholder={t('aiReceptionist.pilot.placeholderNotes')}
            placeholderTextColor="#8EA0BC"
            multiline
          />

          <View style={styles.privacyBlock}>
            <Text style={styles.privacyTitle}>{t('aiReceptionist.pilot.acknowledgementTitle')}</Text>
            <Pressable
              onPress={() => {
                setManualOpsAck((prev) => {
                  const next = !prev;
                  if (next) setManualOpsAckError(null);
                  return next;
                });
              }}
              style={({ pressed }) => [styles.consentRow, pressed && { opacity: 0.88 }]}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: manualOpsAck }}
              accessibilityLabel={t('aiReceptionist.pilot.acknowledgement.manualOps')}
            >
              <View style={[styles.checkbox, manualOpsAck && styles.checkboxChecked]}>
                {manualOpsAck ? <Ionicons name="checkmark" size={13} color="#061018" /> : null}
              </View>
              <Text style={styles.consentText}>{t('aiReceptionist.pilot.acknowledgement.manualOps')}</Text>
            </Pressable>
            {manualOpsAckError ? <Text style={styles.consentError}>{manualOpsAckError}</Text> : null}

            <Pressable
              onPress={() => {
                setNoAutonomousAck((prev) => {
                  const next = !prev;
                  if (next) setNoAutonomousAckError(null);
                  return next;
                });
              }}
              style={({ pressed }) => [styles.consentRow, pressed && { opacity: 0.88 }]}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: noAutonomousAck }}
              accessibilityLabel={t('aiReceptionist.pilot.acknowledgement.noAutonomous')}
            >
              <View style={[styles.checkbox, noAutonomousAck && styles.checkboxChecked]}>
                {noAutonomousAck ? <Ionicons name="checkmark" size={13} color="#061018" /> : null}
              </View>
              <Text style={styles.consentText}>{t('aiReceptionist.pilot.acknowledgement.noAutonomous')}</Text>
            </Pressable>
            {noAutonomousAckError ? <Text style={styles.consentError}>{noAutonomousAckError}</Text> : null}

            <Text style={[styles.privacyTitle, { marginTop: 8 }]}>{t('aiReceptionist.pilot.privacyTitle')}</Text>
            <Text style={styles.privacyCopy}>{t('aiReceptionist.pilot.privacyCopy1')}</Text>
            <Text style={styles.privacyCopy}>{t('aiReceptionist.pilot.privacyCopy2')}</Text>
            <Text style={styles.privacyCopy}>{t('aiReceptionist.pilot.privacyCopy3')}</Text>
            <Text style={styles.privacyCopy}>{t('aiReceptionist.pilot.privacyCopy4')}</Text>
            <Text style={styles.privacyCopy}>{t('aiReceptionist.pilot.privacyCopy5')}</Text>
            <Text style={styles.privacyCopy}>{t('aiReceptionist.pilot.privacyCopy6')}</Text>
            <Pressable
              onPress={() => {
                setConsentAccepted((prev) => {
                  const next = !prev;
                  if (next) setConsentError(null);
                  return next;
                });
              }}
              style={({ pressed }) => [styles.consentRow, pressed && { opacity: 0.88 }]}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: consentAccepted }}
              accessibilityLabel={t('aiReceptionist.pilot.consentA11y')}
            >
              <View style={[styles.checkbox, consentAccepted && styles.checkboxChecked]}>
                {consentAccepted ? <Ionicons name="checkmark" size={13} color="#061018" /> : null}
              </View>
              <Text style={styles.consentText}>{t('aiReceptionist.pilot.consentLabel')}</Text>
            </Pressable>
            {consentError ? <Text style={styles.consentError}>{consentError}</Text> : null}
          </View>

          <Pressable
            onPress={() => {
              void handleSubmit();
            }}
            disabled={submitDisabled}
            style={({ pressed }) => [
              styles.submitBtn,
              submitDisabled && styles.submitBtnDisabled,
              pressed && { opacity: 0.86 },
            ]}
          >
            <Text style={styles.submitBtnText}>
              {isSubmitting ? t('aiReceptionist.pilot.submitSending') : t('aiReceptionist.pilot.submitCta')}
            </Text>
          </Pressable>
          {submitError ? <Text style={styles.submitErrorText}>{submitError}</Text> : null}
        </View>

        {submittedStatus ? (
          <View style={styles.cardConfirm}>
            <Text style={styles.cardTitle}>{t('aiReceptionist.pilot.confirmTitle')}</Text>
            <Text style={styles.cardBody}>{t('aiReceptionist.pilot.confirmStatusLine', { status: submittedStatus })}</Text>
            <Text style={styles.cardBody}>{t('aiReceptionist.pilot.confirmBody')}</Text>
            <Text style={styles.previewTitle}>{t('aiReceptionist.pilot.previewTitle')}</Text>
            <Text style={styles.previewLine}>{t('aiReceptionist.pilot.previewBusiness', { value: na(businessName) })}</Text>
            <Text style={styles.previewLine}>{t('aiReceptionist.pilot.previewIndustry', { value: industryLabel })}</Text>
            <Text style={styles.previewLine}>{t('aiReceptionist.pilot.previewIndustryId', { id: industry })}</Text>
            <Text style={styles.previewLine}>
              {t('aiReceptionist.pilot.previewCityCountry', { value: `${na(city)} / ${na(country)}` })}
            </Text>
            <Text style={styles.previewLine}>{t('aiReceptionist.pilot.previewContact', { value: na(contactName) })}</Text>
            <Text style={styles.previewLine}>{t('aiReceptionist.pilot.previewPhone', { value: na(contactPhone) })}</Text>
            <Text style={styles.previewLine}>{t('aiReceptionist.pilot.previewEmail', { value: na(contactEmail) })}</Text>
            <Text style={styles.previewLine}>{t('aiReceptionist.pilot.previewLanguages', { value: na(languagesNeeded) })}</Text>
            <Text style={styles.previewLine}>
              {t('aiReceptionist.pilot.previewMissedCalls', { value: na(estimatedMissedCallsPerDay) })}
            </Text>
            <Text style={styles.previewLine}>{t('aiReceptionist.pilot.previewAutomation', { value: desiredAutomationLabels })}</Text>
            <Text style={styles.previewLine}>{t('aiReceptionist.pilot.previewDate', { value: na(preferredPilotDate) })}</Text>
            <Text style={styles.previewLine}>{t('aiReceptionist.pilot.previewNotes', { value: na(notes) })}</Text>
            <Text style={styles.previewLine}>
              {t('aiReceptionist.pilot.previewAckManualOps', { value: manualOpsAck ? previewYes : previewNo })}
            </Text>
            <Text style={styles.previewLine}>
              {t('aiReceptionist.pilot.previewAckNoAutonomous', { value: noAutonomousAck ? previewYes : previewNo })}
            </Text>
          </View>
        ) : isSubmittedLocalDraft ? (
          <View style={styles.cardConfirm}>
            <Text style={styles.cardTitle}>{t('aiReceptionist.pilot.draftTitle')}</Text>
            <Text style={styles.cardBody}>{t('aiReceptionist.pilot.draftBody1')}</Text>
            <Text style={styles.cardBody}>{t('aiReceptionist.pilot.draftBody2')}</Text>
            <Text style={styles.cardBody}>{t('aiReceptionist.pilot.draftBody3')}</Text>
            <Text style={styles.previewTitle}>{t('aiReceptionist.pilot.draftPreviewTitle')}</Text>
            <Text style={styles.previewLine}>{t('aiReceptionist.pilot.previewBusiness', { value: na(businessName) })}</Text>
            <Text style={styles.previewLine}>{t('aiReceptionist.pilot.previewIndustry', { value: industryLabel })}</Text>
            <Text style={styles.previewLine}>{t('aiReceptionist.pilot.previewIndustryId', { id: industry })}</Text>
            <Text style={styles.previewLine}>
              {t('aiReceptionist.pilot.previewCityCountry', { value: `${na(city)} / ${na(country)}` })}
            </Text>
            <Text style={styles.previewLine}>{t('aiReceptionist.pilot.previewContact', { value: na(contactName) })}</Text>
            <Text style={styles.previewLine}>{t('aiReceptionist.pilot.previewPhone', { value: na(contactPhone) })}</Text>
            <Text style={styles.previewLine}>{t('aiReceptionist.pilot.previewEmail', { value: na(contactEmail) })}</Text>
            <Text style={styles.previewLine}>{t('aiReceptionist.pilot.previewLanguages', { value: na(languagesNeeded) })}</Text>
            <Text style={styles.previewLine}>
              {t('aiReceptionist.pilot.previewMissedCalls', { value: na(estimatedMissedCallsPerDay) })}
            </Text>
            <Text style={styles.previewLine}>{t('aiReceptionist.pilot.previewAutomation', { value: desiredAutomationLabels })}</Text>
            <Text style={styles.previewLine}>{t('aiReceptionist.pilot.previewDate', { value: na(preferredPilotDate) })}</Text>
            <Text style={styles.previewLine}>{t('aiReceptionist.pilot.previewNotes', { value: na(notes) })}</Text>
            <Text style={styles.previewLine}>
              {t('aiReceptionist.pilot.previewAckManualOps', { value: manualOpsAck ? previewYes : previewNo })}
            </Text>
            <Text style={styles.previewLine}>
              {t('aiReceptionist.pilot.previewAckNoAutonomous', { value: noAutonomousAck ? previewYes : previewNo })}
            </Text>
          </View>
        ) : null}

        <View style={styles.actionRow}>
          <Pressable onPress={() => navigation.navigate('AiReceptionistDemoSimulator')} style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.86 }]}>
            <Text style={styles.actionBtnText}>{t('aiReceptionist.pilot.ctaDemo')}</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('AiReceptionistSetupChecklist')} style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.86 }]}>
            <Text style={styles.actionBtnText}>{t('aiReceptionist.pilot.ctaChecklist')}</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('MerchantDashboard')} style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.86 }]}>
            <Text style={styles.actionBtnText}>{t('aiReceptionist.pilot.ctaMerchant')}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0C1017' },
  scroll: { paddingHorizontal: 16, paddingBottom: 28, gap: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(232,237,247,0.15)',
    backgroundColor: 'rgba(20,27,40,0.88)',
  },
  headerTextWrap: { flex: 1, minWidth: 0 },
  kicker: { fontSize: 11, fontWeight: '700', color: 'rgba(232,237,247,0.62)' },
  title: { fontSize: 23, fontWeight: '900', color: '#F4F7FF' },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(122,228,255,0.45)',
    backgroundColor: 'rgba(61,90,254,0.2)',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  badgeText: { fontSize: 11, fontWeight: '800', color: '#E8EDF7' },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(232,237,247,0.08)',
    backgroundColor: '#151C27',
    padding: 14,
    gap: 8,
  },
  cardConfirm: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(134,239,172,0.4)',
    backgroundColor: 'rgba(20,83,45,0.22)',
    padding: 14,
    gap: 6,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#F4F7FF' },
  cardBody: { fontSize: 13, color: 'rgba(232,237,247,0.74)', lineHeight: 18 },
  label: { fontSize: 12, fontWeight: '700', color: '#D4E9FF', marginTop: 4 },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(232,237,247,0.16)',
    backgroundColor: 'rgba(12,16,23,0.72)',
    color: '#E8EDF7',
    paddingHorizontal: 10,
    paddingVertical: 9,
    fontSize: 13,
  },
  textArea: { minHeight: 82, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  industryGroup: { marginTop: 8, gap: 6 },
  industryGroupTitle: { fontSize: 12, fontWeight: '800', color: '#C7D7FF' },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(122,228,255,0.35)',
    backgroundColor: 'rgba(122,228,255,0.12)',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  chipActive: {
    borderColor: 'rgba(125,211,252,0.75)',
    backgroundColor: 'rgba(59,130,246,0.25)',
  },
  chipText: { fontSize: 11, fontWeight: '700', color: '#D4E9FF' },
  chipTextActive: { color: '#F4F7FF' },
  submitBtn: {
    marginTop: 8,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(159,183,255,0.42)',
    backgroundColor: 'rgba(61,90,254,0.18)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: { fontSize: 13, fontWeight: '800', color: '#DCE8FF' },
  privacyBlock: {
    marginTop: 6,
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(232,237,247,0.12)',
    backgroundColor: 'rgba(12,16,23,0.64)',
    padding: 10,
  },
  privacyTitle: { fontSize: 12, fontWeight: '800', color: '#E8EDF7' },
  privacyCopy: { fontSize: 12, lineHeight: 17, color: 'rgba(232,237,247,0.7)' },
  consentRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(159,183,255,0.52)',
    backgroundColor: 'rgba(20,27,40,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    borderColor: '#7AE4FF',
    backgroundColor: '#7AE4FF',
  },
  consentText: { flex: 1, fontSize: 12, color: '#DCE8FF' },
  consentError: { fontSize: 12, color: '#FCA5A5' },
  submitErrorText: { fontSize: 12, color: '#FCA5A5' },
  previewTitle: { marginTop: 4, fontSize: 13, fontWeight: '800', color: '#E8EDF7' },
  previewLine: { fontSize: 12, color: 'rgba(232,237,247,0.76)' },
  actionRow: { gap: 8, marginTop: 2 },
  actionBtn: {
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(159,183,255,0.42)',
    backgroundColor: 'rgba(61,90,254,0.18)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  actionBtnText: { fontSize: 13, fontWeight: '800', color: '#DCE8FF' },
});
