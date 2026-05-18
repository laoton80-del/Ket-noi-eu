import { useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrecisePanel } from '../../components/ui/PrecisePanel';
import { GLOBAL_COMMERCIAL_TIERS, getDisplayPrice } from '../../state/commercialTiers';
import { useRegionState } from '../../state/region';
import { syncWalletFromServer } from '../../state/wallet';
import { verifyPurchaseReceipt } from '../../services/billing/receiptVerifier';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';
import { useTranslation } from '../../utils/i18n';

function isPremiumTier(id: string): boolean {
  return id === 'pro' || id === 'power';
}

export function GlobalTiersScreen() {
  const { t } = useTranslation();
  const { localCurrency } = useRegionState();
  const [isPurchasing, setIsPurchasing] = useState(false);

  const onUpgrade = async (tierId: string) => {
    if (isPurchasing) return;
    setIsPurchasing(true);
    try {
      const mockReceipt = 'mock_apple_receipt_12345';
      const platform: 'ios' | 'android' = Platform.OS === 'ios' ? 'ios' : 'android';
      const result = await verifyPurchaseReceipt(mockReceipt, platform, tierId);
      if (result.ok) {
        await syncWalletFromServer();
        Alert.alert(t('checkout.tierDemoSuccessTitle'), t('checkout.tierDemoSuccessBody'));
      } else {
        Alert.alert('Xác minh biên lai thất bại.', 'Vui lòng thử lại trong ít phút.');
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Gói dịch vụ toàn cầu</Text>
        <Text style={styles.subtitle}>Hiển thị theo: {localCurrency}</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
        {GLOBAL_COMMERCIAL_TIERS.map((tier) => {
          const premiumTier = isPremiumTier(tier.id);
          return (
            <PrecisePanel key={tier.id} style={[styles.card, premiumTier && styles.cardPremium]}>
              <View style={styles.cardTop}>
                <Text style={styles.tierName}>{tier.name}</Text>
                <Text style={styles.tierSubtitle}>{tier.subtitle}</Text>
              </View>

              <Text style={[styles.displayPrice, premiumTier && styles.displayPricePremium]}>
                {getDisplayPrice(tier.id, localCurrency)}
              </Text>

              <View style={styles.features}>
                {tier.features.map((feature) => (
                  <View key={`${tier.id}_${feature}`} style={styles.featureRow}>
                    <Text style={styles.featureBullet}>•</Text>
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              <Pressable
                onPress={() => void onUpgrade(tier.id)}
                disabled={isPurchasing}
                style={({ pressed }) => [
                  styles.cta,
                  premiumTier ? styles.ctaPremium : styles.ctaStandard,
                  isPurchasing && styles.ctaDisabled,
                  pressed && { opacity: 0.8 },
                ]}
              >
                {isPurchasing ? <ActivityIndicator color={premiumTier ? theme.colors.CeolWhite : theme.colors.onAccent} /> : null}
                <Text style={[styles.ctaText, premiumTier && styles.ctaTextPremium]}>Nâng cấp</Text>
              </Pressable>
            </PrecisePanel>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.DeepInkNavy,
  },
  header: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
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
  carousel: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  card: {
    width: 310,
    minHeight: 420,
    backgroundColor: theme.colors.SoftMineralGrey,
    borderColor: theme.colors.glass.borderSoft,
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  cardPremium: {
    borderColor: theme.colors.SignatureGold,
    backgroundColor: theme.colors.CeolWhite,
  },
  cardTop: {
    gap: theme.spacing.xs,
  },
  tierName: {
    ...theme.typeScale.h1,
    fontFamily: FontFamily.bold,
    color: theme.hybrid.panelCoolText,
  },
  tierSubtitle: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.regular,
    color: theme.hybrid.panelCoolTextMuted,
    lineHeight: theme.typeScale.body.lineHeight,
  },
  displayPrice: {
    ...theme.typeScale.h2,
    fontFamily: FontFamily.semibold,
    color: theme.colors.SignatureGold,
  },
  displayPricePremium: {
    color: theme.colors.SignalBlue,
  },
  features: {
    gap: theme.spacing.xs,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.xs,
  },
  featureBullet: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.bold,
    color: theme.colors.SignalBlue,
  },
  featureText: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.regular,
    color: theme.hybrid.panelCoolText,
    flex: 1,
    lineHeight: theme.typeScale.body.lineHeight,
  },
  cta: {
    minHeight: theme.components.button.height.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  ctaDisabled: {
    opacity: 0.65,
  },
  ctaStandard: {
    backgroundColor: theme.colors.SignatureGold,
    borderColor: theme.colors.SignatureGold,
  },
  ctaPremium: {
    backgroundColor: theme.colors.SignalBlue,
    borderColor: theme.colors.SignalBlue,
  },
  ctaText: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.bold,
    color: theme.colors.onAccent,
  },
  ctaTextPremium: {
    color: theme.colors.CeolWhite,
  },
});
