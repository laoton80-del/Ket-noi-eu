import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';
import { applyWebStyles } from '../../utils/applyWebStyles';

export function VoiceAiSecuredTag() {
  return (
    <View style={styles.wrap} className={applyWebStyles('kn-neon-b2b')}>
      <Text style={styles.text}>🤖 Chốt tự động bởi Lễ Tân AI</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.5)',
    backgroundColor: 'rgba(0, 255, 102, 0.08)',
  },
  text: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: theme.hybrid.onSignal,
  },
});
