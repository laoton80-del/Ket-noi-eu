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
    prompt: 'Xin chao',
    targetWord: 'Ahoj / Dobry den',
    phonetic: '/a-hoi/ - /do-bri den/',
    knowledge: 'A1: dung khi chao hoi co ban.',
    createdAt: now,
  },
  {
    id: 'a1-de-thanks',
    prompt: 'Cam on',
    targetWord: 'Danke',
    phonetic: '/dan-ke/',
    knowledge: 'A1: lich su va dung moi tinh huong.',
    createdAt: now,
  },
  {
    id: 'a2-cz-work',
    prompt: 'Toi di lam',
    targetWord: 'Jdu do prace',
    phonetic: '/y-du do pra-tse/',
    knowledge: 'A2: cau mo ta hanh dong hang ngay.',
    createdAt: now,
  },
  {
    id: 'a2-de-doctor',
    prompt: 'Toi can gap bac si',
    targetWord: 'Ich muss zum Arzt',
    phonetic: '/ikh mus tsum artst/',
    knowledge: 'A2: dung khi can ho tro y te.',
    createdAt: now,
  },
  {
    id: 'a2-cz-appointment',
    prompt: 'Dat lich hen',
    targetWord: 'Objednat termin',
    phonetic: '/ob-yed-nat ter-min/',
    knowledge: 'A2: dung trong benh vien, tiem nail, dich vu.',
    createdAt: now,
  },
  {
    id: 'a1-de-address',
    prompt: 'Dia chi nay o dau?',
    targetWord: 'Wo ist diese Adresse?',
    phonetic: '/vo ist di-ze a-dre-se/',
    knowledge: 'A1-A2: hoi duong khi di chuyen.',
    createdAt: now,
  },
];
