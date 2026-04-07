import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { APP_BRAND } from '../config/appBrand';
import { Colors } from '../theme/colors';
import { FontFamily } from '../theme/typography';

type Section = {
  title: string;
  lines: string[];
};

const sections: Section[] = [
  {
    title: 'Sứ mệnh',
    lines: [
      'Chúng tôi mong muốn, khi Kết Nối Global phát triển vững vàng hơn, hệ sinh thái này sẽ từng bước tạo ra những hỗ trợ thiết thực cho trẻ em có hoàn cảnh khó khăn tại Việt Nam.',
      'Đó có thể là hỗ trợ học tập, đồ dùng cần thiết, điều kiện sinh hoạt tốt hơn, hoặc những chương trình đồng hành dài hạn mang lại giá trị bền vững.',
    ],
  },
  {
    title: 'Cam kết',
    lines: [
      'Kết Nối Global sẽ từng bước dành một phần giá trị tạo ra từ hệ sinh thái để đồng hành cùng các hoạt động thiện nguyện thiết thực.',
      'Chúng tôi chọn cách đi chậm nhưng thật, rõ ràng và bền vững.',
      'Khi chương trình được triển khai chính thức, mọi hoạt động sẽ được cập nhật minh bạch trong ứng dụng.',
    ],
  },
  {
    title: 'Trong thời gian tới',
    lines: [
      'Khi hệ thống vận hành ổn định hơn, cộng đồng người dùng Kết Nối Global cũng sẽ có thể cùng chung tay đóng góp thông qua Kết Nối Yêu Thương.',
      'Mỗi sự đồng hành, dù nhỏ, đều có thể tạo ra một thay đổi ý nghĩa.',
    ],
  },
  {
    title: 'Điều chúng tôi luôn giữ',
    lines: [
      'Thiết thực hơn hình thức',
      'Bền vững hơn ngắn hạn',
      'Minh bạch hơn lời hứa',
      'Tử tế trong từng hành động',
    ],
  },
  {
    title: 'Trạng thái hiện tại',
    lines: [
      'Hiện tại chương trình chưa mở đóng góp cộng đồng.',
      'Kết Nối Yêu Thương đang ở giai đoạn xây nền tảng và chuẩn bị cho các bước đi lâu dài.',
      'Khi chương trình sẵn sàng để cộng đồng cùng tham gia, chúng tôi sẽ cập nhật ngay trong ứng dụng.',
    ],
  },
];

export function KetNoiYeuThuongScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.brand}>{APP_BRAND.name}</Text>
        <Text style={styles.title}>Kết Nối Yêu Thương</Text>
        <Text style={styles.hero}>
          Kết Nối Global tin rằng công nghệ không chỉ giúp cuộc sống dễ hơn, mà còn có thể tạo ra những giá trị tốt đẹp hơn cho cộng đồng.
        </Text>
        <Text style={styles.hero}>
          Kết Nối Yêu Thương là định hướng đồng hành lâu dài của chúng tôi dành cho trẻ em có hoàn cảnh khó khăn tại Việt Nam.
        </Text>

        {sections.map((section) => (
          <View key={section.title} style={styles.card}>
            <Text style={styles.cardTitle}>{section.title}</Text>
            {section.lines.map((line) => (
              <Text key={line} style={styles.cardLine}>
                {line}
              </Text>
            ))}
          </View>
        ))}

        <View style={styles.quoteCard}>
          <Text style={styles.quote}>“Kết nối không chỉ để sống tốt hơn, mà còn để cùng nhau tạo ra điều tốt đẹp hơn.”</Text>
        </View>

        <View style={styles.softCta}>
          <Text style={styles.softCtaText}>Sẽ sớm cập nhật</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 16, paddingBottom: 32 },
  brand: {
    fontSize: 13,
    color: Colors.textSoft,
    fontFamily: FontFamily.regular,
    marginTop: 4,
    marginBottom: 6,
  },
  title: {
    fontSize: 30,
    color: Colors.text,
    fontFamily: FontFamily.extrabold,
    marginBottom: 10,
  },
  hero: {
    fontSize: 15,
    lineHeight: 23,
    color: Colors.text,
    fontFamily: FontFamily.regular,
    marginBottom: 10,
  },
  card: {
    marginTop: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    backgroundColor: Colors.glass,
    padding: 14,
  },
  cardTitle: {
    fontSize: 17,
    color: Colors.text,
    fontFamily: FontFamily.bold,
    marginBottom: 8,
  },
  cardLine: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.textSoft,
    fontFamily: FontFamily.regular,
    marginBottom: 6,
  },
  quoteCard: {
    marginTop: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    backgroundColor: 'rgba(255, 248, 232, 0.75)',
    padding: 14,
  },
  quote: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.text,
    fontFamily: FontFamily.semibold,
    textAlign: 'center',
  },
  softCta: {
    marginTop: 14,
    borderRadius: 999,
    minHeight: 42,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.glass,
  },
  softCtaText: {
    color: Colors.primary,
    fontSize: 14,
    fontFamily: FontFamily.bold,
  },
});
