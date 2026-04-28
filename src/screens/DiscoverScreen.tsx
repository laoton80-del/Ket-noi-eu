import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrecisePanel } from '../components/ui/PrecisePanel';
import { ServiceCard } from '../components/ui/ServiceCard';
import { getStrings } from '../i18n/strings';
import { useAssistantSettings } from '../state/assistantSettings';
import { useRegionState } from '../state/region';
import { theme } from '../theme/theme';
import { FontFamily } from '../theme/typography';

export function DiscoverScreen() {
  const { languageCode } = useAssistantSettings();
  const strings = getStrings(languageCode);
  const { currentCountry, localCurrency } = useRegionState();
  const services = useMemo(
    () =>
      strings.utility.discoveryCategories.map((category, idx) => ({
        id: `discover-${idx}`,
        title: category.title,
        subtitle: category.hint,
      })),
    [strings.utility.discoveryCategories]
  );

  return (
    <SafeAreaView style={styles.container}>
      <PrecisePanel style={styles.localHeaderPanel}>
        <Text style={styles.localHeaderTitle}>{strings.nav.discoverTab} in {currentCountry}</Text>
        <Text style={styles.localHeaderMeta}>Currency: {localCurrency}</Text>
      </PrecisePanel>
      <PrecisePanel style={styles.searchPanel}>
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={16} color={theme.colors.SignatureGold} />
          <TextInput
            style={styles.searchInput}
            placeholder={strings.community.composerPlaceholder}
            placeholderTextColor={theme.colors.text.secondary}
          />
        </View>
      </PrecisePanel>
      <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
        {services.map((item) => (
          <PrecisePanel key={item.id} style={styles.colPanel}>
            <ServiceCard title={item.title} subtitle={item.subtitle} />
          </PrecisePanel>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.DeepInkNavy,
    paddingHorizontal: 14,
    paddingTop: 8,
  },
  localHeaderPanel: {
    marginBottom: 10,
    backgroundColor: theme.colors.executive.card,
  },
  localHeaderTitle: {
    ...theme.typeScale.h1,
    color: theme.colors.SignatureGold,
    fontFamily: FontFamily.bold,
  },
  localHeaderMeta: {
    ...theme.typeScale.caption,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.semibold,
  },
  searchPanel: {
    marginBottom: 12,
    backgroundColor: theme.colors.executive.card,
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
    backgroundColor: theme.colors.executive.card,
  },
});
