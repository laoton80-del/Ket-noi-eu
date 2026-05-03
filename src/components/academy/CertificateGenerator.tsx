import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import type { MonthlyWinner } from '../../services/academy/MonthlyRewardService';
import { FontFamily } from '../../theme/typography';

type CertificateLocale = 'vi' | 'en';

function resolveCertificateLocale(countryCode: string): CertificateLocale {
  const cc = countryCode.trim().toUpperCase();
  if (cc === 'US' || cc === 'AU' || cc === 'GB') return 'en';
  return 'vi';
}

function certCopy(locale: CertificateLocale): Readonly<{
  app: string;
  title: string;
  line1: string;
  line2: string;
  reward: string;
  issueDate: string;
  signature: string;
  button: string;
}> {
  if (locale === 'en') {
    return {
      app: 'ViGlobal Academy',
      title: 'CERTIFICATE',
      line1: 'Outstanding Viet-Kids learner recognition',
      line2: 'Achievement',
      reward: 'Reward',
      issueDate: 'Issued',
      signature: 'AI Teacher',
      button: 'Download / Print Certificate',
    };
  }
  return {
    app: 'ViGlobal Academy',
    title: 'GIẤY KHEN',
    line1: 'Vinh danh học viên xuất sắc Viet-Kids',
    line2: 'Thành tích',
    reward: 'Thưởng',
    issueDate: 'Ngày cấp',
    signature: 'Cô Giáo AI',
    button: 'Tải Xuống / In Giấy Khen',
  };
}

function buildCertificateSvg(winner: MonthlyWinner, locale: CertificateLocale): string {
  const copy = certCopy(locale);
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
  <text x="800" y="160" fill="#7c2d12" text-anchor="middle" font-size="56" font-family="Georgia" font-weight="700">${copy.app}</text>
  <text x="800" y="260" fill="#92400e" text-anchor="middle" font-size="96" font-family="Georgia" font-weight="700">${copy.title}</text>
  <text x="800" y="356" fill="#7c2d12" text-anchor="middle" font-size="42" font-family="Georgia">${copy.line1}</text>
  <text x="800" y="500" fill="#6b210f" text-anchor="middle" font-size="72" font-family="Georgia" font-weight="700">${winner.childNickname}</text>
  <text x="800" y="574" fill="#78350f" text-anchor="middle" font-size="44" font-family="Georgia">${winner.cityLabel} - Hạng ${winner.rank}</text>
  <text x="800" y="650" fill="#92400e" text-anchor="middle" font-size="44" font-family="Georgia">${copy.line2}: ${winner.achievementLabel}</text>
  <text x="800" y="716" fill="#a16207" text-anchor="middle" font-size="34" font-family="Georgia">${copy.reward}: ${winner.rewardVigTokens} VIG Token</text>
  <text x="300" y="920" fill="#7c2d12" text-anchor="middle" font-size="34" font-family="Georgia">${copy.issueDate}: ${winner.monthKey}</text>
  <text x="1290" y="920" fill="#7c2d12" text-anchor="middle" font-size="40" font-family="cursive">${copy.signature}</text>
</svg>`;
}

export function CertificateGenerator({
  winner,
}: Readonly<{
  winner: MonthlyWinner;
}>) {
  const [exporting, setExporting] = useState(false);

  const onDownloadOrPrint = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const locale = resolveCertificateLocale(winner.countryCode);
      const copy = certCopy(locale);
      const baseDir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
      if (!baseDir) {
        Alert.alert('Không thể tạo giấy khen', 'Thiết bị chưa sẵn sàng bộ nhớ tạm.');
        return;
      }
      const svg = buildCertificateSvg(winner, locale);
      const html = `<html><body style="margin:0;padding:0;background:#fff"><div style="width:1600px;height:1100px">${svg}</div></body></html>`;
      const { uri: pdfUri } = await Print.printToFileAsync({
        html,
        width: 1600,
        height: 1100,
        base64: false,
      });
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        await Share.share({
          title: copy.title,
          message: `${winner.childNickname} - ${winner.achievementLabel}`,
          url: pdfUri,
        });
        return;
      }
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(pdfUri, { dialogTitle: copy.title });
      } else {
        await Share.share({
          title: copy.title,
          message: `${winner.childNickname} - ${winner.achievementLabel}`,
          url: pdfUri,
        });
      }
    } catch {
      Alert.alert('Không thể xuất giấy khen', 'Vui lòng thử lại sau.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.bigTitle}>GIẤY KHEN</Text>
      <Text style={styles.name}>{winner.childNickname}</Text>
      <Text style={styles.achievement}>{winner.achievementLabel}</Text>
      <Text style={styles.reward}>Thưởng: {winner.rewardVigTokens} VIG Token</Text>
      <Text style={styles.sign}>Ký tên: Cô Giáo AI</Text>
      <Pressable style={({ pressed }) => [styles.btn, pressed && { opacity: 0.9 }]} onPress={() => void onDownloadOrPrint()}>
        {exporting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.btnText}>{certCopy(resolveCertificateLocale(winner.countryCode)).button}</Text>}
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
  bigTitle: { color: '#7C2D12', fontSize: 28, fontFamily: FontFamily.extrabold },
  name: { color: '#78350F', fontSize: 24, fontFamily: FontFamily.bold },
  achievement: { color: '#92400E', fontSize: 14, fontFamily: FontFamily.medium, textAlign: 'center' },
  reward: { color: '#B45309', fontSize: 13, fontFamily: FontFamily.bold },
  sign: { color: '#7C2D12', fontSize: 16, fontFamily: FontFamily.medium, marginTop: 2 },
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
