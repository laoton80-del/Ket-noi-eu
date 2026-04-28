import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system/legacy';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { FontFamily } from '../theme/typography';
import { theme } from '../theme/theme';

export function HomeworkScanner({
  visible,
  onClose,
  onCaptured,
}: {
  visible: boolean;
  onClose: () => void;
  onCaptured: (base64Image: string) => void;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const [busy, setBusy] = useState(false);
  if (!visible) return null;

  const onCapture = async () => {
    if (!cameraRef.current || busy) return;
    setBusy(true);
    try {
      const shot = await cameraRef.current.takePictureAsync({ quality: 0.82, skipProcessing: true });
      if (!shot?.uri) return;
      const optimized = await manipulateAsync(shot.uri, [{ resize: { width: 900 } }], {
        compress: 0.72,
        format: SaveFormat.JPEG,
        base64: true,
      });
      const base64 =
        optimized.base64 ??
        (await FileSystem.readAsStringAsync(optimized.uri, { encoding: FileSystem.EncodingType.Base64 }));
      onCaptured(base64);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.overlay}>
      {!permission ? (
        <View style={styles.permissionCard}>
          <ActivityIndicator color={theme.colors.SignatureGold} />
        </View>
      ) : !permission.granted ? (
        <View style={styles.permissionCard}>
          <Text style={styles.permissionTitle}>Can quyen Camera</Text>
          <Pressable onPress={() => void requestPermission()} style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]}>
            <Text style={styles.btnText}>Cho phep</Text>
          </Pressable>
          <Pressable onPress={onClose} style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.85 }]}>
            <Text style={styles.closeText}>Dong</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.cameraWrap}>
          <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
          <Pressable onPress={onClose} style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.8 }]}>
            <Ionicons name="close" size={20} color={theme.colors.primaryBright} />
          </Pressable>
          <View style={styles.bound} />
          <Text style={styles.hint}>Dat bai tap vao khung roi chup</Text>
          <Pressable onPress={onCapture} disabled={busy} style={({ pressed }) => [styles.captureOuter, pressed && { opacity: 0.86 }]}>
            <View style={styles.captureInner}>{busy ? <ActivityIndicator color={theme.colors.primaryBright} /> : null}</View>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: theme.colors.overlay.dim },
  permissionCard: {
    marginTop: 180,
    marginHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    backgroundColor: theme.colors.executive.panel,
    alignItems: 'center',
    padding: 16,
  },
  permissionTitle: { color: theme.colors.primaryBright, ...theme.typeScale.h2, fontFamily: FontFamily.bold, marginBottom: 12 },
  btn: {
    minWidth: 120,
    height: 42,
    borderRadius: 12,
    backgroundColor: theme.colors.RouteError,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { color: theme.colors.primaryBright, fontFamily: FontFamily.bold },
  closeBtn: {
    marginTop: 8,
    minHeight: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  closeText: { color: theme.colors.primaryBright, ...theme.typeScale.caption, fontFamily: FontFamily.medium },
  cameraWrap: { flex: 1 },
  iconBtn: {
    position: 'absolute',
    top: 54,
    left: 16,
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    backgroundColor: theme.colors.executive.panelMuted,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  bound: {
    marginTop: 155,
    marginHorizontal: 24,
    height: 290,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: theme.colors.SignatureGold,
    backgroundColor: 'transparent',
  },
  hint: {
    marginTop: 10,
    textAlign: 'center',
    color: theme.colors.primaryBright,
    ...theme.typeScale.caption,
    fontFamily: FontFamily.medium,
  },
  captureOuter: {
    position: 'absolute',
    bottom: 42,
    alignSelf: 'center',
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 3,
    borderColor: theme.colors.SignatureGold,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.overlay.ringSoft,
  },
  captureInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.RouteError,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
