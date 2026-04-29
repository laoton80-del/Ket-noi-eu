export type FreeLearningCard = {
  id: string;
  prompt: string;
  targetWord: string;
  phonetic: string;
  knowledge: string;
  createdAt: string;
};

const now = new Date().toISOString();

export const FREE_A1_A2_CARDS: FreeLearningCard[] = [
  {
    id: 'a1-cz-hello',
    prompt: 'Xin chào',
    targetWord: 'Ahoj / Dobrý den',
    phonetic: '/a-hoi/ - /do-bri den/',
    knowledge: 'A1: dùng khi chào hỏi cơ bản.',
    createdAt: now,
  },
  {
    id: 'a1-de-thanks',
    prompt: 'Cảm ơn',
    targetWord: 'Danke',
    phonetic: '/dan-ke/',
    knowledge: 'A1: lịch sự và dùng trong mọi tình huống.',
    createdAt: now,
  },
  {
    id: 'a2-cz-work',
    prompt: 'Tôi đi làm',
    targetWord: 'Jdu do prace',
    phonetic: '/y-du do pra-tse/',
    knowledge: 'A2: câu mô tả hành động hằng ngày.',
    createdAt: now,
  },
  {
    id: 'a2-de-doctor',
    prompt: 'Tôi cần gặp bác sĩ',
    targetWord: 'Ich muss zum Arzt',
    phonetic: '/ikh mus tsum artst/',
    knowledge: 'A2: dùng khi cần hỗ trợ y tế.',
    createdAt: now,
  },
  {
    id: 'a2-cz-appointment',
    prompt: 'Đặt lịch hẹn',
    targetWord: 'Objednat termín',
    phonetic: '/ob-yed-nat ter-min/',
    knowledge: 'A2: dùng trong bệnh viện, tiệm nail, dịch vụ.',
    createdAt: now,
  },
  {
    id: 'a1-de-address',
    prompt: 'Địa chỉ này ở đâu?',
    targetWord: 'Wo ist diese Adresse?',
    phonetic: '/vo ist di-ze a-dre-se/',
    knowledge: 'A1-A2: hỏi đường khi di chuyển.',
    createdAt: now,
  },
];
