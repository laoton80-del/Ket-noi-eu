import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';
import { applyWebStyles } from '../../utils/applyWebStyles';
import { coerceLanguageSelection, sanitizeLocalLanguageOptions, type LocalLanguageOption } from '../../utils/languageMapper';

export type SmartLanguageSwitcherProps = Readonly<{
  options: readonly LocalLanguageOption[];
  selectedCode: string;
  onSelect: (code: LocalLanguageOption['code']) => void;
}>;

export function SmartLanguageSwitcher({
  options,
  selectedCode,
  onSelect,
}: SmartLanguageSwitcherProps) {
  const [expanded, setExpanded] = useState(false);
  const safeOptions = useMemo(() => sanitizeLocalLanguageOptions(options), [options]);
  const safeSelectedCode = useMemo(
    () => coerceLanguageSelection(selectedCode, safeOptions),
    [safeOptions, selectedCode]
  );
  const selected = useMemo(
    () => safeOptions.find((o) => o.code === safeSelectedCode) ?? safeOptions[0],
    [safeOptions, safeSelectedCode]
  );

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        style={({ pressed }) => [styles.trigger, pressed && { opacity: 0.9 }]}
        className={applyWebStyles('kn-glass')}
        accessibilityRole="button"
        accessibilityLabel="Chọn ngôn ngữ"
      >
        <Ionicons name="language" size={16} color={theme.hybrid.signalStrong} />
        <Text style={styles.triggerText}>{selected?.label ?? 'Tiếng Việt'}</Text>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={theme.colors.text.secondary} />
      </Pressable>

      {expanded ? (
        <View style={styles.menu} className={applyWebStyles('kn-glass')}>
          {safeOptions.map((o) => (
            <Pressable
              key={o.code}
              onPress={() => {
                onSelect(o.code);
                setExpanded(false);
              }}
              style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.85 }]}
            >
              <Text style={[styles.menuText, safeSelectedCode === o.code && styles.menuTextActive]}>{o.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { minWidth: 150, alignItems: 'flex-end' },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  triggerText: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    color: theme.colors.text.primary,
  },
  menu: {
    marginTop: 8,
    width: '100%',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.surfaceMuted,
    overflow: 'hidden',
  },
  menuItem: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  menuText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: theme.colors.text.secondary,
  },
  menuTextActive: {
    color: theme.colors.primaryBright,
    fontFamily: FontFamily.extrabold,
  },
});
