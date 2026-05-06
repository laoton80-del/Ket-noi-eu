/**
 * **Pillar 5 — Data Kill Switch (GDPR Article 17).**
 *
 * Hub / Profile **privacy & GDPR** surface — Right to erasure (kill switch).
 */

import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState, type ReactElement } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../../context/AuthContext';
import { executeRightToErasure } from '../../services/compliance/gdprErasureService';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';

export function GDPRDashboard(): ReactElement | null {
  const { user, logout } = useAuth();
  const [busy, setBusy] = useState(false);

  const onErase = useCallback(() => {
    const uid = user?.serverUserId ?? user?.phone ?? '';
    if (!uid) {
      Alert.alert('Đăng nhập', 'Cần tài khoản để thực hiện yêu cầu xóa dữ liệu.');
      return;
    }

    Alert.alert(
      'Xóa dữ liệu (GDPR)',
      'Thao tác này yêu cầu xóa lịch hẹn, tài liệu kho, và nhật ký AI liên quan tài khoản. Bạn có chắc?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setBusy(true);
              try {
                const r = await executeRightToErasure(uid);
                Alert.alert('Đã gửi yêu cầu', r.detail, [
                  {
                    text: 'OK',
                    onPress: () => {
                      void logout();
                    },
                  },
                ]);
              } catch (e) {
                Alert.alert('Lỗi', e instanceof Error ? e.message : 'Không thể hoàn tất.');
              } finally {
                setBusy(false);
              }
            })();
          },
        },
      ]
    );
  }, [logout, user?.phone, user?.serverUserId]);

  if (!user) return null;

  return (
    <View style={styles.card} accessibilityRole="summary">
      <View style={styles.headerRow}>
        <Ionicons name="shield-half-outline" size={22} color={theme.hybrid.chipErrorText} />
        <Text style={styles.title}>Quyền riêng tư · GDPR (EU)</Text>
      </View>
      <Text style={styles.body}>
        V7 Data Kill Switch — bạn có thể yêu cầu xóa dữ liệu cá nhân: đặt chỗ, tài liệu Web3/Vault, và lịch sử trò chuyện AI
        được liên kết với tài khoản (GDPR Article 17).
      </Text>
      <Pressable
        onPress={onErase}
        disabled={busy}
        style={({ pressed }) => [styles.dangerBtn, pressed && !busy && { opacity: 0.88 }, busy && { opacity: 0.55 }]}
        accessibilityRole="button"
        accessibilityLabel="Kích hoạt quyền xóa dữ liệu"
      >
        {busy ? (
          <ActivityIndicator color="#FECACA" />
        ) : (
          <Text style={styles.dangerBtnText}>Data Kill Switch — yêu cầu xóa dữ liệu</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 16,
    padding: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.35)',
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.CeolWhite,
    flex: 1,
  },
  body: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: 'rgba(226, 232, 240, 0.82)',
    lineHeight: 20,
  },
  dangerBtn: {
    marginTop: 4,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(127, 29, 29, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(252, 165, 165, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  dangerBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    fontWeight: '800',
    color: '#FECACA',
    textAlign: 'center',
  },
});
