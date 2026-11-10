import { Image, StyleSheet, View } from 'react-native';

const MARK = require('../../../../assets/brand/viona/in-app/mark-white-256.png');
const WORDMARK = require('../../../../assets/brand/viona/in-app/wordmark-h192.png');

export function VionaBrandLockup({
  reducedMotion = false,
  compact = false,
}: Readonly<{ reducedMotion?: boolean; compact?: boolean }>) {
  const markSize = compact ? 28 : 36;
  return (
    <View style={styles.row}>
      <View style={reducedMotion ? styles.markStill : styles.markGlow}>
        <Image source={MARK} resizeMode="contain" style={{ width: markSize, height: markSize }} />
      </View>
      {compact ? null : (
        <Image source={WORDMARK} resizeMode="contain" accessible accessibilityLabel="VIONA" style={styles.word} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  markGlow: {
    shadowColor: '#00D1FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
  },
  markStill: {},
  word: { width: 108, height: 28 },
});
