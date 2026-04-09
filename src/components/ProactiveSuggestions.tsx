import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { getChatCompletion } from '../services/OpenAIService';
import { normalizeCountryCodeOrSentinel } from '../config/countryPacks';
import { STORAGE_KEYS } from '../storage/storageKeys';
import { theme } from '../theme/theme';
import { FontFamily } from '../theme/typography';

const AUTH_STORAGE_KEY = STORAGE_KEYS.authSession;
const SUGGESTIONS_CACHE_KEY = STORAGE_KEYS.proactiveSuggestions;
const SUGGESTIONS_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const FALLBACK_SUGGESTIONS: { text: string; persona: 'leona' | 'loan' }[] = [
  { text: 'Gia hạn visa', persona: 'leona' },
  { text: 'Luật lao động mới', persona: 'leona' },
  { text: 'Tìm bác sĩ gần đây', persona: 'loan' },
];

type AuthSnapshot = {
  country?: string;
  name?: string;
};

type SuggestionsCachePayload = {
  at: number;
  suggestions: { text: string; persona: 'leona' | 'loan' }[];
};

function inferProfession(name?: string): string {
  const normalized = (name ?? '').toLowerCase();
  if (normalized.includes('nail')) return 'dịch vụ nails';
  if (normalized.includes('shop')) return 'bán lẻ';
  if (normalized.includes('restaurant') || normalized.includes('quan')) return 'nhà hàng';
  return 'dịch vụ tổng hợp';
}

function parseSuggestions(raw: string): { text: string; persona: 'leona' | 'loan' }[] {
  try {
    const parsed = JSON.parse(raw);
    const rows: unknown[] = Array.isArray(parsed?.suggestions)
      ? (parsed.suggestions as unknown[])
      : Array.isArray(parsed)
      ? (parsed as unknown[])
      : [];
    const cleaned = rows
      .map((item: unknown) => {
        if (typeof item === 'string') {
          return { text: item.trim(), persona: 'leona' as const };
        }
        if (
          item &&
          typeof item === 'object' &&
          typeof (item as { text?: unknown }).text === 'string' &&
          (((item as { persona?: unknown }).persona === 'leona') ||
            ((item as { persona?: unknown }).persona === 'loan'))
        ) {
          const typed = item as { text: string; persona: 'leona' | 'loan' };
          return { text: typed.text.trim(), persona: typed.persona };
        }
        return null;
      })
      .filter(
        (
          v: { text: string; persona: 'leona' | 'loan' } | null
        ): v is { text: string; persona: 'leona' | 'loan' } => !!v && v.text.length > 0
      )
      .slice(0, 3);
    if (cleaned.length === 3) {
      return cleaned;
    }
  } catch {
    // fallback
  }
  return FALLBACK_SUGGESTIONS;
}

export function ProactiveSuggestions({
  onSelect,
}: {
  onSelect: (question: string, persona: 'leona' | 'loan') => void;
}) {
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] =
    useState<{ text: string; persona: 'leona' | 'loan' }[]>(FALLBACK_SUGGESTIONS);
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!loading) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 750, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 750, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [loading, shimmer]);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const cachedRaw = await AsyncStorage.getItem(SUGGESTIONS_CACHE_KEY);
        if (cachedRaw) {
          try {
            const parsedCache = JSON.parse(cachedRaw) as SuggestionsCachePayload;
            const cacheAge = Date.now() - (parsedCache.at ?? 0);
            if (Array.isArray(parsedCache.suggestions) && cacheAge <= SUGGESTIONS_CACHE_TTL_MS) {
              const cachedSuggestions = parseSuggestions(JSON.stringify(parsedCache.suggestions));
              if (mounted) {
                setSuggestions(cachedSuggestions);
                setLoading(false);
              }
              return;
            }
          } catch {
            // ignore malformed cache
          }
        }

        const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        const snapshot = raw ? (JSON.parse(raw) as AuthSnapshot) : null;
        const country = normalizeCountryCodeOrSentinel(snapshot?.country);
        const profession = inferProfession(snapshot?.name);
        const userPrompt =
          `Bạn là trợ lý gợi ý ngữ cảnh sản phẩm. Người dùng đang ở ${country}, làm nghề ${profession}. ` +
          'Hãy trả về ĐÚNG 3 gợi ý ngắn (dưới 10 chữ) mà họ có thể muốn hỏi trợ lý hôm nay. ' +
          'BẮT BUỘC trả JSON object có key suggestions, với mỗi item có đúng 2 key: ' +
          "text (string), persona ('leona' | 'loan').";
        const rawContent = await getChatCompletion([{ role: 'user', content: userPrompt }], 'leona', {
          serviceContext: 'lifeos',
        });
        const parsed = parseSuggestions(rawContent);
        await AsyncStorage.setItem(
          SUGGESTIONS_CACHE_KEY,
          JSON.stringify({
            at: Date.now(),
            suggestions: parsed,
          } satisfies SuggestionsCachePayload)
        );
        if (mounted) setSuggestions(parsed);
      } catch {
        if (mounted) setSuggestions(FALLBACK_SUGGESTIONS);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const shimmerStyle = useMemo(
    () => ({
      opacity: shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0.9] }),
    }),
    [shimmer]
  );

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Gợi ý nhanh hôm nay</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {loading
          ? [0, 1, 2].map((idx) => (
              <Animated.View key={`sk-${idx}`} style={[styles.skeletonChip, shimmerStyle]} />
            ))
          : suggestions.map((item) => (
              <Pressable
                key={`${item.persona}-${item.text}`}
                onPress={() => onSelect(item.text, item.persona)}
                style={({ pressed }) => [styles.chipBorder, pressed && { opacity: 0.82 }]}
              >
                <View style={styles.chipInner}>
                  <Text style={styles.chipText}>{item.text}</Text>
                </View>
              </Pressable>
            ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 10 },
  title: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.bold,
    marginBottom: 8,
    marginLeft: 2,
  },
  row: { gap: 8, paddingRight: 4 },
  chipBorder: {
    borderRadius: 20,
    padding: 1,
    backgroundColor: 'rgba(197, 160, 89, 0.35)',
  },
  chipInner: {
    minHeight: 38,
    borderRadius: 19,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.executive.card,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
  },
  chipText: {
    color: theme.colors.text.primary,
    fontSize: 13,
    fontFamily: FontFamily.medium,
  },
  skeletonChip: {
    width: 128,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(197, 160, 89, 0.15)',
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
  },
});
