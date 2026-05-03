/** Demo rows for B2B consoles — replace with Firestore / ledger reads when wired. */

export type VoiceAiCallHandledRow = {
  readonly id: string;
  readonly startedAtLabel: string;
  readonly durationMin: number;
  readonly intent: string;
  readonly transcriptSnippet: string;
  readonly recordingUriMock: string | null;
};

export const VOICE_RECEPTIONIST_DEMO_HANDLED: readonly VoiceAiCallHandledRow[] = [
  {
    id: 'vr-001',
    startedAtLabel: 'Hôm nay 09:12',
    durationMin: 4,
    intent: 'Booking',
    transcriptSnippet:
      'Khách: “Cho mình đặt gel chiều nay khoảng 15h.” — AI: xác nhận slot nháp, gửi SMS nhắc cho chủ tiệm.',
    recordingUriMock: 'mock://voice-ai/rec-001.webm',
  },
  {
    id: 'vr-002',
    startedAtLabel: 'Hôm qua 18:40',
    durationMin: 7,
    intent: 'Wholesale Order',
    transcriptSnippet:
      'Khách: “Mình cần 3 thùng ly nhựa giao sáng mai.” — AI: ghi SKU + số lượng, chuyển hàng chờ duyệt B2B.',
    recordingUriMock: 'mock://voice-ai/rec-002.webm',
  },
  {
    id: 'vr-003',
    startedAtLabel: 'Hôm qua 11:05',
    durationMin: 3,
    intent: 'Room Reservation',
    transcriptSnippet:
      'Khách: “Còn phòng đôi cuối tuần không?” — AI: kiểm tra lịch phòng demo, giữ chỗ chờ xác nhận.',
    recordingUriMock: null,
  },
] as const;
