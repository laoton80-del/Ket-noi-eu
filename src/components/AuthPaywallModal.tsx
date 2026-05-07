import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from '../i18n';
import { FontFamily } from '../theme/typography';
import { applyWebStyles } from '../utils/applyWebStyles';

type Props = {
  visible: boolean;
  title?: string;
  description?: string;
  onContinue: () => void;
  onClose: () => void;
};

export function AuthPaywallModal({
  visible,
  title,
  description,
  onContinue,
  onClose,
}: Props) {
  const { t } = useTranslation();
  if (!visible) return null;
  const resolvedTitle = title ?? t('authPaywall.title');
  const resolvedDescription = description ?? t('authPaywall.description');

  return (
    <View style={styles.overlay}>
      <View style={styles.card} className={applyWebStyles('kn-glass')}>
        <Text style={styles.title}>{resolvedTitle}</Text>
        <Text style={styles.desc}>{resolvedDescription}</Text>
        <Pressable onPress={onContinue} style={({ pressed }) => [styles.cta, pressed && { opacity: 0.82 }]}>
          <Text style={styles.ctaText}>{t('authPaywall.continuePhone')}</Text>
        </Pressable>
        <Pressable onPress={onClose} style={({ pressed }) => [styles.secondary, pressed && { opacity: 0.8 }]}>
          <Text style={styles.secondaryText}>{t('authPaywall.later')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 80,
    backgroundColor: 'rgba(10, 14, 24, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  card: {
    width: '100%',
    maxWidth: 410,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(11, 42, 102, 0.16)',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 22,
    paddingVertical: 22,
    shadowColor: '#1A2D4D',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 7,
  },
  title: {
    fontSize: 24,
    color: '#182640',
    fontFamily: FontFamily.extrabold,
    marginBottom: 10,
  },
  desc: {
    fontSize: 14,
    lineHeight: 21,
    color: 'rgba(24,38,64,0.78)',
    fontFamily: FontFamily.regular,
    marginBottom: 16,
  },
  cta: {
    borderRadius: 14,
    minHeight: 48,
    backgroundColor: '#C62828',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  ctaText: {
    color: '#FFE9D2',
    fontFamily: FontFamily.bold,
    fontSize: 14,
  },
  secondary: {
    borderRadius: 13,
    minHeight: 40,
    borderWidth: 1,
    borderColor: 'rgba(24,38,64,0.2)',
    backgroundColor: 'rgba(248,250,255,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    color: '#253758',
    fontFamily: FontFamily.semibold,
    fontSize: 13,
  },
});
