export type SupportedLanguage = 'vi' | 'en' | 'cs' | 'de';

type ReceptionStrings = {
  screenTitle: string;
  prepaidTitle: string;
  homelandTitle: string;
  homelandQuote: string;
  /** Sample labels — GLOBAL_V1 pack names (Starter / Basic / Standard); not legacy tier names. */
  walletPackStarterLabel: string;
  walletPackBasicLabel: string;
  walletPackStandardLabel: string;
  walletPackStarterCredits: string;
  walletPackBasicCredits: string;
  walletPackStandardCredits: string;
};

type CountryStrings = {
  screenTitle: string;
  subtitle: string;
  countryNameByCode: Record<string, string>;
  languageOptions: { code: SupportedLanguage; label: string }[];
  aiSection: string;
  aiExternal: string;
  aiInternal: string;
  aiExternalHint: string;
  aiInternalHint: string;
  callSettings: string;
  language: string;
  languageHint: string;
  humanSimulation: string;
  humanSimulationHint: string;
  delegatedCall: string;
  delegatedCallHint: string;
  /** Giọng TTS cho trợ lý CSKH trong app (Minh Khang). */
  loanAssistantVoiceTitle: string;
  loanAssistantVoiceSubtitle: string;
  loanAssistantVoiceFemale: string;
  loanAssistantVoiceMale: string;
};

type LearningStrings = {
  segmentInactive: string;
  segmentActive: string;
  speakWithChauLoan: string;
  /** Đoạn mở đầu; dùng placeholder {teacher} cho tên Minh Khang */
  hintWithChauLoan: string;
  /** Nút bắt đầu luyện nói với Minh Khang */
  startPracticeWithChauLoan: string;
};

export type UtilityDiscoveryCategory = { title: string; hint: string };

type UtilityStrings = {
  screenTitle: string;
  pricingTitle: string;
  region: string;
  month: string;
  year: string;
  subtitle: string;
  servicesTitle: string;
  serviceJob: string;
  serviceHousing: string;
  serviceLegal: string;
  serviceExchange: string;
  /** LifeOS hub entry (utilities grid). */
  serviceLifeOS: string;
  /** Travel companion surface. */
  serviceTravel: string;
  /** Optional surface when launch flag enables it. */
  serviceYeuThuong: string;
  /** Radar discovery when enabled. */
  serviceRadarDiscovery: string;
  /** Fallback: Leona path when Radar is off. */
  serviceFindServicesLeona: string;
  /** Document vault entry. */
  serviceVault: string;
  /** Pack preview line on utility screen; `{turns}` = credit count. */
  packTurnsCredits: string;
  /** Curated discovery — Quốc gia + Tiện ích (PASS 1 hybrid). */
  discoverySectionTitle: string;
  discoverySectionSubtitle: string;
  discoveryCategories: UtilityDiscoveryCategory[];
};

type CommunityStrings = {
  screenTitle: string;
  subtitle: string;
  composerPlaceholder: string;
  postButton: string;
  feedTitle: string;
  post1Author: string;
  post1Body: string;
  post1Meta: string;
  post2Author: string;
  post2Body: string;
  post2Meta: string;
};

type ProfileStrings = {
  screenTitle: string;
  subtitle: string;
  currentPlan: string;
  creditsTitle: string;
  creditsBalance: string;
  creditsHint: string;
  identityTitle: string;
  residencyStatusLabel: string;
  visaTypeLabel: string;
  visaExpiryLabel: string;
  subscriptionPlanLabel: string;
  aiCreditsLabel: string;
  residencyStatusDuHoc: string;
  residencyStatusLaoDong: string;
  residencyStatusDinhCu: string;
  residencyStatusTiNan: string;
  planFree: string;
  planPremium: string;
  planCombo: string;
  settingsTitle: string;
  settingLanguage: string;
  settingNotifications: string;
  settingPrivacy: string;
  settingSupport: string;
  /** Profile credits summary; placeholder `{credits}`. */
  creditsBalanceCurrent: string;
  editIdentityCta: string;
  alertLanguageTitle: string;
  alertLanguageBody: string;
  alertNotificationsTitle: string;
  alertNotificationsBody: string;
  alertPrivacyTitle: string;
  /** Placeholders `{privacyUrl}`, `{termsUrl}`. */
  alertPrivacyBody: string;
  alertSupportTitle: string;
  /** Placeholders `{email}`, `{product}`, `{launch}`. */
  alertSupportBody: string;
  onboardingResetTitle: string;
  onboardingResetMessage: string;
  onboardingResetCancel: string;
  onboardingResetConfirm: string;
  onboardingResetDoneTitle: string;
  onboardingResetDoneMessage: string;
  onboardingResetRowLabel: string;
};

type VoiceStrings = {
  holdMic: string;
  listening: string;
  sending: string;
  speaking: string;
  analyzingSpeech: string;
  aiThinking: string;
  youSaidDemo: string;
  replyFrom: string;
  errMic: string;
  errRecord: string;
  errSend: string;
  receptionTitle: string;
  receptionHint: string;
};

type ErrorsStrings = {
  outOfCredits: string;
};

/** Wallet / top-up alerts and inline copy (`ComboWalletScreen`). */
type ComboWalletStrings = {
  walletLockedTitle: string;
  walletLockedBody: string;
  backendMissingTitle: string;
  backendMissingBody: string;
  paymentsMissingTitle: string;
  paymentsMissingBody: string;
  paymentInitFailTitle: string;
  paymentInitFailBody: string;
  paymentNotVerifiedTitle: string;
  paymentNotVerifiedBody: string;
  paymentMissingIdTitle: string;
  paymentMissingIdBody: string;
  creditsNotCreditedTitle: string;
  creditsNotCreditedBody: string;
  connectionInterruptedTitle: string;
  connectionInterruptedBody: string;
  pinWrongTitle: string;
  pinWrongBody: string;
  closeCheckoutTitle: string;
  closeCheckoutBody: string;
  unlockWalletTitle: string;
  pendingVerifyText: string;
  alertClose: string;
  alertRetry: string;
  alertLater: string;
  /** Visible chrome; `{country}` = profile country code. */
  screenSubtitle: string;
  balanceLabel: string;
  balanceHint: string;
  buyInitInProgress: string;
  enterpriseCta: string;
  /** Biometric system prompt when unlocking wallet. */
  biometricReason: string;
  filterAll: string;
  filterTopup: string;
  filterConsume: string;
  /** `{inboundName}`, `{inboundPrice}`, `{outboundName}`, `{outboundPrice}` */
  unitPriceLine: string;
  /** `{gift}` */
  giftLine: string;
  /** `{amount}` display label e.g. formatted price */
  packPriceLine: string;
  historySectionTitle: string;
  historyFootnote: string;
  emptyHistory: string;
};

type AppStrings = {
  common: {
    pronounYou: 'Bạn';
    aiLoanName: 'CSKH Minh Khang';
    chauLoanAgentName: 'Tổng đài viên Minh Khang';
  };
  reception: ReceptionStrings;
  country: CountryStrings;
  learning: LearningStrings;
  utility: UtilityStrings;
  community: CommunityStrings;
  profile: ProfileStrings;
  voice: VoiceStrings;
  errors: ErrorsStrings;
  comboWallet: ComboWalletStrings;
  nav: {
    countryTab: string;
    utilityTab: string;
    learningTab: string;
    communityTab: string;
    receptionTab: string;
    profileTab: string;
  };
};

/** Canonical UI string table by language (`getStrings` reads from here). */
export const STRINGS_BY_LANGUAGE: Record<SupportedLanguage, AppStrings> = {
  vi: {
    common: {
      pronounYou: 'Bạn',
      aiLoanName: 'CSKH Minh Khang',
      chauLoanAgentName: 'Tổng đài viên Minh Khang',
    },
    reception: {
      screenTitle: 'Lễ tân',
      prepaidTitle: 'Gói Credits Global (Starter → Enterprise)',
      homelandTitle: 'Góc Quê Hương',
      homelandQuote: 'Dù ở đâu, gốc quê nhà vẫn luôn ở bên Bạn.',
      walletPackStarterLabel: 'Gói Starter · Nhập môn',
      walletPackBasicLabel: 'Gói Basic · Tiêu chuẩn nhẹ',
      walletPackStandardLabel: 'Gói Standard · Phổ biến',
      walletPackStarterCredits: '100 Credits',
      walletPackBasicCredits: '230 Credits',
      walletPackStandardCredits: '650 Credits',
    },
    country: {
      screenTitle: 'Quốc gia',
      subtitle: 'Chọn quốc gia hồ sơ — giá hiển thị & gói Credits theo nhóm thị trường Global.',
      countryNameByCode: {
        CZ: 'Séc',
        SK: 'Slovakia',
        PL: 'Ba Lan',
        DE: 'Đức',
        FR: 'Pháp',
        UK: 'Anh',
        GB: 'Anh (GB)',
        CH: 'Thụy Sĩ',
        VN: 'Việt Nam',
      },
      languageOptions: [
        { code: 'vi', label: 'Tiếng Việt (VI)' },
        { code: 'en', label: 'Tiếng Anh (EN)' },
        { code: 'cs', label: 'Čeština (CS)' },
        { code: 'de', label: 'Tiếng Đức (DE)' },
      ],
      aiSection: 'Trợ lý & hỗ trợ',
      aiExternal: 'Đối ngoại (Leona Nguyen)',
      aiInternal: 'Đối nội (Minh Khang)',
      aiExternalHint: 'Leona: gọi hỗ trợ đối ngoại, giọng rõ ràng.',
      aiInternalHint: 'Minh Khang: CSKH trong app — Lễ tân, tiện ích, phiên dịch.',
      callSettings: 'Cài đặt cuộc gọi',
      language: 'Ngôn ngữ',
      languageHint: 'Giao diện & giọng đọc',
      humanSimulation: 'Mô phỏng con người',
      humanSimulationHint: 'Độ trễ & từ đệm (chế độ Leona đối ngoại)',
      delegatedCall: 'Gọi điện ủy quyền',
      delegatedCallHint: 'Hỗ trợ thay mặt Bạn kết nối cuộc gọi',
      loanAssistantVoiceTitle: 'Giọng Minh Khang',
      loanAssistantVoiceSubtitle: 'Lễ tân, phiên dịch trực tiếp và phát âm trong app.',
      loanAssistantVoiceFemale: 'Nữ',
      loanAssistantVoiceMale: 'Nam',
    },
    learning: {
      segmentInactive: 'TỪ ĐIỂN',
      segmentActive: 'HỌC TẬP',
      speakWithChauLoan: 'Luyện nói cùng Minh Khang',
      hintWithChauLoan: 'Hôm nay Bạn bắt đầu luyện nói với {teacher}.',
      startPracticeWithChauLoan: 'Bắt đầu luyện nói với Minh Khang',
    },
    utility: {
      screenTitle: 'Tiện ích',
      pricingTitle: 'Bảng giá Global (USD · theo nhóm thị trường)',
      region: 'Khu vực',
      month: 'Tháng',
      year: 'Năm',
      subtitle: 'Tiện ích theo quốc gia hồ sơ — định hướng Global, ưu tiên hỗ trợ thực tế.',
      servicesTitle: 'Dịch vụ thiết yếu',
      serviceJob: 'Tìm việc',
      serviceHousing: 'Thuê nhà',
      serviceLegal: 'Dịch vụ pháp lý',
      serviceExchange: 'Đổi tiền',
      serviceLifeOS: 'LifeOS — trung tâm điều phối',
      serviceTravel: 'Đồng hành du lịch',
      serviceYeuThuong: 'Kết Nối Yêu Thương',
      serviceRadarDiscovery: 'Radar — khám phá dịch vụ',
      serviceFindServicesLeona: 'Tìm dịch vụ (Leona)',
      serviceVault: 'Két sắt giấy tờ',
      packTurnsCredits: '{turns} Credits',
      discoverySectionTitle: 'Khám phá dịch vụ theo nhu cầu thực tế',
      discoverySectionSubtitle:
        'Định hướng toàn cầu, ưu tiên hỗ trợ thực hành — không phải danh mục tài chính xa xỉ.',
      discoveryCategories: [
        {
          title: 'Visa & giấy tờ',
          hint: 'Hộ chiếu, visa, hợp đồng và giấy tờ cần cho sinh sống tại nước sở tại.',
        },
        {
          title: 'Cư trú & nhập cư',
          hint: 'Gia hạn, đổi loại cư trú và thủ tục nhập cư cơ bản.',
        },
        {
          title: 'Y tế & đặt lịch',
          hint: 'Khám chữa, bảo hiểm và định hướng đặt hẹn trong hệ thống y tế địa phương.',
        },
        {
          title: 'Pháp lý & tư vấn',
          hint: 'Hợp đồng, lao động và hỗ trợ pháp lý thực dụng.',
        },
        {
          title: 'Việc làm & doanh nghiệp',
          hint: 'Tìm việc, hợp đồng lao động và dịch vụ liên quan doanh nghiệp nhỏ.',
        },
        {
          title: 'Nhà ở, khách sạn & homestay',
          hint: 'Thuê nhà, lưu trú ngắn hạn và homestay phù hợp ngân sách.',
        },
        {
          title: 'Nails, quán ăn & dịch vụ Việt',
          hint: 'Tiện ích quen thuộc: nails, ăn uống, mua sắm phục vụ cộng đồng người Việt.',
        },
        {
          title: 'Booking & hỗ trợ dịch vụ',
          hint: 'Đặt chỗ, gọi hỗ trợ và đồng hành xử lý tình huống thực tế.',
        },
      ],
    },
    community: {
      screenTitle: 'Cộng đồng',
      subtitle: 'Chia sẻ kinh nghiệm sống, việc làm và thông tin cộng đồng theo quốc gia bạn đang ở.',
      composerPlaceholder: 'Bạn muốn chia sẻ điều gì hôm nay?',
      postButton: 'Đăng',
      feedTitle: 'Bảng tin cộng đồng',
      post1Author: 'An - Praha',
      post1Body: 'Mình vừa hoàn tất hồ sơ gia hạn cư trú, ai cần checklist mình gửi ngay.',
      post1Meta: '2 giờ trước',
      post2Author: 'Linh - Berlin',
      post2Body: 'Cuối tuần có chợ Việt tại Berlin, Bạn nào cần đồ quê nhà có thể ghé.',
      post2Meta: 'Hôm nay',
    },
    profile: {
      screenTitle: 'Cá nhân',
      subtitle: 'Thông tin tài khoản và gói dịch vụ của Bạn.',
      currentPlan: 'Gói hiện tại: Standard',
      creditsTitle: 'Credits',
      creditsBalance: 'Số dư đồng bộ từ máy chủ — xem mục Ví',
      creditsHint: 'Bạn có thể dùng Credits cho gọi điện ủy quyền, học tập và dịch vụ.',
      identityTitle: 'Identity Snapshot',
      residencyStatusLabel: 'Diện cư trú',
      visaTypeLabel: 'Loại visa/thẻ',
      visaExpiryLabel: 'Hạn visa',
      subscriptionPlanLabel: 'Gói thuê bao',
      aiCreditsLabel: 'Credits dịch vụ',
      residencyStatusDuHoc: 'Du học',
      residencyStatusLaoDong: 'Lao động',
      residencyStatusDinhCu: 'Định cư',
      residencyStatusTiNan: 'Tị nạn',
      planFree: 'Free',
      planPremium: 'Premium',
      planCombo: 'Combo',
      settingsTitle: 'Cài đặt ứng dụng',
      settingLanguage: 'Ngôn ngữ',
      settingNotifications: 'Thông báo',
      settingPrivacy: 'Riêng tư & bảo mật',
      settingSupport: 'Hỗ trợ',
      creditsBalanceCurrent: 'Số dư hiện tại: {credits} Credits',
      editIdentityCta: 'Chỉnh sửa hồ sơ Identity',
      alertLanguageTitle: 'Ngôn ngữ',
      alertLanguageBody: 'Đổi ngôn ngữ trong màn Quốc gia để đồng bộ giọng và giao diện.',
      alertNotificationsTitle: 'Thông báo',
      alertNotificationsBody:
        'Thông báo nhắc hạn giấy tờ và nội dung hằng ngày được bật theo quyền thiết bị.',
      alertPrivacyTitle: 'Riêng tư & bảo mật',
      alertPrivacyBody: 'Privacy: {privacyUrl}\nTerms: {termsUrl}',
      alertSupportTitle: 'Hỗ trợ',
      alertSupportBody: 'Liên hệ: {email}\nSản phẩm: {product}\nPhiên bản launch: {launch}',
      onboardingResetTitle: 'Hướng dẫn lần đầu',
      onboardingResetMessage:
        'Hiện lại câu hỏi “Bạn đang cần gì nhất?” và các gợi ý ngắn trên từng màn hình sau khi khởi động lại app.',
      onboardingResetCancel: 'Hủy',
      onboardingResetConfirm: 'Đặt lại',
      onboardingResetDoneTitle: 'Đã đặt lại',
      onboardingResetDoneMessage: 'Khởi động lại app để thấy câu hỏi lần đầu.',
      onboardingResetRowLabel: 'Đặt lại hướng dẫn lần đầu',
    },
    voice: {
      holdMic: 'Giữ nút micro để nói.',
      listening: 'Đang lắng nghe…',
      sending: 'Đang gửi tới máy chủ…',
      speaking: 'Đang trả lời…',
      analyzingSpeech: 'Đang phân tích giọng nói…',
      aiThinking: 'Đang xử lý…',
      youSaidDemo: 'Bạn vừa nói (demo)',
      replyFrom: 'Phản hồi',
      errMic: 'Cần quyền micro để dùng giọng nói.',
      errRecord: 'Không thể ghi âm.',
      errSend: 'Gửi âm thanh thất bại.',
      receptionTitle: 'Hỏi bằng giọng nói',
      receptionHint: 'Giữ micro — CSKH Minh Khang hỗ trợ Bạn với giọng chuyên nghiệp, thân thiện.',
    },
    errors: {
      outOfCredits: 'Bạn đã hết Credits. Vui lòng nạp thêm để tiếp tục sử dụng CSKH Minh Khang.',
    },
    comboWallet: {
      walletLockedTitle: 'Ví đang khóa',
      walletLockedBody: 'Vui lòng xác thực để tiếp tục thanh toán.',
      backendMissingTitle: 'Chưa cấu hình máy chủ',
      backendMissingBody:
        'Thiếu EXPO_PUBLIC_BACKEND_API_BASE — không thể cộng Credits an toàn. Kiểm tra biến môi trường build.',
      paymentsMissingTitle: 'Chưa cấu hình thanh toán',
      paymentsMissingBody:
        'Thiếu EXPO_PUBLIC_PAYMENTS_API_BASE — không thể khởi tạo thanh toán. Kiểm tra biến môi trường build.',
      paymentInitFailTitle: 'Không khởi tạo được thanh toán',
      paymentInitFailBody:
        'Máy chủ thanh toán không trả client secret. Kiểm tra dịch vụ payments và mạng, rồi thử lại.',
      paymentNotVerifiedTitle: 'Chưa xác minh thanh toán',
      paymentNotVerifiedBody:
        'Thanh toán có thể đã xong nhưng máy chủ chưa xác nhận quyền nạp. Credits chưa được cộng. Bạn có thể thử lại.',
      paymentMissingIdTitle: 'Thanh toán',
      paymentMissingIdBody: 'Thiếu mã giao dịch thanh toán. Vui lòng chọn gói lại.',
      creditsNotCreditedTitle: 'Chưa cộng Credits',
      creditsNotCreditedBody:
        'Thanh toán có thể đã thành công nhưng sổ Credits trên máy chủ chưa cập nhật. Thử lại để hoàn tất (idempotent).',
      connectionInterruptedTitle: 'Gián đoạn kết nối',
      connectionInterruptedBody:
        'Không hoàn tất bước xác minh hoặc cộng Credits. Kiểm tra mạng; nếu đã trừ tiền, thử lại để đồng bộ.',
      pinWrongTitle: 'Không thể mở khóa',
      pinWrongBody: 'Mã PIN không đúng. Vui lòng thử lại.',
      closeCheckoutTitle: 'Đóng thanh toán',
      closeCheckoutBody:
        'Nếu bạn đã trả tiền, Credits có thể vẫn đang chờ máy chủ. Kiểm tra số dư hoặc mở lại gói nạp và thử đồng bộ.',
      unlockWalletTitle: 'Mở khóa Ví',
      pendingVerifyText: 'Đang xác minh thanh toán và cộng Credits trên máy chủ…',
      alertClose: 'Đóng',
      alertRetry: 'Thử lại',
      alertLater: 'Để sau',
      screenSubtitle: 'Ví Credits',
      balanceLabel: 'Số dư hiện tại',
      balanceHint:
        'Số dư Credits đồng bộ từ máy chủ sau đăng nhập. Giá gói theo tiền tệ địa phương theo quốc gia hồ sơ ({country}).',
      buyInitInProgress: 'Đang khởi tạo thanh toán...',
      enterpriseCta: 'Enterprise: liên hệ kinh doanh — thanh toán trong app sắp có.',
      biometricReason: 'Xác thực để xem Ví Kết Nối Global',
      filterAll: 'Tất cả',
      filterTopup: 'Đã Nạp',
      filterConsume: 'Đã Dùng',
      unitPriceLine:
        'Hỗ trợ trong app ({inboundName}): {inboundPrice} | Gọi đối ngoại ({outboundName}): {outboundPrice}',
      giftLine: 'Quà tặng: {gift}',
      packPriceLine: 'Giá gói: {amount}',
      historySectionTitle: 'Lịch sử trên thiết bị',
      historyFootnote: 'Chỉ mang tính tham khảo; số dư thật lấy từ máy chủ sau khi đăng nhập.',
      emptyHistory: 'Chưa có giao dịch nào.',
    },
    nav: {
      countryTab: 'Quốc gia',
      utilityTab: 'Tiện ích',
      learningTab: 'Học tập',
      communityTab: 'Cộng đồng',
      receptionTab: 'Lễ tân',
      profileTab: 'Cá nhân',
    },
  },
  en: {
    common: {
      pronounYou: 'Bạn',
      aiLoanName: 'CSKH Minh Khang',
      chauLoanAgentName: 'Tổng đài viên Minh Khang',
    },
    reception: {
      screenTitle: 'Reception',
      prepaidTitle: 'Global Credits packs (Starter → Enterprise)',
      homelandTitle: 'Homeland Corner',
      homelandQuote: 'Where your roots stay close, wherever you are.',
      walletPackStarterLabel: 'Starter pack · Entry',
      walletPackBasicLabel: 'Basic pack · Light',
      walletPackStandardLabel: 'Standard pack · Popular',
      walletPackStarterCredits: '100 Credits',
      walletPackBasicCredits: '230 Credits',
      walletPackStandardCredits: '650 Credits',
    },
    country: {
      screenTitle: 'Countries',
      subtitle: 'Choose a country to explore services, tools, and your community.',
      countryNameByCode: {
        CZ: 'Czechia',
        SK: 'Slovakia',
        PL: 'Poland',
        DE: 'Germany',
        FR: 'France',
        UK: 'United Kingdom',
        GB: 'United Kingdom (GB)',
        CH: 'Switzerland',
        VN: 'Vietnam',
      },
      languageOptions: [
        { code: 'vi', label: 'Vietnamese (VI)' },
        { code: 'en', label: 'English (EN)' },
        { code: 'cs', label: 'Czech (CS)' },
        { code: 'de', label: 'German (DE)' },
      ],
      aiSection: 'Assistants & support',
      aiExternal: 'External (Leona Nguyen)',
      aiInternal: 'Internal (Minh Khang)',
      aiExternalHint: 'Leona: outbound support calls, clear voice.',
      aiInternalHint: 'Minh Khang: in-app CSKH — reception, utilities, interpreter.',
      callSettings: 'Call Settings',
      language: 'Language',
      languageHint: 'App UI & spoken voice',
      humanSimulation: 'Human Simulation',
      humanSimulationHint: 'Latency & fillers (Leona outbound mode)',
      delegatedCall: 'Delegated Calling',
      delegatedCallHint: 'Support places the call on your behalf',
      loanAssistantVoiceTitle: 'Minh Khang voice',
      loanAssistantVoiceSubtitle: 'Reception, live interpreter, and in-app playback.',
      loanAssistantVoiceFemale: 'Female',
      loanAssistantVoiceMale: 'Male',
    },
    learning: {
      segmentInactive: 'DICTIONARY',
      segmentActive: 'LEARNING',
      speakWithChauLoan: 'Practice speaking with Minh Khang',
      hintWithChauLoan: 'Today Bạn begin speaking practice with {teacher}.',
      startPracticeWithChauLoan: 'Start speaking practice with Minh Khang',
    },
    utility: {
      screenTitle: 'Utilities',
      pricingTitle: 'Global pricing (USD · by market band)',
      region: 'Region',
      month: 'Month',
      year: 'Year',
      subtitle: 'Essential tools by country profile — Global-first and practical support.',
      servicesTitle: 'Essential Services',
      serviceJob: 'Find Jobs',
      serviceHousing: 'Housing Rental',
      serviceLegal: 'Legal Services',
      serviceExchange: 'Currency Exchange',
    },
    community: {
      screenTitle: 'Community',
      subtitle: 'Share life tips, jobs, and local community updates in your current country.',
      composerPlaceholder: 'What do you want to share today?',
      postButton: 'Post',
      feedTitle: 'Community Feed',
      post1Author: 'An - Prague',
      post1Body: 'I just completed my residence extension paperwork. I can share my checklist.',
      post1Meta: '2h ago',
      post2Author: 'Linh - Berlin',
      post2Body: 'Vietnamese market this weekend in Berlin. Great place for hometown food.',
      post2Meta: 'Today',
    },
    profile: {
      screenTitle: 'Profile',
      subtitle: 'Your account details and active service package.',
      currentPlan: 'Current plan: Standard',
      creditsTitle: 'Credits',
      creditsBalance: 'Balance syncs from server — see Wallet',
      creditsHint: 'You can use Credits for delegated calls, learning, and services.',
      identityTitle: 'Identity Snapshot',
      residencyStatusLabel: 'Residency status',
      visaTypeLabel: 'Visa/card type',
      visaExpiryLabel: 'Visa expiry',
      subscriptionPlanLabel: 'Subscription',
      aiCreditsLabel: 'Service credits',
      residencyStatusDuHoc: 'Student',
      residencyStatusLaoDong: 'Worker',
      residencyStatusDinhCu: 'Settled',
      residencyStatusTiNan: 'Refugee',
      planFree: 'Free',
      planPremium: 'Premium',
      planCombo: 'Combo',
      settingsTitle: 'App Settings',
      settingLanguage: 'Language',
      settingNotifications: 'Notifications',
      settingPrivacy: 'Privacy & Security',
      settingSupport: 'Support',
      creditsBalanceCurrent: 'Current balance: {credits} Credits',
      editIdentityCta: 'Edit identity profile',
      alertLanguageTitle: 'Language',
      alertLanguageBody: 'Change language on the Countries tab to sync voice and interface.',
      alertNotificationsTitle: 'Notifications',
      alertNotificationsBody:
        'Document reminders and daily tips follow the notification permissions you grant on this device.',
      alertPrivacyTitle: 'Privacy & security',
      alertPrivacyBody: 'Privacy: {privacyUrl}\nTerms: {termsUrl}',
      alertSupportTitle: 'Support',
      alertSupportBody: 'Contact: {email}\nProduct: {product}\nLaunch edition: {launch}',
      onboardingResetTitle: 'First-time guidance',
      onboardingResetMessage:
        'Show again the “What do you need most?” prompt and short hints per screen after you restart the app.',
      onboardingResetCancel: 'Cancel',
      onboardingResetConfirm: 'Reset',
      onboardingResetDoneTitle: 'Reset done',
      onboardingResetDoneMessage: 'Restart the app to see the first-time prompt.',
      onboardingResetRowLabel: 'Reset first-time guidance',
    },
    voice: {
      holdMic: 'Hold the mic button to speak.',
      listening: 'Listening…',
      sending: 'Sending to server…',
      speaking: 'Assistant is replying…',
      analyzingSpeech: 'Analyzing your speech…',
      aiThinking: 'Processing…',
      youSaidDemo: 'You said (demo)',
      replyFrom: 'Reply',
      errMic: 'Microphone permission is required.',
      errRecord: 'Could not record audio.',
      errSend: 'Could not send audio.',
      receptionTitle: 'Voice request',
      receptionHint: 'Hold the mic — Minh Khang customer service assists you professionally.',
    },
    errors: {
      outOfCredits: 'You are out of Credits. Please top up to continue using Minh Khang support.',
    },
    comboWallet: {
      walletLockedTitle: 'Wallet is locked',
      walletLockedBody: 'Please authenticate to continue checkout.',
      backendMissingTitle: 'Backend not configured',
      backendMissingBody:
        'Missing EXPO_PUBLIC_BACKEND_API_BASE — Credits cannot be added safely. Check your build environment.',
      paymentsMissingTitle: 'Payments not configured',
      paymentsMissingBody:
        'Missing EXPO_PUBLIC_PAYMENTS_API_BASE — checkout cannot start. Check your build environment.',
      paymentInitFailTitle: 'Could not start payment',
      paymentInitFailBody:
        'The payments service did not return a client secret. Check the payments backend and network, then try again.',
      paymentNotVerifiedTitle: 'Payment not verified yet',
      paymentNotVerifiedBody:
        'Payment may have succeeded but the server has not confirmed the top-up. Credits were not added. You can retry.',
      paymentMissingIdTitle: 'Payment',
      paymentMissingIdBody: 'Missing payment reference. Please pick a pack again.',
      creditsNotCreditedTitle: 'Credits not posted',
      creditsNotCreditedBody:
        'Payment may have succeeded but server credits are not updated yet. Retry to finish (idempotent).',
      connectionInterruptedTitle: 'Connection interrupted',
      connectionInterruptedBody:
        'Verification or credit posting did not finish. Check your network; if you were charged, retry to sync.',
      pinWrongTitle: 'Cannot unlock',
      pinWrongBody: 'Incorrect PIN. Please try again.',
      closeCheckoutTitle: 'Close checkout',
      closeCheckoutBody:
        'If you already paid, Credits may still be pending on the server. Check your balance or reopen the pack and sync.',
      unlockWalletTitle: 'Unlock wallet',
      pendingVerifyText: 'Verifying payment and posting Credits on the server…',
      alertClose: 'Close',
      alertRetry: 'Retry',
      alertLater: 'Later',
      screenSubtitle: 'Credits wallet',
      balanceLabel: 'Current balance',
      balanceHint:
        'Credits sync from the server after sign-in. Pack prices use local currency for profile country ({country}).',
      buyInitInProgress: 'Initializing payment…',
      enterpriseCta: 'Enterprise: contact sales — in-app checkout coming soon.',
      biometricReason: 'Authenticate to view the Kết Nối Global wallet',
      filterAll: 'All',
      filterTopup: 'Top-up',
      filterConsume: 'Used',
      unitPriceLine:
        'In-app support ({inboundName}): {inboundPrice} | Outbound ({outboundName}): {outboundPrice}',
      giftLine: 'Gift: {gift}',
      packPriceLine: 'Pack price: {amount}',
      historySectionTitle: 'On-device history',
      historyFootnote: 'For reference only; real balance comes from the server after sign-in.',
      emptyHistory: 'No transactions yet.',
    },
    nav: {
      countryTab: 'Countries',
      utilityTab: 'Utilities',
      learningTab: 'Learning',
      communityTab: 'Community',
      receptionTab: 'Reception',
      profileTab: 'Profile',
    },
  },
  cs: {
    common: {
      pronounYou: 'Bạn',
      aiLoanName: 'CSKH Minh Khang',
      chauLoanAgentName: 'Tổng đài viên Minh Khang',
    },
    reception: {
      screenTitle: 'Recepce',
      prepaidTitle: 'Globalni balicky Credits',
      homelandTitle: 'Koutek domova',
      homelandQuote: 'Koreni zustavaji blizko, i kdyz jste v Evrope.',
      comboBronze: 'Starter · vstup',
      comboSilver: 'Basic · lehky',
      comboGold: 'Standard · bezny',
      comboBronzeTurns: '100 Credits',
      comboSilverTurns: '230 Credits',
      comboGoldTurns: '650 Credits',
    },
    country: {
      screenTitle: 'Zeme',
      subtitle: 'Vyberte zemi a objevte sluzby, nastroje a komunitu.',
      countryNameByCode: {
        CZ: 'Cesko',
        SK: 'Slovensko',
        PL: 'Polsko',
        DE: 'Nemecko',
        FR: 'Francie',
        UK: 'Velka Britanie',
        GB: 'Velka Britanie (GB)',
        CH: 'Svycarsko',
        VN: 'Vietnam',
      },
      languageOptions: [
        { code: 'vi', label: 'Vietnamstina (VI)' },
        { code: 'en', label: 'Anglictina (EN)' },
        { code: 'cs', label: 'Cestina (CS)' },
        { code: 'de', label: 'Nemcina (DE)' },
      ],
      aiSection: 'Asistenti a podpora',
      aiExternal: 'Vnejsi (Leona Nguyen)',
      aiInternal: 'Vnitrni (Minh Khang)',
      aiExternalHint: 'Leona: odchozi hovory podpory, jasny hlas.',
      aiInternalHint: 'Minh Khang: CSKH v aplikaci — recepce, nastroje, tlumocnik.',
      callSettings: 'Nastaveni hovoru',
      language: 'Jazyk',
      languageHint: 'Rozhrani aplikace a mluveny hlas',
      humanSimulation: 'Simulace cloveka',
      humanSimulationHint: 'Zpozdeni a fillers (rezim Leona outbound)',
      delegatedCall: 'Povereny hovor',
      delegatedCallHint: 'Podpora hovori za Bạn',
      loanAssistantVoiceTitle: 'Hlas Minh Khang',
      loanAssistantVoiceSubtitle: 'Recepce, zivy tlumocnik a prehravani v aplikaci.',
      loanAssistantVoiceFemale: 'Zensky',
      loanAssistantVoiceMale: 'Muzsky',
    },
    learning: {
      segmentInactive: 'SLOVNIK',
      segmentActive: 'VYUKA',
      speakWithChauLoan: 'Trenink mluveni s Minh Khang',
      hintWithChauLoan: 'Dnes Bạn zacina s mluvenim s {teacher}.',
      startPracticeWithChauLoan: 'Zacit mluveni s Minh Khang',
    },
    utility: {
      screenTitle: 'Nastroje',
      pricingTitle: 'Globalni ceny (USD · podle trhu)',
      region: 'Region',
      month: 'Mesic',
      year: 'Rok',
      subtitle: 'Zakladni nastroje podle Vaseho profilu zeme se zamerenim na praktickou podporu.',
      servicesTitle: 'Zakladni sluzby',
      serviceJob: 'Hledani prace',
      serviceHousing: 'Pronajem bydleni',
      serviceLegal: 'Pravni sluzby',
      serviceExchange: 'Smena meny',
    },
    community: {
      screenTitle: 'Komunita',
      subtitle: 'Sdilejte zkusenosti, praci a komunitni aktuality podle zeme, kde zijete.',
      composerPlaceholder: 'Co chcete dnes sdilet?',
      postButton: 'Publikovat',
      feedTitle: 'Komunitni feed',
      post1Author: 'An - Praha',
      post1Body: 'Dokoncil jsem prodlouzeni pobytu. Kdo chce checklist, poslu ho.',
      post1Meta: 'pred 2 h',
      post2Author: 'Linh - Berlin',
      post2Body: 'O vikendu je vietnamsky trh v Berline. Skvele misto na domaci potraviny.',
      post2Meta: 'dnes',
    },
    profile: {
      screenTitle: 'Profil',
      subtitle: 'Informace o uctu a aktivnim balicku.',
      currentPlan: 'Aktualni plan: Standard',
      creditsTitle: 'Credits',
      creditsBalance: 'Zustatek ze serveru — viz Penezenka',
      creditsHint: 'Credits lze pouzit pro poverene hovory, vyuku a sluzby.',
      identityTitle: 'Identity Snapshot',
      residencyStatusLabel: 'Status pobytu',
      visaTypeLabel: 'Typ viza/karty',
      visaExpiryLabel: 'Platnost viza',
      subscriptionPlanLabel: 'Predplatne',
      aiCreditsLabel: 'Kredity sluzeb',
      residencyStatusDuHoc: 'Student',
      residencyStatusLaoDong: 'Pracovni',
      residencyStatusDinhCu: 'Trvaly pobyt',
      residencyStatusTiNan: 'Uprchlik',
      planFree: 'Free',
      planPremium: 'Premium',
      planCombo: 'Combo',
      settingsTitle: 'Nastaveni aplikace',
      settingLanguage: 'Jazyk',
      settingNotifications: 'Notifikace',
      settingPrivacy: 'Soukromi a bezpecnost',
      settingSupport: 'Podpora',
      creditsBalanceCurrent: 'Aktualni zustatek: {credits} Credits',
      editIdentityCta: 'Upravit profil Identity',
      alertLanguageTitle: 'Jazyk',
      alertLanguageBody: 'Jazyk zmente v zalozce Zeme — synchronizuje se hlas a rozhrani.',
      alertNotificationsTitle: 'Notifikace',
      alertNotificationsBody:
        'Pripominky dokumentu a denni obsah zavisi na povolenich pro oznameni v nastaveni zarizeni.',
      alertPrivacyTitle: 'Soukromi a bezpecnost',
      alertPrivacyBody: 'Ochrana osobnich udaju: {privacyUrl}\nPodminky: {termsUrl}',
      alertSupportTitle: 'Podpora',
      alertSupportBody: 'Kontakt: {email}\nProdukt: {product}\nVydani: {launch}',
      onboardingResetTitle: 'Uvadeci pruvodce',
      onboardingResetMessage:
        'Znovu zobrazit otazku „Co potrebujete nejvic?“ a kratke napovedy po restartu aplikace.',
      onboardingResetCancel: 'Zrusit',
      onboardingResetConfirm: 'Resetovat',
      onboardingResetDoneTitle: 'Reset probehl',
      onboardingResetDoneMessage: 'Restartujte aplikaci a uvidite uvadeci otazku.',
      onboardingResetRowLabel: 'Resetovat uvadeci pruvodce',
    },
    voice: {
      holdMic: 'Drzte tlacitko mikrofonu a mluvte.',
      listening: 'Nasloucham…',
      sending: 'Odesilam na server…',
      speaking: 'Asistent odpovida…',
      analyzingSpeech: 'Analyzuji rec…',
      aiThinking: 'Zpracovavam…',
      youSaidDemo: 'Rekli jste (demo)',
      replyFrom: 'Odpoved',
      errMic: 'Je potreba povoleni mikrofonu.',
      errRecord: 'Nelze nahravat.',
      errSend: 'Nelze odeslat audio.',
      receptionTitle: 'Hlasovy dotaz',
      receptionHint: 'Drzte mikrofon — Minh Khang CSKH vam pomuze profesionalnim tonem.',
    },
    errors: {
      outOfCredits: 'Nemate zadne Credits. Dobijte je pro dalsi pouziti podpory Minh Khang.',
    },
    comboWallet: {
      walletLockedTitle: 'Penezenka je uzamcena',
      walletLockedBody: 'Pro pokracovani v platbe se overte.',
      backendMissingTitle: 'Backend neni nakonfigurovan',
      backendMissingBody:
        'Chybi EXPO_PUBLIC_BACKEND_API_BASE — Credits nelze bezpecne pricist. Zkontrolujte build prostredi.',
      paymentsMissingTitle: 'Platby nejsou nakonfigurovany',
      paymentsMissingBody:
        'Chybi EXPO_PUBLIC_PAYMENTS_API_BASE — platbu nelze zahajit. Zkontrolujte build prostredi.',
      paymentInitFailTitle: 'Platbu nelze spustit',
      paymentInitFailBody:
        'Platobni sluzba nevratila client secret. Zkontrolujte backend a sit, pak zkuste znovu.',
      paymentNotVerifiedTitle: 'Platba jeste neni overena',
      paymentNotVerifiedBody:
        'Platba mohla uspet, ale server zatim nepotvrdil dobiti. Credits nebyly pricteny. Muzete opakovat.',
      paymentMissingIdTitle: 'Platba',
      paymentMissingIdBody: 'Chybi reference platby. Zvolte balicek znovu.',
      creditsNotCreditedTitle: 'Credits nebyly pricteny',
      creditsNotCreditedBody:
        'Platba mohla uspet, ale stav Credits na serveru jeste neni aktualni. Opakujte pro dokonceni (idempotentni).',
      connectionInterruptedTitle: 'Preruseno spojeni',
      connectionInterruptedBody:
        'Overeni nebo pricteni Credits nedobehlo. Zkontrolujte sit; pri zuctovani zkuste znovu pro synchronizaci.',
      pinWrongTitle: 'Nelze otevrit',
      pinWrongBody: 'Spatny PIN. Zkuste to znovu.',
      closeCheckoutTitle: 'Zavrit platbu',
      closeCheckoutBody:
        'Pokud jste jiz platili, Credits mohou na serveru cekat. Zkontrolujte zustatek nebo znovu otevrite balicek.',
      unlockWalletTitle: 'Odemknout penezenku',
      pendingVerifyText: 'Overuji platbu a pricteni Credits na serveru…',
      alertClose: 'Zavrit',
      alertRetry: 'Znovu',
      alertLater: 'Pozdeji',
      screenSubtitle: 'Penezenka Credits',
      balanceLabel: 'Aktualni zustatek',
      balanceHint:
        'Zustatek Credits se synchronizuje ze serveru po prihlaseni. Ceny balicku jsou v mistni mene podle zeme profilu ({country}).',
      buyInitInProgress: 'Spoustim platbu…',
      enterpriseCta: 'Enterprise: kontaktujte obchod — platba v aplikaci bude brzy.',
      biometricReason: 'Overte pro zobrazeni penezenky Kết Nối Global',
      filterAll: 'Vše',
      filterTopup: 'Nabito',
      filterConsume: 'Použito',
      unitPriceLine:
        'Podpora v aplikaci ({inboundName}): {inboundPrice} | Externi hovor ({outboundName}): {outboundPrice}',
      giftLine: 'Darek: {gift}',
      packPriceLine: 'Cena balicku: {amount}',
      historySectionTitle: 'Historie v zarizeni',
      historyFootnote: 'Jen orientacne; skutecny zustatek je ze serveru po prihlaseni.',
      emptyHistory: 'Zatim zadne transakce.',
    },
    nav: {
      countryTab: 'Zeme',
      utilityTab: 'Nastroje',
      learningTab: 'Vyuka',
      communityTab: 'Komunita',
      receptionTab: 'Recepce',
      profileTab: 'Profil',
    },
  },
  de: {
    common: {
      pronounYou: 'Bạn',
      aiLoanName: 'CSKH Minh Khang',
      chauLoanAgentName: 'Tổng đài viên Minh Khang',
    },
    reception: {
      screenTitle: 'Empfang',
      prepaidTitle: 'Global Credits-Pakete',
      homelandTitle: 'Heimat-Ecke',
      homelandQuote: 'Deine Wurzeln bleiben nah, auch in Europa.',
      comboBronze: 'Starter · Einstieg',
      comboSilver: 'Basic · leicht',
      comboGold: 'Standard · beliebt',
      comboBronzeTurns: '100 Credits',
      comboSilverTurns: '230 Credits',
      comboGoldTurns: '650 Credits',
    },
    country: {
      screenTitle: 'Land',
      subtitle: 'Waehle ein Land und entdecke Services, Tools und Community.',
      countryNameByCode: {
        CZ: 'Tschechien',
        SK: 'Slowakei',
        PL: 'Polen',
        DE: 'Deutschland',
        FR: 'Frankreich',
        UK: 'Vereinigtes Koenigreich',
        GB: 'Vereinigtes Koenigreich (GB)',
        CH: 'Schweiz',
        VN: 'Vietnam',
      },
      languageOptions: [
        { code: 'vi', label: 'Vietnamesisch (VI)' },
        { code: 'en', label: 'Englisch (EN)' },
        { code: 'cs', label: 'Tschechisch (CS)' },
        { code: 'de', label: 'Deutsch (DE)' },
      ],
      aiSection: 'Assistenten & Support',
      aiExternal: 'Extern (Leona Nguyen)',
      aiInternal: 'Intern (Minh Khang)',
      aiExternalHint: 'Leona: ausgehende Support-Anrufe, klare Stimme.',
      aiInternalHint: 'Minh Khang: In-App-CSKH — Empfang, Tools, Dolmetschen.',
      callSettings: 'Anruf-Einstellungen',
      language: 'Sprache',
      languageHint: 'UI und gesprochene Stimme',
      humanSimulation: 'Menschliche Simulation',
      humanSimulationHint: 'Latenz & Filler (Leona-Outbound-Modus)',
      delegatedCall: 'Delegierter Anruf',
      delegatedCallHint: 'Support waehlt im Namen von Bạn',
      loanAssistantVoiceTitle: 'Stimme Minh Khang',
      loanAssistantVoiceSubtitle: 'Empfang, Live-Dolmetschen und Wiedergabe in der App.',
      loanAssistantVoiceFemale: 'Weiblich',
      loanAssistantVoiceMale: 'Maennlich',
    },
    learning: {
      segmentInactive: 'WOERTERBUCH',
      segmentActive: 'LERNEN',
      speakWithChauLoan: 'Sprechtraining mit Minh Khang',
      hintWithChauLoan: 'Heute beginnt Bạn das Sprechtraining mit {teacher}.',
      startPracticeWithChauLoan: 'Sprechtraining mit Minh Khang starten',
    },
    utility: {
      screenTitle: 'Tools',
      pricingTitle: 'Globales Pricing (USD · nach Markt)',
      region: 'Region',
      month: 'Monat',
      year: 'Jahr',
      subtitle: 'Wichtige Tools nach Ihrem Laenderprofil mit Fokus auf praktische Unterstuetzung.',
      servicesTitle: 'Wesentliche Services',
      serviceJob: 'Jobs finden',
      serviceHousing: 'Wohnung mieten',
      serviceLegal: 'Rechtsservice',
      serviceExchange: 'Geldwechsel',
    },
    community: {
      screenTitle: 'Community',
      subtitle: 'Teile Erfahrungen, Jobs und lokale Community-Updates in deinem aktuellen Land.',
      composerPlaceholder: 'Was moechtest du heute teilen?',
      postButton: 'Posten',
      feedTitle: 'Community Feed',
      post1Author: 'An - Prag',
      post1Body: 'Ich habe meine Aufenthaltsverlaengerung abgeschlossen. Ich kann meine Checkliste teilen.',
      post1Meta: 'vor 2 Std',
      post2Author: 'Linh - Berlin',
      post2Body: 'Am Wochenende gibt es einen vietnamesischen Markt in Berlin.',
      post2Meta: 'Heute',
    },
    profile: {
      screenTitle: 'Profil',
      subtitle: 'Dein Konto und aktives Servicepaket.',
      currentPlan: 'Aktueller Plan: Standard',
      creditsTitle: 'Credits',
      creditsBalance: 'Kontostand vom Server — siehe Wallet',
      creditsHint: 'Credits koennen fuer delegierte Anrufe, Lernen und Services genutzt werden.',
      identityTitle: 'Identity Snapshot',
      residencyStatusLabel: 'Aufenthaltsstatus',
      visaTypeLabel: 'Visa/Kartentyp',
      visaExpiryLabel: 'Visa-Ablauf',
      subscriptionPlanLabel: 'Abo',
      aiCreditsLabel: 'Service-Credits',
      residencyStatusDuHoc: 'Studium',
      residencyStatusLaoDong: 'Arbeit',
      residencyStatusDinhCu: 'Daueraufenthalt',
      residencyStatusTiNan: 'Fluchtstatus',
      planFree: 'Free',
      planPremium: 'Premium',
      planCombo: 'Combo',
      settingsTitle: 'App-Einstellungen',
      settingLanguage: 'Sprache',
      settingNotifications: 'Benachrichtigungen',
      settingPrivacy: 'Datenschutz & Sicherheit',
      settingSupport: 'Support',
      creditsBalanceCurrent: 'Aktueller Kontostand: {credits} Credits',
      editIdentityCta: 'Identity-Profil bearbeiten',
      alertLanguageTitle: 'Sprache',
      alertLanguageBody:
        'Aendern Sie die Sprache im Reiter Land — dann stimmen Stimme und Oberflaeche ueberein.',
      alertNotificationsTitle: 'Benachrichtigungen',
      alertNotificationsBody:
        'Dokument-Erinnerungen und taegliche Hinweise folgen den Geraeteberechtigungen.',
      alertPrivacyTitle: 'Datenschutz & Sicherheit',
      alertPrivacyBody: 'Datenschutz: {privacyUrl}\nAGB: {termsUrl}',
      alertSupportTitle: 'Support',
      alertSupportBody: 'Kontakt: {email}\nProdukt: {product}\nLaunch: {launch}',
      onboardingResetTitle: 'Erstmalige Hinweise',
      onboardingResetMessage:
        'Zeigt die Frage „Wozu brauchen Sie am meisten Hilfe?“ und kurze Hinweise je Bildschirm nach App-Neustart erneut.',
      onboardingResetCancel: 'Abbrechen',
      onboardingResetConfirm: 'Zuruecksetzen',
      onboardingResetDoneTitle: 'Zurueckgesetzt',
      onboardingResetDoneMessage: 'App neu starten, um die Erstnutzungsfrage zu sehen.',
      onboardingResetRowLabel: 'Erstmalige Hinweise zuruecksetzen',
    },
    voice: {
      holdMic: 'Halten Sie die Mikrofon-Taste zum Sprechen.',
      listening: 'Ich hoere zu…',
      sending: 'Wird gesendet…',
      speaking: 'Assistent antwortet…',
      analyzingSpeech: 'Sprache wird analysiert…',
      aiThinking: 'Wird verarbeitet…',
      youSaidDemo: 'Sie sagten (Demo)',
      replyFrom: 'Antwort',
      errMic: 'Mikrofonberechtigung erforderlich.',
      errRecord: 'Aufnahme nicht moeglich.',
      errSend: 'Audio konnte nicht gesendet werden.',
      receptionTitle: 'Sprachanfrage',
      receptionHint: 'Mikrofon halten — Minh Khang CSKH hilft in professionellem Empfangston.',
    },
    errors: {
      outOfCredits: 'Sie haben keine Credits mehr. Bitte laden Sie auf, um Minh Khang weiter zu nutzen.',
    },
    comboWallet: {
      walletLockedTitle: 'Wallet gesperrt',
      walletLockedBody: 'Bitte authentifizieren Sie sich, um fortzufahren.',
      backendMissingTitle: 'Backend nicht konfiguriert',
      backendMissingBody:
        'EXPO_PUBLIC_BACKEND_API_BASE fehlt — Credits koennen nicht sicher gutgeschrieben werden. Build pruefen.',
      paymentsMissingTitle: 'Zahlungen nicht konfiguriert',
      paymentsMissingBody:
        'EXPO_PUBLIC_PAYMENTS_API_BASE fehlt — Checkout kann nicht starten. Build pruefen.',
      paymentInitFailTitle: 'Zahlung startet nicht',
      paymentInitFailBody:
        'Der Zahlungsdienst lieferte kein client secret. Backend und Netz pruefen, dann erneut versuchen.',
      paymentNotVerifiedTitle: 'Zahlung noch nicht bestaetigt',
      paymentNotVerifiedBody:
        'Zahlung klappte moeglicherweise, aber der Server hat die Aufladung nicht bestaetigt. Credits wurden nicht gebucht. Wiederholen moeglich.',
      paymentMissingIdTitle: 'Zahlung',
      paymentMissingIdBody: 'Zahlungsreferenz fehlt. Paket erneut waehlen.',
      creditsNotCreditedTitle: 'Credits nicht gebucht',
      creditsNotCreditedBody:
        'Zahlung klappte moeglicherweise, aber das Credit-Guthaben auf dem Server ist noch nicht aktualisiert. Wiederholen zum Abschluss (idempotent).',
      connectionInterruptedTitle: 'Verbindung unterbrochen',
      connectionInterruptedBody:
        'Bestaetigung oder Gutschrift nicht abgeschlossen. Netz pruefen; bei Abbuchung erneut synchronisieren.',
      pinWrongTitle: 'Entsperren fehlgeschlagen',
      pinWrongBody: 'Falsche PIN. Bitte erneut versuchen.',
      closeCheckoutTitle: 'Checkout schliessen',
      closeCheckoutBody:
        'Wenn Sie bereits bezahlt haben, koennen Credits noch auf den Server warten. Saldo pruefen oder Paket erneut oeffnen.',
      unlockWalletTitle: 'Wallet entsperren',
      pendingVerifyText: 'Zahlung wird geprueft und Credits auf dem Server gebucht…',
      alertClose: 'Schliessen',
      alertRetry: 'Erneut',
      alertLater: 'Spaeter',
      screenSubtitle: 'Credits-Wallet',
      balanceLabel: 'Aktueller Kontostand',
      balanceHint:
        'Credits werden nach dem Login vom Server synchronisiert. Paketpreise in Landeswaehrung fuer Profil-Land ({country}).',
      buyInitInProgress: 'Zahlung wird vorbereitet…',
      enterpriseCta: 'Enterprise: Vertrieb kontaktieren — In-App-Checkout folgt.',
      biometricReason: 'Authentifizieren Sie sich, um die Kết Nối Global Wallet zu oeffnen',
      filterAll: 'Alle',
      filterTopup: 'Aufgeladen',
      filterConsume: 'Verbraucht',
      unitPriceLine:
        'In-App-Support ({inboundName}): {inboundPrice} | Ausgehend ({outboundName}): {outboundPrice}',
      giftLine: 'Geschenk: {gift}',
      packPriceLine: 'Paketpreis: {amount}',
      historySectionTitle: 'Verlauf auf dem Geraet',
      historyFootnote:
        'Nur zur Orientierung; der echte Kontostand kommt nach dem Login vom Server.',
      emptyHistory: 'Noch keine Transaktionen.',
    },
    nav: {
      countryTab: 'Land',
      utilityTab: 'Tools',
      learningTab: 'Lernen',
      communityTab: 'Community',
      receptionTab: 'Empfang',
      profileTab: 'Profil',
    },
  },
};

/** Canonical export — language tables for the Global app shell. */
export const STRINGS_GLOBAL = STRINGS_BY_LANGUAGE;

/** @deprecated Use `STRINGS_GLOBAL`, `STRINGS_BY_LANGUAGE`, or `getStrings`. */
export const STRINGS_V9 = STRINGS_BY_LANGUAGE;

export function getStrings(languageCode: string): AppStrings {
  const key = languageCode.toLowerCase() as SupportedLanguage;
  return STRINGS_BY_LANGUAGE[key] ?? STRINGS_BY_LANGUAGE.vi;
}
