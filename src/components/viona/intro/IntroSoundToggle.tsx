import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { readIntroSoundEnabled, setIntroSoundEnabled } from './introChime';

export function IntroSoundToggle() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    void readIntroSoundEnabled().then(setEnabled);
  }, []);

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    void setIntroSoundEnabled(next);
  };

  return (
    <Pressable accessibilityRole="switch" accessibilityState={{ checked: enabled }} onPress={toggle} style={styles.row}>
      <View style={styles.copy}>
        <Text style={styles.title}>Âm thanh mở app</Text>
        <Text style={styles.hint}>{enabled ? 'Bật' : 'Tắt'}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    marginTop: 8,
    minHeight: 48,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(10, 26, 51, 0.08)',
  },
  copy: { gap: 2 },
  title: { fontSize: 15, fontWeight: '700', color: '#0A1A33' },
  hint: { fontSize: 12, color: '#5C6B7A' },
});
