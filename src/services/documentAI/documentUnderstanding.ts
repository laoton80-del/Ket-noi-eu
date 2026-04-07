import { toIsoDateFromDdMmYyyy } from '../../components/DocumentScanner';

export type DocumentMeaningType =
  | 'visa_residency'
  | 'passport'
  | 'labor_contract'
  | 'hospital_appointment'
  | 'school_notice'
  | 'utility_bill'
  | 'unknown';

export type DocumentActionSuggestion = {
  title: string;
  route: 'LeonaCall' | 'LiveInterpreter' | 'Tabs';
  params?: Record<string, unknown>;
};

export type DocumentUnderstandingResult = {
  meaningType: DocumentMeaningType;
  summary: string;
  keyMeaning: string;
  suggestedActions: DocumentActionSuggestion[];
};

function inferMeaning(docTypeRaw: string): DocumentMeaningType {
  const t = docTypeRaw.trim().toLowerCase();
  if (!t) return 'unknown';
  if (t.includes('visa') || t.includes('cư trú') || t.includes('residency')) return 'visa_residency';
  if (t.includes('passport') || t.includes('hộ chiếu') || t.includes('ho chieu')) return 'passport';
  if (t.includes('labor') || t.includes('hợp đồng') || t.includes('hop dong')) return 'labor_contract';
  if (t.includes('hospital') || t.includes('clinic') || t.includes('appointment') || t.includes('khám')) return 'hospital_appointment';
  if (t.includes('school') || t.includes('homework') || t.includes('bài tập') || t.includes('thông báo')) return 'school_notice';
  if (t.includes('bill') || t.includes('invoice') || t.includes('hóa đơn')) return 'utility_bill';
  return 'unknown';
}

function actionsForMeaning(meaning: DocumentMeaningType, expiryDate: string | null): DocumentActionSuggestion[] {
  const iso = toIsoDateFromDdMmYyyy(expiryDate);
  if (meaning === 'hospital_appointment') {
    return [
      {
        title: 'Mở phiên dịch để chuẩn bị trao đổi với bệnh viện',
        route: 'LiveInterpreter',
        params: { guidedEntry: true, scenario: 'doctor' },
      },
      {
        title: 'Nhờ Leona gọi xác nhận lịch khám',
        route: 'LeonaCall',
        params: { prefillRequest: 'Gọi xác nhận lịch khám bệnh giúp tôi.', autoSubmit: false },
      },
    ];
  }
  if (meaning === 'visa_residency' || meaning === 'passport') {
    return [
      {
        title: 'Nhờ Leona gọi hỗ trợ gia hạn ngay',
        route: 'LeonaCall',
        params: {
          prefillRequest: iso ? `Gọi hỗ trợ gia hạn giấy tờ trước ngày ${iso}.` : 'Gọi hỗ trợ gia hạn giấy tờ giúp tôi.',
          autoSubmit: true,
        },
      },
    ];
  }
  if (meaning === 'school_notice') {
    return [
      {
        title: 'Mở phiên dịch để hiểu kỹ thông báo',
        route: 'LiveInterpreter',
        params: { guidedEntry: true, scenario: 'general' },
      },
      {
        title: 'Mở khu học tập để hỗ trợ bé',
        route: 'Tabs',
        params: { screen: 'HocTap' },
      },
    ];
  }
  return [
    {
      title: 'Nhờ Leona gọi xác nhận nội dung tài liệu',
      route: 'LeonaCall',
      params: { prefillRequest: 'Gọi xác nhận nội dung tài liệu giúp tôi.', autoSubmit: false },
    },
  ];
}

export function understandDocument(input: {
  documentType: string;
  expiryDate: string | null;
  confidence: 'high' | 'medium' | 'low';
}): DocumentUnderstandingResult {
  const meaning = inferMeaning(input.documentType);
  const confidenceNote =
    input.confidence === 'high' ? 'Độ tin cậy cao.' : input.confidence === 'medium' ? 'Độ tin cậy trung bình.' : 'Độ tin cậy thấp, cần kiểm tra lại.';
  const keyMeaning =
    meaning === 'hospital_appointment'
      ? 'Đây là giấy tờ liên quan lịch khám / y tế.'
      : meaning === 'visa_residency'
        ? 'Đây là giấy tờ cư trú / visa cần theo dõi hạn.'
        : meaning === 'passport'
          ? 'Đây là hộ chiếu cần theo dõi hạn.'
          : meaning === 'school_notice'
            ? 'Đây là thông báo học tập cho bé.'
            : 'Đây là giấy tờ cần xác nhận thêm nội dung.';
  return {
    meaningType: meaning,
    summary: `${keyMeaning} ${confidenceNote}`,
    keyMeaning,
    suggestedActions: actionsForMeaning(meaning, input.expiryDate),
  };
}
