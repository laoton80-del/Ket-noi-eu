import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system/legacy';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { FontFamily } from '../theme/typography';

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
          <ActivityIndicator color="#D4AF37" />
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
          <Pressable onPress={onClose} style={styles.iconBtn}>
            <Ionicons name="close" size={20} color="#FFE9C0" />
          </Pressable>
          <View style={styles.bound} />
          <Text style={styles.hint}>Dat bai tap vao khung roi chup</Text>
          <Pressable onPress={onCapture} disabled={busy} style={({ pressed }) => [styles.captureOuter, pressed && { opacity: 0.86 }]}>
            <View style={styles.captureInner}>{busy ? <ActivityIndicator color="#FFF2DF" /> : null}</View>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(12,10,8,0.75)' },
  permissionCard: {
    marginTop: 180,
    marginHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.45)',
    backgroundColor: 'rgba(28,22,16,0.9)',
    alignItems: 'center',
    padding: 16,
  },
  permissionTitle: { color: '#FFF0CF', fontSize: 16, fontFamily: FontFamily.bold, marginBottom: 12 },
  btn: {
    minWidth: 120,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#C62828',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { color: '#FFE8D0', fontFamily: FontFamily.bold },
  closeBtn: {
    marginTop: 8,
    minHeight: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  closeText: { color: '#FFE8D0', fontSize: 12, fontFamily: FontFamily.medium },
  cameraWrap: { flex: 1 },
  iconBtn: {
    position: 'absolute',
    top: 54,
    left: 16,
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.45)',
    backgroundColor: 'rgba(21,17,12,0.75)',
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
    borderColor: 'rgba(212,175,55,0.92)',
    backgroundColor: 'transparent',
  },
  hint: {
    marginTop: 10,
    textAlign: 'center',
    color: '#FFE7C7',
    fontSize: 12,
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
    borderColor: 'rgba(212,175,55,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,232,170,0.24)',
  },
  captureInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#CB3D3D',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
