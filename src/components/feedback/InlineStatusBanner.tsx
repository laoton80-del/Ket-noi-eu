import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  tone?: 'info' | 'warning' | 'error';
  text: string;
  retryLabel?: string;
  onRetry?: () => void;
};

export const InlineStatusBanner: React.FC<Props> = ({ tone = 'info', text, retryLabel, onRetry }) => {
  const bg = tone === 'error' ? '#FEE2E2' : tone === 'warning' ? '#FEF3C7' : '#E0F2FE';
  const fg = tone === 'error' ? '#991B1B' : tone === 'warning' ? '#92400E' : '#0C4A6E';
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
  text: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
  retryBtn: { marginTop: 8, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  retryText: { fontSize: 12, fontWeight: '700' },
});
