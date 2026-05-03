import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../theme/colors';
import { FontFamily } from '../theme/typography';

type Props = {
  visible: boolean;
  text: string;
  onDismiss: () => void;
};

/**
 * Single short instruction; dismiss once — persistence is caller's responsibility.
 */
export function MicroHintBanner({ visible, text, onDismiss }: Props) {
  if (!visible) return null;
  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.card}>
        <Text style={styles.text}>{text}</Text>
        <Pressable onPress={onDismiss} style={({ pressed }) => [styles.close, pressed && { opacity: 0.75 }]} hitSlop={10}>
          <Ionicons name="close-circle" size={22} color="rgba(90,70,40,0.55)" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: 6,
    zIndex: 50,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,251,242,0.96)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.4)',
    shadowColor: '#5C4A2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  text: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: FontFamily.medium,
    color: Colors.text,
  },
  close: { padding: 2, marginTop: -2 },
});
