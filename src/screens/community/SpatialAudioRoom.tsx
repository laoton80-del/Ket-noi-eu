import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { AdaptiveContainer } from '../../components/layout/AdaptiveContainer';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';

type Participant = {
  id: string;
  name: string;
  angleDeg: number;
  radius: number;
};

const PARTICIPANTS: Participant[] = [
  { id: 'p1', name: 'Anna', angleDeg: 0, radius: 120 },
  { id: 'p2', name: 'Linh', angleDeg: 72, radius: 126 },
  { id: 'p3', name: 'Mika', angleDeg: 144, radius: 116 },
  { id: 'p4', name: 'Quan', angleDeg: 216, radius: 124 },
  { id: 'p5', name: 'Duy', angleDeg: 288, radius: 118 },
];

function PulsingAvatar({ participant }: { participant: Participant }) {
  const volumePulse = useSharedValue(0);
  const theta = (participant.angleDeg * Math.PI) / 180;
  const x = Math.cos(theta) * participant.radius;
  const y = Math.sin(theta) * participant.radius;

  useEffect(() => {
    volumePulse.value = withRepeat(withTiming(1, { duration: 920 }), -1, true);
  }, [volumePulse]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: x },
      { translateY: y },
      { scale: interpolate(volumePulse.value, [0, 1], [1, 1.18]) },
    ],
    opacity: interpolate(volumePulse.value, [0, 1], [0.8, 1]),
  }));

  return (
    <Animated.View style={StyleSheet.flatten([styles.participantWrap, style])}>
      <View style={styles.avatarDot} />
      <Text style={styles.avatarName}>{participant.name}</Text>
    </Animated.View>
  );
}

export function SpatialAudioRoom() {
  const [spatialEnabled, setSpatialEnabled] = useState(false);
  const participants = useMemo(() => PARTICIPANTS, []);

  return (
    <SafeAreaView style={styles.container}>
      <AdaptiveContainer contentStyle={styles.content}>
        <Text style={styles.title}>Phòng cộng đồng âm thanh không gian</Text>
        <Text style={styles.subtitle}>Vị trí âm thanh 3D mô phỏng theo khoảng cách người tham gia.</Text>

        <View style={styles.radarStage}>
          <View style={styles.centerUser}>
            <Text style={styles.centerText}>Bạn</Text>
          </View>
          {participants.map((participant) => (
            <PulsingAvatar key={participant.id} participant={participant} />
          ))}
        </View>

        <Pressable
          onPress={() => setSpatialEnabled((prev) => !prev)}
          style={({ pressed }) => [styles.toggleBtn, pressed && { opacity: 0.84 }]}
        >
          <Text style={styles.toggleText}>
            {spatialEnabled ? 'Đã bật Âm Thanh Không Gian 3D' : 'Bật Âm Thanh Không Gian 3D'}
          </Text>
        </Pressable>
      </AdaptiveContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bgPrimary,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    gap: theme.spacing.md,
  },
  title: {
    ...theme.typeScale.h2,
    color: theme.colors.text.primary,
    fontFamily: FontFamily.bold,
  },
  subtitle: {
    ...theme.typeScale.caption,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.regular,
    textAlign: 'center',
  },
  radarStage: {
    width: 340,
    height: 340,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.glass.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  centerUser: {
    width: 64,
    height: 64,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.hybrid.signalStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    ...theme.typeScale.caption,
    color: theme.hybrid.onSignal,
    fontFamily: FontFamily.bold,
  },
  participantWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -20,
    marginTop: -20,
  },
  avatarDot: {
    width: 28,
    height: 28,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.primary,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
  },
  avatarName: {
    ...theme.typeScale.caption,
    color: theme.colors.text.primary,
    fontFamily: FontFamily.medium,
    marginTop: 2,
  },
  toggleBtn: {
    minHeight: theme.components.button.height.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.hybrid.signalSubtleBorder,
    backgroundColor: theme.hybrid.signalStrong,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  toggleText: {
    ...theme.typeScale.body,
    color: theme.hybrid.onSignal,
    fontFamily: FontFamily.semibold,
  },
});
