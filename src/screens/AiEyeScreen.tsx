import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  ToastAndroid,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { RadarScanner } from '../components/ai-eye/RadarScanner';
import { InlineStatusBanner } from '../components/feedback/InlineStatusBanner';
import { processVisionFrame, type VisionResultPayload } from '../api/visionPipeline';
import { appendUsageHistory } from '../services/history';
import { trackGrowthEvent } from '../services/growth';
import { addFlashcardFromVision } from '../state/flashcards';
import { ResultBottomSheet } from '../components/ai-eye/ResultBottomSheet';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/routes';
import { useAssistantSettings } from '../state/assistantSettings';
import { FontFamily } from '../theme/typography';

export function AiEyeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, setPendingRedirect } = useAuth();
  const { languageCode } = useAssistantSettings();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [result, setResult] = useState<VisionResultPayload | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [showSaveFx, setShowSaveFx] = useState(false);
  const fxProgress = useSharedValue(0);

  const FRAME_HEIGHT = 286;

  useEffect(() => {
    if (!user) {
      setPendingRedirect('AiEye');
      navigation.navigate('Login');
    }
  }, [navigation, setPendingRedirect, user]);

  useEffect(() => {
    if (!isScanning) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [isScanning]);

  if (!user) return null;

  const onCaptureAndScan = async () => {
    if (!cameraRef.current || isScanning) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setResult(null);
    setScanError(null);
    let photoUri: string | null = null;
    try {
      const shot = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: true,
      });
      if (!shot?.uri) return;
      photoUri = shot.uri;
      setCapturedUri(photoUri);
    } catch {
      return;
    }
    if (!photoUri) return;

    setIsScanning(true);
    try {
      const payload = await processVisionFrame(photoUri, languageCode);
      setResult(payload);
      void trackGrowthEvent('ocr_success', { meta: { source: 'ai_eye' } });
      void appendUsageHistory({ type: 'ocr', status: 'success', note: 'ai_eye_scan_success' });
    } catch {
      const msg = 'Kết nối máy chủ tạm gián đoạn. Giữ ảnh và thử lại sau vài giây.';
      setScanError(msg);
      void trackGrowthEvent('ocr_fail', { meta: { source: 'ai_eye' } });
      void appendUsageHistory({ type: 'ocr', status: 'failed', note: 'ai_eye_scan_failed' });
      if (Platform.OS === 'android') {
        ToastAndroid.show(msg, ToastAndroid.SHORT);
      } else {
        Alert.alert('Mắt Thần · Quét bài', msg);
      }
    } finally {
      setIsScanning(false);
    }
  };

  const onSaveFlashcard = () => {
    if (result) {
      addFlashcardFromVision(result);
    }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const msg = 'Đã lưu từ vựng vào kho thẻ của bé!';
    setShowSaveFx(true);
    fxProgress.value = 0;
    fxProgress.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.quad) }, (done) => {
      if (done) {
        fxProgress.value = 0;
      }
    });
    setTimeout(() => setShowSaveFx(false), 760);
    if (Platform.OS === 'android') {
      ToastAndroid.show(msg, ToastAndroid.SHORT);
      return;
    }
    Alert.alert('Mắt Thần · Quét bài', msg);
  };

  const onRetake = () => {
    if (isScanning) return;
    setResult(null);
    setCapturedUri(null);
  };

  const saveFxStyle = useAnimatedStyle(() => ({
    opacity: 1 - fxProgress.value,
    transform: [{ translateY: -36 * fxProgress.value }],
  }));

  if (!permission) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <ActivityIndicator size="small" color="#D4AF37" />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>Mắt Thần cần quyền Camera</Text>
        <Text style={styles.permissionText}>Cho phép camera để quét đề bài và phân tích ngữ cảnh.</Text>
        <Pressable onPress={() => void requestPermission()} style={({ pressed }) => [styles.permissionBtn, pressed && { opacity: 0.82 }]}>
          <Text style={styles.permissionBtnText}>Cho phép Camera</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {capturedUri ? (
        <Image source={{ uri: capturedUri }} style={styles.camera} resizeMode="cover" />
      ) : (
        <CameraView ref={cameraRef} style={styles.camera} facing="back" enableTorch={flashEnabled} />
      )}

      <View style={styles.overlay}>
        <View style={styles.topMask} />
        <View style={styles.middleRow}>
          <View style={styles.sideMask} />
          <View style={styles.frameWrap}>
            <View style={styles.frameBorder}>
              <RadarScanner active={isScanning} height={FRAME_HEIGHT - 8} durationMs={isScanning ? 560 : 1300} />
            </View>
          </View>
          <View style={styles.sideMask} />
        </View>
        <View style={styles.bottomMask} />
      </View>

      <View style={styles.topBar}>
        <Text style={styles.title}>Mắt Thần</Text>
        <Text style={styles.subtitle}>
          {isScanning ? 'Đang phân tích bài tập…' : 'Căn sách vào khung và bấm chụp'}
        </Text>
        {scanError ? <InlineStatusBanner tone="error" text={scanError} onRetry={() => void onCaptureAndScan()} /> : null}
      </View>
      <Pressable
        onPress={() => setFlashEnabled((v) => !v)}
        style={({ pressed }) => [styles.flashBtn, pressed && { opacity: 0.84 }]}
      >
        <Ionicons name={flashEnabled ? 'flash' : 'flash-off'} size={18} color="#FFE9C0" />
      </Pressable>

      <View style={styles.bottomAction}>
        <Pressable onPress={onRetake} style={({ pressed }) => [styles.retakeBtn, pressed && { opacity: 0.84 }]}>
          <Text style={styles.retakeText}>Chup lai</Text>
        </Pressable>
        <Pressable
          onPress={onCaptureAndScan}
          disabled={isScanning}
          style={({ pressed }) => [styles.captureOuter, isScanning && styles.captureDisabled, pressed && { opacity: 0.86 }]}
        >
          <View style={styles.captureInner}>
            {isScanning ? <ActivityIndicator color="#FFEAD0" /> : null}
          </View>
        </Pressable>
        <View style={styles.placeholder} />
      </View>

      <ResultBottomSheet visible={!!result} result={result} onSave={onSaveFlashcard} />
      {showSaveFx ? (
        <Animated.View style={[styles.saveFxWrap, saveFxStyle]}>
          <Ionicons name="leaf" size={16} color="#FFE3A2" />
          <Text style={styles.saveFxText}>+1 Thẻ học 3D</Text>
        </Animated.View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0E0C' },
  camera: { ...StyleSheet.absoluteFillObject },
  overlay: { ...StyleSheet.absoluteFillObject },
  topMask: { flex: 1, backgroundColor: 'rgba(13, 11, 8, 0.58)' },
  middleRow: { height: 286, flexDirection: 'row' },
  sideMask: { flex: 1, backgroundColor: 'rgba(13, 11, 8, 0.58)' },
  frameWrap: { width: '78%', alignSelf: 'center' },
  frameBorder: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.8)',
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  bottomMask: { flex: 1.3, backgroundColor: 'rgba(13, 11, 8, 0.58)' },
  topBar: {
    position: 'absolute',
    top: 56,
    left: 16,
    right: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.32)',
    backgroundColor: 'rgba(255,255,255,0.16)',
    padding: 12,
  },
  title: { fontSize: 24, color: '#FFF3D6', fontFamily: FontFamily.extrabold, marginBottom: 4 },
  subtitle: { fontSize: 13, color: 'rgba(255,238,200,0.92)', fontFamily: FontFamily.regular },
  flashBtn: {
    position: 'absolute',
    right: 18,
    top: 114,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.55)',
    backgroundColor: 'rgba(28,22,16,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 3,
  },
  bottomAction: {
    position: 'absolute',
    bottom: 28,
    left: 22,
    right: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  retakeBtn: {
    minWidth: 90,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.45)',
    backgroundColor: 'rgba(21,17,12,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retakeText: { color: '#F2DDA8', fontFamily: FontFamily.medium, fontSize: 13 },
  captureOuter: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: 'rgba(212,175,55,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,232,170,0.24)',
  },
  captureInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#CB3D3D',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C93A3A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
  },
  captureDisabled: { opacity: 0.7 },
  placeholder: { minWidth: 90, height: 40 },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#F8F6F0',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  permissionTitle: {
    marginTop: 12,
    fontSize: 22,
    color: '#2A231A',
    fontFamily: FontFamily.extrabold,
    textAlign: 'center',
  },
  permissionText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: '#5D5447',
    fontFamily: FontFamily.regular,
    textAlign: 'center',
  },
  permissionBtn: {
    marginTop: 16,
    minWidth: 180,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#C62828',
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionBtnText: { color: '#FFE8D0', fontFamily: FontFamily.bold, fontSize: 15 },
  saveFxWrap: {
    position: 'absolute',
    bottom: 116,
    alignSelf: 'center',
    minHeight: 30,
    borderRadius: 15,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(31,24,18,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.52)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  saveFxText: {
    color: '#FFE3A2',
    fontFamily: FontFamily.medium,
    fontSize: 12,
  },
});
