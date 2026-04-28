import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';

type ServiceCardProps = {
  title: string;
  subtitle: string;
  onPress?: () => void;
};

export function ServiceCard({ title, subtitle, onPress }: ServiceCardProps) {
  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]} onPress={onPress}>
      <View style={styles.imagePlaceholder}>
        <Text style={styles.imageHint}>Image</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.GraphiteBlue,
    backgroundColor: theme.colors.CeolWhite,
    shadowColor: theme.colors.glass.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  imagePlaceholder: {
    height: 96,
    backgroundColor: theme.colors.SoftMineralGrey,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.glass.borderSoft,
  },
  imageHint: {
    color: theme.colors.GraphiteBlue,
    fontSize: 12,
    fontFamily: FontFamily.medium,
  },
  body: {
    padding: 10,
    gap: 4,
  },
  title: {
    color: theme.colors.GraphiteBlue,
    fontSize: 14,
    fontFamily: FontFamily.bold,
  },
  subtitle: {
    color: theme.colors.GraphiteBlue,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: FontFamily.regular,
    opacity: 0.72,
  },
  pressed: {
    opacity: 0.78,
  },
});
