import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LAUNCH_PILOT_CONFIG } from '../../config/launchPilot';
import type { UserSegment } from '../../context/AuthContext';
import type { RootStackParamList } from '../../navigation/routes';
import { runMarketplaceAiBookingFlow } from '../../services/marketplace';
import type { LifeOSData } from '../model/lifeOSDataTypes';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function buildLifeOSActions(
  navigation: Nav,
  ctx: { userCountry?: string; segment: UserSegment }
): LifeOSData['actions'] {
  const { userCountry, segment } = ctx;
  return {
    onPressBookLeona: () => {
      navigation.navigate('LeonaCall', {
        prefillRequest: 'Gọi hỗ trợ gia hạn hồ sơ pháp lý/visa',
        autoSubmit: true,
      });
    },
    onPressTopUp: () => {
      navigation.navigate('Wallet');
    },
    onPressUpgradeLearning: () => {
      if (segment === 'child') {
        navigation.navigate('KidsLearningHome');
        return;
      }
      navigation.navigate('AdultLearningHome');
    },
    onPressCallHelp: () => {
      navigation.navigate('LeonaCall', {
        prefillRequest: 'Tôi cần Leona gọi hộ / hỗ trợ liên hệ. Tóm tắt giúp tôi việc cần làm.',
        autoSubmit: false,
      });
    },
    onPressInterpreter: () => {
      navigation.navigate('LiveInterpreter', {
        guidedEntry: true,
        scenario: 'general',
      });
    },
    onPressCallAssist: () => {
      navigation.navigate('Tabs', { screen: 'LeTan' });
    },
    onPressFindServices: () => {
      if (LAUNCH_PILOT_CONFIG.enableRadarSurface) {
        navigation.navigate('RadarDiscovery');
        return;
      }
      navigation.navigate('LeonaCall', {
        prefillRequest: 'Tôi cần tìm dịch vụ uy tín gần khu vực của tôi.',
        autoSubmit: false,
      });
    },
    onPressMarketplaceAutoBook: () => {
      void (async () => {
        const result = await runMarketplaceAiBookingFlow({
          userCountry,
          userContext: {
            location: userCountry ?? null,
            language: 'vi',
            businessType: 'general',
            requestedTimeIso: null,
          },
        });
        if (!result) return;
        navigation.navigate('LeonaCall', {
          prefillRequest: result.outboundCallPrefill,
          autoSubmit: true,
        });
      })();
    },
  };
}
