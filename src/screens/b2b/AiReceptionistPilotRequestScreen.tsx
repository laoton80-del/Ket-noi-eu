import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState, type ReactElement } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../navigation/routes';
import { isRestApiConfigured } from '../../services/apiClient';
import {
  submitAiReceptionistPilotLead,
  type AiReceptionistLeadDesiredAutomation,
  type AiReceptionistLeadIndustry,
} from '../../services/api/aiReceptionistLeadApi';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Industry = 'nail_salon' | 'spa' | 'restaurant' | 'barber' | 'other';
type Automation = 'intake_only' | 'booking_request' | 'auto_booking_later' | 'multi_language_support';

const INDUSTRY_OPTIONS: readonly Readonly<{ id: Industry; label: string }>[] = [
  { id: 'nail_salon', label: 'Nail salon' },
  { id: 'spa', label: 'Spa' },
  { id: 'restaurant', label: 'Restaurant' },
  { id: 'barber', label: 'Barber' },
  { id: 'other', label: 'Other' },
];

const AUTOMATION_OPTIONS: readonly Readonly<{ id: Automation; label: string }>[] = [
  { id: 'intake_only', label: 'Intake only' },
  { id: 'booking_request', label: 'Booking request' },
  { id: 'auto_booking_later', label: 'Auto booking later' },
  { id: 'multi_language_support', label: 'Multi-language support' },
];

export function AiReceptionistPilotRequestScreen(): ReactElement {
  const navigation = useNavigation<Nav>();
  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState<Industry>('nail_salon');
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
  const [consentError, setConsentError] = useState<string | null>(null);
  const [isSubmittedLocalDraft, setIsSubmittedLocalDraft] = useState(false);
  const [submittedStatus, setSubmittedStatus] = useState<'submitted_for_manual_review' | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const industryLabel = useMemo(
    () => INDUSTRY_OPTIONS.find((item) => item.id === industry)?.label ?? 'Unknown',
    [industry]
  );
  const desiredAutomationLabels = useMemo(() => {
    const labels = AUTOMATION_OPTIONS.filter((item) => desiredAutomation.includes(item.id)).map((item) => item.label);
    return labels.length > 0 ? labels.join(', ') : 'Not selected';
  }, [desiredAutomation]);

  const toggleAutomation = (id: Automation): void => {
    setDesiredAutomation((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const industryToApi: Record<Industry, AiReceptionistLeadIndustry> = {
    nail_salon: 'Nail salon',
    spa: 'Spa',
    restaurant: 'Restaurant',
    barber: 'Barber',
    other: 'Other',
  };

  const automationToApi: Record<Automation, AiReceptionistLeadDesiredAutomation> = {
    intake_only: 'Intake only',
    booking_request: 'Booking request',
    auto_booking_later: 'Auto booking later',
    multi_language_support: 'Multi-language support',
  };

  const handleSubmit = async (): Promise<void> => {
    if (!consentAccepted) {
      setConsentError('Please accept consent to submit this pilot request.');
      return;
    }
    setConsentError(null);
    setSubmitError(null);
    setSubmittedStatus(null);

    const normalizedPhone = contactPhone.trim();
    const normalizedEmail = contactEmail.trim();
    if (!normalizedPhone && !normalizedEmail) {
      setSubmitError('Please provide at least contact phone or contact email.');
      return;
    }

    const normalizedMissedCalls = estimatedMissedCallsPerDay.trim();
    if (!/^\d{1,4}$/.test(normalizedMissedCalls)) {
      setSubmitError('Estimated missed calls per day must be a valid number.');
      return;
    }

    if (!isRestApiConfigured()) {
      setIsSubmittedLocalDraft(true);
      setSubmitError('Pilot request relay is not configured yet. Your draft remains local.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitAiReceptionistPilotLead({
        businessName: businessName.trim(),
        industry: industryToApi[industry],
        city: city.trim(),
        country: country.trim(),
        contactName: contactName.trim(),
        contactPhone: normalizedPhone || undefined,
        contactEmail: normalizedEmail || undefined,
        languagesNeeded: languagesNeeded.trim(),
        estimatedMissedCallsPerDay: normalizedMissedCalls,
        desiredAutomation: desiredAutomation.map((item) => automationToApi[item]),
        preferredPilotDate: preferredPilotDate.trim() || undefined,
        notes: notes.trim() || undefined,
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
        setSubmitError('Pilot request relay is not configured yet. Your draft remains local.');
      } else if (result.status === 400) {
        setSubmitError('Please review your pilot request fields and try again.');
      } else if (result.status === 401) {
        setSubmitError('Your session is invalid or expired. Please sign in again.');
      } else if (result.unreachable) {
        setSubmitError('Could not send request. Your draft is still local.');
      } else {
        setSubmitError('Could not send request. Your draft is still local.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <Text style={styles.kicker}>B2B AI Receptionist</Text>
            <Text style={styles.title}>Request AI Receptionist Pilot</Text>
          </View>
        </View>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>Pilot request</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Safety copy</Text>
          <Text style={styles.cardBody}>This does not activate production phone automation.</Text>
          <Text style={styles.cardBody}>No payment is taken.</Text>
          <Text style={styles.cardBody}>VIONA team must review before pilot activation.</Text>
          <Text style={styles.cardBody}>AI may make mistakes; merchant confirmation is required.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pilot request form</Text>

          <Text style={styles.label}>Business name</Text>
          <TextInput value={businessName} onChangeText={setBusinessName} style={styles.input} placeholder="Business name" placeholderTextColor="#8EA0BC" />

          <Text style={styles.label}>Industry</Text>
          <View style={styles.chipRow}>
            {INDUSTRY_OPTIONS.map((item) => {
              const active = item.id === industry;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setIndustry(item.id)}
                  style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && { opacity: 0.88 }]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>City</Text>
          <TextInput value={city} onChangeText={setCity} style={styles.input} placeholder="City" placeholderTextColor="#8EA0BC" />
          <Text style={styles.label}>Country</Text>
          <TextInput value={country} onChangeText={setCountry} style={styles.input} placeholder="Country" placeholderTextColor="#8EA0BC" />

          <Text style={styles.label}>Contact name</Text>
          <TextInput value={contactName} onChangeText={setContactName} style={styles.input} placeholder="Contact name" placeholderTextColor="#8EA0BC" />
          <Text style={styles.label}>Contact phone</Text>
          <TextInput
            value={contactPhone}
            onChangeText={setContactPhone}
            style={styles.input}
            placeholder="Contact phone"
            placeholderTextColor="#8EA0BC"
            keyboardType="phone-pad"
          />
          <Text style={styles.label}>Contact email</Text>
          <TextInput
            value={contactEmail}
            onChangeText={setContactEmail}
            style={styles.input}
            placeholder="Contact email"
            placeholderTextColor="#8EA0BC"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Languages needed</Text>
          <TextInput
            value={languagesNeeded}
            onChangeText={setLanguagesNeeded}
            style={styles.input}
            placeholder="Vietnamese, English, Czech..."
            placeholderTextColor="#8EA0BC"
          />

          <Text style={styles.label}>Estimated missed calls per day</Text>
          <TextInput
            value={estimatedMissedCallsPerDay}
            onChangeText={setEstimatedMissedCallsPerDay}
            style={styles.input}
            placeholder="e.g. 8"
            placeholderTextColor="#8EA0BC"
            keyboardType="number-pad"
          />

          <Text style={styles.label}>Desired automation</Text>
          <View style={styles.chipRow}>
            {AUTOMATION_OPTIONS.map((item) => {
              const active = desiredAutomation.includes(item.id);
              return (
                <Pressable
                  key={item.id}
                  onPress={() => toggleAutomation(item.id)}
                  style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && { opacity: 0.88 }]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>Preferred pilot date</Text>
          <TextInput
            value={preferredPilotDate}
            onChangeText={setPreferredPilotDate}
            style={styles.input}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#8EA0BC"
          />

          <Text style={styles.label}>Notes</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            style={[styles.input, styles.textArea]}
            placeholder="Additional context"
            placeholderTextColor="#8EA0BC"
            multiline
          />

          <View style={styles.privacyBlock}>
            <Text style={styles.privacyTitle}>Privacy and consent</Text>
            <Text style={styles.privacyCopy}>
              By submitting this pilot request, you agree that VIONA may contact you regarding AI Receptionist pilot
              evaluation.
            </Text>
            <Text style={styles.privacyCopy}>This request does not activate production AI phone automation.</Text>
            <Text style={styles.privacyCopy}>No payment is taken.</Text>
            <Text style={styles.privacyCopy}>No booking is created.</Text>
            <Text style={styles.privacyCopy}>No real AI phone call is made from this request.</Text>
            <Text style={styles.privacyCopy}>
              Your data is used only to evaluate pilot eligibility and onboarding readiness.
            </Text>
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
              accessibilityLabel="Consent accepted"
            >
              <View style={[styles.checkbox, consentAccepted && styles.checkboxChecked]}>
                {consentAccepted ? <Ionicons name="checkmark" size={13} color="#061018" /> : null}
              </View>
              <Text style={styles.consentText}>I agree to pilot lead evaluation and privacy terms.</Text>
            </Pressable>
            {consentError ? <Text style={styles.consentError}>{consentError}</Text> : null}
          </View>

          <Pressable
            onPress={() => {
              void handleSubmit();
            }}
            disabled={!consentAccepted || isSubmitting}
            style={({ pressed }) => [
              styles.submitBtn,
              (!consentAccepted || isSubmitting) && styles.submitBtnDisabled,
              pressed && { opacity: 0.86 },
            ]}
          >
            <Text style={styles.submitBtnText}>
              {isSubmitting ? 'Sending to VIONA team...' : 'Submit pilot request'}
            </Text>
          </Pressable>
          {submitError ? <Text style={styles.submitErrorText}>{submitError}</Text> : null}
        </View>

        {submittedStatus ? (
          <View style={styles.cardConfirm}>
            <Text style={styles.cardTitle}>Pilot request sent for manual review.</Text>
            <Text style={styles.cardBody}>Status: {submittedStatus}</Text>
            <Text style={styles.cardBody}>
              VIONA team will review your request before any pilot activation.
            </Text>
            <Text style={styles.previewTitle}>Submitted preview</Text>
            <Text style={styles.previewLine}>Business: {businessName || 'N/A'}</Text>
            <Text style={styles.previewLine}>Industry: {industryLabel}</Text>
            <Text style={styles.previewLine}>City/Country: {(city || 'N/A') + ' / ' + (country || 'N/A')}</Text>
            <Text style={styles.previewLine}>Contact: {contactName || 'N/A'}</Text>
            <Text style={styles.previewLine}>Phone: {contactPhone || 'N/A'}</Text>
            <Text style={styles.previewLine}>Email: {contactEmail || 'N/A'}</Text>
            <Text style={styles.previewLine}>Languages: {languagesNeeded || 'N/A'}</Text>
            <Text style={styles.previewLine}>Missed calls/day: {estimatedMissedCallsPerDay || 'N/A'}</Text>
            <Text style={styles.previewLine}>Desired automation: {desiredAutomationLabels}</Text>
            <Text style={styles.previewLine}>Preferred pilot date: {preferredPilotDate || 'N/A'}</Text>
            <Text style={styles.previewLine}>Notes: {notes || 'N/A'}</Text>
          </View>
        ) : isSubmittedLocalDraft ? (
          <View style={styles.cardConfirm}>
            <Text style={styles.cardTitle}>Pilot request draft created</Text>
            <Text style={styles.cardBody}>Consent was captured for this request attempt.</Text>
            <Text style={styles.cardBody}>Could not send request. Your draft is still local.</Text>
            <Text style={styles.cardBody}>No pilot approval or activation happened from this local draft.</Text>
            <Text style={styles.previewTitle}>Draft preview</Text>
            <Text style={styles.previewLine}>Business: {businessName || 'N/A'}</Text>
            <Text style={styles.previewLine}>Industry: {industryLabel}</Text>
            <Text style={styles.previewLine}>City/Country: {(city || 'N/A') + ' / ' + (country || 'N/A')}</Text>
            <Text style={styles.previewLine}>Contact: {contactName || 'N/A'}</Text>
            <Text style={styles.previewLine}>Phone: {contactPhone || 'N/A'}</Text>
            <Text style={styles.previewLine}>Email: {contactEmail || 'N/A'}</Text>
            <Text style={styles.previewLine}>Languages: {languagesNeeded || 'N/A'}</Text>
            <Text style={styles.previewLine}>Missed calls/day: {estimatedMissedCallsPerDay || 'N/A'}</Text>
            <Text style={styles.previewLine}>Desired automation: {desiredAutomationLabels}</Text>
            <Text style={styles.previewLine}>Preferred pilot date: {preferredPilotDate || 'N/A'}</Text>
            <Text style={styles.previewLine}>Notes: {notes || 'N/A'}</Text>
          </View>
        ) : null}

        <View style={styles.actionRow}>
          <Pressable onPress={() => navigation.navigate('AiReceptionistDemoSimulator')} style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.86 }]}>
            <Text style={styles.actionBtnText}>Back to demo</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('AiReceptionistSetupChecklist')} style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.86 }]}>
            <Text style={styles.actionBtnText}>Configure checklist</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('MerchantDashboard')} style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.86 }]}>
            <Text style={styles.actionBtnText}>Back to merchant dashboard</Text>
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
  chipText: { fontSize: 12, fontWeight: '700', color: '#D4E9FF' },
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
