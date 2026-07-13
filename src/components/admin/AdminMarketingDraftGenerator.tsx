import { useState, type ReactElement } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { formatNetworkFailureMessage } from '../../services/apiClient';
import { postAdminMarketingGenerateDraft } from '../../services/viGlobalAdminApi';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';

export type AdminMarketingDraftGeneratorProps = Readonly<{
  /** Called after a draft is successfully generated, so the host screen can refresh its list. */
  onDraftGenerated?: (marketingPostId: string) => void;
}>;

type GeneratedResult = Readonly<{
  content: string;
  toolName: string;
  confidence: number;
}>;

/**
 * Pack32.4 — Marketing Admin Dashboard UI Integration (see
 * docs/internal-ops/VIONA_PACK32_4_MARKETING_ADMIN_UI_PLAN.md §4). READ → DISPLAY only:
 * (1) render a form (Topic, Tone, Target language), (2) call the existing, unmodified
 * `POST /api/admin/marketing/generate-draft` (Pack32.3), (3) show the returned draft content as
 * read-only text. This component intentionally contains NO publish / share / social-platform
 * action of any kind — the only way a generated draft can ever become public is via the
 * existing, separate, human-operated `publish`/`approve-and-translate`/`delete` controls already
 * rendered for every DRAFT row by the host screen.
 */
export function AdminMarketingDraftGenerator(props: AdminMarketingDraftGeneratorProps): ReactElement {
  const { onDraftGenerated } = props;

  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('');
  const [targetLanguageCode, setTargetLanguageCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratedResult | null>(null);

  const isFormValid =
    topic.trim().length > 0 && tone.trim().length > 0 && targetLanguageCode.trim().length > 0;

  const onGenerate = async (): Promise<void> => {
    if (!isFormValid || submitting) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await postAdminMarketingGenerateDraft({
        topic: topic.trim(),
        tone: tone.trim(),
        targetLanguageCode: targetLanguageCode.trim(),
      });
      if (!res.ok) {
        setErrorMessage(res.error);
        return;
      }
      setResult({
        content: res.data.content,
        toolName: res.data.toolName,
        confidence: res.data.confidence,
      });
      onDraftGenerated?.(res.data.marketingPostId);
    } catch (e) {
      setErrorMessage(formatNetworkFailureMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>AI Draft Generator</Text>
      <Text style={styles.subtitle}>
        Tạo bản nháp mới theo yêu cầu — kết quả chỉ hiển thị để xem, xuất hiện trong danh sách bên
        dưới để duyệt/đăng như bình thường.
      </Text>

      <TextInput
        value={topic}
        onChangeText={setTopic}
        style={styles.input}
        placeholder="Chủ đề (Topic) — vd: khuyến mãi mùa hè"
        placeholderTextColor={theme.colors.text.secondary}
        editable={!submitting}
      />
      <TextInput
        value={tone}
        onChangeText={setTone}
        style={styles.input}
        placeholder="Giọng văn (Tone) — vd: upbeat, professional"
        placeholderTextColor={theme.colors.text.secondary}
        editable={!submitting}
      />
      <TextInput
        value={targetLanguageCode}
        onChangeText={setTargetLanguageCode}
        style={styles.input}
        placeholder="Mã ngôn ngữ (Target language) — vd: vi, en, de"
        placeholderTextColor={theme.colors.text.secondary}
        editable={!submitting}
      />

      <Pressable
        onPress={() => void onGenerate()}
        disabled={!isFormValid || submitting}
        style={({ pressed }) => [
          styles.generateBtn,
          (!isFormValid || submitting) && styles.btnDisabled,
          pressed && { opacity: 0.9 },
        ]}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.generateBtnText}>Generate Draft</Text>
        )}
      </Pressable>

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      {result ? (
        <View style={styles.resultBox}>
          <Text style={styles.resultMeta}>
            {result.toolName} · confidence {result.confidence.toFixed(2)}
          </Text>
          <TextInput
            value={result.content}
            editable={false}
            multiline
            style={styles.resultText}
            textAlignVertical="top"
          />
          <Text style={styles.resultHint}>
            Cuộn xuống danh sách bên dưới để xem, chỉnh sửa, duyệt hoặc đăng bản nháp này.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    gap: theme.spacing.sm,
  },
  title: { fontFamily: FontFamily.extrabold, fontSize: 16, color: theme.colors.text.primary },
  subtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    borderRadius: 12,
    padding: 12,
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.surface ?? theme.colors.background,
  },
  generateBtn: {
    marginTop: theme.spacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateBtnText: { fontFamily: FontFamily.bold, fontSize: 14, color: '#fff' },
  btnDisabled: { opacity: 0.45 },
  errorText: { fontFamily: FontFamily.medium, fontSize: 12, color: theme.colors.danger },
  resultBox: {
    marginTop: theme.spacing.sm,
    gap: 8,
    padding: theme.spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    backgroundColor: theme.colors.surface,
  },
  resultMeta: { fontFamily: FontFamily.semibold, fontSize: 11, color: theme.colors.text.secondary },
  resultText: {
    minHeight: 120,
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: theme.colors.text.primary,
    lineHeight: 21,
  },
  resultHint: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: theme.colors.text.secondary,
  },
});
