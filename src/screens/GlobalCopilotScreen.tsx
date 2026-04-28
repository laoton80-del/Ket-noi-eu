import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrecisePanel } from '../components/ui/PrecisePanel';
import { draftGlobalDocument } from '../services/ai/CopilotClient';
import { useRegionState } from '../state/region';
import { chargeWalletServer } from '../state/wallet';
import { theme } from '../theme/theme';
import { FontFamily } from '../theme/typography';
import { generateChargeKey } from '../utils/idempotency';

export function GlobalCopilotScreen() {
  const { currentCountry, localLanguage } = useRegionState();
  const [intent, setIntent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [draft, setDraft] = useState('');

  const canGenerate = intent.trim().length > 0 && !isGenerating;

  const onGenerate = async () => {
    if (!canGenerate) return;
    setIsGenerating(true);
    try {
      const chargeResult = await chargeWalletServer('business_copilot_draft', generateChargeKey('copilot'));
      if (!chargeResult.ok) {
        if (chargeResult.error === 'insufficient_funds') {
          Alert.alert('Khong du Credits', 'Ban can nap them Credits de tao van ban voi Global Copilot.');
        } else {
          Alert.alert('Thanh toan that bai', 'Khong the tru Credits luc nay. Vui long thu lai sau.');
        }
        return;
      }
      const generated = await draftGlobalDocument(intent, currentCountry, localLanguage);
      setDraft(generated);
    } catch {
      Alert.alert('Khong the tao van ban', 'He thong AI tam thoi khong phan hoi. Vui long thu lai sau.');
    } finally {
      setIsGenerating(false);
    }
  };

  const onCopy = async () => {
    if (!draft) return;
    await Clipboard.setStringAsync(draft);
    Alert.alert('Da sao chep', 'Noi dung van ban da duoc sao chep vao clipboard.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Global Copilot</Text>
          <Text style={styles.subtitle}>
            Drafting in {localLanguage} ({currentCountry})
          </Text>
        </View>

        <PrecisePanel style={styles.inputPanel}>
          <Text style={styles.panelLabel}>Intent</Text>
          <TextInput
            value={intent}
            onChangeText={setIntent}
            style={styles.input}
            placeholder="Gach dau dong y muon cua ban..."
            placeholderTextColor={theme.colors.text.secondary}
            multiline
            textAlignVertical="top"
          />
        </PrecisePanel>

        <Pressable
          onPress={() => void onGenerate()}
          disabled={!canGenerate}
          style={({ pressed }) => [styles.generateBtn, !canGenerate && styles.generateBtnDisabled, pressed && { opacity: 0.8 }]}
        >
          {isGenerating ? <ActivityIndicator color={theme.components.button.variant.primary.text} /> : null}
          <Text style={styles.generateBtnText}>Generate Document (30 Credits)</Text>
        </Pressable>

        {draft ? (
          <PrecisePanel>
            <Text style={styles.resultLabel}>Generated Document</Text>
            <Text style={styles.resultText}>{draft}</Text>
            <Pressable onPress={() => void onCopy()} style={({ pressed }) => [styles.copyBtn, pressed && { opacity: 0.8 }]}>
              <Text style={styles.copyBtnText}>Copy to Clipboard</Text>
            </Pressable>
          </PrecisePanel>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.DeepInkNavy,
  },
  content: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  header: {
    gap: theme.spacing.xs,
  },
  title: {
    ...theme.typeScale.h2,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.CeolWhite,
  },
  subtitle: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.secondary,
  },
  inputPanel: {
    gap: theme.spacing.sm,
  },
  panelLabel: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.semibold,
    color: theme.colors.text.primary,
  },
  input: {
    minHeight: 180,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.executive.panelMuted,
    color: theme.colors.text.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    ...theme.typeScale.body,
  },
  generateBtn: {
    minHeight: theme.components.button.height.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.components.button.variant.primary.border,
    backgroundColor: theme.components.button.variant.primary.background,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  generateBtnDisabled: {
    opacity: 0.6,
  },
  generateBtnText: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.bold,
    color: theme.components.button.variant.primary.text,
  },
  resultLabel: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  resultText: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.secondary,
    lineHeight: theme.typeScale.body.lineHeight,
  },
  copyBtn: {
    marginTop: theme.spacing.md,
    minHeight: theme.components.button.height.sm,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.components.button.variant.secondary.border,
    backgroundColor: theme.components.button.variant.secondary.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyBtnText: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.semibold,
    color: theme.components.button.variant.secondary.text,
  },
});
