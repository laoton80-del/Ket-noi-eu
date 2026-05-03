import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RootStackParamList } from '../../navigation/routes';

type Props = NativeStackScreenProps<RootStackParamList, 'P2PVoiceCall'>;

/** Web: WebRTC P2P voice requires native iOS/Android builds. */
export function CallScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.wrap}>
      <Text style={styles.title}>Cuộc gọi trong app</Text>
      <Text style={styles.body}>
        Phiên bản web không hỗ trợ WebRTC thoại P2P. Vui lòng dùng ứng dụng iOS hoặc Android (dev client).
      </Text>
      <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [styles.btn, pressed && { opacity: 0.88 }]}>
        <Text style={styles.btnText}>Quay lại</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#050B14' },
  title: { fontSize: 20, fontWeight: '700', color: '#F4F1EA', marginBottom: 12, textAlign: 'center' },
  body: { fontSize: 15, color: 'rgba(244,241,234,0.78)', textAlign: 'center', lineHeight: 22 },
  btn: {
    marginTop: 28,
    alignSelf: 'center',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(197,160,89,0.35)',
  },
  btnText: { color: '#F4F1EA', fontWeight: '600' },
});
