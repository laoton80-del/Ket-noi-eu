import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { UsageHistoryItem } from '../../services/history';
import { Colors } from '../../theme/colors';
import { FontFamily } from '../../theme/typography';

type Props = {
  items: UsageHistoryItem[];
};

function viType(type: UsageHistoryItem['type']): string {
  if (type === 'interpreter') return 'Phiên dịch';
  if (type === 'leona') return 'Leona';
  if (type === 'booking') return 'Đặt lịch';
  if (type === 'ocr') return 'Quét giấy tờ';
  if (type === 'emergency') return 'SOS';
  return 'Cuộc gọi';
}

export const TrustHistoryCard: React.FC<Props> = ({ items }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Lịch sử gần đây</Text>
      {items.length === 0 ? (
        <Text style={styles.empty}>Chưa có hoạt động nào gần đây.</Text>
      ) : (
        items.slice(0, 8).map((item) => (
          <View key={item.id} style={styles.row}>
            <Text style={styles.type}>{viType(item.type)}</Text>
            <Text style={[styles.status, item.status === 'success' ? styles.ok : styles.fail]}>
              {item.status === 'success' ? 'Thành công' : 'Thất bại'}
            </Text>
          </View>
        ))
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: { borderRadius: 18, borderWidth: 1, borderColor: Colors.glassBorder, backgroundColor: Colors.glass, padding: 14, marginBottom: 12, gap: 8 },
  title: { fontSize: 16, color: Colors.text, fontFamily: FontFamily.bold },
  empty: { fontSize: 13, color: Colors.textSoft, fontFamily: FontFamily.regular },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  type: { fontSize: 13, color: Colors.textSoft, fontFamily: FontFamily.medium },
  status: { fontSize: 13, fontFamily: FontFamily.semibold },
  ok: { color: '#166534' },
  fail: { color: '#991B1B' },
});
