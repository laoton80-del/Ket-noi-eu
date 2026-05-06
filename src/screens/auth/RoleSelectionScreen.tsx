import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DiasporaRestrictionModal } from '../../components/modals/DiasporaRestrictionModal';
import { useAppMode } from '../../context/AppModeContext';
import { useAuth } from '../../context/AuthContext';
import type { RootStackParamList } from '../../navigation/routes';
import { evaluateMerchantSurfaceAccess } from '../../services/auth/merchantSurfaceEntry';
import { isDomesticVietnamDialForMerchantPolicy } from '../../services/AuthService';
import { Colors } from '../../theme/colors';
import { FontFamily } from '../../theme/typography';
import { applyWebStyles } from '../../utils/applyWebStyles';
import { WelcomeBrandPanel } from './WelcomeScreen';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function RoleSelectionScreen() {
  const navigation = useNavigation<Nav>();
  const { pendingLogin } = useAuth();
  const { setMode } = useAppMode();
  const [restrictionOpen, setRestrictionOpen] = useState(false);
  const autoB2cTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const phone = pendingLogin?.phone ?? '';
  const isVnDial = isDomesticVietnamDialForMerchantPolicy(phone);

  const clearAutoB2cTimer = useCallback(() => {
    if (autoB2cTimerRef.current) {
      clearTimeout(autoB2cTimerRef.current);
      autoB2cTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!pendingLogin?.phone) {
      navigation.replace('Login');
    }
  }, [navigation, pendingLogin?.phone]);

  useEffect(() => {
    if (!isVnDial || !pendingLogin?.phone) return;
    setMode('B2C_MODE');
    clearAutoB2cTimer();
    autoB2cTimerRef.current = setTimeout(() => {
      autoB2cTimerRef.current = null;
      navigation.replace('SetupProfile', { mode: 'onboarding' });
    }, 900);
    return () => {
      clearAutoB2cTimer();
    };
  }, [clearAutoB2cTimer, isVnDial, navigation, pendingLogin?.phone, setMode]);

  const openB2BBlocked = useCallback(() => {
    clearAutoB2cTimer();
    setRestrictionOpen(true);
  }, [clearAutoB2cTimer]);

  const goB2CSetup = useCallback(() => {
    clearAutoB2cTimer();
    setMode('B2C_MODE');
    navigation.navigate('SetupProfile', { mode: 'onboarding' });
  }, [clearAutoB2cTimer, navigation, setMode]);

  const openMerchantPath = useCallback(
    (route: 'PartnerOnboarding' | 'B2BPaywall') => {
      void (async () => {
        const access = await evaluateMerchantSurfaceAccess(pendingLogin?.phone);
        if (access.denied && access.kind === 'vn_dial') {
          setRestrictionOpen(true);
          return;
        }
        if (access.denied && access.kind === 'gps_vn') {
          Alert.alert('Kết Nối Global', access.message);
          return;
        }
        navigation.navigate(route);
      })();
    },
    [navigation, pendingLogin?.phone]
  );

  if (!pendingLogin?.phone) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <WelcomeBrandPanel />
      <View style={styles.card} className={applyWebStyles('kn-glass')}>
        {isVnDial ? (
          <>
            <Text style={styles.kicker}>Chế độ Khách hàng (B2C)</Text>
            <Text style={styles.title}>Chào mừng bạn đến với Kết Nối Global</Text>
            <Text style={styles.lead}>
              Số điện thoại Việt Nam của bạn được dùng đầy đủ tính năng Khách hàng: đặt dịch vụ nước ngoài, AI trợ lý,
              du lịch và ví. Chúng tôi đang chuyển bạn sang thiết lập hồ sơ…
            </Text>
            <Pressable onPress={goB2CSetup} style={({ pressed }) => [styles.primaryCta, pressed && { opacity: 0.88 }]}>
              <Text style={styles.primaryCtaText}>Tiếp tục ngay</Text>
            </Pressable>
            <Text style={styles.divider}>— hoặc —</Text>
            <Pressable
              onPress={openB2BBlocked}
              style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.86 }]}
              accessibilityRole="button"
              accessibilityLabel="Mở Tiệm Kinh Doanh B2B"
            >
              <Text style={styles.secondaryBtnText}>Mở Tiệm Kinh Doanh (B2B)</Text>
            </Pressable>
            <Pressable
              onPress={openB2BBlocked}
              style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.86 }]}
              accessibilityRole="button"
              accessibilityLabel="Nâng cấp tài khoản Merchant"
            >
              <Text style={styles.secondaryBtnText}>Nâng cấp tài khoản Merchant</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.title}>Bạn muốn bắt đầu như thế nào?</Text>
            <Text style={styles.lead}>Kiều bào có thể mở thêm không gian Kinh doanh (B2B) sau khi hoàn tất hồ sơ.</Text>
            <Pressable onPress={goB2CSetup} style={({ pressed }) => [styles.primaryCta, pressed && { opacity: 0.88 }]}>
              <Text style={styles.primaryCtaText}>Tiếp tục là Khách hàng (B2C)</Text>
            </Pressable>
            <Pressable
              onPress={() => openMerchantPath('PartnerOnboarding')}
              style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.86 }]}
            >
              <Text style={styles.secondaryBtnText}>Mở Tiệm Kinh Doanh (B2B)</Text>
            </Pressable>
            <Pressable
              onPress={() => openMerchantPath('B2BPaywall')}
              style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.86 }]}
            >
              <Text style={styles.secondaryBtnText}>Nâng cấp tài khoản Merchant</Text>
            </Pressable>
          </>
        )}
      </View>
      <DiasporaRestrictionModal visible={restrictionOpen} onClose={() => setRestrictionOpen(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F6F0',
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    backgroundColor: 'rgba(255,255,255,0.78)',
    padding: 18,
    marginTop: 8,
  },
  kicker: {
    fontSize: 12,
    fontFamily: FontFamily.extrabold,
    letterSpacing: 0.6,
    color: Colors.textSoft,
    textTransform: 'uppercase',
    marginBottom: 6,
    textAlign: 'center',
  },
  title: {
    fontSize: 22,
    fontFamily: FontFamily.extrabold,
    color: Colors.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  lead: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: FontFamily.regular,
    color: Colors.textSoft,
    marginBottom: 16,
    textAlign: 'center',
  },
  primaryCta: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: '#C62828',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  primaryCtaText: {
    color: '#FFE9D2',
    fontFamily: FontFamily.bold,
    fontSize: 15,
  },
  divider: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.textSoft,
    marginVertical: 8,
    fontFamily: FontFamily.medium,
  },
  secondaryBtn: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(198, 40, 40, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.65)',
  },
  secondaryBtnText: {
    fontFamily: FontFamily.semibold,
    fontSize: 14,
    color: Colors.text,
  },
});
