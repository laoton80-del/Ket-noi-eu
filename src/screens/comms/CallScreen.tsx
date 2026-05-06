import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { RTCView } from 'react-native-webrtc';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RootStackParamList } from '../../navigation/routes';
import { createVoiceTranslationBridge } from '../../services/comms/VoiceTranslationBridge';
import { useP2PVoiceCall } from '../../services/comms/useP2PVoiceCall';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';

export type CallScreenProps = NativeStackScreenProps<RootStackParamList, 'P2PVoiceCall'>;

export function CallScreen({ navigation, route }: CallScreenProps) {
  const { roomId, role, peerDisplayName, isOfferer } = route.params;
  const [muted, setMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const bridge = useMemo(() => createVoiceTranslationBridge(), []);

  const onError = useCallback((message: string) => {
    setErrorBanner(message);
  }, []);

  const call = useP2PVoiceCall({
    roomId,
    role,
    isOfferer,
    bridge,
    onError,
  });

  useEffect(() => {
    void Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      shouldDuckAndroid: false,
      playThroughEarpieceAndroid: !speakerOn,
    }).catch(() => {
      /* non-fatal */
    });
  }, [speakerOn]);

  useEffect(() => {
    call.setMuted(muted);
  }, [muted, call]);

  const statusLabel = useMemo(() => {
    if (errorBanner) return errorBanner;
    if (!call.signalingConnected) return 'Đang kết nối tín hiệu…';
    return call.connectionState;
  }, [call.connectionState, call.signalingConnected, errorBanner]);

  const endCall = useCallback(() => {
    call.hangUp();
    navigation.goBack();
  }, [call, navigation]);

  return (
    <LinearGradient colors={['#050B14', '#0B1F3B', '#0E1624']} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.title}>Cuộc gọi trong app</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {peerDisplayName ?? (role === 'tourist' ? 'Khách · Tourist' : 'Merchant địa phương')}
          </Text>
          <Text style={styles.roomHint} numberOfLines={1}>
            Phòng: {roomId}
          </Text>
        </View>

        <View style={styles.avatarRing}>
          <View style={styles.avatarInner}>
            <Ionicons name="call" size={44} color="#C8FFCF" />
          </View>
        </View>

        <Text style={styles.status}>{statusLabel}</Text>

        {call.remoteStream ? (
          <RTCView
            streamURL={call.remoteStream.toURL()}
            style={styles.hiddenRtc}
            objectFit="cover"
            zOrder={0}
            mirror={false}
          />
        ) : null}

        <View style={styles.controls}>
          <Pressable
            onPress={() => setMuted((m) => !m)}
            style={({ pressed }) => [styles.ctrlBtn, pressed && { opacity: 0.85 }]}
            accessibilityLabel={muted ? 'Bật micro' : 'Tắt micro'}
          >
            <Ionicons name={muted ? 'mic-off' : 'mic'} size={26} color="#F4F7FC" />
            <Text style={styles.ctrlLabel}>{muted ? 'Bật mic' : 'Tắt mic'}</Text>
          </Pressable>

          <Pressable
            onPress={() => setSpeakerOn((s) => !s)}
            style={({ pressed }) => [styles.ctrlBtn, pressed && { opacity: 0.85 }]}
            accessibilityLabel="Loa ngoài"
          >
            <Ionicons name={speakerOn ? 'volume-high' : 'ear'} size={26} color="#F4F7FC" />
            <Text style={styles.ctrlLabel}>{speakerOn ? 'Loa ngoài' : 'Tai nghe'}</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              Alert.alert('Kết thúc cuộc gọi?', undefined, [
                { text: 'Ở lại', style: 'cancel' },
                { text: 'Kết thúc', style: 'destructive', onPress: () => endCall() },
              ]);
            }}
            style={({ pressed }) => [styles.ctrlBtn, styles.ctrlEnd, pressed && { opacity: 0.88 }]}
            accessibilityLabel="Kết thúc cuộc gọi"
          >
            <Ionicons name="call" size={28} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
            <Text style={styles.ctrlLabelEnd}>Kết thúc</Text>
          </Pressable>
        </View>

        <Text style={styles.footerNote}>
          Âm thanh đi thẳng giữa hai máy (P2P). AI phiên dịch có thể gắn vào luồng sau này.
        </Text>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: 20 },
  header: { alignItems: 'center', marginTop: 8 },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: 22,
    color: theme.colors.text.primary,
  },
  subtitle: {
    marginTop: 6,
    fontFamily: FontFamily.medium,
    fontSize: 16,
    color: 'rgba(232,238,249,0.92)',
  },
  roomHint: {
    marginTop: 4,
    fontSize: 12,
    color: 'rgba(154,167,188,0.95)',
  },
  avatarRing: {
    alignSelf: 'center',
    marginTop: 36,
    marginBottom: 20,
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: 'rgba(200,255,207,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11,42,102,0.35)',
  },
  avatarInner: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: 'rgba(5,11,20,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  status: {
    textAlign: 'center',
    fontSize: 14,
    color: 'rgba(200,210,230,0.9)',
    marginBottom: 24,
  },
  hiddenRtc: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0.01,
    overflow: 'hidden',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'flex-start',
    marginTop: 'auto',
    marginBottom: 28,
  },
  ctrlBtn: {
    alignItems: 'center',
    minWidth: 88,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  ctrlEnd: {
    backgroundColor: 'rgba(220,53,69,0.95)',
  },
  ctrlLabel: {
    marginTop: 8,
    fontSize: 12,
    color: 'rgba(244,247,252,0.95)',
  },
  ctrlLabelEnd: {
    marginTop: 8,
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  footerNote: {
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    color: 'rgba(154,167,188,0.85)',
    marginBottom: 16,
  },
});
