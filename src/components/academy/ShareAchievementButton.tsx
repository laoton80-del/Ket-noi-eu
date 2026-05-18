import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Share, StyleSheet, Text } from 'react-native';
import i18n, { useTranslation } from '../../i18n';
import { FontFamily } from '../../theme/typography';

type ShareCardPayload = Readonly<{
  childNickname: string;
  cityLabel: string;
  rank: number;
  points: number;
}>;

function makeShareCardSvg(payload: ShareCardPayload, locale: 'vi' | 'en'): string {
  const t = i18n.getFixedT(locale);
  const brand = t('academySub.share.brand');
  const subtitle = t('academySub.share.cardSubtitle');
  const rankLabel = t('academySub.share.rankLabel', { rank: payload.rank });
  const pointsLine = t('academySub.share.pointsLine', { points: payload.points });
  const tagline = t('academySub.share.tagline');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1080" height="1080" viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0ea5e9"/>
      <stop offset="100%" stop-color="#7c3aed"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1080" fill="url(#bg)"/>
  <rect x="80" y="80" width="920" height="920" rx="56" fill="rgba(255,255,255,0.14)" stroke="rgba(255,255,255,0.38)" stroke-width="3"/>
  <text x="540" y="190" fill="#ffffff" text-anchor="middle" font-size="64" font-family="Arial" font-weight="700">${brand}</text>
  <text x="540" y="258" fill="#dbeafe" text-anchor="middle" font-size="32" font-family="Arial">${subtitle}</text>
  <text x="540" y="430" fill="#fef3c7" text-anchor="middle" font-size="64" font-family="Arial" font-weight="700">${rankLabel}</text>
  <text x="540" y="510" fill="#ffffff" text-anchor="middle" font-size="56" font-family="Arial" font-weight="700">${payload.childNickname}</text>
  <text x="540" y="572" fill="#e2e8f0" text-anchor="middle" font-size="38" font-family="Arial">${payload.cityLabel}</text>
  <text x="540" y="700" fill="#f0fdf4" text-anchor="middle" font-size="40" font-family="Arial" font-weight="700">${pointsLine}</text>
  <text x="540" y="830" fill="#fef9c3" text-anchor="middle" font-size="30" font-family="Arial">${tagline}</text>
</svg>`;
}

export function ShareAchievementButton({
  childNickname,
  cityLabel,
  rank,
  points,
}: ShareCardPayload) {
  const { t, i18n: i18nInstance } = useTranslation();
  const [sharing, setSharing] = useState(false);
  const locale = i18nInstance.language?.startsWith('vi') ? 'vi' : 'en';

  const onShare = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const cacheDir = FileSystem.cacheDirectory;
      if (!cacheDir) {
        Alert.alert(t('academySub.share.errorTitle'), t('academySub.share.errorStorage'));
        return;
      }
      const svg = makeShareCardSvg({ childNickname, cityLabel, rank, points }, locale);
      const fileUri = `${cacheDir}viona-vietkids-rank-${Date.now()}.svg`;
      await FileSystem.writeAsStringAsync(fileUri, svg);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, { dialogTitle: t('academySub.share.dialogTitle') });
      } else {
        await Share.share({
          title: t('academySub.share.dialogTitle'),
          message: t('academySub.share.shareMessage', { nickname: childNickname, rank, city: cityLabel, points }),
          url: fileUri,
        });
      }
    } catch {
      Alert.alert(t('academySub.share.errorTitle'), t('academySub.share.errorBusy'));
    } finally {
      setSharing(false);
    }
  };

  return (
    <Pressable style={({ pressed }) => [styles.btn, pressed && { opacity: 0.9 }]} onPress={() => void onShare()}>
      {sharing ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <Ionicons name="share-social" size={16} color="#FFFFFF" />
      )}
      <Text style={styles.btnText}>{t('academySub.share.button')}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    minHeight: 42,
    borderRadius: 999,
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  btnText: { color: '#FFFFFF', fontSize: 13, fontFamily: FontFamily.bold },
});
