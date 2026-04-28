import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrecisePanel } from '../components/ui/PrecisePanel';
import { APP_BRAND } from '../config/appBrand';
import { getStrings } from '../i18n/strings';
import { useAssistantSettings } from '../state/assistantSettings';
import { useRegionState } from '../state/region';
import { theme } from '../theme/theme';
import { FontFamily } from '../theme/typography';

export function CongDongScreen() {
  const { languageCode } = useAssistantSettings();
  const strings = getStrings(languageCode);
  const { currentCountry } = useRegionState();
  const feedItems = [
    { id: '1', author: strings.community.post1Author, body: strings.community.post1Body, meta: strings.community.post1Meta },
    { id: '2', author: strings.community.post2Author, body: strings.community.post2Body, meta: strings.community.post2Meta },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.brand}>{APP_BRAND.name}</Text>
        <Text style={styles.title}>{strings.community.screenTitle}</Text>
        <Text style={styles.subtitle}>{strings.community.subtitle}</Text>
        <Text style={styles.contextText}>{currentCountry}</Text>
        <PrecisePanel style={styles.previewPill}>
          <Text style={styles.previewText}>{strings.community.subtitle}</Text>
        </PrecisePanel>

        <PrecisePanel style={styles.composer}>
          <Text style={styles.composerText}>{strings.community.composerPlaceholder}</Text>
          <Pressable
            onPress={() =>
              Alert.alert(strings.community.screenTitle, strings.community.subtitle)
            }
            style={({ pressed }) => [styles.postButton, pressed && styles.pressed]}
          >
            <Text style={styles.postButtonText}>{strings.community.postButton}</Text>
          </Pressable>
        </PrecisePanel>

        <Text style={styles.feedTitle}>{strings.community.feedTitle}</Text>
        {feedItems.map((item) => (
          <Pressable
            key={item.id}
            onPress={() =>
              Alert.alert(strings.community.screenTitle, strings.community.feedTitle)
            }
            style={({ pressed }) => [styles.feedCard, pressed && styles.pressed]}
          >
            <View style={styles.feedHeader}>
              <View style={styles.avatarCircle}>
                <Ionicons name="person" size={14} color={theme.colors.SignatureGold} />
              </View>
              <Text style={styles.author}>{item.author}</Text>
              <Text style={styles.meta}>{item.meta}</Text>
            </View>
            <Text style={styles.body}>{item.body}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.DeepInkNavy,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 120,
  },
  brand: {
    ...theme.typeScale.caption,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  title: {
    ...theme.typeScale.h1,
    color: theme.colors.SignatureGold,
    marginBottom: 6,
  },
  subtitle: {
    ...theme.typeScale.body,
    color: theme.colors.text.secondary,
  },
  contextText: {
    ...theme.typeScale.caption,
    color: theme.colors.text.secondary,
    marginBottom: 12,
  },
  previewPill: {
    backgroundColor: theme.colors.executive.card,
    marginBottom: 10,
  },
  previewText: { ...theme.typeScale.caption, color: theme.colors.CeolWhite, fontFamily: FontFamily.semibold },
  composer: {
    backgroundColor: theme.colors.executive.card,
    marginBottom: 12,
  },
  composerText: {
    ...theme.typeScale.body,
    color: theme.colors.text.secondary,
    marginBottom: 10,
  },
  postButton: {
    alignSelf: 'flex-end',
    borderRadius: 10,
    backgroundColor: theme.colors.SignatureGold,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  postButtonText: {
    ...theme.typeScale.caption,
    color: theme.colors.onAccent,
    fontFamily: FontFamily.semibold,
  },
  feedTitle: {
    marginTop: 4,
    marginBottom: 8,
    ...theme.typeScale.h2,
    color: theme.colors.SignatureGold,
  },
  feedCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    backgroundColor: theme.colors.executive.card,
    padding: 12,
    marginBottom: 10,
  },
  feedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.executive.chipFill,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
  },
  author: {
    marginLeft: 8,
    ...theme.typeScale.body,
    color: theme.colors.CeolWhite,
    fontFamily: FontFamily.semibold,
    flex: 1,
  },
  meta: {
    ...theme.typeScale.caption,
    color: theme.colors.text.secondary,
  },
  body: {
    ...theme.typeScale.body,
    color: theme.colors.CeolWhite,
  },
  pressed: {
    opacity: 0.78,
  },
});
