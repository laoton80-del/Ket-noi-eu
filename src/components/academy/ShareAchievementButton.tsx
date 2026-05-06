import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Share, StyleSheet, Text } from 'react-native';
import { FontFamily } from '../../theme/typography';

type ShareCardPayload = Readonly<{
  childNickname: string;
  cityLabel: string;
  rank: number;
  points: number;
}>;

function makeShareCardSvg(payload: ShareCardPayload): string {
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
  <text x="540" y="190" fill="#ffffff" text-anchor="middle" font-size="64" font-family="Arial" font-weight="700">ViGlobal</text>
  <text x="540" y="258" fill="#dbeafe" text-anchor="middle" font-size="36" font-family="Arial">Viet-Kids Bảng Vàng Danh Vọng</text>
  <text x="540" y="430" fill="#fef3c7" text-anchor="middle" font-size="72" font-family="Arial" font-weight="700">Hạng ${payload.rank}</text>
  <text x="540" y="510" fill="#ffffff" text-anchor="middle" font-size="56" font-family="Arial" font-weight="700">${payload.childNickname}</text>
  <text x="540" y="572" fill="#e2e8f0" text-anchor="middle" font-size="38" font-family="Arial">${payload.cityLabel}</text>
  <text x="540" y="700" fill="#f0fdf4" text-anchor="middle" font-size="44" font-family="Arial" font-weight="700">${payload.points} điểm tuần này</text>
  <text x="540" y="830" fill="#fef9c3" text-anchor="middle" font-size="34" font-family="Arial">Con tự hào - Bố mẹ hạnh phúc</text>
</svg>`;
}

export function ShareAchievementButton({
  childNickname,
  cityLabel,
  rank,
  points,
}: ShareCardPayload) {
  const [sharing, setSharing] = useState(false);

  const onShare = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const cacheDir = FileSystem.cacheDirectory;
      if (!cacheDir) {
        Alert.alert('Không thể chia sẻ', 'Thiết bị chưa sẵn sàng bộ nhớ tạm để tạo ảnh thành tích.');
        return;
      }
      const svg = makeShareCardSvg({ childNickname, cityLabel, rank, points });
      const fileUri = `${cacheDir}viglobal-vietkids-rank-${Date.now()}.svg`;
      await FileSystem.writeAsStringAsync(fileUri, svg);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, { dialogTitle: 'Khoe Thành Tích Viet-Kids' });
      } else {
        await Share.share({
          title: 'Khoe Thành Tích Viet-Kids',
          message: `${childNickname} đang ở Hạng ${rank} tại ${cityLabel} - ${points} điểm Viet-Kids tuần này!`,
          url: fileUri,
        });
      }
    } catch {
      Alert.alert('Không thể chia sẻ', 'Hệ thống chia sẻ đang bận, vui lòng thử lại sau.');
    } finally {
      setSharing(false);
    }
  };

  return (
    <Pressable style={({ pressed }) => [styles.btn, pressed && { opacity: 0.9 }]} onPress={() => void onShare()}>
      {sharing ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Ionicons name="share-social" size={16} color="#FFFFFF" />}
      <Text style={styles.btnText}>Khoe Thành Tích</Text>
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
