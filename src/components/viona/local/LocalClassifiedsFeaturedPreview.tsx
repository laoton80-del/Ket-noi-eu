/**
 * Local main-page classifieds — compact featured preview (not full feed).
 */
import { Ionicons } from '@expo/vector-icons';
import { useMemo, type ReactElement } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import {
  getLocalHeroCardAsset,
  type LocalHeroVisualKey,
} from '../../../design/vionaLocalHeroAssets';
import { getLocalHeroVisualSpec } from '../../../design/vionaLocalHeroVisuals';
import { useTranslation } from '../../../i18n';
import { FontFamily } from '../../../theme/typography';
import { LocalHomeParityCard } from './LocalHomeParityCard';

type ClassifiedCategory = 'hiring' | 'shop_transfer' | 'housing';

export type LocalClassifiedsFeaturedPost = Readonly<{
  id: string;
  category: ClassifiedCategory;
  title: string;
  city: string;
  priceLabel: string;
  isVip: boolean;
}>;

type ClassifiedStyleMeta = Readonly<{
  icon: keyof typeof Ionicons.glyphMap;
  accent: 'emerald' | 'gold' | 'cyan';
  label: string;
  heroKey: LocalHeroVisualKey;
}>;

function resolveMeta(category: ClassifiedCategory): ClassifiedStyleMeta {
  switch (category) {
    case 'shop_transfer':
      return {
        icon: 'storefront-outline',
        accent: 'gold',
        label: 'Sang tiem',
        heroKey: 'legalWealth',
      };
    case 'housing':
      return {
        icon: 'home-outline',
        accent: 'cyan',
        label: 'Thue nha',
        heroKey: 'bookingAssist',
      };
    case 'hiring':
    default:
      return {
        icon: 'construct-outline',
        accent: 'emerald',
        label: 'Tuyen tho',
        heroKey: 'myRequests',
      };
  }
}

const DESKTOP_TABLET_MIN = 620;
const MOBILE_CAROUSEL_MAX = 520;

export type LocalClassifiedsFeaturedPreviewProps = Readonly<{
  posts: readonly LocalClassifiedsFeaturedPost[];
  totalCount?: number;
  walletLabel: string;
  onCreateListing: () => void;
  onViewAll: () => void;
  testID?: string;
}>;

export function LocalClassifiedsFeaturedPreview({
  posts,
  totalCount,
  walletLabel,
  onCreateListing,
  onViewAll,
  testID = 'local-classifieds-featured-preview',
}: LocalClassifiedsFeaturedPreviewProps): ReactElement {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();

  const isWide = width >= DESKTOP_TABLET_MIN;
  const useCarousel = width < MOBILE_CAROUSEL_MAX;
  const previewLimit = isWide ? 3 : 2;

  const visiblePosts = useMemo(() => posts.slice(0, previewLimit), [posts, previewLimit]);
  const feedTotal = totalCount ?? posts.length;
  const hiddenCount = Math.max(0, feedTotal - visiblePosts.length);

  const carouselWidth = useMemo(
    () => Math.min(300, Math.max(248, Math.round(width * 0.82))),
    [width]
  );

  const renderCard = (item: LocalClassifiedsFeaturedPost) => {
    const meta = resolveMeta(item.category);
    const visual = getLocalHeroVisualSpec(meta.heroKey);
    const imageStyle =
      Platform.OS === 'web'
        ? ({
            objectFit: 'cover' as const,
            objectPosition: visual.preferredObjectPosition,
          } as const)
        : undefined;

    return (
      <LocalHomeParityCard
        accent={meta.accent}
        title={item.title}
        subtitle={`${item.city} · ${item.priceLabel}`}
        statusLabel={item.isVip ? t('localHub.vipHighlight') : meta.label}
        statusTone={item.isVip ? 'demo' : 'lite'}
        icon={meta.icon}
        backgroundImage={getLocalHeroCardAsset(meta.heroKey)}
        imageStyle={imageStyle}
        onPress={onViewAll}
        accessibilityLabel={`${item.title}. ${item.city}. ${item.priceLabel}`}
        testID={`local-classified-${item.id}`}
        stretchInColumn={!useCarousel}
      />
    );
  };

  return (
    <View style={styles.wrap} testID={testID}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>{t('localHub.classifiedsKicker')}</Text>
          <Text style={styles.title}>{t('localHub.classifiedsTitle')}</Text>
          <Text style={styles.subtitle}>{t('localHub.classifiedsFeaturedSubtitle')}</Text>
        </View>
        <Text style={styles.walletHint}>{walletLabel}</Text>
      </View>

      <View style={styles.ctaRow}>
        <Pressable
          style={styles.postBtn}
          onPress={onCreateListing}
          testID="local-classifieds-create-listing"
          accessibilityRole="button"
          accessibilityLabel={t('localHub.postNewListing')}
        >
          <Ionicons name="add-circle-outline" size={18} color="rgba(236, 205, 128, 0.95)" />
          <Text style={styles.postBtnText}>{t('localHub.postNewListing')}</Text>
        </Pressable>
        <Pressable
          style={styles.viewAllBtn}
          onPress={onViewAll}
          testID="local-classifieds-view-all"
          accessibilityRole="button"
          accessibilityLabel={t('localHub.viewAllClassifieds')}
        >
          <Text style={styles.viewAllBtnText}>{t('localHub.viewAllClassifieds')}</Text>
          <Ionicons name="chevron-forward" size={16} color="rgba(180, 220, 255, 0.92)" />
        </Pressable>
      </View>

      {useCarousel ? (
        <ScrollView
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={Platform.OS === 'web'}
          contentContainerStyle={styles.carouselContent}
        >
          {visiblePosts.map((item) => (
            <View key={item.id} style={[styles.carouselCell, { width: carouselWidth }]}>
              {renderCard(item)}
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.grid}>
          {visiblePosts.map((item) => (
            <View
              key={item.id}
              style={[
                styles.cell,
                visiblePosts.length === 1 && styles.cellSingle,
                visiblePosts.length === 2 && styles.cellDouble,
                visiblePosts.length >= 3 && styles.cellTriple,
              ]}
            >
              {renderCard(item)}
            </View>
          ))}
        </View>
      )}

      {hiddenCount > 0 ? (
        <Pressable onPress={onViewAll} style={styles.moreHintRow} accessibilityRole="button">
          <Text style={styles.moreHintText}>
            {t('localHub.classifiedsPreviewMore', { count: hiddenCount })}
          </Text>
        </Pressable>
      ) : null}

      <Text style={styles.safetyCopy}>{t('localHub.classifiedsFeaturedSafety')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 10,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  kicker: {
    fontSize: 10,
    fontFamily: FontFamily.extrabold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: 'rgba(214, 230, 248, 0.76)',
  },
  title: {
    fontSize: 16,
    fontFamily: FontFamily.extrabold,
    color: 'rgba(242, 248, 255, 0.96)',
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: FontFamily.medium,
    color: 'rgba(186, 210, 235, 0.88)',
    marginTop: 2,
  },
  walletHint: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: 'rgba(236, 205, 128, 0.92)',
  },
  ctaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  postBtn: {
    minHeight: 38,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(236, 205, 128, 0.44)',
    backgroundColor: 'rgba(236, 205, 128, 0.14)',
    paddingHorizontal: 13,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  postBtnText: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: 'rgba(247, 251, 255, 0.95)',
  },
  viewAllBtn: {
    minHeight: 38,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(120, 190, 255, 0.36)',
    backgroundColor: 'rgba(10, 18, 32, 0.55)',
    paddingHorizontal: 13,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllBtnText: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    color: 'rgba(230, 244, 255, 0.94)',
  },
  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  cell: {
    minWidth: 0,
  },
  cellSingle: {
    width: '100%',
  },
  cellDouble: {
    width: '48.8%',
  },
  cellTriple: {
    width: '32%',
  },
  carouselContent: {
    gap: 10,
    paddingRight: 8,
  },
  carouselCell: {
    minWidth: 0,
  },
  moreHintRow: {
    alignSelf: 'flex-start',
  },
  moreHintText: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    color: 'rgba(148, 210, 255, 0.9)',
  },
  safetyCopy: {
    fontSize: 10,
    lineHeight: 15,
    fontFamily: FontFamily.medium,
    color: 'rgba(148, 163, 184, 0.82)',
  },
});
