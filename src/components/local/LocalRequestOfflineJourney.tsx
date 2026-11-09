import { useState, type ReactElement } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { useTranslation } from '../../i18n';

/** Presentation stages only. They are not Local Request domain statuses. */
type OfflinePhase = 'DRAFT_LOCAL' | 'REVIEW_LOCAL' | 'CONFIRMED_LOCALLY_NOT_SUBMITTED';

const CAPABILITY = 'FIXER_HIRE' as const;

const SERVICE_OPTIONS = [
  {
    id: 'light-electrical',
    vi: 'Điện nhẹ (ví dụ)',
    en: 'Light electrical (example)',
    fixture:
      'Bóng đèn phòng khách mẫu không sáng. Đây là ví dụ tổng hợp, không phải sự cố khí gas hay điện nguy hiểm.',
  },
  {
    id: 'furniture',
    vi: 'Lắp nội thất (ví dụ)',
    en: 'Furniture assembly (example)',
    fixture:
      'Ghế mẫu trong phòng khách bị tháo rời và cần lắp lại. Đây là ví dụ tổng hợp, không phải việc điện hay nước.',
  },
  {
    id: 'household-water',
    vi: 'Nước sinh hoạt nhỏ (ví dụ)',
    en: 'Minor household water (example)',
    fixture:
      'Vòi nước mẫu trong bếp nhỏ giọt. Đây là ví dụ tổng hợp, không phải sự cố ngập hay điện.',
  },
] as const;

const SYNTHETIC_DESCRIPTION = SERVICE_OPTIONS[0].fixture;
const FIXTURE_DESCRIPTIONS = new Set<string>(SERVICE_OPTIONS.map((option) => option.fixture));

const STEP_COPY = {
  DRAFT_LOCAL: { vi: 'Bước 1/3 — Mô tả công việc', en: 'Step 1/3 — Describe the work' },
  REVIEW_LOCAL: { vi: 'Bước 2/3 — Kiểm tra bản nháp', en: 'Step 2/3 — Review the draft' },
  CONFIRMED_LOCALLY_NOT_SUBMITTED: { vi: 'Bước 3/3 — Hoàn tất bản nháp', en: 'Step 3/3 — Draft complete' },
} as const;

const LOCALITY_OPTIONS = [
  { id: 'sample-block', vi: 'Khu phố mẫu', en: 'Sample neighborhood' },
  { id: 'sample-tower', vi: 'Chung cư mẫu', en: 'Sample apartment block' },
] as const;

const TIME_OPTIONS = [
  { id: 'tomorrow-morning', vi: 'Sáng ngày mai (ví dụ)', en: 'Tomorrow morning (example)' },
  { id: 'tomorrow-afternoon', vi: 'Chiều ngày mai (ví dụ)', en: 'Tomorrow afternoon (example)' },
] as const;

type OptionId<T extends readonly { id: string }[]> = T[number]['id'];

type LocalRequestOfflineJourneyProps = {
  visible: boolean;
  onClose: () => void;
};

export function LocalRequestOfflineJourney({
  visible,
  onClose,
}: LocalRequestOfflineJourneyProps): ReactElement {
  const { i18n } = useTranslation();
  const english = (i18n.resolvedLanguage ?? i18n.language ?? '').toLowerCase().startsWith('en');
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const sidePad = windowWidth < 400 ? 12 : 20;
  const cardMaxHeight = Math.max(320, windowHeight - sidePad * 2);
  const [headerHeight, setHeaderHeight] = useState(150);
  const [footerHeight, setFooterHeight] = useState(76);
  const scrollMaxHeight = Math.max(120, cardMaxHeight - headerHeight - footerHeight - 32 - 14);
  const stackReviewSecondary = windowWidth < 400;
  const stackConfirmation = windowWidth < 400;
  const [phase, setPhase] = useState<OfflinePhase>('DRAFT_LOCAL');
  const [serviceId, setServiceId] = useState<OptionId<typeof SERVICE_OPTIONS>>(SERVICE_OPTIONS[0].id);
  const [localityId, setLocalityId] = useState<OptionId<typeof LOCALITY_OPTIONS>>(LOCALITY_OPTIONS[0].id);
  const [timeId, setTimeId] = useState<OptionId<typeof TIME_OPTIONS>>(TIME_OPTIONS[0].id);
  const [description, setDescription] = useState<string>(SYNTHETIC_DESCRIPTION);
  const [draftNotice, setDraftNotice] = useState<string | null>(null);

  const labelOf = (options: readonly { id: string; vi: string; en: string }[], id: string) => {
    const match = options.find((option) => option.id === id);
    return english ? match?.en ?? '' : match?.vi ?? '';
  };
  const serviceLabel = labelOf(SERVICE_OPTIONS, serviceId);
  const localityLabel = labelOf(LOCALITY_OPTIONS, localityId);
  const timeLabel = labelOf(TIME_OPTIONS, timeId);
  const stepCopy = STEP_COPY[phase][english ? 'en' : 'vi'];

  const selectService = (id: OptionId<typeof SERVICE_OPTIONS>) => {
    setServiceId(id);
    setDescription((current) => {
      if (current.trim().length === 0 || FIXTURE_DESCRIPTIONS.has(current)) {
        return SERVICE_OPTIONS.find((option) => option.id === id)?.fixture ?? current;
      }
      return current;
    });
    setDraftNotice(null);
  };

  const resetToInitialDraft = () => {
    setServiceId(SERVICE_OPTIONS[0].id);
    setLocalityId(LOCALITY_OPTIONS[0].id);
    setTimeId(TIME_OPTIONS[0].id);
    setDescription(SYNTHETIC_DESCRIPTION);
    setPhase('DRAFT_LOCAL');
    setDraftNotice(null);
  };

  const openReview = () => {
    if (description.trim().length === 0) {
      setDraftNotice(
        english
          ? 'Enter a service description before review.'
          : 'Nhập mô tả việc trước khi xem lại.'
      );
      return;
    }
    setDraftNotice(null);
    setPhase('REVIEW_LOCAL');
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.backdrop, { padding: sidePad }]}>
        <Text
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no"
          style={styles.retainedCode}
        >
          {`${CAPABILITY} ${phase} Đã xác nhận bản nháp. Yêu cầu chưa được gửi.`}
        </Text>
        <View style={[styles.card, { maxHeight: cardMaxHeight }]} accessibilityViewIsModal>
          <View onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}>
            <Text style={styles.kicker}>{english ? 'Draft preview' : 'Bản xem trước'}</Text>
            <View style={styles.titleRow}>
              <HandymanMark />
              <View style={styles.titleCopy}>
                <Text style={styles.title}>Gọi thợ sửa chữa</Text>
                <Text style={styles.step}>{stepCopy}</Text>
              </View>
            </View>
            <StepProgress phase={phase} />
            <Text style={styles.demoNote}>
              {english
                ? 'In-memory demonstration only. Nothing is sent, saved, or shown to a tradesperson.'
                : 'Bản thử trên máy. Không gửi, không lưu, không chuyển tới thợ.'}
            </Text>
          </View>

          {phase === 'DRAFT_LOCAL' ? (
            <ScrollView
              style={[styles.body, { maxHeight: scrollMaxHeight }]}
              keyboardShouldPersistTaps="handled"
            >
              <ChoiceGroup
                label={english ? 'What should the tradesperson help with?' : 'Bạn cần thợ hỗ trợ việc gì?'}
                options={SERVICE_OPTIONS}
                selectedId={serviceId}
                english={english}
                onSelect={selectService}
              />
              <ChoiceGroup
                label={english ? 'Expected area' : 'Khu vực dự kiến'}
                options={LOCALITY_OPTIONS}
                selectedId={localityId}
                english={english}
                onSelect={setLocalityId}
              />
              <ChoiceGroup
                label={english ? 'Preferred time' : 'Thời gian mong muốn'}
                options={TIME_OPTIONS}
                selectedId={timeId}
                english={english}
                onSelect={setTimeId}
              />
              <Text style={styles.label}>{english ? 'Service description' : 'Mô tả việc'}</Text>
              <TextInput
                value={description}
                onChangeText={(value) => {
                  setDescription(value);
                  if (value.trim().length > 0) {
                    setDraftNotice(null);
                  }
                }}
                multiline
                style={styles.input}
                placeholderTextColor="rgba(186, 214, 232, 0.45)"
                accessibilityLabel={english ? 'Service description' : 'Mô tả việc'}
              />
              {draftNotice ? <Text style={styles.draftNotice}>{draftNotice}</Text> : null}
            </ScrollView>
          ) : null}

          {phase === 'REVIEW_LOCAL' ? (
            <ScrollView style={[styles.body, { maxHeight: scrollMaxHeight }]}>
              <Text style={styles.label}>{english ? 'Check this draft' : 'Kiểm tra bản nháp'}</Text>
              <SummaryLine label={english ? 'Work' : 'Việc cần hỗ trợ'} value={serviceLabel} />
              <SummaryLine label={english ? 'Expected area' : 'Khu vực dự kiến'} value={localityLabel} />
              <SummaryLine label={english ? 'Preferred time' : 'Thời gian mong muốn'} value={timeLabel} />
              <Text style={styles.draftBody}>{description}</Text>
            </ScrollView>
          ) : null}

          {phase === 'CONFIRMED_LOCALLY_NOT_SUBMITTED' ? (
            <ScrollView style={[styles.body, { maxHeight: scrollMaxHeight }]}>
              <View style={styles.completeIntro}>
                <CompletionMark />
                <Text style={styles.confirmed} accessibilityRole="header">
                  {'Đã xác nhận bản nháp.\nYêu cầu chưa được gửi.'}
                </Text>
              </View>
              <SummaryLine label={english ? 'Work' : 'Việc cần hỗ trợ'} value={serviceLabel} />
              <SummaryLine label={english ? 'Expected area' : 'Khu vực dự kiến'} value={localityLabel} />
              <SummaryLine label={english ? 'Preferred time' : 'Thời gian mong muốn'} value={timeLabel} />
              <Text style={styles.draftBody}>{description}</Text>
              {english ? (
                <Text style={styles.confirmedEn}>
                  {'Draft confirmed on this device. The request has not been sent.'}
                </Text>
              ) : null}
              <Text style={styles.demoNote}>
                {english
                  ? 'No server request id. No merchant or provider received this draft.'
                  : 'Không có mã yêu cầu. Không thợ và không đơn vị nào nhận bản nháp này.'}
              </Text>
            </ScrollView>
          ) : null}

          <View
            onLayout={(event) => setFooterHeight(event.nativeEvent.layout.height)}
            style={[
              phase === 'REVIEW_LOCAL' ? styles.reviewActions : styles.actions,
              phase === 'CONFIRMED_LOCALLY_NOT_SUBMITTED' && stackConfirmation ? styles.actionsStack : null,
            ]}
          >
            {phase === 'DRAFT_LOCAL' ? (
              <>
                <Pressable accessibilityRole="button" onPress={onClose} style={styles.ghostBtn}>
                  <Text style={styles.ghostBtnText}>{english ? 'Close' : 'Đóng'}</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={openReview} style={styles.primaryBtn}>
                  <Text style={styles.primaryBtnText}>{english ? 'Review draft' : 'Xem lại bản nháp'}</Text>
                </Pressable>
              </>
            ) : null}
            {phase === 'REVIEW_LOCAL' ? (
              <>
                <View style={[styles.reviewSecondaryRow, stackReviewSecondary && styles.reviewSecondaryStack]}>
                  <Pressable accessibilityRole="button" onPress={onClose} style={[styles.ghostBtn, styles.reviewSecondaryBtn]}>
                    <Text style={styles.reviewSecondaryText}>{english ? 'Close' : 'Đóng'}</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setPhase('DRAFT_LOCAL')}
                    style={[styles.ghostBtn, styles.reviewSecondaryBtn]}
                  >
                    <Text style={styles.reviewSecondaryText}>{english ? 'Edit draft' : 'Sửa bản nháp'}</Text>
                  </Pressable>
                </View>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setPhase('CONFIRMED_LOCALLY_NOT_SUBMITTED')}
                  style={[styles.primaryBtn, styles.reviewConfirmBtn]}
                >
                  <Text style={styles.reviewConfirmText}>
                    {english ? 'Confirm locally' : 'Xác nhận trên máy'}
                  </Text>
                </Pressable>
              </>
            ) : null}
            {phase === 'CONFIRMED_LOCALLY_NOT_SUBMITTED' ? (
              <>
                <Pressable
                  accessibilityRole="button"
                  onPress={resetToInitialDraft}
                  style={[styles.ghostBtn, stackConfirmation && styles.stackedAction]}
                >
                  <Text style={styles.ghostBtnText}>{english ? 'New draft' : 'Tạo bản nháp khác'}</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={onClose}
                  style={[styles.primaryBtn, stackConfirmation && styles.stackedAction]}
                >
                  <Text style={styles.primaryBtnText}>{english ? 'Return to Local' : 'Về Local'}</Text>
                </Pressable>
              </>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function HandymanMark(): ReactElement {
  return (
    <View style={styles.mark} accessibilityElementsHidden>
      <View style={styles.markHead} />
      <View style={styles.markGrip} />
    </View>
  );
}

function CompletionMark(): ReactElement {
  return (
    <View style={styles.completeBadge} accessibilityElementsHidden>
      <Text style={styles.completeGlyph}>✓</Text>
    </View>
  );
}

function StepProgress({ phase }: Readonly<{ phase: OfflinePhase }>): ReactElement {
  const steps: readonly OfflinePhase[] = ['DRAFT_LOCAL', 'REVIEW_LOCAL', 'CONFIRMED_LOCALLY_NOT_SUBMITTED'];
  const current = steps.indexOf(phase);
  return (
    <View style={styles.progress} accessibilityRole="progressbar">
      {steps.map((step, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <View key={step} style={[styles.progressItem, index < steps.length - 1 && styles.progressItemGrow]}>
            <View
              style={[
                styles.progressDot,
                done && styles.progressDotDone,
                active && styles.progressDotActive,
              ]}
            >
              <Text style={[styles.progressIndex, (done || active) && styles.progressIndexOn]}>{index + 1}</Text>
            </View>
            {index < steps.length - 1 ? (
              <View style={[styles.progressLine, index < current && styles.progressLineOn]} />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

function ChoiceGroup<T extends string>({
  label,
  options,
  selectedId,
  english,
  onSelect,
}: Readonly<{
  label: string;
  options: readonly { id: T; vi: string; en: string }[];
  selectedId: T;
  english: boolean;
  onSelect: (id: T) => void;
}>): ReactElement {
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.choices}>
        {options.map((option) => {
          const selected = option.id === selectedId;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onSelect(option.id)}
              style={[styles.choice, selected && styles.choiceSelected]}
            >
              <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>
                {english ? option.en : option.vi}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function SummaryLine({ label, value }: Readonly<{ label: string; value: string }>): ReactElement {
  return (
    <Text style={styles.summaryLine}>
      <Text style={styles.summaryLabel}>{label}: </Text>
      {value}
    </Text>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(3, 8, 18, 0.72)',
    justifyContent: 'center',
    padding: 20,
  },
  retainedCode: {
    position: 'absolute',
    left: -10000,
    top: 0,
    width: 1,
    height: 1,
    opacity: 0,
  },
  card: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 124, 0.42)',
    backgroundColor: '#0A1A33',
    padding: 16,
    overflow: 'hidden',
    shadowColor: '#0C7BFF',
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  kicker: {
    color: '#E7C27A',
    fontSize: 11,
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  titleRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleCopy: { flex: 1, minWidth: 0 },
  title: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '700',
  },
  step: {
    marginTop: 2,
    color: '#D6E8FF',
    fontSize: 13,
    fontWeight: '600',
  },
  mark: {
    width: 36,
    height: 36,
    marginRight: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 124, 0.85)',
    backgroundColor: 'rgba(12, 123, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markHead: {
    width: 18,
    height: 5,
    borderRadius: 2,
    backgroundColor: '#E7C27A',
  },
  markGrip: {
    width: 4,
    height: 11,
    marginTop: -1,
    marginRight: 9,
    borderRadius: 2,
    backgroundColor: '#7DD3FC',
  },
  progress: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressItemGrow: { flex: 1 },
  progressDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(186, 214, 232, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(8, 18, 32, 0.65)',
  },
  progressDotDone: {
    borderColor: '#0C7BFF',
    backgroundColor: 'rgba(12, 123, 255, 0.35)',
  },
  progressDotActive: {
    borderColor: '#E7C27A',
    backgroundColor: 'rgba(12, 123, 255, 0.55)',
  },
  progressIndex: {
    color: 'rgba(226, 232, 240, 0.55)',
    fontSize: 11,
    fontWeight: '700',
  },
  progressIndexOn: { color: '#F8FAFC' },
  progressLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 6,
    borderRadius: 1,
    backgroundColor: 'rgba(186, 214, 232, 0.22)',
  },
  progressLineOn: { backgroundColor: '#0C7BFF' },
  completeIntro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  completeBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E7C27A',
    backgroundColor: 'rgba(12, 123, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeGlyph: {
    color: '#E7C27A',
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 26,
  },
  demoNote: {
    marginTop: 8,
    color: 'rgba(226, 232, 240, 0.78)',
    fontSize: 13,
    lineHeight: 18,
  },
  body: { marginTop: 14 },
  group: { marginBottom: 12 },
  label: {
    color: '#BAE6FD',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(125, 211, 252, 0.28)',
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(8, 18, 32, 0.9)',
  },
  choiceSelected: {
    borderColor: '#E7C27A',
    backgroundColor: 'rgba(12, 123, 255, 0.28)',
  },
  choiceText: { color: '#E2E8F0', fontSize: 13, fontWeight: '600' },
  choiceTextSelected: { color: '#F8FAFC' },
  input: {
    minHeight: 110,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(125, 211, 252, 0.28)',
    backgroundColor: 'rgba(8, 18, 32, 0.9)',
    color: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: 'top',
    fontSize: 15,
  },
  draftBody: {
    color: '#F8FAFC',
    fontSize: 16,
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 8,
  },
  summaryLine: {
    color: '#F8FAFC',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  summaryLabel: { color: '#BAE6FD', fontWeight: '700' },
  draftNotice: {
    marginTop: 8,
    color: '#FDE68A',
    fontSize: 13,
    lineHeight: 18,
  },
  confirmed: {
    flex: 1,
    minWidth: 0,
    color: '#F8FAFC',
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
  },
  confirmedEn: {
    marginTop: 8,
    color: '#BAE6FD',
    fontSize: 15,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
  },
  actionsStack: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  stackedAction: {
    flexGrow: 0,
    flexBasis: 'auto',
    width: '100%',
    alignSelf: 'stretch',
  },
  reviewActions: {
    marginTop: 16,
    gap: 8,
  },
  reviewSecondaryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  reviewSecondaryStack: {
    flexDirection: 'column',
  },
  reviewSecondaryBtn: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  reviewConfirmBtn: {
    alignSelf: 'stretch',
  },
  reviewSecondaryText: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  reviewConfirmText: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  ghostBtn: {
    minHeight: 44,
    flexGrow: 1,
    flexBasis: 0,
    minWidth: 120,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.35)',
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostBtnText: { color: '#E2E8F0', fontSize: 14, fontWeight: '600' },
  primaryBtn: {
    minHeight: 44,
    flexGrow: 1,
    flexBasis: 0,
    minWidth: 120,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(231, 194, 122, 0.72)',
    backgroundColor: '#0C7BFF',
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { color: '#F8FAFC', fontSize: 14, fontWeight: '700' },
});
