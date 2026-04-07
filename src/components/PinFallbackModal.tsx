import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { FontFamily } from '../theme/typography';
import { theme } from '../theme/theme';

type PinFallbackModalProps = {
  visible: boolean;
  title: string;
  onVerify: (pin: string) => void;
  onClose: () => void;
};

export function PinFallbackModal({ visible, title, onVerify, onClose }: PinFallbackModalProps) {
  const [pin, setPin] = useState('');

  const submit = () => {
    onVerify(pin.trim());
    setPin('');
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet} onStartShouldSetResponder={() => true}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.hint}>Nhập mã PIN dự phòng (4 số).</Text>
          <TextInput
            value={pin}
            onChangeText={setPin}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={8}
            placeholder="••••"
            placeholderTextColor={theme.colors.text.secondary}
            style={styles.input}
          />
          <View style={styles.row}>
            <Pressable onPress={onClose} style={({ pressed }) => [styles.btn, styles.btnGhost, pressed && { opacity: 0.85 }]}>
              <Text style={styles.btnGhostText}>Hủy</Text>
            </Pressable>
            <Pressable onPress={submit} style={({ pressed }) => [styles.btn, styles.btnPrimary, pressed && { opacity: 0.9 }]}>
              <Text style={styles.btnPrimaryText}>Xác nhận</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 12, 10, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  sheet: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    backgroundColor: theme.colors.background,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
  },
  title: {
    fontSize: theme.typeScale.body.fontSize,
    fontFamily: FontFamily.bold,
    color: theme.colors.text.primary,
    marginBottom: 6,
  },
  hint: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.secondary,
    marginBottom: 12,
  },
  input: {
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(74, 64, 54, 0.25)',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 18,
    fontFamily: FontFamily.semibold,
    color: theme.colors.text.primary,
    letterSpacing: 4,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  btn: {
    flex: 1,
    minHeight: 44,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnGhost: {
    borderWidth: 1,
    borderColor: 'rgba(74, 64, 54, 0.28)',
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  btnGhostText: {
    fontFamily: FontFamily.semibold,
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  btnPrimary: {
    backgroundColor: theme.colors.text.primary,
  },
  btnPrimaryText: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: theme.colors.surface,
  },
});
