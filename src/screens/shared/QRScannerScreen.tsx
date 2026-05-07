import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../../navigation/routes';
import { FontFamily } from '../../theme/typography';

const MASK = 'rgba(5, 11, 20, 0.7)';
const GOLD = '#D4AF37';
const BRACKET_LEN = 26;
const BRACKET_THICK = 3;

type Nav = NativeStackNavigationProp<RootStackParamList>;

const cornerBox = {
  position: 'absolute' as const,
  width: BRACKET_LEN,
  height: BRACKET_LEN,
};

function CornerBrackets({ size }: { size: number }) {
  const inset = 2;
  const arm = BRACKET_LEN;
  const t = BRACKET_THICK;

  return (
    <View style={[styles.bracketHost, { width: size, height: size }]} pointerEvents="none">
      <View style={[cornerBox, { top: inset, left: inset }]}>
        <View style={[styles.bracketV, { width: t, height: arm, top: 0, left: 0 }]} />
        <View style={[styles.bracketH, { width: arm, height: t, top: 0, left: 0 }]} />
      </View>
      <View style={[cornerBox, { top: inset, right: inset }]}>
        <View style={[styles.bracketV, { width: t, height: arm, top: 0, right: 0 }]} />
        <View style={[styles.bracketH, { width: arm, height: t, top: 0, right: 0 }]} />
      </View>
      <View style={[cornerBox, { bottom: inset, left: inset }]}>
        <View style={[styles.bracketV, { width: t, height: arm, bottom: 0, left: 0 }]} />
        <View style={[styles.bracketH, { width: arm, height: t, bottom: 0, left: 0 }]} />
      </View>
      <View style={[cornerBox, { bottom: inset, right: inset }]}>
        <View style={[styles.bracketV, { width: t, height: arm, bottom: 0, right: 0 }]} />
        <View style={[styles.bracketH, { width: arm, height: t, bottom: 0, right: 0 }]} />
      </View>
    </View>
  );
}

export function QRScannerScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { width: winW, height: winH } = useWindowDimensions();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const frame = useMemo(() => Math.min(winW * 0.72, 288), [winW]);
  const cutoutLeft = (winW - frame) / 2;
  const cutoutTop = Math.max(insets.top + 56, (winH - frame) / 2 - 36);

  const laserY = useRef(new Animated.Value(0)).current;
  const laserTravel = Math.max(8, frame - 20);

  const handleScanSuccess = useCallback((data: string) => {
    console.log('[QRScannerScreen] handleScanSuccess', data);
    Alert.alert(
      'Scan successful',
      data.length > 0 ? data : '(empty payload)',
      [{ text: 'Scan again', onPress: () => setScanned(false) }],
      { cancelable: true }
    );
  }, []);

  useEffect(() => {
    laserY.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(laserY, {
          toValue: 1,
          duration: 2600,
          easing: Easing.bezier(0.45, 0.05, 0.25, 1),
          useNativeDriver: true,
        }),
        Animated.timing(laserY, {
          toValue: 0,
          duration: 2600,
          easing: Easing.bezier(0.45, 0.05, 0.25, 1),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => {
      loop.stop();
    };
  }, [laserY, frame]);

  const laserTranslateY = laserY.interpolate({
    inputRange: [0, 1],
    outputRange: [6, laserTravel],
  });

  const onBarcodeScanned = useCallback(
    (result: BarcodeScanningResult) => {
      if (scanned) return;
      const data = result.data?.trim() ?? '';
      if (Platform.OS !== 'web') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setScanned(true);
      handleScanSuccess(data);
    },
    [scanned, handleScanSuccess]
  );

  const permissionDenied = permission?.status === 'denied';
  const permissionGranted = permission?.granted === true;
  const permissionPending = permission === null;

  const openSettings = useCallback(() => {
    void Linking.openSettings();
  }, []);

  return (
    <View style={styles.root}>
      {permissionGranted ? (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={scanned ? undefined : onBarcodeScanned}
        />
      ) : (
        <View style={[styles.fallbackBg, StyleSheet.absoluteFill]} />
      )}

      {permissionGranted ? null : (
        <View style={[styles.permissionLayer, StyleSheet.absoluteFill]} pointerEvents="box-none">
          {permissionPending ? (
            <View style={styles.permissionCard}>
              <ActivityIndicator color={GOLD} size="large" />
              <Text style={styles.permissionTitle}>Checking camera…</Text>
            </View>
          ) : (
            <View style={styles.permissionCard}>
              <Ionicons name="camera-outline" size={40} color={GOLD} />
              <Text style={styles.permissionTitle}>Camera access</Text>
              <Text style={styles.permissionBody}>
                VIONA uses your camera only to read payment QR codes. Your video is not stored.
              </Text>
              {permissionDenied ? (
                <Pressable style={styles.primaryBtn} onPress={openSettings}>
                  <Text style={styles.primaryBtnText}>Open Settings</Text>
                </Pressable>
              ) : null}
              <Pressable
                style={[styles.primaryBtn, permissionDenied && styles.secondaryBtn]}
                onPress={() => void requestPermission()}
              >
                <Text style={styles.primaryBtnText}>
                  {permissionDenied ? 'Try again' : 'Allow camera'}
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      )}

      {permissionGranted ? (
        <>
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <View style={[styles.maskBand, { top: 0, height: cutoutTop, width: winW }]} />
            <View
              style={[
                styles.maskBand,
                {
                  top: cutoutTop + frame,
                  left: 0,
                  width: winW,
                  height: Math.max(0, winH - (cutoutTop + frame)),
                },
              ]}
            />
            <View
              style={[
                styles.maskBand,
                {
                  top: cutoutTop,
                  left: 0,
                  width: cutoutLeft,
                  height: frame,
                },
              ]}
            />
            <View
              style={[
                styles.maskBand,
                {
                  top: cutoutTop,
                  left: cutoutLeft + frame,
                  width: Math.max(0, winW - cutoutLeft - frame),
                  height: frame,
                },
              ]}
            />
          </View>

          <View
            style={[
              styles.cutoutChrome,
              {
                left: cutoutLeft,
                top: cutoutTop,
                width: frame,
                height: frame,
              },
            ]}
            pointerEvents="none"
          >
            <CornerBrackets size={frame} />
            <Animated.View
              style={[
                styles.laser,
                {
                  width: frame - 28,
                  left: 14,
                  transform: [{ translateY: laserTranslateY }],
                },
              ]}
            />
          </View>

          <Text
            style={[
              styles.caption,
              {
                top: cutoutTop + frame + 22,
                left: 24,
                right: 24,
              },
            ]}
            pointerEvents="none"
          >
            <Text style={styles.captionWhite}>Align QR code to pay</Text>
            <Text style={styles.captionGold}> / Quét mã để thanh toán</Text>
          </Text>
        </>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        onPress={() => navigation.goBack()}
        style={[styles.backBtn, { top: insets.top + 8, left: 12 }]}
        hitSlop={12}
      >
        <Ionicons name="chevron-back" size={28} color="rgba(255,255,255,0.95)" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#050b14',
  },
  fallbackBg: {
    backgroundColor: '#050b14',
  },
  permissionLayer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
    backgroundColor: 'rgba(5, 11, 20, 0.55)',
  },
  permissionCard: {
    maxWidth: 360,
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 22,
    backgroundColor: 'rgba(12, 22, 38, 0.94)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    alignItems: 'center',
    gap: 14,
  },
  permissionTitle: {
    fontFamily: FontFamily.semibold,
    fontSize: 20,
    color: 'rgba(248, 250, 252, 0.96)',
    textAlign: 'center',
  },
  permissionBody: {
    fontFamily: FontFamily.regular,
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(226, 232, 240, 0.82)',
    textAlign: 'center',
  },
  primaryBtn: {
    marginTop: 4,
    minWidth: 220,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: 'rgba(212, 175, 55, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.55)',
  },
  secondaryBtn: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.2)',
  },
  primaryBtnText: {
    fontFamily: FontFamily.semibold,
    fontSize: 16,
    color: 'rgba(252, 250, 245, 0.98)',
    textAlign: 'center',
  },
  maskBand: {
    position: 'absolute',
    backgroundColor: MASK,
  },
  cutoutChrome: {
    position: 'absolute',
    overflow: 'hidden',
  },
  bracketHost: {
    ...StyleSheet.absoluteFillObject,
  },
  bracketV: {
    position: 'absolute',
    backgroundColor: GOLD,
    borderRadius: 1,
    shadowColor: GOLD,
    shadowOpacity: 0.45,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  bracketH: {
    position: 'absolute',
    backgroundColor: GOLD,
    borderRadius: 1,
    shadowColor: GOLD,
    shadowOpacity: 0.45,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  laser: {
    position: 'absolute',
    top: 0,
    height: 2,
    backgroundColor: GOLD,
    borderRadius: 1,
    opacity: 0.95,
    shadowColor: GOLD,
    shadowOpacity: 0.95,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    ...(Platform.OS === 'android' ? { elevation: 6 } : null),
  },
  caption: {
    position: 'absolute',
    textAlign: 'center',
    fontFamily: FontFamily.medium,
    fontSize: 15,
    letterSpacing: 0.2,
  },
  captionWhite: {
    color: 'rgba(255, 255, 255, 0.92)',
  },
  captionGold: {
    color: GOLD,
  },
  backBtn: {
    position: 'absolute',
    zIndex: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(5, 11, 20, 0.45)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
  },
});
