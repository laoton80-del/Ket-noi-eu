import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TextInput, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SponsoredShopCard } from '../components/commercial/SponsoredShopCard';
import { PrecisePanel } from '../components/ui/PrecisePanel';
import { ServiceCard } from '../components/ui/ServiceCard';
import { getStrings } from '../i18n/strings';
import { useAssistantSettings } from '../state/assistantSettings';
import { useRegionState } from '../state/region';
import { theme } from '../theme/theme';
import { FontFamily } from '../theme/typography';
import { useSyncHubOnFocus } from '../hooks/useSyncHubOnFocus';

export function DiscoverScreen() {
  useSyncHubOnFocus('HUB_SERVICE');
  const { languageCode } = useAssistantSettings();
  const strings = getStrings(languageCode);
  const { currentCountry, localCurrency } = useRegionState();
  const services = useMemo(
    () =>
      strings.utility.discoveryCategories.map((category, idx) => ({
        id: `discover-${idx}`,
        title: category.title,
        subtitle: category.hint,
        animationSource: resolveDiscoveryAnimation(category.title),
      })),
    [strings.utility.discoveryCategories]
  );
  const webGlassStyle =
    Platform.OS === 'web'
      ? ({ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' } as unknown as ViewStyle)
      : undefined;

  return (
    <SafeAreaView style={styles.container}>
      <PrecisePanel style={[styles.localHeaderPanel, webGlassStyle]}>
        <Text style={styles.localHeaderTitle}>{strings.nav.utilityTab} tại {currentCountry}</Text>
        <Text style={styles.localHeaderMeta}>Tiền tệ: {localCurrency}</Text>
      </PrecisePanel>
      <PrecisePanel style={[styles.searchPanel, webGlassStyle]}>
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={16} color={theme.hybrid.signalStrong} />
          <TextInput
            style={styles.searchInput}
            placeholder={strings.community.composerPlaceholder}
            placeholderTextColor={theme.colors.text.secondary}
          />
        </View>
      </PrecisePanel>
      <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
        <SponsoredShopCard
          title="Nails Prime Hub - Top nha cung cap thang nay"
          subtitle="Do uu tien hien thi premium cho doi tac tai tro, phu hop nhu cau salon va mua si."
        />
        {services.map((item) => (
          <PrecisePanel key={item.id} style={[styles.colPanel, webGlassStyle]}>
            <ServiceCard title={item.title} subtitle={item.subtitle} animationSource={item.animationSource} />
          </PrecisePanel>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function resolveDiscoveryAnimation(title: string): { uri: string } {
  const normalized = title.toLowerCase();
  if (normalized.includes('visa') || normalized.includes('giấy tờ')) {
    return { uri: 'https://assets9.lottiefiles.com/packages/lf20_m6cu56_d.json' };
  }
  if (normalized.includes('cư trú') || normalized.includes('nhập cư')) {
    return { uri: 'https://assets3.lottiefiles.com/packages/lf20_ch49h6kq.json' };
  }
  if (normalized.includes('y tế')) {
    return { uri: 'https://assets1.lottiefiles.com/packages/lf20_5tkzkblw.json' };
  }
  if (normalized.includes('pháp lý')) {
    return { uri: 'https://assets7.lottiefiles.com/packages/lf20_4kx2q32n.json' };
  }
  if (normalized.includes('việc làm')) {
    return { uri: 'https://assets3.lottiefiles.com/packages/lf20_jtbfg2nb.json' };
  }
  if (normalized.includes('nhà ở') || normalized.includes('homestay')) {
    return { uri: 'https://assets2.lottiefiles.com/packages/lf20_h4th9ofg.json' };
  }
  if (normalized.includes('nails') || normalized.includes('quán ăn') || normalized.includes('dịch vụ việt')) {
    return { uri: 'https://assets8.lottiefiles.com/packages/lf20_ydo1amjm.json' };
  }
  return { uri: 'https://assets10.lottiefiles.com/packages/lf20_ysrn2dcg.json' };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bgPrimary,
    paddingHorizontal: 14,
    paddingTop: 8,
  },
  localHeaderPanel: {
    marginBottom: 10,
    backgroundColor: theme.colors.glass.surface,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    shadowColor: theme.colors.glass.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  localHeaderTitle: {
    ...theme.typeScale.h1,
    color: theme.colors.text.primary,
    fontFamily: FontFamily.bold,
  },
  localHeaderMeta: {
    ...theme.typeScale.caption,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.semibold,
  },
  searchPanel: {
    marginBottom: 12,
    backgroundColor: theme.colors.glass.surface,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
  },
  searchWrap: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    ...theme.typeScale.body,
    color: theme.colors.CeolWhite,
    paddingVertical: 0,
  },
  grid: {
    gap: theme.spacing.sm,
    paddingBottom: 20,
  },
  colPanel: {
    borderRadius: 16,
    backgroundColor: theme.colors.glass.surface,
    borderColor: theme.hybrid.signalSubtleBorder,
    borderWidth: 1,
    shadowColor: theme.colors.glass.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 6,
  },
});
