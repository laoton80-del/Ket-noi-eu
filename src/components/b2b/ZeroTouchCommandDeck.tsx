import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { useB2bConsolePreferencesStore } from '../../state/b2bConsolePreferences';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';
import { applyWebStyles, mergeWebClassNames } from '../../utils/applyWebStyles';

export type ZeroTouchCommandDeckProps = {
  /** Smart calendar uses dark shell; orders screen uses default light tokens. */
  variant?: 'dark' | 'light';
};

export function ZeroTouchCommandDeck({ variant = 'light' }: ZeroTouchCommandDeckProps) {
  const isDark = variant === 'dark';
  const audioAlertsEnabled = useB2bConsolePreferencesStore((s) => s.audioAlertsEnabled);
  const wholesaleAutoPrint = useB2bConsolePreferencesStore((s) => s.wholesaleAutoPrint);
  const setAudio = useB2bConsolePreferencesStore((s) => s.setAudioAlertsEnabled);
  const setPrint = useB2bConsolePreferencesStore((s) => s.setWholesaleAutoPrint);

  const textPrimary = isDark ? theme.colors.CeolWhite : theme.colors.text.primary;
  const textMuted = isDark ? 'rgba(235, 238, 245, 0.72)' : theme.colors.text.secondary;
  const rowBg = isDark ? 'rgba(8, 14, 28, 0.55)' : 'rgba(255,255,255,0.06)';
  const borderCol = isDark ? 'rgba(197, 160, 89, 0.45)' : theme.colors.glass.borderSoft;

  return (
    <View
      style={[styles.shell, { borderColor: borderCol, backgroundColor: rowBg }]}
      className={mergeWebClassNames('kn-glass', 'kn-neon-b2b')}
    >
      <View style={styles.deckHeader}>
        <Ionicons name="pulse" size={20} color={theme.colors.SignatureGold} />
        <View style={styles.deckHeaderText}>
          <Text style={[styles.deckTitle, { color: textPrimary }]}>Vận hành không chạm</Text>
          <Text style={[styles.deckSub, { color: textMuted }]}>
            AI phiên dịch sang tiếng Việt — cảnh báo âm thanh &amp; in phiếu tự động (mock).
          </Text>
        </View>
      </View>

      <View style={[styles.row, { borderColor: borderCol }]} className={applyWebStyles('kn-glass')}>
        <View style={styles.rowTextCol}>
          <Text style={[styles.rowTitle, { color: textPrimary }]}>Âm thanh thông báo</Text>
          <Text style={[styles.rowHint, { color: textMuted }]}>Nghe “Ting!” khi AI chốt lịch / đơn — tay vẫn làm nail.</Text>
        </View>
        <Switch
          accessibilityLabel="Bật âm thanh thông báo AI"
          value={audioAlertsEnabled}
          onValueChange={setAudio}
          trackColor={{ false: 'rgba(120,120,130,0.5)', true: 'rgba(0, 255, 102, 0.45)' }}
          thumbColor={audioAlertsEnabled ? theme.colors.SignatureGold : '#f4f3f4'}
        />
      </View>

      <View style={[styles.row, { borderColor: borderCol }]} className={applyWebStyles('kn-glass')}>
        <View style={styles.rowTextCol}>
          <Text style={[styles.rowTitle, { color: textPrimary }]}>Tự động in phiếu</Text>
          <Text style={[styles.rowHint, { color: textMuted }]}>
            Đơn mua sỉ từ AI — xếp hàng in biên nhận kho (mô phỏng).
          </Text>
        </View>
        <Switch
          accessibilityLabel="Tự động in phiếu đơn sỉ"
          value={wholesaleAutoPrint}
          onValueChange={setPrint}
          trackColor={{ false: 'rgba(120,120,130,0.5)', true: 'rgba(197, 160, 89, 0.55)' }}
          thumbColor={wholesaleAutoPrint ? theme.colors.primaryBright : '#f4f3f4'}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  deckHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 4,
  },
  deckHeaderText: {
    flex: 1,
    gap: 4,
  },
  deckTitle: {
    fontSize: 16,
    fontFamily: FontFamily.extrabold,
    letterSpacing: 0.3,
  },
  deckSub: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    lineHeight: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: theme.radius.md,
    borderWidth: 1,
  },
  rowTextCol: {
    flex: 1,
    gap: 4,
    paddingRight: 8,
  },
  rowTitle: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
  },
  rowHint: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    lineHeight: 15,
  },
});
