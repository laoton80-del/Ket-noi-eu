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

/**
 * Defensive category union: current normalized values plus future-friendly strings.
 * `resolveMeta` always falls back safely, so unrecognized categories never break the card.
 */
type ClassifiedCategory =
  | 'hiring'
  | 'jobs'
  | 'shop_transfer'
  | 'business'
  | 'housing'
  | 'marketplace'
  | 'services'
  | 'community'
  | (string & {});

export type LocalClassifiedsFeaturedPost = Readonly<{
  id: string;
  category: ClassifiedCategory;
  title: string;
  city: string;
  priceLabel: string;
  isVip: boolean;
  /**
   * Optional user-uploaded listing photo (future). When present the card uses it as the
   * card image; otherwise a safe category fallback visual is used. No upload/storage here.
   */
  imageUri?: string;
  imageUrl?: string;
}>;

type ClassifiedStyleMeta = Readonly<{
  icon: keyof typeof Ionicons.glyphMap;
  accent: 'emerald' | 'gold' | 'cyan' | 'violet';
  label: string;
  heroKey: LocalHeroVisualKey;
}>;

/** Safe category → fallback art / accent / icon mapping (defensive against future strings). */
function resolveMeta(category: ClassifiedCategory): ClassifiedStyleMeta {
  switch (category) {
    case 'shop_transfer':
    case 'business':
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
    case 'marketplace':
      return {
        icon: 'pricetags-outline',
        accent: 'gold',
        label: 'Cho',
        heroKey: 'browseServices',
      };
    case 'services':
      return {
        icon: 'construct-outline',
        accent: 'emerald',
        label: 'Dich vu',
        heroKey: 'browseServices',
      };
    case 'community':
      return {
        icon: 'people-outline',
        accent: 'violet',
        label: 'Cong dong',
        heroKey: 'default',
      };
    case 'hiring':
    case 'jobs':
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
    // Prefer a user-uploaded listing photo when present; otherwise safe category fallback art.
    const listingImage = item.imageUri ?? item.imageUrl;
    const hasListingImage = typeof listingImage === 'string' && listingImage.trim().length > 0;
    const backgroundImage = hasListingImage
      ? { uri: listingImage.trim() }
      : getLocalHeroCardAsset(meta.heroKey);
    const imageStyle =
      Platform.OS === 'web'
        ? ({
            objectFit: 'cover' as const,
            objectPosition: hasListingImage ? 'center' : visual.preferredObjectPosition,
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
        backgroundImage={backgroundImage}
        imageStyle={imageStyle}
        onPress={onViewAll}
        accessibilityLabel={`${item.title}. ${item.city}. ${item.priceLabel}`}
        testID={`local-classified-${item.id}`}
        stretchInColumn={!useCarousel}
        networkTier="classified"
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
              style={[styles.cell, visiblePosts.length === 1 && styles.cellSingle]}
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
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 5,
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
    lineHeight: 18,
    fontFamily: FontFamily.medium,
    color: 'rgba(186, 210, 235, 0.88)',
    marginTop: 4,
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
    gap: 10,
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
    // Equal columns: flexBasis:0 + flexGrow:1 lets every card share the rail evenly and absorb the
    // 12px gaps, so 2-up and 3-up both fill the row with no asymmetric dead space (the old fixed
    // 31.5%/48.4% widths ignored the gaps and left a ragged right edge). `stretch` equalizes height.
    alignItems: 'stretch',
    gap: 12,
  },
  cell: {
    minWidth: 0,
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
  },
  cellSingle: {
    flexGrow: 0,
    flexBasis: '100%',
  },
  carouselContent: {
    gap: 12,
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
    lineHeight: 16,
    fontFamily: FontFamily.medium,
    color: 'rgba(148, 163, 184, 0.82)',
    marginTop: 2,
  },
});
