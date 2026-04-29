import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Linking, Pressable, StyleSheet, View } from 'react-native';
import { SOSModal } from './SOSModal';
import { theme } from '../../theme/theme';

type SOSHeaderButtonProps = {
  tone?: 'default' | 'danger';
};

export function SOSHeaderButton({ tone = 'default' }: SOSHeaderButtonProps) {
  const [open, setOpen] = useState(false);
  const pulse = useRef(new Animated.Value(0)).current;
  const useDangerTone = tone === 'danger';

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1800,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const handleEmergencyCall = () => {
    void Linking.openURL('tel:112').catch(() => {
      Alert.alert('SOS', 'Không thể mở cuộc gọi khẩn cấp trên thiết bị này.');
    });
  };

  const handleEmbassyCall = () => {
    void Linking.openURL('tel:+420123456789').catch(() => {
      Alert.alert('SOS', 'Không thể mở số Đại sứ quán trên thiết bị này.');
    });
  };

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.button, useDangerTone && styles.buttonDanger, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Mở SOS khẩn cấp"
      >
        <Animated.View
          pointerEvents="none"
          style={StyleSheet.flatten([
            styles.techRing,
            useDangerTone && styles.techRingDanger,
            {
              opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] }),
              transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.45] }) }],
            },
          ])}
        />
        <View style={[styles.iconCore, useDangerTone && styles.iconCoreDanger]}>
          <Ionicons name="shield-outline" size={18} color={theme.colors.CeolWhite} />
        </View>
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
    backgroundColor: theme.colors.glass.surface,
    borderWidth: 1,
    borderColor: theme.hybrid.signalSubtleBorder,
    overflow: 'visible',
  },
  buttonDanger: {
    backgroundColor: 'rgba(128, 16, 24, 0.42)',
    borderColor: 'rgba(255, 51, 51, 0.62)',
    shadowColor: '#FF3333',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 6,
  },
  techRing: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.hybrid.signalStrong,
  },
  techRingDanger: {
    borderColor: '#FF3333',
  },
  iconCore: {
    width: 30,
    height: 30,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.hybrid.signalStrong,
  },
  iconCoreDanger: {
    backgroundColor: '#7E121A',
  },
  pressed: {
    opacity: 0.84,
  },
});
