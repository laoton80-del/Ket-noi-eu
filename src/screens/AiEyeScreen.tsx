import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrecisePanel } from '../components/ui/PrecisePanel';
import { StatusChip, type StatusChipState } from '../components/ui/StatusChip';
import { useRegionState } from '../state/region';
import { scanDocumentWithAI, type DocumentParseResult } from '../services/ai/DocumentScannerClient';
import { theme } from '../theme/theme';
import { FontFamily } from '../theme/typography';

export function AiEyeScreen() {
  const { currentCountry } = useRegionState();
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<DocumentParseResult | null>(null);

  const urgencyToState = (urgency: DocumentParseResult['urgency']): StatusChipState => {
    if (urgency === 'High') return 'Error';
    if (urgency === 'Medium') return 'Pending';
    return 'Cleared';
  };

  const onPickDocument = async () => {
    if (isScanning) return;
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      base64: true,
      quality: 0.8,
    });
    if (picked.canceled || !picked.assets.length) {
      return;
    }
    const asset = picked.assets[0];
    if (!asset.uri) return;

    const maxDimension = 1500;
    const sourceWidth = typeof asset.width === 'number' ? asset.width : maxDimension;
    const sourceHeight = typeof asset.height === 'number' ? asset.height : maxDimension;
    const shouldResize = sourceWidth > maxDimension || sourceHeight > maxDimension;
    const resizeAction: ImageManipulator.Action[] = shouldResize
      ? sourceWidth >= sourceHeight
        ? [{ resize: { width: maxDimension } }]
        : [{ resize: { height: maxDimension } }]
      : [];

    const optimized = await ImageManipulator.manipulateAsync(asset.uri, resizeAction, {
      compress: 0.7,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    });
    if (!optimized.base64) return;

    setSelectedImageUri(optimized.uri);
    setScanResult(null);
    setIsScanning(true);
    try {
      const parsed = await scanDocumentWithAI(optimized.base64, currentCountry);
      setScanResult(parsed);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>AI Document Eye</Text>
          <Text style={styles.subtitle}>Local context: {currentCountry}</Text>
        </View>

        <Pressable
          onPress={() => void onPickDocument()}
          disabled={isScanning}
          style={({ pressed }) => [styles.scanButton, isScanning && styles.scanButtonDisabled, pressed && { opacity: 0.8 }]}
        >
          <Ionicons name="camera-outline" size={28} color={theme.colors.CeolWhite} />
          <Text style={styles.scanButtonText}>Scan Document</Text>
        </Pressable>

        {selectedImageUri ? (
          <PrecisePanel style={styles.previewPanel}>
            <Image source={{ uri: selectedImageUri }} style={styles.previewImage} resizeMode="cover" />
          </PrecisePanel>
        ) : null}

        {isScanning ? (
          <PrecisePanel style={styles.loadingPanel}>
            <ActivityIndicator color={theme.colors.primary} />
            <Text style={styles.loadingText}>AI is analyzing document context...</Text>
          </PrecisePanel>
        ) : null}

        {scanResult ? (
          <View style={styles.resultStack}>
            <PrecisePanel>
              <View style={styles.resultHeaderRow}>
                <Text style={styles.resultTitle}>{scanResult.title}</Text>
                <StatusChip state={urgencyToState(scanResult.urgency)} />
              </View>
              <Text style={styles.resultSummary}>{scanResult.summary}</Text>
            </PrecisePanel>

            <PrecisePanel>
              <Text style={styles.actionHeader}>Action Items</Text>
              {scanResult.actionItems.map((item) => (
                <View key={item} style={styles.actionRow}>
                  <Ionicons name="checkmark-circle-outline" size={16} color={theme.colors.primary} />
                  <Text style={styles.actionText}>{item}</Text>
                </View>
              ))}
            </PrecisePanel>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.DeepInkNavy },
  content: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  header: {
    gap: theme.spacing.xs,
  },
  title: {
    ...theme.typeScale.h2,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.CeolWhite,
  },
  subtitle: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.secondary,
  },
  scanButton: {
    minHeight: 56,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.RouteError,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  scanButtonDisabled: {
    opacity: 0.7,
  },
  scanButtonText: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.bold,
    color: theme.colors.CeolWhite,
  },
  previewPanel: {
    padding: theme.spacing.sm,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: theme.radius.sm,
  },
  loadingPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  loadingText: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.primary,
    flex: 1,
  },
  resultStack: {
    gap: theme.spacing.sm,
  },
  resultHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  resultTitle: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.bold,
    color: theme.colors.text.primary,
    flex: 1,
  },
  resultSummary: {
    marginTop: theme.spacing.sm,
    ...theme.typeScale.caption,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.secondary,
    lineHeight: theme.typeScale.body.lineHeight,
  },
  actionHeader: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  actionText: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.secondary,
    flex: 1,
    lineHeight: theme.typeScale.body.lineHeight,
  },
});
