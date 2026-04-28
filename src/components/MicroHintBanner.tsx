import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../theme/colors';
import { FontFamily } from '../theme/typography';
import { theme } from '../theme/theme';

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
          <Ionicons name="close-circle" size={22} color={theme.colors.text.secondary} />
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
    backgroundColor: theme.colors.executive.card,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    shadowColor: theme.colors.glass.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  text: {
    flex: 1,
    ...theme.typeScale.body,
    fontFamily: FontFamily.medium,
    color: Colors.text,
  },
  close: { padding: 2, marginTop: -2 },
});
