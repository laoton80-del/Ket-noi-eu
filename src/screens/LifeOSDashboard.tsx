/** Action hub for in-scope support flows (Interpreter, Leona, Vault, Wallet, SOS). */
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, View, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useLifeOSData } from '../hooks/useLifeOSData';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  CompanionCard,
  DailyEngagementCard,
  AdultLearningCard,
  KidsLearningCard,
  LegalWidget,
  LifeOSActionGrid,
  LifeOSLowCreditBanner,
  LifeOSPostActionCard,
  LifeOSSuggestionsCard,
  WalletWidget,
  type LifeOSActionCell,
} from '../components/widgets';
import { postActionHintsFor, type LifeOSTrackedAction } from '../lifeOS/postActionHints';
import { theme } from '../theme/theme';
import { FontFamily } from '../theme/typography';
import { generateSellCTA } from '../services/selling';
import { getDailyContent, markDailyAction, type DailyLoopAction } from '../services/engagement';
import { noteCompanionAction } from '../services/companion';
import { useAuth } from '../context/AuthContext';
import { recordAIIdentityAction } from '../services/identity';
import type { RootStackParamList } from '../navigation/routes';
import { buildLifeOSSuggestionLines, buildPredictiveLines } from '../lifeOS/ui/suggestionBuilders';
import { useLifeOSActionCells } from '../lifeOS/hooks/useLifeOSActionCells';
import { useLifeOSCompanionAndPredictive } from '../lifeOS/hooks/useLifeOSCompanionAndPredictive';
import { useLifeOSDailyLoopBootstrap } from '../lifeOS/hooks/useLifeOSDailyLoopBootstrap';
import { APP_BRAND } from '../config/appBrand';

export const LifeOSDashboard: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const lifeOS = useLifeOSData();
  const { user } = useAuth();
  const [lastAction, setLastAction] = useState<LifeOSTrackedAction | null>(null);
  const { dailyState, setDailyState } = useLifeOSDailyLoopBootstrap();
  const [loadingActionKey, setLoadingActionKey] = useState<string | null>(null);
  const { autoCtas, companionMessage, companionSuggestions } = useLifeOSCompanionAndPredictive({
    userPhone: user?.phone,
    segment: lifeOS.userProfile.segment,
    showLowCreditBanner: lifeOS.showLowCreditBanner,
    showLegalWidget: lifeOS.showLegalWidget,
    holidayActions: lifeOS.holidayActions,
    streakDays: dailyState.streakDays,
    userCountry: lifeOS.userCountry,
    visaExpiryDate: lifeOS.visaExpiryDate,
    daysToExpiry: lifeOS.daysToExpiry,
    learningProgress: lifeOS.learningProgress,
    creditBalance: lifeOS.creditBalance,
  });

  const legalSellFirstLine = useMemo(() => {
    const cta = generateSellCTA('booking_call', {
      userInput: 'gia hạn hồ sơ',
      intent: 'booking',
      context: { userCountry: lifeOS.userCountry, segment: lifeOS.userProfile.segment },
    });
    return cta?.message.split('\n')[0] ?? null;
  }, [lifeOS.userCountry, lifeOS.userProfile.segment]);

  const suggestionLines = useMemo(
    () =>
      buildLifeOSSuggestionLines({
        showLowCreditBanner: lifeOS.showLowCreditBanner,
        lowCreditThreshold: lifeOS.lowCreditThreshold,
        showLegalWidget: lifeOS.showLegalWidget,
        userCountry: lifeOS.userCountry,
        userSegment: lifeOS.userProfile.segment,
        daysToExpiry: lifeOS.daysToExpiry,
        isLowBalance: lifeOS.isLowBalance,
        showEducationWidget: lifeOS.showEducationWidget,
        holidayActions: lifeOS.holidayActions,
        marketplaceSuggestion: lifeOS.marketplaceSuggestion,
        autonomyHint: lifeOS.autonomyHint,
        pricing: {
          leonaOutbound: lifeOS.pricing.leonaOutbound,
          interpreterSession: lifeOS.pricing.interpreterSession,
        },
        legalSellFirstLine,
      }),
    [legalSellFirstLine, lifeOS]
  );

  const predictiveLines = useMemo(() => buildPredictiveLines(autoCtas), [autoCtas]);

  const actionCells: LifeOSActionCell[] = useLifeOSActionCells({
    pricing: {
      leonaOutbound: lifeOS.pricing.leonaOutbound,
      interpreterSession: lifeOS.pricing.interpreterSession,
      leTanBooking: lifeOS.pricing.leTanBooking,
    },
    creditBalance: lifeOS.creditBalance,
    userCountry: lifeOS.userCountry,
    userSegment: lifeOS.userProfile.segment,
    loadingActionKey,
    setLoadingActionKey,
    setLastAction: setLastAction as React.Dispatch<React.SetStateAction<'callHelp' | 'interpreter' | 'callAssist' | 'findServices' | 'topUp'>>,
    actions: {
      onPressTopUp: lifeOS.actions.onPressTopUp,
      onPressCallHelp: lifeOS.actions.onPressCallHelp,
      onPressInterpreter: lifeOS.actions.onPressInterpreter,
      onPressCallAssist: lifeOS.actions.onPressCallAssist,
      onPressFindServices: lifeOS.actions.onPressFindServices,
    },
  });

  const postLines = useMemo(() => {
    if (!lastAction) return [];
    return postActionHintsFor(lastAction, {
      legalCredits: lifeOS.pricing.legalLeona,
      leonaCredits: lifeOS.pricing.leonaOutbound,
      interpreterCredits: lifeOS.pricing.interpreterSession,
      leTanCredits: lifeOS.pricing.leTanBooking,
    });
  }, [lastAction, lifeOS.pricing]);

  const dailyContent = useMemo(
    () =>
      getDailyContent({
        segment: lifeOS.userProfile.segment,
        lowCredit: lifeOS.showLowCreditBanner,
        hasUrgentVisa: lifeOS.showLegalWidget,
        streakDays: dailyState.streakDays,
        lastAction: dailyState.lastAction,
      }),
    [dailyState.lastAction, dailyState.streakDays, lifeOS.showLegalWidget, lifeOS.showLowCreditBanner, lifeOS.userProfile.segment]
  );

  const onDailyAction = useCallback((action: DailyLoopAction) => {
    void markDailyAction(action);
    if (user?.phone) void recordAIIdentityAction(user.phone, action);
    if (action === 'learning') void noteCompanionAction('learning');
    if (action === 'call_help') void noteCompanionAction('call_help');
    if (action === 'interpreter') void noteCompanionAction('interpreter');
    if (action === 'call_assist') void noteCompanionAction('call_assist');
    setDailyState((prev) => ({ ...prev, lastAction: action }));
    if (action === 'learning') {
      setLastAction('learning');
      lifeOS.actions.onPressUpgradeLearning();
      return;
    }
    if (action === 'call_help') {
      setLastAction('callHelp');
      lifeOS.actions.onPressCallHelp();
      return;
    }
    if (action === 'interpreter') {
      setLastAction('interpreter');
      lifeOS.actions.onPressInterpreter();
      return;
    }
    if (action === 'call_assist') {
      setLastAction('callAssist');
      lifeOS.actions.onPressCallAssist();
    }
  }, [lifeOS.actions, setDailyState, user?.phone]);

  const onCompanionSuggestionPress = useCallback((label: string) => {
    if (user?.phone) void recordAIIdentityAction(user.phone, `companion:${label}`);
    const normalized = label.toLowerCase();
    if (normalized.includes('nạp')) {
      setLastAction('topUp');
      lifeOS.actions.onPressTopUp();
      return;
    }
    if (normalized.includes('phiên dịch')) {
      void noteCompanionAction('interpreter');
      setLastAction('interpreter');
      lifeOS.actions.onPressInterpreter();
      return;
    }
    if (normalized.includes('gọi')) {
      void noteCompanionAction('call_help');
      setLastAction('callHelp');
      lifeOS.actions.onPressCallHelp();
      return;
    }
    if (normalized.includes('học') || normalized.includes('bài tập')) {
      void noteCompanionAction('learning');
      setLastAction('learning');
      lifeOS.actions.onPressUpgradeLearning();
      return;
    }
    void noteCompanionAction('call_assist');
    setLastAction('callAssist');
    lifeOS.actions.onPressCallAssist();
  }, [lifeOS.actions, user?.phone]);

  const onSuggestionPress = useCallback(
    (line: string) => {
      const t = line.toLowerCase();
      if (t.includes('nạp') || t.includes('credits')) {
        lifeOS.actions.onPressTopUp();
        return;
      }
      if (t.includes('phiên dịch')) {
        lifeOS.actions.onPressInterpreter();
        return;
      }
      if (t.includes('gia hạn') || t.includes('leona') || t.includes('đặt lịch') || t.includes('goi')) {
        lifeOS.actions.onPressCallHelp();
        return;
      }
      if (t.includes('học') || t.includes('bài tập')) {
        lifeOS.actions.onPressUpgradeLearning();
        return;
      }
      lifeOS.actions.onPressFindServices();
    },
    [lifeOS.actions]
  );

  const blocks = useMemo(() => {
    const result: React.ReactNode[] = [];

    result.push(
      <Animated.View key="companion" entering={FadeInDown.duration(200)}>
        <CompanionCard
          message={companionMessage}
          suggestedActions={companionSuggestions.slice(0, 2)}
          onPressSuggestion={onCompanionSuggestionPress}
        />
      </Animated.View>
    );

    result.push(
      <Animated.View key="travel-hub" entering={FadeInDown.duration(215)}>
        <Pressable
          onPress={() => navigation.navigate('TravelCompanion')}
          style={({ pressed }) => [
            {
              borderRadius: theme.radius.lg,
              borderWidth: 1,
              borderColor: theme.colors.glass.border,
              backgroundColor: theme.colors.glass.surfaceStrong,
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            },
            pressed && { opacity: 0.88 },
          ]}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: theme.colors.background,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="airplane-outline" size={22} color={theme.colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontFamily: FontFamily.bold, color: theme.colors.text.primary }}>Đồng hành du lịch</Text>
            <Text style={{ fontSize: 13, fontFamily: FontFamily.regular, color: theme.colors.text.secondary, marginTop: 4, lineHeight: 18 }}>
              Sân bay, khách sạn, taxi, nhà hàng… — phiên dịch, Leona, SOS, Minh Khang. Không đặt vé hay tìm giá trong app.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
        </Pressable>
      </Animated.View>
    );

    result.push(
      <Animated.View key="daily-loop" entering={FadeInDown.duration(220)}>
        <DailyEngagementCard
          streakDays={dailyState.streakDays}
          suggestion={dailyContent.suggestion}
          reminder={dailyContent.reminder}
          achievement={dailyContent.achievement}
          primaryLabel={dailyContent.quickAction.primaryLabel}
          primaryAction={dailyContent.quickAction.primaryAction}
          secondaryLabel={dailyContent.quickAction.secondaryLabel}
          secondaryAction={dailyContent.quickAction.secondaryAction}
          onAction={onDailyAction}
        />
      </Animated.View>
    );

    if (lifeOS.showLegalWidget) {
      result.push(
        <Animated.View key="urgent" entering={FadeInDown.duration(240)}>
          <LegalWidget
            daysToExpiry={lifeOS.daysToExpiry}
            visaExpiryDate={lifeOS.visaExpiryDate}
            ctaPrice={lifeOS.pricing.legalLeona}
            urgencyLine={lifeOS.legalUrgencyLine}
            onPressAction={() => {
              setLastAction('legal');
              lifeOS.actions.onPressBookLeona();
            }}
          />
        </Animated.View>
      );
    }

    if (lifeOS.showLowCreditBanner) {
      result.push(
        <Animated.View key="low-credit" entering={FadeInDown.duration(250)}>
          <LifeOSLowCreditBanner
            visible
            balance={lifeOS.creditBalance}
            threshold={lifeOS.lowCreditThreshold}
            minActionCost={lifeOS.minActionCost}
            onPressTopUp={() => {
              setLastAction('topUp');
              lifeOS.actions.onPressTopUp();
            }}
          />
        </Animated.View>
      );
    }

    result.push(
      <Animated.View key="actions" entering={FadeInDown.duration(260)}>
        <LifeOSActionGrid cells={actionCells} />
      </Animated.View>
    );

    if (lifeOS.showEducationWidget) {
      if (lifeOS.userProfile.segment === 'child') {
        result.push(
          <Animated.View key="learning-child" entering={FadeInDown.duration(320)}>
            <KidsLearningCard
              progress={lifeOS.kidsLearning.progressPercent}
              onPressStart={() => {
                setLastAction('learning');
                void noteCompanionAction('learning');
                lifeOS.actions.onPressUpgradeLearning();
              }}
            />
          </Animated.View>
        );
      } else {
        result.push(
          <Animated.View key="learning-adult" entering={FadeInDown.duration(300)}>
            <AdultLearningCard
              currentLevel={lifeOS.currentLearningLevel}
              onPressContinue={() => {
                setLastAction('learning');
                void noteCompanionAction('learning');
                lifeOS.actions.onPressUpgradeLearning();
              }}
            />
          </Animated.View>
        );
      }
    }

    result.push(
      <Animated.View key="wallet" entering={FadeInDown.duration(340)}>
        <WalletWidget
          creditBalance={lifeOS.creditBalance}
          isLowBalance={lifeOS.isLowBalance}
          smartWalletLine={lifeOS.smartWalletLine}
          onPressTopUp={() => {
            setLastAction('topUp');
            lifeOS.actions.onPressTopUp();
          }}
        />
      </Animated.View>
    );

    result.push(
      <Animated.View key="post-action" entering={FadeInDown.duration(350)}>
        <LifeOSPostActionCard
          visible={lastAction !== null}
          lines={postLines}
          onDismiss={() => setLastAction(null)}
        />
      </Animated.View>
    );

    const combinedSuggestions = [...predictiveLines, ...suggestionLines].slice(0, 5);
    if (combinedSuggestions.length > 0) {
      result.push(
        <Animated.View key="suggestions" entering={FadeInDown.duration(360)}>
          <LifeOSSuggestionsCard lines={combinedSuggestions} onPressLine={onSuggestionPress} />
        </Animated.View>
      );
    }

    return result;
  }, [
    actionCells,
    companionMessage,
    companionSuggestions,
    dailyContent,
    dailyState.streakDays,
    lifeOS,
    lastAction,
    navigation,
    onCompanionSuggestionPress,
    onDailyAction,
    onSuggestionPress,
    postLines,
    predictiveLines,
    suggestionLines,
  ]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>{APP_BRAND.name}</Text>
          <Text style={styles.subtitle}>LifeOS</Text>
          <Text style={styles.tagline}>Ưu tiên hành động tốn Credits có chủ đích — rõ giá, rõ kết quả.</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.creditChip}>
            <Text style={styles.creditChipText}>{lifeOS.creditBalance} Credits</Text>
          </View>
          <Pressable style={styles.sosBtn} onPress={() => navigation.navigate('EmergencySOS')}>
            <Ionicons name="warning" size={14} color="#FFFFFF" />
            <Text style={styles.sosBtnText}>SOS</Text>
          </Pressable>
        </View>
      </View>
      <View style={styles.stack}>{blocks}</View>
    </ScrollView>
  );
};

export default LifeOSDashboard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  brand: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.regular,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 24,
    color: theme.colors.text.primary,
    fontFamily: FontFamily.extrabold,
  },
  tagline: {
    marginTop: 6,
    fontSize: 13,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.regular,
    maxWidth: '78%',
    lineHeight: 18,
  },
  creditChip: {
    minHeight: 32,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    backgroundColor: theme.colors.glass.surfaceStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  creditChipText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontFamily: FontFamily.bold,
  },
  sosBtn: {
    minHeight: 30,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    justifyContent: 'center',
  },
  sosBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: FontFamily.bold,
  },
  stack: {
    gap: 16,
  },
});
