import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet } from 'react-native';
import { SOSModal } from './SOSModal';
import { theme } from '../../theme/theme';

export function SOSHeaderButton() {
  const [open, setOpen] = useState(false);

  const handleEmergencyCall = () => {
    void Linking.openURL('tel:112').catch(() => {
      Alert.alert('SOS', 'Khong the mo cuoc goi khan cap tren thiet bi nay.');
    });
  };

  const handleEmbassyCall = () => {
    void Linking.openURL('tel:+420123456789').catch(() => {
      Alert.alert('SOS', 'Khong the mo so Dai Su Quan tren thiet bi nay.');
    });
  };

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Mo SOS khan cap"
      >
        <Ionicons name="shield" size={18} color={theme.colors.CeolWhite} />
      </Pressable>
      <SOSModal
        visible={open}
        onClose={() => setOpen(false)}
        onEmergencyCall={handleEmergencyCall}
        onEmbassyCall={handleEmbassyCall}
      />
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 38,
    height: 38,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.RouteError,
    borderWidth: 1,
    borderColor: theme.colors.RouteError,
  },
  pressed: {
    opacity: 0.84,
  },
});
