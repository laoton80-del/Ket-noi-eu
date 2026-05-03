import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { APP_BRAND } from '../config/appBrand';
import { getStrings } from '../i18n/strings';
import { useAssistantSettings } from '../state/assistantSettings';
import { Colors } from '../theme/colors';
import { FontFamily } from '../theme/typography';

export function CongDongScreen() {
  const { languageCode } = useAssistantSettings();
  const strings = getStrings(languageCode);
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
        <View style={styles.previewPill}>
          <Text style={styles.previewText}>Cộng đồng đang được hoàn thiện trước khi mở công khai. Tạm thời vui lòng dùng LifeOS/Leona/Phiên dịch.</Text>
        </View>

        <View style={styles.composer}>
          <Text style={styles.composerText}>{strings.community.composerPlaceholder}</Text>
          <Pressable
            onPress={() =>
              Alert.alert('Cộng đồng', 'Tính năng này đang trong giai đoạn hoàn thiện. Vui lòng dùng LifeOS, Leona hoặc Phiên dịch.')
            }
            style={({ pressed }) => [styles.postButton, pressed && { opacity: 0.72 }]}
          >
            <Text style={styles.postButtonText}>{strings.community.postButton}</Text>
          </Pressable>
        </View>

        <Text style={styles.feedTitle}>{strings.community.feedTitle}</Text>
        {feedItems.map((item) => (
          <Pressable
            key={item.id}
            onPress={() =>
              Alert.alert('Cộng đồng', 'Bài đăng mẫu — cộng đồng công khai sẽ được cập nhật khi sẵn sàng.')
            }
            style={({ pressed }) => [styles.feedCard, pressed && { opacity: 0.72 }]}
          >
            <View style={styles.feedHeader}>
              <View style={styles.avatarCircle}>
                <Ionicons name="person" size={14} color={Colors.primary} />
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
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 120,
  },
  brand: {
    fontSize: 14,
    color: Colors.textSoft,
    fontFamily: FontFamily.regular,
    marginBottom: 4,
  },
  title: {
    fontSize: 30,
    fontFamily: FontFamily.extrabold,
    color: Colors.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: FontFamily.regular,
    color: Colors.textSoft,
    marginBottom: 12,
  },
  previewPill: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#B7791F',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
  },
  previewText: { fontSize: 12, color: '#7C2D12', fontFamily: FontFamily.semibold },
  composer: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    backgroundColor: Colors.glass,
    padding: 12,
    marginBottom: 12,
  },
  composerText: {
    fontSize: 14,
    color: Colors.textSoft,
    fontFamily: FontFamily.regular,
    marginBottom: 10,
  },
  postButton: {
    alignSelf: 'flex-end',
    borderRadius: 10,
    backgroundColor: Colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  postButtonText: {
    fontSize: 13,
    color: '#33240E',
    fontFamily: FontFamily.bold,
  },
  feedTitle: {
    marginTop: 4,
    marginBottom: 8,
    fontSize: 14,
    color: Colors.text,
    fontFamily: FontFamily.extrabold,
  },
  feedCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    backgroundColor: Colors.glass,
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
    backgroundColor: 'rgba(255,251,242,0.9)',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  author: {
    marginLeft: 8,
    fontSize: 14,
    color: Colors.text,
    fontFamily: FontFamily.semibold,
    flex: 1,
  },
  meta: {
    fontSize: 12,
    color: Colors.textSoft,
    fontFamily: FontFamily.regular,
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    color: Colors.text,
    fontFamily: FontFamily.regular,
  },
});
