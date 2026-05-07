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
    backgroundColor: 'rgba(9, 8, 12, 0.62)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  card: {
    width: '100%',
    maxWidth: 396,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.5)',
    backgroundColor: 'rgba(255,255,255,0.86)',
    paddingHorizontal: 20,
    paddingVertical: 20,
    shadowColor: '#8B7355',
    shadowOffset: { width: 4, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  title: {
    fontSize: 21,
    color: '#2A231A',
    fontFamily: FontFamily.extrabold,
    marginBottom: 8,
  },
  desc: {
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(42,35,26,0.82)',
    fontFamily: FontFamily.regular,
    marginBottom: 14,
  },
  cta: {
    borderRadius: 13,
    minHeight: 46,
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
    borderRadius: 12,
    minHeight: 38,
    borderWidth: 1,
    borderColor: 'rgba(90, 70, 40, 0.35)',
    backgroundColor: 'rgba(255,255,255,0.58)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    color: '#4C3E2B',
    fontFamily: FontFamily.semibold,
    fontSize: 13,
  },
});
