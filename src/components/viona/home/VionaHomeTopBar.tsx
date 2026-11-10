import { Ionicons } from '@expo/vector-icons';
import { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';

import { vionaCinematicTokens } from '../../../design/vionaCinematicTokens';
import { useTranslation } from '../../../i18n';
import { VionaCraneMark } from '../brand/VionaCraneMark';

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
}>;

export function VionaHomeTopBar({
  displayName,
  regionLabel,
  previewMode = false,
  showBrand = false,
  reducedMotion = false,
  onOpenLanguage,
  sosAction,
  searchValue,
  onSearchChange,
  onFocus,
  menu,
}: VionaHomeTopBarProps) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const name = displayName?.trim() || null;
  const desktop = width >= vionaCinematicTokens.layout.desktopMin;
  const tablet = width >= 768;
  const markSize = desktop ? 44 : tablet ? 36 : 32;
  const wordSize = desktop ? 22 : tablet ? 18 : 16;
  const avatarLabel = previewMode ? t('home.rec2.avatarPreview') : name ?? t('home.rec2.avatarGuest');
  const place = regionLabel?.trim() || null;

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
          <View pointerEvents="none" style={styles.brandGlow} />
          <VionaCraneMark size={markSize} variant="gold" />
          <Text style={[styles.brandWord, { fontSize: wordSize, letterSpacing: desktop ? 3.4 : 2.4 }]}>VIONA</Text>
        </View>
      ) : null}
      <View style={styles.place}>
        <Ionicons name="location-outline" size={15} color={vionaCinematicTokens.color.cyan} />
        <View style={styles.placeCopy}>
          {place ? <Text style={styles.placeText}>{place}</Text> : null}
          <Text style={styles.weather}>{t('home.rec2.weatherUnavailable')}</Text>
        </View>
      </View>
      <View style={styles.search}>
        <Ionicons name="search-outline" size={16} color={vionaCinematicTokens.color.muted} />
        <TextInput
          accessibilityLabel={t('home.rec2.searchPlaceholder')}
          accessibilityHint={t('home.rec2.searchNotConnected')}
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
        <View
          accessibilityRole="image"
          accessibilityLabel={t('home.rec2.notificationUnavailable')}
          style={styles.tool}
        >
          <Ionicons name="notifications-outline" size={18} color="#71879C" />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('home.rec2.language')}
          accessibilityState={{ disabled: !onOpenLanguage }}
          disabled={!onOpenLanguage}
          onPress={onOpenLanguage}
          style={styles.tool}
        >
          <Ionicons name="language-outline" size={18} color={vionaCinematicTokens.color.ice} />
        </Pressable>
        {sosAction}
        <View accessibilityLabel={avatarLabel} style={styles.avatar}>
          <Text style={styles.avatarText}>{avatarLabel.slice(0, 1).toUpperCase()}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
  },
  brandAnchor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 48,
    paddingLeft: 6,
    paddingRight: 10,
    backgroundColor: 'transparent',
  },
  brandGlow: {
    position: 'absolute',
    left: 4,
    right: 0,
    top: 8,
    bottom: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(243, 217, 166, 0.07)',
    shadowColor: '#F3D9A6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
  },
  brandWord: {
    color: '#D4AF7C',
    fontFamily: vionaCinematicTokens.fontFamily.bold,
    fontWeight: '700',
  },
  place: { flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: 220 },
  placeCopy: { gap: 1, flexShrink: 1 },
  placeText: { color: vionaCinematicTokens.color.ice, fontSize: 13, fontFamily: vionaCinematicTokens.fontFamily.semibold },
  weather: { color: vionaCinematicTokens.color.muted, fontSize: 11 },
  search: {
    flexGrow: 1,
    flexBasis: 220,
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
  searchInput: {
    flex: 1,
    color: vionaCinematicTokens.color.ice,
    fontSize: 14,
    paddingVertical: 8,
  },
  tools: { flexDirection: 'row', alignItems: 'center', gap: 8 },
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
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: vionaCinematicTokens.color.sapphire,
    borderWidth: 1,
    borderColor: vionaCinematicTokens.color.gold,
  },
  avatarText: { color: vionaCinematicTokens.color.ice, fontFamily: vionaCinematicTokens.fontFamily.bold },
});
