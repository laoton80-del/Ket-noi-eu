import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  TextInput,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  ToastAndroid,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import { DocumentScanner, mapDocumentTypeToCoreType, toIsoDateFromDdMmYyyy } from '../components/DocumentScanner';
import { MicroHintBanner } from '../components/MicroHintBanner';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/routes';
import { hasSeenMicroHint, markMicroHintSeen } from '../onboarding/guidedOnboardingStorage';
import { understandDocument } from '../services/documentAI';
import { appendUsageHistory } from '../services/history';
import { trackGrowthEvent } from '../services/growth';
import {
  DOCUMENT_VAULT_STORAGE_KEY,
  clearDocumentAlarmSeen,
  getDocumentTypeLabel,
  loadVaultDocuments,
  normalizeVaultDocument,
  type CoreDocumentType,
  type DocumentVaultItem,
} from '../services/DocumentAlarmService';
import { useAssistantSettings } from '../state/assistantSettings';
import { gradients } from '../theme/gradients';
import { theme } from '../theme/theme';
import { FontFamily } from '../theme/typography';

function daysUntil(expiryDate: string): number {
  const now = new Date();
  const target = new Date(`${expiryDate}T00:00:00`);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function DocumentCard({ item, locale }: { item: DocumentVaultItem; locale: string }) {
  const left = daysUntil(item.expiryDate);
  const isUrgent = left <= 30;
  const shake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isUrgent) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shake, { toValue: 1, duration: 120, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -1, duration: 120, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 0, duration: 120, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isUrgent, shake]);

  const label =
    left < 0
      ? `Quá hạn ${Math.abs(left)} ngày`
      : left === 0
      ? 'Hết hạn hôm nay'
      : `Còn ${left} ngày`;

  return (
    <Animated.View
      style={[
        styles.cardWrap,
        isUrgent && styles.cardWrapUrgent,
        isUrgent && { transform: [{ translateX: shake.interpolate({ inputRange: [-1, 1], outputRange: [-1.5, 1.5] }) }] },
      ]}
    >
      <LinearGradient
        colors={isUrgent ? gradients.dangerCard : gradients.sandCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardBorder}
      >
        <View style={styles.cardInner}>
          <View style={styles.cardHeader}>
            <Text style={styles.docType}>{getDocumentTypeLabel(item.documentType)}</Text>
            <Ionicons
              name={isUrgent ? 'warning' : 'shield-checkmark'}
              size={18}
              color={isUrgent ? theme.colors.text.primary : theme.colors.SignatureGold}
            />
          </View>
          <Text style={styles.docName} numberOfLines={1}>
            {item.holderName}
          </Text>
          <Text style={styles.docExpiry}>
            Hết hạn: {new Date(item.expiryDate).toLocaleDateString(locale)}
          </Text>
          <Text style={[styles.daysLeft, isUrgent && styles.daysLeftUrgent]}>{label}</Text>
          <Text style={styles.actionText} numberOfLines={2}>
            {item.actionRequired ?? 'Khuyến nghị: chủ động đặt lịch gia hạn sớm để tránh gián đoạn cư trú/làm việc.'}
          </Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

export function VaultScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, setPendingRedirect, updateProfile } = useAuth();
  const { languageCode } = useAssistantSettings();
  const [docs, setDocs] = useState<DocumentVaultItem[]>([]);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [manualDocType, setManualDocType] = useState<CoreDocumentType>('passport');
  const [manualExpiryDate, setManualExpiryDate] = useState('');
  const [editingDoc, setEditingDoc] = useState<DocumentVaultItem | null>(null);
  const [editDocType, setEditDocType] = useState<CoreDocumentType>('passport');
  const [editExpiryDate, setEditExpiryDate] = useState('');
  const [showVaultMicro, setShowVaultMicro] = useState(false);
  const [docInsight, setDocInsight] = useState<string | null>(null);
  const [vaultError, setVaultError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      if (await hasSeenMicroHint('vault')) return;
      setShowVaultMicro(true);
    })();
  }, []);

  useEffect(() => {
    if (!user) {
      setPendingRedirect('Vault');
      navigation.navigate('Login', { redirectTo: 'Vault' });
    }
  }, [navigation, setPendingRedirect, user]);

  useEffect(() => {
    void (async () => {
      try {
        const loaded = await loadVaultDocuments();
        setDocs(loaded);
      } catch {
        setVaultError('Không tải được dữ liệu giấy tờ. Bạn có thể thử quét lại hoặc nhập tay.');
      }
    })();
  }, []);

  const locale = languageCode === 'vi' ? 'vi-VN' : 'en-GB';
  const sorted = useMemo(
    () => [...docs].sort((a, b) => daysUntil(a.expiryDate) - daysUntil(b.expiryDate)),
    [docs]
  );

  const toast = (msg: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(msg, ToastAndroid.SHORT);
      return;
    }
    Alert.alert('Smart Vault', msg);
  };

  const saveDocs = async (next: DocumentVaultItem[]) => {
    setDocs(next);
    await AsyncStorage.setItem(DOCUMENT_VAULT_STORAGE_KEY, JSON.stringify(next));
    updateProfile({
      identityDocuments: next.map((doc) => ({
        id: doc.id,
        documentType: doc.documentType,
        expiryDate: doc.expiryDate,
        holderName: doc.holderName,
      })),
    });
  };

  const scheduleReminders = async (doc: DocumentVaultItem): Promise<string[]> => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return [];
    const expiry = new Date(`${doc.expiryDate}T09:00:00`);
    const offsets = [90, 30];
    const ids: string[] = [];
    for (const d of offsets) {
      const when = new Date(expiry.getTime() - d * 24 * 60 * 60 * 1000);
      if (when.getTime() <= Date.now()) continue;
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Canh bao giay to',
          body: `Cảnh báo: ${getDocumentTypeLabel(doc.documentType)} của bạn sẽ hết hạn vào ngày ${new Date(doc.expiryDate).toLocaleDateString(
            locale
          )}. Đừng để trễ hạn! Bạn có muốn Trợ lý Leona Nguyen gọi điện đặt lịch gia hạn ngay bây giờ không?`,
          data: {
            route: 'LeonaCall',
            prefillRequest: `Gọi hỗ trợ gia hạn ${getDocumentTypeLabel(doc.documentType)} cho ${doc.holderName} trước ngày ${doc.expiryDate}`,
            autoSubmit: true,
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: when,
        },
      });
      ids.push(id);
    }
    return ids;
  };

  const onScannerResult = async (result: {
    documentType: string;
    expiryDate: string | null;
    confidence: 'high' | 'medium' | 'low';
  }) => {
    try {
      setVaultError(null);
      const mappedType = mapDocumentTypeToCoreType(result.documentType);
      const isoDate = toIsoDateFromDdMmYyyy(result.expiryDate);
      setManualDocType(mappedType);
      setManualExpiryDate(isoDate);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (result.confidence === 'high') {
        toast('Đọc dữ liệu thành công!');
      } else if (result.confidence === 'medium') {
        toast('Đọc dữ liệu tương đối. Vui lòng kiểm tra lại ngày hết hạn trước khi lưu.');
      } else {
        toast('Độ tin cậy quét thấp. Kiểm tra và chỉnh tay trước khi lưu.');
      }
      const meaning = understandDocument(result);
      setDocInsight(`${meaning.summary} Goi y: ${meaning.suggestedActions.map((a) => a.title).slice(0, 1).join('')}`);
      setScannerOpen(false);
      void trackGrowthEvent('ocr_success', {
        meta: { confidence: result.confidence, source: 'vault' },
      });
      void appendUsageHistory({ type: 'ocr', status: 'success', note: 'vault_scan_success' });
    } catch {
      setVaultError('Không thể phân tích giấy tờ lúc này. Bạn vui lòng thử quét lại hoặc nhập tay.');
      void trackGrowthEvent('ocr_fail', { meta: { source: 'vault' } });
      void appendUsageHistory({ type: 'ocr', status: 'failed', note: 'vault_scan_failed' });
    }
  };

  const onAddManualDocument = async () => {
    const expiryDate = manualExpiryDate.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(expiryDate)) {
      toast('Ngày hết hạn phải theo định dạng YYYY-MM-DD.');
      return;
    }
    const manualDoc = normalizeVaultDocument({
      documentType: manualDocType,
      expiryDate,
      holderName: user?.name ?? 'Khách hàng',
      source: 'manual',
      actionRequired: 'Chủ động đặt lịch gia hạn trước hạn để tránh gián đoạn.',
    });
    if (!manualDoc) {
      toast('Thông tin giấy tờ chưa hợp lệ.');
      return;
    }
    const reminderIds = await scheduleReminders(manualDoc);
    const snapshot: DocumentVaultItem = { ...manualDoc, reminderIds };
    await saveDocs([snapshot, ...docs]);
    setManualExpiryDate('');
    toast('Đã thêm giấy tờ vào Vault.');
  };

  const openEditDocument = (doc: DocumentVaultItem) => {
    setEditingDoc(doc);
    setEditDocType(doc.documentType);
    setEditExpiryDate(doc.expiryDate);
  };

  const onSaveEditedDocument = async () => {
    if (!editingDoc) return;
    const expiryDate = editExpiryDate.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(expiryDate)) {
      toast('Ngày hết hạn phải theo định dạng YYYY-MM-DD.');
      return;
    }
    const next = docs.map((doc) =>
      doc.id === editingDoc.id ? { ...doc, documentType: editDocType, expiryDate } : doc
    );
    await clearDocumentAlarmSeen(editingDoc.id);
    await saveDocs(next);
    setEditingDoc(null);
    toast('Đã cập nhật giấy tờ.');
  };

  const onDeleteDocument = async () => {
    if (!editingDoc) return;
    const next = docs.filter((doc) => doc.id !== editingDoc.id);
    await clearDocumentAlarmSeen(editingDoc.id);
    await saveDocs(next);
    setEditingDoc(null);
    toast('Đã xóa giấy tờ khỏi Vault.');
  };

  if (!user) return null;

  return (
    <SafeAreaView style={styles.container}>
      <MicroHintBanner
        visible={showVaultMicro}
        text="Thêm một giấy tờ để nhận nhắc hạn — quét hoặc nhập ngày hết hạn bên dưới."
        onDismiss={() => {
          setShowVaultMicro(false);
          void markMicroHintSeen('vault');
        }}
      />
      {vaultError ? (
        <View style={styles.inlineError}>
          <Text style={styles.inlineErrorText}>{vaultError}</Text>
          <Pressable onPress={() => setVaultError(null)} style={({ pressed }) => [styles.retryMini, pressed && { opacity: 0.8 }]}>
            <Text style={styles.retryMiniText}>Đóng</Text>
          </Pressable>
        </View>
      ) : null}
      <View style={styles.header}>
        <Text style={styles.title}>Smart Document Vault</Text>
        <Text style={styles.subtitle}>Giấy tờ sắp hết hạn sẽ tự động nổi lên trên.</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.quickAddCard}>
          <Text style={styles.quickAddTitle}>Thêm nhanh giấy tờ</Text>
          {docInsight ? <Text style={styles.quickAddHint}>{docInsight}</Text> : null}
          <View style={styles.docTypeRow}>
            {(['passport', 'visa_residency', 'labor_contract'] as const).map((type) => (
              <Pressable
                key={type}
                onPress={() => setManualDocType(type)}
                style={({ pressed }) => [
                  styles.docTypeChip,
                  manualDocType === type && styles.docTypeChipActive,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text style={[styles.docTypeChipText, manualDocType === type && styles.docTypeChipTextActive]}>
                  {getDocumentTypeLabel(type)}
                </Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            value={manualExpiryDate}
            onChangeText={setManualExpiryDate}
            placeholder="Ngày hết hạn (YYYY-MM-DD)"
            placeholderTextColor={theme.hybrid.panelCoolTextMuted}
            style={styles.expiryInput}
          />
          <Pressable onPress={() => void onAddManualDocument()} style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.8 }]}>
            <Text style={styles.addBtnText}>Thêm vào Vault</Text>
          </Pressable>
        </View>
        {sorted.length ? (
          sorted.map((item) => (
            <Pressable key={item.id} onPress={() => openEditDocument(item)} style={({ pressed }) => [pressed && { opacity: 0.8 }]}>
              <DocumentCard item={item} locale={locale} />
            </Pressable>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="archive-outline" size={26} color={theme.colors.SignatureGold} />
            <Text style={styles.emptyTitle}>Kho lưu trữ đang trống</Text>
            <Text style={styles.emptySub}>
              Bấm &quot;Quét Giấy Tờ&quot; để lưu Visa, Passport hoặc Contract.
            </Text>
          </View>
        )}
      </ScrollView>

      <Pressable onPress={() => setScannerOpen(true)} style={({ pressed }) => [styles.scanBtnWrap, pressed && { opacity: 0.8 }]}>
        <LinearGradient colors={gradients.dangerButton} style={styles.scanBtn}>
          <Ionicons name="scan-circle-outline" size={20} color={theme.colors.primaryBright} />
          <Text style={styles.scanBtnText}>Quét Giấy Tờ</Text>
        </LinearGradient>
      </Pressable>

      <DocumentScanner
        visible={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanned={onScannerResult}
        countryCode={user?.country}
      />

      {editingDoc ? (
        <View style={styles.scannerOverlay}>
          <View style={styles.permissionCard}>
            <Text style={styles.permissionTitle}>Chỉnh sửa giấy tờ</Text>
            <View style={styles.docTypeRow}>
              {(['passport', 'visa_residency', 'labor_contract'] as const).map((type) => (
                <Pressable
                  key={`edit-${type}`}
                  onPress={() => setEditDocType(type)}
                  style={({ pressed }) => [
                    styles.docTypeChip,
                    editDocType === type && styles.docTypeChipActive,
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Text style={[styles.docTypeChipText, editDocType === type && styles.docTypeChipTextActive]}>
                    {getDocumentTypeLabel(type)}
                  </Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              value={editExpiryDate}
              onChangeText={setEditExpiryDate}
              placeholder="Ngày hết hạn (YYYY-MM-DD)"
              placeholderTextColor={theme.colors.text.secondary}
              style={[styles.expiryInput, styles.expiryInputDark]}
            />
            <View style={styles.editActionsRow}>
              <Pressable onPress={() => void onSaveEditedDocument()} style={({ pressed }) => [styles.permissionBtn, pressed && { opacity: 0.8 }]}>
                <Text style={styles.permissionBtnText}>Lưu</Text>
              </Pressable>
              <Pressable onPress={() => void onDeleteDocument()} style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.8 }]}>
                <Text style={styles.permissionBtnText}>Xóa</Text>
              </Pressable>
            </View>
            <Pressable onPress={() => setEditingDoc(null)} style={({ pressed }) => [styles.closeEditBtn, pressed && { opacity: 0.8 }]}>
              <Text style={styles.closeEditText}>Đóng</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.SoftMineralGrey },
  inlineError: {
    marginHorizontal: 14,
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.RouteError,
    backgroundColor: theme.hybrid.chipErrorBg,
    padding: 10,
  },
  inlineErrorText: { color: theme.hybrid.chipErrorText, ...theme.typeScale.caption, lineHeight: 18, fontFamily: FontFamily.semibold },
  retryMini: { marginTop: 8, alignSelf: 'flex-start', borderWidth: 1, borderColor: theme.colors.RouteError, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  retryMiniText: { color: theme.hybrid.chipErrorText, ...theme.typeScale.caption, fontFamily: FontFamily.bold },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 6 },
  title: { ...theme.typeScale.h2, color: theme.hybrid.panelCoolText, fontFamily: FontFamily.extrabold },
  subtitle: { marginTop: 4, ...theme.typeScale.caption, color: theme.hybrid.panelCoolTextMuted, fontFamily: FontFamily.regular },
  content: { paddingHorizontal: 14, paddingBottom: 120, gap: 10 },
  quickAddCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.hybrid.panelCoolBorder,
    backgroundColor: theme.colors.CeolWhite,
    padding: 12,
    marginBottom: 4,
  },
  quickAddTitle: { ...theme.typeScale.body, color: theme.hybrid.panelCoolText, fontFamily: FontFamily.bold, marginBottom: 8 },
  quickAddHint: {
    marginTop: -2,
    marginBottom: 8,
    ...theme.typeScale.caption,
    lineHeight: 18,
    color: theme.hybrid.panelCoolTextMuted,
    fontFamily: FontFamily.medium,
  },
  docTypeRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  docTypeChip: {
    minHeight: 30,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.hybrid.panelCoolBorder,
    backgroundColor: theme.colors.CeolWhite,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docTypeChipActive: { backgroundColor: theme.hybrid.signalMutedBg },
  docTypeChipText: { ...theme.typeScale.caption, color: theme.hybrid.panelCoolTextMuted, fontFamily: FontFamily.medium },
  docTypeChipTextActive: { color: theme.hybrid.panelCoolText, fontFamily: FontFamily.bold },
  expiryInput: {
    marginTop: 8,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.hybrid.panelCoolBorder,
    backgroundColor: theme.colors.CeolWhite,
    paddingHorizontal: 10,
    color: theme.hybrid.panelCoolText,
    fontFamily: FontFamily.medium,
  },
  addBtn: {
    marginTop: 8,
    minHeight: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.RouteError,
  },
  addBtnText: { color: theme.colors.CeolWhite, ...theme.typeScale.caption, fontFamily: FontFamily.bold },
  cardWrap: {
    borderRadius: 18,
    shadowColor: theme.colors.glass.shadow,
    shadowOpacity: 0.16,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 10,
    elevation: 5,
  },
  cardWrapUrgent: {
    zIndex: 2,
    shadowColor: theme.colors.RouteError,
    shadowOpacity: 0.35,
    elevation: 8,
  },
  cardBorder: { borderRadius: 18, padding: 1.2 },
  cardInner: {
    borderRadius: 17,
    backgroundColor: theme.colors.CeolWhite,
    padding: 12,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  docType: { ...theme.typeScale.caption, color: theme.colors.SignatureGold, fontFamily: FontFamily.bold },
  docName: { marginTop: 6, ...theme.typeScale.h2, color: theme.hybrid.panelCoolText, fontFamily: FontFamily.extrabold },
  docExpiry: { marginTop: 6, ...theme.typeScale.caption, color: theme.hybrid.panelCoolTextMuted, fontFamily: FontFamily.regular },
  daysLeft: { marginTop: 4, ...theme.typeScale.caption, color: theme.colors.SignatureGold, fontFamily: FontFamily.bold },
  daysLeftUrgent: { color: theme.colors.RouteError },
  actionText: { marginTop: 6, ...theme.typeScale.caption, lineHeight: 18, color: theme.hybrid.panelCoolTextMuted, fontFamily: FontFamily.regular },
  emptyCard: {
    marginTop: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.hybrid.panelCoolBorder,
    backgroundColor: theme.colors.CeolWhite,
    minHeight: 170,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  emptyTitle: { marginTop: 10, ...theme.typeScale.body, color: theme.hybrid.panelCoolText, fontFamily: FontFamily.bold },
  emptySub: { marginTop: 4, ...theme.typeScale.caption, color: theme.hybrid.panelCoolTextMuted, textAlign: 'center', fontFamily: FontFamily.regular },
  scanBtnWrap: { position: 'absolute', left: 16, right: 16, bottom: 20 },
  scanBtn: {
    height: 52,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: theme.colors.RouteError,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
  scanBtnText: { color: theme.colors.primaryBright, ...theme.typeScale.body, fontFamily: FontFamily.bold },
  scannerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: theme.colors.overlay.dim },
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
  permissionTitle: { color: theme.colors.text.primary, ...theme.typeScale.body, fontFamily: FontFamily.bold, marginBottom: 12 },
  permissionBtn: {
    minWidth: 120,
    height: 42,
    borderRadius: 12,
    backgroundColor: theme.colors.RouteError,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionBtnText: { color: theme.colors.CeolWhite, ...theme.typeScale.body, fontFamily: FontFamily.bold },
  editActionsRow: { marginTop: 8, flexDirection: 'row', gap: 8 },
  deleteBtn: {
    minWidth: 120,
    height: 42,
    borderRadius: 12,
    backgroundColor: theme.colors.RouteError,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeEditBtn: {
    marginTop: 8,
    minHeight: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  closeEditText: { color: theme.colors.primaryBright, ...theme.typeScale.caption, fontFamily: FontFamily.medium },
  cameraWrap: { flex: 1 },
  cameraTopBar: {
    position: 'absolute',
    top: 54,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    backgroundColor: theme.colors.executive.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    marginTop: 170,
    marginHorizontal: 34,
    height: 260,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: theme.colors.glass.border,
    backgroundColor: 'transparent',
  },
  captureBtnOuter: {
    position: 'absolute',
    bottom: 42,
    alignSelf: 'center',
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: theme.colors.SignatureGold,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.hybrid.signalMutedBg,
  },
  captureBtnInner: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: theme.colors.RouteError,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expiryInputDark: {
    backgroundColor: theme.colors.executive.panelMuted,
    borderColor: theme.colors.glass.border,
    color: theme.colors.text.primary,
  },
});
