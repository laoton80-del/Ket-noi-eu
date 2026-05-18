import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { getVioCreditsLabel } from '../../core/monetization/vioDisplayLabels';
import i18n, { useTranslation } from '../../i18n';
import type { MonthlyWinner } from '../../services/academy/MonthlyRewardService';
import { FontFamily } from '../../theme/typography';

type CertificateLocale = 'vi' | 'en';

function resolveCertificateLocale(countryCode: string): CertificateLocale {
  const cc = countryCode.trim().toUpperCase();
  if (cc === 'US' || cc === 'AU' || cc === 'GB') return 'en';
  return 'vi';
}

type CertStrings = Readonly<{
  brand: string;
  title: string;
  line1: string;
  line2: string;
  rewardLabel: string;
  rewardValue: string;
  issueDate: string;
  signature: string;
  footer: string;
  button: string;
}>;

function getCertStrings(locale: CertificateLocale, winner: MonthlyWinner): CertStrings {
  const t = i18n.getFixedT(locale);
  const credits = getVioCreditsLabel();
  return {
    brand: t('academySub.certificate.brand'),
    title: t('academySub.certificate.cardTitle'),
    line1: t(locale === 'en' ? 'academySub.certificate.line1En' : 'academySub.certificate.line1Vi'),
    line2: t('academySub.certificate.line2'),
    rewardLabel: t('academySub.certificate.reward'),
    rewardValue: t('academySub.certificate.rewardValue', {
      amount: String(winner.rewardVigTokens),
      credits,
    }),
    issueDate: t('academySub.certificate.issueDate'),
    signature: t('academySub.certificate.signature'),
    footer: t('academySub.certificate.footerDisclaimer'),
    button: t('academySub.certificate.button'),
  };
}

function buildCertificateSvg(winner: MonthlyWinner, copy: CertStrings): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1600" height="1100" viewBox="0 0 1600 1100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fef9c3"/>
      <stop offset="100%" stop-color="#fde68a"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="1100" fill="url(#bg)"/>
  <rect x="46" y="46" width="1508" height="1008" rx="34" fill="none" stroke="#b45309" stroke-width="7"/>
  <rect x="70" y="70" width="1460" height="960" rx="28" fill="rgba(255,255,255,0.72)" stroke="#d97706" stroke-width="2"/>
  <text x="800" y="140" fill="#7c2d12" text-anchor="middle" font-size="48" font-family="Georgia" font-weight="700">${copy.brand}</text>
  <text x="800" y="230" fill="#92400e" text-anchor="middle" font-size="80" font-family="Georgia" font-weight="700">${copy.title}</text>
  <text x="800" y="310" fill="#7c2d12" text-anchor="middle" font-size="36" font-family="Georgia">${copy.line1}</text>
  <text x="800" y="460" fill="#6b210f" text-anchor="middle" font-size="68" font-family="Georgia" font-weight="700">${winner.childNickname}</text>
  <text x="800" y="530" fill="#78350f" text-anchor="middle" font-size="40" font-family="Georgia">${winner.cityLabel} · ${copy.line2}</text>
  <text x="800" y="600" fill="#92400e" text-anchor="middle" font-size="38" font-family="Georgia">${winner.achievementLabel}</text>
  <text x="800" y="660" fill="#a16207" text-anchor="middle" font-size="32" font-family="Georgia">${copy.rewardLabel}: ${copy.rewardValue}</text>
  <text x="300" y="860" fill="#7c2d12" text-anchor="middle" font-size="30" font-family="Georgia">${copy.issueDate}: ${winner.monthKey}</text>
  <text x="1290" y="860" fill="#7c2d12" text-anchor="middle" font-size="34" font-family="cursive">${copy.signature}</text>
  <text x="800" y="980" fill="#92400e" text-anchor="middle" font-size="26" font-family="Georgia">${copy.footer}</text>
</svg>`;
}

export function CertificateGenerator({
  winner,
}: Readonly<{
  winner: MonthlyWinner;
}>) {
  const { t } = useTranslation();
  const [exporting, setExporting] = useState(false);
  const locale = resolveCertificateLocale(winner.countryCode);
  const copy = useMemo(() => getCertStrings(locale, winner), [locale, winner]);
  const creditsLabel = getVioCreditsLabel();

  const onDownloadOrPrint = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const baseDir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
      if (!baseDir) {
        Alert.alert(t('academySub.certificate.exportErrorTitle'), t('academySub.certificate.exportErrorStorage'));
        return;
      }
      const svg = buildCertificateSvg(winner, copy);
      const { uri: shareUri } = await Print.printToFileAsync({
        html: `<html><body style="margin:0;padding:0;background:#fff"><div style="width:1600px;height:1100px">${svg}</div></body></html>`,
        width: 1600,
        height: 1100,
        base64: false,
      });
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        await Share.share({
          title: copy.title,
          message: `${winner.childNickname} - ${winner.achievementLabel}`,
          url: shareUri,
        });
        return;
      }
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(shareUri, { dialogTitle: copy.title });
      } else {
        await Share.share({
          title: copy.title,
          message: `${winner.childNickname} - ${winner.achievementLabel}`,
          url: shareUri,
        });
      }
    } catch {
      Alert.alert(t('academySub.certificate.exportErrorTitle'), t('academySub.certificate.exportErrorRetry'));
    } finally {
      setExporting(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.previewBadge}>{t('academySub.common.litePilotBadge')}</Text>
      <Text style={styles.bigTitle}>{copy.title}</Text>
      <Text style={styles.name}>{winner.childNickname}</Text>
      <Text style={styles.achievement}>{winner.achievementLabel}</Text>
      <Text style={styles.reward}>
        {t('academySub.certificate.reward')}:{' '}
        {t('academySub.certificate.rewardValue', {
          amount: String(winner.rewardVigTokens),
          credits: creditsLabel,
        })}
      </Text>
      <Text style={styles.sign}>{t('academySub.certificate.sign')}</Text>
      <Text style={styles.footer}>{t('academySub.certificate.footerDisclaimer')}</Text>
      <Pressable style={({ pressed }) => [styles.btn, pressed && { opacity: 0.9 }]} onPress={() => void onDownloadOrPrint()}>
        {exporting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.btnText}>{copy.button}</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: 3,
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
    padding: 14,
    alignItems: 'center',
    gap: 4,
  },
  previewBadge: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    color: '#6D28D9',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  bigTitle: { color: '#7C2D12', fontSize: 22, fontFamily: FontFamily.extrabold, textAlign: 'center' },
  name: { color: '#78350F', fontSize: 24, fontFamily: FontFamily.bold },
  achievement: { color: '#92400E', fontSize: 14, fontFamily: FontFamily.medium, textAlign: 'center' },
  reward: { color: '#B45309', fontSize: 13, fontFamily: FontFamily.bold, textAlign: 'center' },
  sign: { color: '#7C2D12', fontSize: 14, fontFamily: FontFamily.medium, marginTop: 2 },
  footer: {
    color: '#92400E',
    fontSize: 11,
    fontFamily: FontFamily.medium,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 4,
  },
  btn: {
    marginTop: 6,
    minHeight: 40,
    borderRadius: 999,
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { color: '#FFFFFF', fontSize: 12, fontFamily: FontFamily.bold },
});
