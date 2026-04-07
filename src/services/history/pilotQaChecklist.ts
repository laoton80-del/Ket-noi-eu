export type PilotQaCase = {
  id: string;
  platform: 'android' | 'iphone' | 'both';
  area: string;
  scenario: string;
  expected: string;
};

export const PILOT_QA_CHECKLIST: PilotQaCase[] = [
  { id: 'qa-01', platform: 'both', area: 'App', scenario: 'Mở app lần đầu', expected: 'Ghi event app_open và không crash.' },
  { id: 'qa-02', platform: 'android', area: 'Network', scenario: 'Mạng yếu 2G trong Live Interpreter', expected: 'Hiện fallback/retry rõ ràng, không treo session.' },
  { id: 'qa-03', platform: 'iphone', area: 'Wallet', scenario: 'Không đủ Credits rồi gọi Leona', expected: 'Hiện cảnh báo + chuyển nạp Credits hợp lệ.' },
  { id: 'qa-04', platform: 'both', area: 'Wallet', scenario: 'Đủ Credits và gọi Leona', expected: 'Cuộc gọi đi tiếp, trừ Credits đúng một lần.' },
  { id: 'qa-05', platform: 'both', area: 'Vault OCR', scenario: 'Ảnh rõ giấy tờ', expected: 'OCR success + lưu gợi ý + event ocr_success.' },
  { id: 'qa-06', platform: 'both', area: 'Vault OCR', scenario: 'Ảnh mờ/thiếu sáng', expected: 'OCR fail copy bình tĩnh + retry + event ocr_fail.' },
  { id: 'qa-07', platform: 'both', area: 'Interpreter', scenario: 'Im lặng lâu', expected: 'Tự kết thúc phiên và hiển thị trạng thái rõ.' },
  { id: 'qa-08', platform: 'both', area: 'Interpreter', scenario: 'Nói nhanh + trộn ngôn ngữ', expected: 'Không crash, có lỗi mềm khi AI fail.' },
  { id: 'qa-09', platform: 'both', area: 'Payment', scenario: 'Ngắt mạng lúc xác minh topup', expected: 'Hiển thị retry path, không cộng Credits sai.' },
  { id: 'qa-10', platform: 'both', area: 'Leona', scenario: 'Call path thất bại', expected: 'Có fallback copy, retry, và ghi history failed.' },
];
