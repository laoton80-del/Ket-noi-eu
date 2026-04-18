import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme/theme';
import { FontFamily } from '../theme/typography';

export type DiscoveryCategoryItem = { title: string; hint: string };

type DiscoveryCuratedListProps = {
  sectionTitle: string;
  sectionSubtitle: string;
  categories: readonly DiscoveryCategoryItem[];
};

export function DiscoveryCuratedList({ sectionTitle, sectionSubtitle, categories }: DiscoveryCuratedListProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle}>{sectionTitle}</Text>
      <Text style={styles.sectionSubtitle}>{sectionSubtitle}</Text>
      <View style={styles.list}>
        {categories.map((item, index) => (
          <View
            key={`${item.title}-${index}`}
            style={[styles.row, index === categories.length - 1 && styles.rowLast]}
          >
            <View style={styles.accentRule} />
            <View style={styles.textCol}>
              <Text style={styles.rowTitle}>{item.title}</Text>
              <Text style={styles.rowHint}>{item.hint}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.text.primary,
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  sectionSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  list: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.hybrid.borderOnInk,
    backgroundColor: theme.colors.surfaceMuted,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    paddingVertical: theme.spacing.sm + 2,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.hybrid.borderOnInk,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  accentRule: {
    width: 3,
    borderRadius: 2,
    backgroundColor: theme.hybrid.signal,
    marginRight: theme.spacing.md,
    alignSelf: 'stretch',
    minHeight: 36,
    opacity: 0.85,
  },
  textCol: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontFamily: FontFamily.semibold,
    color: theme.colors.text.primary,
    marginBottom: 3,
  },
  rowHint: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.tertiary,
  },
});
