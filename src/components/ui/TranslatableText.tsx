import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';
import { Skeleton } from './Skeleton';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';

type TranslatableTextProps = {
  originalText: string;
  targetLanguage: string;
};

function mockTranslate(text: string, targetLanguage: string): string {
  return `[${targetLanguage.toUpperCase()}] ${text}`;
}

export function TranslatableText({ originalText, targetLanguage }: TranslatableTextProps) {
  const [loading, setLoading] = useState(false);
  const [translated, setTranslated] = useState<string | null>(null);

  const visibleText = useMemo(() => translated ?? originalText, [originalText, translated]);

  const onTranslate = () => {
    if (loading) return;
    setLoading(true);
    setTimeout(() => {
      setTranslated(mockTranslate(originalText, targetLanguage));
      setLoading(false);
    }, 900);
  };

  return (
    <Animated.View layout={Layout.springify()} style={styles.container}>
      <View style={styles.textRow}>
        {loading ? (
          <Animated.View entering={FadeIn} exiting={FadeOut}>
            <Skeleton width="100%" height={18} />
          </Animated.View>
        ) : (
          <Animated.View entering={FadeIn} exiting={FadeOut} layout={Layout.springify()} style={styles.textWrap}>
            <Text style={styles.text}>{visibleText}</Text>
          </Animated.View>
        )}
      </View>

      <Pressable onPress={onTranslate} style={({ pressed }) => [styles.translateBtn, pressed && { opacity: 0.86 }]}>
        <Ionicons name="language-outline" size={14} color={theme.hybrid.signalStrong} />
        <Text style={styles.translateText}>Translate</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.xs,
  },
  textRow: {
    minHeight: 20,
  },
  textWrap: {
    width: '100%',
  },
  text: {
    ...theme.typeScale.body,
    color: theme.colors.text.primary,
    fontFamily: FontFamily.regular,
  },
  translateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.hybrid.signalSubtleBorder,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.glass.surface,
  },
  translateText: {
    ...theme.typeScale.caption,
    color: theme.hybrid.signalStrong,
    fontFamily: FontFamily.medium,
  },
});
