import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useState, type ReactElement } from 'react';
import * as Clipboard from 'expo-clipboard';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../../navigation/routes';
import {
  deleteAdminMarketingDraft,
  fetchAdminMarketingPosts,
  postAdminMarketingApproveAndTranslate,
  publishAdminMarketingPost,
  putAdminMarketingPost,
  triggerAdminMarketingDraft,
  type MarketingPostRowDto,
  type MarketingTranslationDto,
} from '../../services/viGlobalAdminApi';
import { formatNetworkFailureMessage, isRestApiConfigured } from '../../services/apiClient';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';
import { mergeWebClassNames } from '../../utils/applyWebStyles';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function PolyglotAmmunitionSection(props: Readonly<{
  translations: MarketingTranslationDto[] | undefined;
  onCopy: (text: string) => void | Promise<void>;
  onOpenFacebook: () => void;
}>): ReactElement | null {
  const { translations, onCopy, onOpenFacebook } = props;
  if (!translations || translations.length === 0) return null;
  return (
    <View style={styles.ammoSection}>
      <Text style={styles.ammoTitle}>Ready-to-Deploy Ammunition (Translations)</Text>
      <Text style={styles.ammoSub}>
        Copy từng bản — dán thủ công vào nhóm Facebook (Meta: không auto-blast hàng loạt).
      </Text>
      {translations.map((t) => (
        <View key={t.id} style={styles.ammoCard}>
          <Text style={styles.ammoLang}>
            {t.languageCode.toUpperCase()} · {t.targetAudience}
          </Text>
          <Text style={styles.ammoBody} selectable>
            {t.translatedContent}
          </Text>
          <View style={styles.ammoActions}>
            <Pressable
              onPress={() => void onCopy(t.translatedContent)}
              style={({ pressed }) => [styles.ammoCopyBtn, pressed && { opacity: 0.9 }]}
            >
              <Text style={styles.ammoCopyBtnText}>📋 Copy Text</Text>
            </Pressable>
            <Pressable
              onPress={onOpenFacebook}
              style={({ pressed }) => [styles.ammoFbBtn, pressed && { opacity: 0.9 }]}
            >
              <Text style={styles.ammoFbBtnText}>🔗 Open Facebook</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </View>
  );
}

export function MarketingApprovalScreen() {
  const navigation = useNavigation<Nav>();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;

  const [drafts, setDrafts] = useState<MarketingPostRowDto[]>([]);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [triggerBusy, setTriggerBusy] = useState(false);

  const loadDrafts = useCallback(async (): Promise<void> => {
    if (!isRestApiConfigured()) {
      setDrafts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetchAdminMarketingPosts('DRAFT', true, 1);
      if (!res.ok) {
        Alert.alert('Không tải được', res.error);
        setDrafts([]);
        return;
      }
      setDrafts([...res.data.items]);
      setEdits((prev) => {
        const next = { ...prev };
        for (const row of res.data.items) {
          if (next[row.id] === undefined) next[row.id] = row.content;
        }
        return next;
      });
    } catch (e) {
      Alert.alert('Lỗi', formatNetworkFailureMessage(e));
      setDrafts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const onSave = async (id: string): Promise<void> => {
    const content = (edits[id] ?? '').trim();
    if (content.length === 0) {
      Alert.alert('Nội dung trống', 'Vui lòng nhập nội dung bài đăng.');
      return;
    }
    setBusyId(id);
    try {
      const res = await putAdminMarketingPost(id, { content });
      if (!res.ok) {
        Alert.alert('Lưu thất bại', res.error);
        return;
      }
      setDrafts((rows) => rows.map((r) => (r.id === id ? res.data : r)));
      setEdits((e) => ({ ...e, [id]: res.data.content }));
      Alert.alert('Đã lưu', 'Bản nháp đã cập nhật trên máy chủ.');
    } catch (e) {
      Alert.alert('Lỗi', formatNetworkFailureMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  const onReject = (id: string): void => {
    Alert.alert('Xóa bản nháp?', 'Thao tác này không hoàn tác.', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: () => void confirmReject(id),
      },
    ]);
  };

  const confirmReject = async (id: string): Promise<void> => {
    setBusyId(id);
    try {
      const res = await deleteAdminMarketingDraft(id);
      if (!res.ok) {
        Alert.alert('Xóa thất bại', res.error);
        return;
      }
      setDrafts((rows) => rows.filter((r) => r.id !== id));
      setEdits((e) => {
        const { [id]: _removed, ...rest } = e;
        return rest;
      });
    } catch (e) {
      Alert.alert('Lỗi', formatNetworkFailureMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  const onApprovePolyglot = async (id: string): Promise<void> => {
    const content = (edits[id] ?? '').trim();
    if (content.length === 0) {
      Alert.alert('Nội dung trống', 'Nhập hoặc chỉnh sửa bài trước khi duyệt đa ngữ.');
      return;
    }
    setBusyId(id);
    try {
      const res = await postAdminMarketingApproveAndTranslate(id, { content });
      if (!res.ok) {
        Alert.alert('Polyglot thất bại', res.error);
        return;
      }
      setDrafts((rows) => rows.map((r) => (r.id === id ? res.data.post : r)));
      setEdits((e) => ({ ...e, [id]: res.data.post.content }));
      Alert.alert(
        'Đã duyệt & sinh bản dịch',
        'Dùng clipboard + Facebook thủ công cho từng nhóm — không auto-post hàng loạt (an toàn Meta).'
      );
    } catch (e) {
      Alert.alert('Lỗi', formatNetworkFailureMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  const onCopyTranslation = async (text: string): Promise<void> => {
    try {
      await Clipboard.setStringAsync(text);
      Alert.alert('Đã copy', 'Dán vào nhóm Facebook thủ công (khuyến nghị Meta).');
    } catch {
      Alert.alert('Clipboard', 'Không sao chép được trên thiết bị này.');
    }
  };

  const onOpenFacebookManual = (): void => {
    void Linking.openURL('https://www.facebook.com/').catch(() => {
      Alert.alert('Facebook', 'Không mở được liên kết.');
    });
  };

  const onApprovePublish = async (id: string): Promise<void> => {
    const content = (edits[id] ?? '').trim();
    if (content.length === 0) {
      Alert.alert('Nội dung trống', 'Vui lòng nhập nội dung trước khi đăng.');
      return;
    }
    setBusyId(id);
    try {
      const save = await putAdminMarketingPost(id, { content });
      if (!save.ok) {
        Alert.alert('Lưu trước khi đăng thất bại', save.error);
        return;
      }
      const pub = await publishAdminMarketingPost(id);
      if (!pub.ok) {
        Alert.alert('Facebook từ chối', pub.error);
        return;
      }
      Alert.alert('Đã đăng Facebook', `Post ID: ${pub.data.facebookPostId}`);
      setDrafts((rows) => rows.filter((r) => r.id !== id));
      setEdits((e) => {
        const { [id]: _removed, ...rest } = e;
        return rest;
      });
    } catch (e) {
      Alert.alert('Lỗi', formatNetworkFailureMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  const onForceDraft = async (): Promise<void> => {
    setTriggerBusy(true);
    try {
      const res = await triggerAdminMarketingDraft();
      if (!res.ok) {
        Alert.alert('Tạo nháp thất bại', res.error);
        return;
      }
      await loadDrafts();
      Alert.alert('Đã tạo bản nháp AI', 'Kiểm tra danh sách bên dưới (cron tương tự, không gọi Facebook).');
    } catch (e) {
      Alert.alert('Lỗi', formatNetworkFailureMessage(e));
    } finally {
      setTriggerBusy(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      void loadDrafts();
    }, [loadDrafts])
  );

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <ScrollView
        contentContainerStyle={[styles.scroll, isWide && styles.scrollWide]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.85 }]}>
            <Ionicons name="chevron-back" size={24} color={theme.colors.text.primary} />
          </Pressable>
          <Text style={styles.screenTitle}>AI Social Media Desk</Text>
          <View style={styles.backSpacer} />
        </View>

        <View style={styles.hero} className={mergeWebClassNames('kn-glass')}>
          <Text style={styles.heroKicker}>Human-in-the-loop</Text>
          <Text style={styles.heroBody}>
            Cron chỉ tạo DRAFT. Bấm &quot;Duyệt &amp; đa ngữ&quot; để AI sinh bản dịch (VN · US/EN · KR · DE) — copy thủ công vào nhóm, không spam API.
            Đăng Page chính thức (một lần) tùy chọn qua Graph API.
          </Text>
          <Pressable
            onPress={() => void onForceDraft()}
            disabled={triggerBusy || !isRestApiConfigured()}
            style={({ pressed }) => [
              styles.forceDraftBtn,
              (triggerBusy || !isRestApiConfigured()) && styles.btnDisabled,
              pressed && { opacity: 0.9 },
            ]}
          >
            {triggerBusy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.forceDraftText}>Tạo bản nháp AI ngay (giống cron)</Text>
            )}
          </Pressable>
          {!isRestApiConfigured() ? (
            <Text style={styles.warn}>Chưa cấu hình EXPO_PUBLIC_REST_API_BASE — không gọi được máy chủ.</Text>
          ) : null}
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Đang tải bản nháp…</Text>
          </View>
        ) : drafts.length === 0 ? (
          <View style={styles.empty} className={mergeWebClassNames('kn-glass')}>
            <Text style={styles.emptyTitle}>Không có bản nháp DRAFT</Text>
            <Text style={styles.emptySub}>Chờ cron 9h / 18h hoặc bấm nút tạo nháp phía trên.</Text>
          </View>
        ) : (
          drafts.map((row) => {
            const busy = busyId === row.id;
            return (
              <View key={row.id} style={styles.card} className={mergeWebClassNames('kn-glass')}>
                <Text style={styles.cardMeta}>
                  {new Date(row.createdAt).toLocaleString('vi-VN')} · {row.id.slice(0, 8)}…
                </Text>
                <TextInput
                  multiline
                  value={edits[row.id] ?? row.content}
                  onChangeText={(t) => setEdits((e) => ({ ...e, [row.id]: t }))}
                  style={styles.textArea}
                  textAlignVertical="top"
                  placeholder="Nội dung bài đăng Facebook…"
                />
                <View style={[styles.actions, isWide && styles.actionsWide]}>
                  <Pressable
                    onPress={() => void onSave(row.id)}
                    disabled={busy}
                    style={({ pressed }) => [styles.btnSecondary, busy && styles.btnDisabled, pressed && { opacity: 0.88 }]}
                  >
                    <Text style={styles.btnSecondaryText}>Lưu thay đổi</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => onReject(row.id)}
                    disabled={busy}
                    style={({ pressed }) => [styles.btnDanger, busy && styles.btnDisabled, pressed && { opacity: 0.88 }]}
                  >
                    <Text style={styles.btnDangerText}>Từ chối (xóa)</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => void onApprovePolyglot(row.id)}
                    disabled={busy}
                    style={({ pressed }) => [styles.btnPolyglot, busy && styles.btnDisabled, pressed && { opacity: 0.92 }]}
                  >
                    {busy ? (
                      <ActivityIndicator color={theme.colors.onAccent} />
                    ) : (
                      <Text style={styles.btnPolyglotText}>Duyệt &amp; sinh đa ngữ (Polyglot)</Text>
                    )}
                  </Pressable>
                  <Pressable
                    onPress={() => void onApprovePublish(row.id)}
                    disabled={busy}
                    style={({ pressed }) => [styles.btnPublish, busy && styles.btnDisabled, pressed && { opacity: 0.92 }]}
                  >
                    <Text style={styles.btnPublishText}>Đăng Page chính thức (Graph API)</Text>
                  </Pressable>
                </View>

                <PolyglotAmmunitionSection
                  translations={row.translations}
                  onCopy={onCopyTranslation}
                  onOpenFacebook={onOpenFacebookManual}
                />
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { padding: theme.spacing.md, paddingBottom: 40, gap: theme.spacing.md },
  scrollWide: { maxWidth: 920, alignSelf: 'center', width: '100%' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  backBtn: { padding: 8, marginLeft: -4 },
  backSpacer: { width: 32 },
  screenTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: FontFamily.extrabold,
    fontSize: 17,
    color: theme.colors.text.primary,
  },
  hero: {
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
  },
  heroKicker: {
    fontFamily: FontFamily.semibold,
    fontSize: 12,
    color: theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroBody: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 21,
  },
  forceDraftBtn: {
    marginTop: theme.spacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  forceDraftText: { fontFamily: FontFamily.bold, fontSize: 14, color: '#fff' },
  warn: { fontFamily: FontFamily.medium, fontSize: 12, color: theme.colors.danger },
  loadingBox: { padding: 40, alignItems: 'center', gap: 12 },
  loadingText: { fontFamily: FontFamily.medium, color: theme.colors.text.secondary },
  empty: {
    padding: theme.spacing.xl,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    alignItems: 'center',
  },
  emptyTitle: { fontFamily: FontFamily.bold, fontSize: 16, color: theme.colors.text.primary },
  emptySub: {
    marginTop: 8,
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  card: {
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    gap: theme.spacing.sm,
  },
  cardMeta: { fontFamily: FontFamily.medium, fontSize: 11, color: theme.colors.text.secondary },
  textArea: {
    minHeight: 140,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    borderRadius: 12,
    padding: 12,
    fontFamily: FontFamily.regular,
    fontSize: 15,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.surface ?? theme.colors.background,
  },
  actions: { flexDirection: 'column', gap: 10, marginTop: 8 },
  actionsWide: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  btnSecondary: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    alignItems: 'center',
  },
  btnSecondaryText: { fontFamily: FontFamily.semibold, color: theme.colors.text.primary },
  btnDanger: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(220, 38, 38, 0.12)',
    alignItems: 'center',
  },
  btnDangerText: { fontFamily: FontFamily.semibold, color: '#b91c1c' },
  btnPublish: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  btnPublishText: { fontFamily: FontFamily.extrabold, fontSize: 15, color: '#052e1a' },
  btnPolyglot: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  btnPolyglotText: { fontFamily: FontFamily.extrabold, fontSize: 15, color: theme.colors.onAccent },
  ammoSection: { marginTop: theme.spacing.md, gap: theme.spacing.sm },
  ammoTitle: { fontFamily: FontFamily.extrabold, fontSize: 15, color: theme.colors.primaryBright },
  ammoSub: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },
  ammoCard: {
    marginTop: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    backgroundColor: theme.colors.surface,
    gap: 8,
  },
  ammoLang: { fontFamily: FontFamily.semibold, fontSize: 12, color: theme.colors.text.secondary },
  ammoBody: { fontFamily: FontFamily.regular, fontSize: 14, color: theme.colors.text.primary, lineHeight: 21 },
  ammoActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8, alignItems: 'stretch' },
  ammoCopyBtn: {
    flexGrow: 1,
    minHeight: 56,
    minWidth: 160,
    borderRadius: 14,
    backgroundColor: theme.colors.SignalBlue,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  ammoCopyBtnText: { fontFamily: FontFamily.extrabold, fontSize: 17, color: '#fff' },
  ammoFbBtn: {
    flexGrow: 1,
    minHeight: 48,
    minWidth: 140,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: 'rgba(85, 144, 224, 0.12)',
  },
  ammoFbBtnText: { fontFamily: FontFamily.bold, fontSize: 14, color: theme.colors.primaryBright },
  btnDisabled: { opacity: 0.45 },
});
