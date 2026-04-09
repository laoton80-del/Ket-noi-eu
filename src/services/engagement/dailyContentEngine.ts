import type { DailyLoopAction } from './dailyLoopStorage';

export type DailyContentInput = {
  segment: 'adult' | 'child';
  lowCredit: boolean;
  hasUrgentVisa: boolean;
  streakDays: number;
  lastAction: DailyLoopAction;
};

export type DailyContent = {
  suggestion: string;
  quickAction: {
    primaryLabel: string;
    primaryAction: DailyLoopAction;
    secondaryLabel: string;
    secondaryAction: DailyLoopAction;
  };
  reminder: string;
  achievement: string | null;
};

function milestone(streak: number): string | null {
  if (streak >= 21) return 'Huy hiệu: 21 ngày duy trì nhịp học và xử lý việc đều đặn.';
  if (streak >= 7) return 'Huy hiệu: 7 ngày liên tiếp mở app.';
  if (streak >= 3) return 'Tiến bộ tốt: 3 ngày liên tiếp.';
  return null;
}

export function getDailyContent(input: DailyContentInput): DailyContent {
  if (input.hasUrgentVisa) {
    return {
      suggestion: 'Ưu tiên hôm nay: xác nhận lịch gia hạn giấy tờ.',
      quickAction: {
        primaryLabel: 'Gọi hỗ trợ ngay',
        primaryAction: 'call_help',
        secondaryLabel: 'Mở phiên dịch',
        secondaryAction: 'interpreter',
      },
      reminder: input.lowCredit ? 'Số dư thấp — nạp trước để không lỡ lịch.' : 'Hoàn tất cuộc gọi trong hôm nay để giảm rủi ro trễ hạn.',
      achievement: milestone(input.streakDays),
    };
  }

  if (input.segment === 'child') {
    return {
      suggestion: 'Nhiệm vụ nhẹ hôm nay: quét 1 bài tập và giải theo từng bước.',
      quickAction: {
        primaryLabel: 'Quét bài tập',
        primaryAction: 'learning',
        secondaryLabel: 'Mở phiên dịch',
        secondaryAction: 'interpreter',
      },
      reminder: 'Dành 5 phút học mỗi ngày giúp bé tiến bộ đều.',
      achievement: milestone(input.streakDays),
    };
  }

  if (input.lastAction === 'interpreter') {
    return {
      suggestion: 'Hôm nay thử chốt 1 việc thực tế sau phiên dịch.',
      quickAction: {
        primaryLabel: 'Hỗ trợ cuộc gọi',
        primaryAction: 'call_assist',
        secondaryLabel: 'Gọi giúp tôi',
        secondaryAction: 'call_help',
      },
      reminder: input.lowCredit ? 'Nạp thêm Credits để không gián đoạn.' : 'Mục tiêu: hoàn tất 1 việc nhỏ trong 10 phút.',
      achievement: milestone(input.streakDays),
    };
  }

  return {
    suggestion: 'Mỗi ngày 1 việc nhỏ: học, gọi, hoặc xác nhận lịch.',
    quickAction: {
      primaryLabel: 'Phiên dịch nhanh',
      primaryAction: 'interpreter',
      secondaryLabel: 'Hỗ trợ cuộc gọi',
      secondaryAction: 'call_assist',
    },
    reminder: input.lowCredit ? 'Số dư thấp, cân nhắc nạp để duy trì nhịp hằng ngày.' : 'Mở app hằng ngày để giữ chuỗi và xử lý việc nhanh.',
    achievement: milestone(input.streakDays),
  };
}
