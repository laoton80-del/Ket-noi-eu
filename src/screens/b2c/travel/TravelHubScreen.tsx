import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { VionaCraneMark } from '../../../components/viona/brand/VionaCraneMark';
import { vionaCinematicTokens } from '../../../design/vionaCinematicTokens';
import { TravelScreen } from '../TravelScreen';

/**
 * Cinematic frame around the existing Travel screen.
 * Does not request location or change consent.
 */
export function TravelHubScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.frame}>
        <VionaCraneMark size={22} variant="sapphire" />
        <View style={styles.copy}>
          <Text style={styles.title}>VIONA Travel</Text>
          <Text style={styles.note}>Location stays off until you choose it on this screen.</Text>
        </View>
      </View>
      <View style={styles.body}>
        <TravelScreen />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: vionaCinematicTokens.color.midnight },
  frame: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: vionaCinematicTokens.color.line,
  },
  copy: { flex: 1, gap: 2 },
  title: { color: vionaCinematicTokens.color.ice, fontSize: 18, fontWeight: '700', letterSpacing: 0.4 },
  note: { color: vionaCinematicTokens.color.muted, fontSize: 12 },
  body: { flex: 1, minHeight: 0 },
});
