import { Inter_600SemiBold, useFonts } from '@expo-google-fonts/inter';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { type ReactNode, useEffect, useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions, type ViewStyle } from 'react-native';

import { useHomeCommand } from '../../../context/HomeCommandContext';
import { vionaCinematicTokens } from '../../../design/vionaCinematicTokens';
import { useTranslation } from '../../../i18n';

const GOLD_MARK = require('../../../../assets/brand/viona/viona-symbol-gold.png');

function webBlur(px: number): ViewStyle | null {
  if (Platform.OS !== 'web') return null;
  return { filter: `blur(${px}px)` } as ViewStyle;
}

export type VionaHomeTopBarProps = Readonly<{
  displayName?: string | null;
  regionLabel?: string | null;
  previewMode?: boolean;
  showBrand?: boolean;
  reducedMotion?: boolean;
  onOpenLanguage?: () => void;
  sosAction?: ReactNode;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onFocus?: () => void;
  menu?: Readonly<{ open: boolean; onPress: () => void }>;
  avatarUri?: string | null;
  rankLabel?: string | null;
  weather?: Readonly<{ temperatureC: number }> | null;
  notificationCount?: number;
}>;

function isTechnicalPlace(label: string): boolean {
  return /cinematic|not connected|weather source|nguồn thời tiết|chưa có nguồn/i.test(label);
}

function headerClock(language: string, now: Date): { date: string; time: string } {
  const locale = language.trim() || 'en';
  const date = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(now);
  const time = new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(now);
  return { date, time };
}

export function VionaHomeTopBar({
  displayName,
  regionLabel,
  previewMode = false,
  showBrand = false,
  reducedMotion: _reducedMotion = false,
  onOpenLanguage,
  searchValue,
  onSearchChange,
  onFocus,
  menu,
  avatarUri,
  rankLabel,
  weather = null,
  notificationCount = 0,
}: VionaHomeTopBarProps) {
  const { t, i18n } = useTranslation();
  const homeCommand = useHomeCommand();
  const { width } = useWindowDimensions();
  const [fontsLoaded] = useFonts({ Inter_600SemiBold });
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);
  const name = displayName?.trim() || null;
  const desktop = width >= vionaCinematicTokens.layout.desktopMin;
  const tablet = width >= 768;
  const markSize = desktop ? 60 : tablet ? 48 : 42;
  const wordSize = desktop ? 26 : tablet ? 20 : 17;
  const rawPlace = regionLabel?.trim() || '';
  const place =
    previewMode || !rawPlace || isTechnicalPlace(rawPlace) ? t('home.rec2.header.previewPlace') : rawPlace;
  const clock = headerClock(i18n.resolvedLanguage ?? i18n.language, now);
  const identityName = previewMode ? t('home.rec2.avatarPreview') : name ?? t('home.rec2.avatarGuest');
  const signedIn = !previewMode && !!name;
  const initial = signedIn && name ? name.slice(0, 1).toUpperCase() : '';
  const languageCode = (i18n.resolvedLanguage ?? i18n.language ?? 'en').slice(0, 2).toUpperCase();
  const notices = notificationCount > 0 ? Math.min(99, notificationCount) : 0;

  return (
    <View style={styles.bar}>
      {menu ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={menu.open ? t('home.rec2.menuClose') : t('home.rec2.menuOpen')}
          accessibilityState={{ expanded: menu.open }}
          onPress={menu.onPress}
          style={styles.tool}
        >
          <Ionicons name={menu.open ? 'close' : 'menu-outline'} size={20} color={vionaCinematicTokens.color.ice} />
        </Pressable>
      ) : null}
      {showBrand ? (
        <View accessibilityRole="text" accessibilityLabel="VIONA" style={styles.brandAnchor}>
          <View style={[styles.markSlot, { width: markSize, height: markSize }]}>
            <View
              pointerEvents="none"
              style={[styles.halo, { width: markSize * 0.72, height: markSize * 0.72 }, webBlur(18)]}
            />
            <Image
              source={GOLD_MARK}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
              style={{ width: markSize, height: markSize }}
            />
          </View>
          <Text
            style={[
              styles.brandWord,
              {
                fontSize: wordSize,
                letterSpacing: Math.round(wordSize * 0.2),
                fontFamily: fontsLoaded ? 'Inter_600SemiBold' : 'Montserrat_600SemiBold',
              },
            ]}
          >
            VIONA
          </Text>
        </View>
      ) : null}
      <View style={[styles.place, width < 768 && styles.placeNarrow]}>
        <Ionicons name="location-outline" size={15} color={vionaCinematicTokens.color.cyan} />
        <Text style={styles.placeText} numberOfLines={2}>
          {place}
          <Text style={styles.metaDim}>{`  ·  ${clock.date}  ·  ${clock.time}`}</Text>
        </Text>
        {weather ? (
          <View style={styles.weather}>
            <Ionicons name="partly-sunny-outline" size={14} color={vionaCinematicTokens.color.ice} />
            <Text style={styles.placeText}>{`${weather.temperatureC}°`}</Text>
          </View>
        ) : null}
      </View>
      <View style={[styles.search, width < 768 && styles.searchNarrow]}>
        <Ionicons name="search-outline" size={16} color={vionaCinematicTokens.color.muted} />
        <TextInput
          accessibilityLabel={t('home.rec2.searchPlaceholder')}
          placeholder={t('home.rec2.searchPlaceholder')}
          placeholderTextColor={vionaCinematicTokens.color.muted}
          value={searchValue}
          onChangeText={onSearchChange}
          onFocus={onFocus}
          onSubmitEditing={() => undefined}
          returnKeyType="search"
          style={styles.searchInput}
        />
      </View>
      <View style={styles.tools}>
        <View accessibilityRole="image" accessibilityLabel={t('home.rec2.header.notifications')} style={styles.tool}>
          <Ionicons name="notifications-outline" size={18} color={vionaCinematicTokens.color.ice} />
          {notices > 0 ? (
            <View style={styles.noticeBadge}>
              <Text style={styles.noticeBadgeText}>{notices}</Text>
            </View>
          ) : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('home.rec2.language')}
          accessibilityState={{ disabled: !onOpenLanguage }}
          disabled={!onOpenLanguage}
          onPress={onOpenLanguage}
          style={styles.lang}
        >
          <Text style={styles.langCode}>{languageCode}</Text>
          <Ionicons name="chevron-down" size={12} color={vionaCinematicTokens.color.ice} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={identityName}
          onPress={() => homeCommand?.openAccount()}
          style={styles.user}
        >
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarPhoto} />
          ) : initial ? (
            <LinearGradient colors={['#1A4E86', '#0A1A33']} style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </LinearGradient>
          ) : (
            <View style={styles.avatar}>
              <Ionicons name="person-outline" size={18} color={vionaCinematicTokens.color.ice} />
            </View>
          )}
          <View style={styles.userCopy}>
            <Text style={styles.userName} numberOfLines={1}>
              {identityName}
            </Text>
            {rankLabel?.trim() ? (
              <Text style={styles.rank} numberOfLines={1}>{`👑 ${rankLabel.trim()}`}</Text>
            ) : null}
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    width: '100%',
    maxWidth: Platform.OS === 'web' ? ('100vw' as unknown as number) : undefined,
    minWidth: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
  },
  brandAnchor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 8,
    paddingRight: 12,
    backgroundColor: 'transparent',
  },
  markSlot: { alignItems: 'center', justifyContent: 'center' },
  halo: {
    position: 'absolute',
    backgroundColor: 'rgba(243, 217, 166, 0.34)',
    borderRadius: 999,
    shadowColor: '#F3D9A6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
  },
  brandWord: {
    color: '#F3D9A6',
    fontWeight: '600',
  },
  place: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1, maxWidth: 520, minWidth: 0 },
  placeNarrow: { flexBasis: '100%', maxWidth: '100%' },
  placeText: {
    flexShrink: 1,
    color: vionaCinematicTokens.color.ice,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: vionaCinematicTokens.fontFamily.semibold,
  },
  metaDim: { color: 'rgba(230, 244, 255, 0.78)', fontFamily: vionaCinematicTokens.fontFamily.medium, fontWeight: '500' },
  weather: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  search: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 220,
    minWidth: 0,
    minHeight: 44,
    borderRadius: vionaCinematicTokens.radius.pill,
    borderWidth: 1,
    borderColor: vionaCinematicTokens.color.line,
    backgroundColor: vionaCinematicTokens.color.surfaceGlass,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
  },
  searchNarrow: { flexBasis: '100%' },
  searchInput: {
    flex: 1,
    color: vionaCinematicTokens.color.ice,
    fontSize: 14,
    paddingVertical: 8,
  },
  tools: { flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 'auto' },
  tool: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: vionaCinematicTokens.color.line,
    backgroundColor: 'rgba(2, 12, 24, 0.54)',
  },
  lang: {
    minWidth: 52,
    height: 40,
    paddingHorizontal: 10,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
    borderWidth: 1,
    borderColor: vionaCinematicTokens.color.line,
    backgroundColor: 'rgba(2, 12, 24, 0.54)',
  },
  langCode: {
    color: vionaCinematicTokens.color.ice,
    fontSize: 12,
    fontFamily: vionaCinematicTokens.fontFamily.semibold,
  },
  noticeBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00D1FF',
  },
  noticeBadgeText: { color: '#04111F', fontSize: 8, fontFamily: vionaCinematicTokens.fontFamily.bold },
  user: { flexDirection: 'row', alignItems: 'center', gap: 8, maxWidth: 180, minWidth: 0 },
  userCopy: { flexShrink: 1, minWidth: 0 },
  userName: {
    color: vionaCinematicTokens.color.ice,
    fontSize: 13,
    fontFamily: vionaCinematicTokens.fontFamily.semibold,
  },
  rank: { color: '#F3D9A6', fontSize: 11, fontFamily: vionaCinematicTokens.fontFamily.medium },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: vionaCinematicTokens.color.sapphire,
    borderWidth: 1,
    borderColor: vionaCinematicTokens.color.gold,
  },
  avatarPhoto: { width: 36, height: 36, borderRadius: 18 },
  avatarText: { color: vionaCinematicTokens.color.ice, fontFamily: vionaCinematicTokens.fontFamily.bold },
});
