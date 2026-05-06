import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../../navigation/routes';
import {
  AD_VERTICAL,
  type AdVertical,
  formatAdExportMarkdown,
  generateFacebookGoogleAdPack,
  generateAllVerticalPacks,
} from '../../services/marketing/AdContentGenerator';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';
import { applyWebStyles, mergeWebClassNames } from '../../utils/applyWebStyles';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const VERTICAL_CHIPS: readonly { id: AdVertical; label: string }[] = [
  { id: AD_VERTICAL.NAILS_SPA, label: 'Nails / Spa' },
  { id: AD_VERTICAL.WHOLESALE, label: 'Wholesale' },
  { id: AD_VERTICAL.HOSPITALITY, label: 'Hospitality' },
] as const;

export function AdContentFactoryScreen() {
  const navigation = useNavigation<Nav>();
  const [selected, setSelected] = useState<AdVertical>(AD_VERTICAL.NAILS_SPA);

  const pack = useMemo(() => generateFacebookGoogleAdPack(selected), [selected]);
  const exportAll = useMemo(() => generateAllVerticalPacks().map((p) => formatAdExportMarkdown(p)).join('\n---\n'), []);

  const onCopyExport = useCallback(() => {
    const md = formatAdExportMarkdown(pack);
    Alert.alert(
      'Xuất nội dung (mock)',
      `Đã chuẩn bị ${md.length} ký tự Markdown — production: Clipboard.setStringAsync.`,
      [{ text: 'OK' }]
    );
  }, [pack]);

  const onExportAll = useCallback(() => {
    Alert.alert('Xuất cả 3 vertical (mock)', `${exportAll.length} ký tự — clipboard wiring trong phase kế tiếp.`);
  }, [exportAll.length]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.85 }]}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.text.primary} />
        </Pressable>
        <Text style={styles.topTitle} numberOfLines={1}>
          Xưởng nội dung quảng cáo
        </Text>
        <View style={styles.topSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero} className={mergeWebClassNames('kn-glass', 'kn-neon-b2b')}>
          <Text style={styles.heroTitle}>📢 AI AD FACTORY</Text>
          <Text style={styles.heroSub}>
            Facebook / Google — headline + FOMO + RSA (mock). Chọn vertical để sinh bản creative tĩnh (thay bằng LLM sau).
          </Text>
        </View>

        <View style={styles.chipRow}>
          {VERTICAL_CHIPS.map((c) => {
            const on = c.id === selected;
            return (
              <Pressable
                key={c.id}
                onPress={() => setSelected(c.id)}
                style={({ pressed }) => [
                  styles.chip,
                  on && styles.chipOn,
                  pressed && { opacity: 0.88 },
                ]}
                className={mergeWebClassNames('kn-glass', on ? 'kn-neon-b2b' : undefined)}
              >
                <Text style={[styles.chipText, on && styles.chipTextOn]}>{c.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.block} className={mergeWebClassNames('kn-glass', 'kn-neon-b2b')}>
          <Text style={styles.blockLabel}>HEADLINE</Text>
          <Text style={styles.blockBody}>{pack.headline}</Text>
          <Text style={styles.blockLabel}>ALT</Text>
          <Text style={styles.blockBody}>{pack.headlineAlt}</Text>
          <Text style={styles.blockLabel}>SUBHEAD</Text>
          <Text style={styles.blockBody}>{pack.subheadline}</Text>
          <Text style={styles.blockLabel}>BODY</Text>
          <Text style={styles.blockBody}>{pack.bodyPrimary}</Text>
          <Text style={styles.blockLabel}>FOMO</Text>
          <Text style={styles.blockFomo}>{pack.bodyFomo}</Text>
          <Text style={styles.blockLabel}>CTA</Text>
          <Text style={styles.blockCta}>{pack.cta}</Text>
          <Text style={styles.blockLabel}>GOOGLE DESCRIPTIONS</Text>
          <Text style={styles.blockSmall}>{pack.googleDescriptionLine1}</Text>
          <Text style={styles.blockSmall}>{pack.googleDescriptionLine2}</Text>
          <Text style={styles.blockLabel}>RSA</Text>
          {pack.rsaHeadlines.map((h, idx) => (
            <Text key={`${pack.vertical}-rsa-${idx.toString()}`} style={styles.rsaLine}>
              • {h}
            </Text>
          ))}
          <Text style={styles.blockLabel}>HASHTAGS</Text>
          <Text style={styles.tags}>{pack.suggestedHashtags.join(' ')}</Text>
        </View>

        <View style={styles.actions}>
          <Pressable onPress={onCopyExport} style={({ pressed }) => [styles.btn, pressed && { opacity: 0.9 }]}>
            <Ionicons name="copy-outline" size={18} color={theme.colors.onAccent} />
            <Text style={styles.btnText}>Sao chép pack (mock)</Text>
          </Pressable>
          <Pressable onPress={onExportAll} style={({ pressed }) => [styles.btnSecondary, pressed && { opacity: 0.9 }]}>
            <Text style={styles.btnSecondaryText}>Xuất cả 3 vertical (mock)</Text>
          </Pressable>
        </View>

        <View style={styles.preview} className={applyWebStyles('kn-glass')}>
          <Text style={styles.previewTitle}>Markdown preview (rút gọn)</Text>
          <Text style={styles.previewMono} numberOfLines={12}>
            {formatAdExportMarkdown(pack)}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0B1220' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 6,
  },
  backBtn: { padding: 8 },
  topTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontFamily: FontFamily.bold,
    color: theme.colors.text.primary,
  },
  topSpacer: { width: 40 },
  scroll: { padding: 16, paddingBottom: 48, gap: 14 },
  hero: {
    padding: 16,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: 8,
  },
  heroTitle: {
    fontSize: 18,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.primaryBright,
  },
  heroSub: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
  },
  chipOn: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(197, 160, 89, 0.15)',
  },
  chipText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: theme.colors.text.secondary,
  },
  chipTextOn: {
    color: theme.colors.primaryBright,
  },
  block: {
    padding: 14,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: 8,
  },
  blockLabel: {
    fontSize: 10,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.primaryBright,
    letterSpacing: 0.6,
    marginTop: 4,
  },
  blockBody: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: theme.colors.text.primary,
    lineHeight: 20,
  },
  blockFomo: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    color: theme.colors.PendingAmber,
    lineHeight: 20,
  },
  blockCta: {
    fontSize: 14,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.success,
  },
  blockSmall: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },
  rsaLine: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: theme.colors.text.primary,
    lineHeight: 18,
  },
  tags: {
    fontSize: 11,
    fontFamily: FontFamily.semibold,
    color: theme.colors.text.secondary,
  },
  actions: { gap: 10 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: theme.radius.md,
    backgroundColor: theme.components.button.variant.primary.background,
    borderWidth: 1,
    borderColor: theme.components.button.variant.primary.border,
  },
  btnText: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: theme.components.button.variant.primary.text,
  },
  btnSecondary: {
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.45)',
    alignItems: 'center',
  },
  btnSecondaryText: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: theme.colors.primaryBright,
  },
  preview: {
    padding: 12,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    gap: 8,
  },
  previewTitle: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: theme.colors.text.secondary,
  },
  previewMono: {
    fontSize: 10,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.tertiary,
    lineHeight: 15,
  },
});
