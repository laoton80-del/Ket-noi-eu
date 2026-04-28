import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';

type Props = {
  tone?: 'info' | 'warning' | 'error';
  text: string;
  retryLabel?: string;
  onRetry?: () => void;
};

export const InlineStatusBanner: React.FC<Props> = ({ tone = 'info', text, retryLabel, onRetry }) => {
  const bg = tone === 'error' ? theme.hybrid.chipErrorBg : tone === 'warning' ? theme.colors.executive.panelMuted : theme.hybrid.chipProcessingBg;
  const fg = tone === 'error' ? theme.colors.RouteError : tone === 'warning' ? theme.colors.PendingAmber : theme.colors.SignalBlue;
  return (
    <View style={[styles.wrap, { backgroundColor: bg, borderColor: fg }]}>
      <Text style={[styles.text, { color: fg }]}>{text}</Text>
      {onRetry ? (
        <Pressable onPress={onRetry} style={({ pressed }) => [styles.retryBtn, pressed && { opacity: 0.82 }]}>
          <Text style={[styles.retryText, { color: fg }]}>{retryLabel ?? 'Thử lại'}</Text>
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginVertical: 8,
  },
  text: { ...theme.typeScale.body, fontFamily: FontFamily.semibold },
  retryBtn: { marginTop: 8, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  retryText: { ...theme.typeScale.caption, fontFamily: FontFamily.bold },
});
