import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { APP_BRAND } from '../../config/appBrand';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';
import { applyWebStyles, mergeWebClassNames } from '../../utils/applyWebStyles';

const KNG_MARKETING_ORIGIN = 'https://ketnoiglobal.com' as const;
const KOL_LIFETIME_COMMISSION_PCT = 10 as const;
const REFERRAL_PATH = '/r/leona-ai-growth' as const;

interface RadarFeedItem {
  readonly id: string;
  readonly authorDisplay: string;
  readonly groupName: string;
  readonly body: string;
}

const RADAR_MOCK_FEED: readonly RadarFeedItem[] = [
  {
    id: 'radar-nails-berlin-1',
    authorDisplay: 'Nguyễn Văn A',
    groupName: 'Hội Làm Nails Berlin',
    body: 'Mọi người ơi có ai biết tiệm nails nào đang sang nhượng hoặc cần thợ không ạ?',
  },
];

interface B2bMerchantPick {
  readonly displayName: string;
  readonly slug: string;
  readonly city: string;
}

const B2B_MERCHANT_PICKS: readonly B2bMerchantPick[] = [
  { displayName: 'Nails Palace Kreuzberg', slug: 'nails-palace-kreuzberg', city: 'Berlin' },
  { displayName: 'Glow Studio Mitte', slug: 'glow-studio-mitte', city: 'Berlin' },
  { displayName: 'Berlin Beauty Lab', slug: 'berlin-beauty-lab', city: 'Berlin' },
];

function slugifyGroupPathSegment(name: string): string {
  const trimmed = name.trim().toLowerCase();
  const withAscii = trimmed
    .replace(/đ/g, 'd')
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
  const slug = withAscii
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug.slice(0, 96) || 'fb-group';
}

function buildVipTrackingUrl(groupName: string): string {
  const slug = slugifyGroupPathSegment(groupName);
  return `${KNG_MARKETING_ORIGIN}/vip/${slug}`;
}

function buildSeedingPost(pain: string): string {
  const p = pain.trim() || 'những thủ tục khó hiểu khi sống ở nước ngoài';
  return (
    `Mình cũng từng “đứng hình” vì ${p} — stress lắm, đi một mình càng dễ bị lạc giữa biển chữ.\n\n` +
    `Dạo này mình hay nhờ **AI Leona** trên app **${APP_BRAND.masterName}**: hỏi nhanh là có hướng xử lý, ` +
    `gợi ý cách nói, kèm checklist — kiểu có “người đồng hành” bên cạnh ấy. Không phải quảng cáo đâu, ` +
    `chỉ là… thấy đỡ cô đơn hơn hẳn 😅\n\n` +
    `Nếu bạn muốn thử: ${KNG_MARKETING_ORIGIN}${REFERRAL_PATH} ` +
    `(mình để link ở đây cho tiện — ai dùng thì cứ ping mình trao đổi thêm nhé). Chúc cả nhà bình an! ✨`
  );
}

function pickMerchantForRadar(item: RadarFeedItem): B2bMerchantPick {
  const lower = item.body.toLowerCase();
  if (lower.includes('nail')) {
    return B2B_MERCHANT_PICKS[0];
  }
  return B2B_MERCHANT_PICKS[1];
}

function buildRadarAiReply(item: RadarFeedItem): string {
  const m = pickMerchantForRadar(item);
  const listingUrl = `${KNG_MARKETING_ORIGIN}/b2b/${m.slug}`;
  return (
    `Chào ${item.authorDisplay}, mình xem group ${item.groupName} thấy bạn đang tìm cơ hội nails — ` +
    `trên **${APP_BRAND.masterName}** có **${m.displayName}** (${m.city}) đang mở hồ sơ B2B: ` +
    `bạn có thể xem nhanh booth, slot thợ / sang nhượng (nếu có) tại ${listingUrl}.\n\n` +
    `Nếu cần mình gọi **Leona** để soạn tin nhắn tiếng Đức gửi chủ tiệm luôn cũng được nhé. Chúc bạn tìm được chỗ ưng ý! 💅`
  );
}

export function FacebookWarRoomScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1100;
  const isComfortable = width >= 720;

  const [groupName, setGroupName] = useState('Hội Người Việt Séc');
  const [painInput, setPainInput] = useState('Không biết tiếng Đức khi đi Sở ngoại kiều');
  const [seedingPost, setSeedingPost] = useState<string>(() => buildSeedingPost(painInput));
  const [radarReplies, setRadarReplies] = useState<Record<string, string>>({});

  const vipLink = useMemo(() => buildVipTrackingUrl(groupName), [groupName]);

  const commissionLine = `Hoa hồng trọn đời cho Admin Group: ${KOL_LIFETIME_COMMISSION_PCT}% (tracking VIP).`;

  const copyVipPackage = async (): Promise<void> => {
    const payload = `${vipLink}\n${commissionLine}`;
    try {
      await Clipboard.setStringAsync(payload);
      Alert.alert('Đã sao chép', 'Gửi Admin group FB kèm thông điệp hoa hồng 10%.');
    } catch {
      Alert.alert('Lỗi', 'Không thể copy — thử lại.');
    }
  };

  const regenerateSeeding = (): void => {
    setSeedingPost(buildSeedingPost(painInput));
  };

  const copySeedingPost = async (): Promise<void> => {
    try {
      await Clipboard.setStringAsync(seedingPost);
      Alert.alert('Đã copy', 'Bài seeding đã vào clipboard.');
    } catch {
      Alert.alert('Lỗi', 'Không thể copy — thử lại.');
    }
  };

  const generateRadarReply = (item: RadarFeedItem): void => {
    setRadarReplies((prev) => ({ ...prev, [item.id]: buildRadarAiReply(item) }));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, isComfortable && styles.scrollComfort, isDesktop && styles.scrollDesktop]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header} className={mergeWebClassNames('kn-glass', 'kn-neon-b2b')}>
          <Text style={[styles.headerTitle, isComfortable && styles.headerTitleDesktop]}>PHÒNG TÁC CHIẾN FACEBOOK (WAR ROOM)</Text>
          <Text style={styles.headerSub}>
            KOL tracking · AI seeding · Social radar — {APP_BRAND.masterName} growth ops (mock / demo).
          </Text>
        </View>

        <View style={[styles.rowTwo, isDesktop && styles.rowTwoDesktop]}>
          <View style={styles.panel} className={applyWebStyles('kn-glass')}>
            <View style={styles.panelBadge} className={applyWebStyles('kn-neon-b2b')}>
              <Text style={styles.panelBadgeText}>1 · KOL</Text>
            </View>
            <Text style={styles.panelTitle}>TƯỚNG LĨNH KOL</Text>
            <Text style={styles.panelHint}>Tracking link cho Admin Group FB — hoa hồng {KOL_LIFETIME_COMMISSION_PCT}% trọn đời.</Text>
            <Text style={styles.inputLabel}>Tên Group FB</Text>
            <TextInput
              value={groupName}
              onChangeText={setGroupName}
              placeholder="VD: Hội Người Việt Séc"
              placeholderTextColor={theme.colors.text.tertiary}
              style={styles.input}
            />
            <View style={styles.linkGlowWrap} className={mergeWebClassNames('kn-glass', 'kn-neon-b2b')}>
              <Text style={styles.linkLabel}>Link VIP (mock)</Text>
              <Text selectable style={styles.linkUrl}>
                {vipLink}
              </Text>
              <Text style={styles.commission}>{commissionLine}</Text>
            </View>
            <Pressable onPress={() => void copyVipPackage()} style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }]}>
              <Ionicons name="copy-outline" size={18} color={theme.colors.onAccent} />
              <Text style={styles.primaryBtnText}>Copy & Gửi Admin</Text>
            </Pressable>
          </View>

          <View style={styles.panel} className={applyWebStyles('kn-glass')}>
            <View style={styles.panelBadge} className={applyWebStyles('kn-neon-b2b')}>
              <Text style={styles.panelBadgeText}>2 · AI</Text>
            </View>
            <Text style={styles.panelTitle}>AI RẢI MỒI CÂU</Text>
            <Text style={styles.panelHint}>Mô phỏng LLM viết bài Facebook tự nhiên — có nhắc Leona + link giới thiệu.</Text>
            <Text style={styles.inputLabel}>Nỗi đau khách hàng</Text>
            <TextInput
              value={painInput}
              onChangeText={setPainInput}
              placeholder="VD: Không biết tiếng Đức khi đi Sở ngoại kiều"
              placeholderTextColor={theme.colors.text.tertiary}
              style={[styles.input, styles.inputTall]}
              multiline
            />
            <Pressable onPress={regenerateSeeding} style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.9 }]}>
              <Ionicons name="sparkles-outline" size={18} color={theme.colors.primaryBright} />
              <Text style={styles.secondaryBtnText}>Tạo / làm mới bài AI (mock)</Text>
            </Pressable>
            <View style={styles.postCard}>
              <Text style={styles.postTitle}>Bản nháp seeding</Text>
              <Text style={styles.postBody}>{seedingPost}</Text>
            </View>
            <Pressable onPress={() => void copySeedingPost()} style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }]}>
              <Ionicons name="clipboard-outline" size={18} color={theme.colors.onAccent} />
              <Text style={styles.primaryBtnText}>Copy to Clipboard</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.panel} className={applyWebStyles('kn-glass')}>
          <View style={styles.panelBadge} className={applyWebStyles('kn-neon-b2b')}>
            <Text style={styles.panelBadgeText}>3 · Radar</Text>
          </View>
          <Text style={styles.panelTitle}>RADAR LẮNG NGHE</Text>
          <Text style={styles.panelHint}>Luồng mock: bài viết “bắt được” từ group — gợi ý trả lời kèm merchant VIONA.</Text>
          {RADAR_MOCK_FEED.map((item) => (
            <View key={item.id} style={styles.radarCard}>
              <Text style={styles.radarMeta}>
                {item.authorDisplay} · {item.groupName}
              </Text>
              <Text style={styles.radarBody}>{item.body}</Text>
              <Pressable
                onPress={() => generateRadarReply(item)}
                style={({ pressed }) => [styles.radarAction, pressed && { opacity: 0.92 }]}
                className={applyWebStyles('kn-neon-b2b')}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={18} color={theme.colors.primaryBright} />
                <Text style={styles.radarActionText}>AI: Trả lời kèm Link VIONA</Text>
              </Pressable>
              {radarReplies[item.id] ? (
                <View style={styles.replyBox}>
                  <Text style={styles.replyLabel}>Bản gợi ý trả lời</Text>
                  <Text selectable style={styles.replyBody}>
                    {radarReplies[item.id]}
                  </Text>
                </View>
              ) : null}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.backgroundDeep,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xxl * 2,
    gap: theme.spacing.lg,
  },
  scrollComfort: {
    paddingHorizontal: theme.spacing.lg,
  },
  scrollDesktop: {
    maxWidth: 1240,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  header: {
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.executive.panel,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.text.primary,
    letterSpacing: 0.4,
  },
  headerTitleDesktop: {
    fontSize: 20,
  },
  headerSub: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: FontFamily.medium,
    color: theme.colors.text.secondary,
  },
  rowTwo: {
    gap: theme.spacing.lg,
  },
  rowTwoDesktop: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  panel: {
    flex: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: theme.colors.executive.card,
    minWidth: 0,
  },
  panelBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
  },
  panelBadgeText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: theme.colors.onAccent,
    letterSpacing: 0.6,
  },
  panelTitle: {
    fontSize: 16,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.primaryBright,
  },
  panelHint: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.secondary,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    color: theme.colors.text.primary,
  },
  input: {
    minHeight: 44,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: 'rgba(5, 11, 20, 0.55)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    color: theme.colors.text.primary,
    fontFamily: FontFamily.regular,
    fontSize: 14,
  },
  inputTall: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  linkGlowWrap: {
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(197, 160, 89, 0.08)',
  },
  linkLabel: {
    fontSize: 11,
    fontFamily: FontFamily.semibold,
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  linkUrl: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: theme.colors.primaryBright,
  },
  commission: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: theme.colors.text.primary,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.components.button.variant.primary.background,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.components.button.variant.primary.border,
  },
  primaryBtnText: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: theme.components.button.variant.primary.text,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(197, 160, 89, 0.12)',
  },
  secondaryBtnText: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    color: theme.colors.primaryBright,
  },
  postCard: {
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: theme.spacing.sm,
  },
  postTitle: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    color: theme.colors.text.secondary,
  },
  postBody: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.primary,
  },
  radarCard: {
    marginTop: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: 'rgba(5, 11, 20, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: theme.spacing.md,
  },
  radarMeta: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: theme.colors.SignalBlue,
  },
  radarBody: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.primary,
  },
  radarAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    alignSelf: 'flex-start',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(197, 160, 89, 0.15)',
  },
  radarActionText: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: theme.colors.primaryBright,
  },
  replyBox: {
    padding: theme.spacing.md,
    borderRadius: theme.radius.sm,
    backgroundColor: 'rgba(85, 144, 224, 0.12)',
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.SignalBlue,
    gap: theme.spacing.xs,
  },
  replyLabel: {
    fontSize: 11,
    fontFamily: FontFamily.semibold,
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
  },
  replyBody: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.primary,
  },
});
