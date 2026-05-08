import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { vionaTokens } from '../../design';
import { FontFamily } from '../../theme/typography';
import { useTranslation } from '../../i18n';

export type VionaFashionHomeCommandBarProps = Readonly<{
  onPressLogo: () => void;
  onPressLocal: () => void;
  onPressTravel: () => void;
  onPressAcademy: () => void;
  onPressBusiness?: () => void;
  onPressLanguage: () => void;
  onPressVio: () => void;
  onPressSafety: () => void;
  onPressAccount: () => void;
  onPressRole?: () => void;
  showRolePicker: boolean;
}>;

export function VionaFashionHomeCommandBar({
  onPressLogo,
  onPressLocal,
  onPressTravel,
  onPressAcademy,
  onPressBusiness,
  onPressLanguage,
  onPressVio,
  onPressSafety,
  onPressAccount,
  onPressRole,
  showRolePicker,
}: VionaFashionHomeCommandBarProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.bar}>
      <View style={styles.leftCluster}>
        <Pressable
          onPress={onPressLogo}
          style={({ pressed }) => [styles.logoBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="VIONA Hub"
        >
          <Text style={styles.logoMark}>VIONA</Text>
        </Pressable>
        <View style={styles.miniNav}>
          <Pressable onPress={onPressLocal} style={({ pressed }) => [styles.navLink, pressed && styles.pressed]}>
            <Text style={styles.navLinkText}>{t('home.tabLocal')}</Text>
          </Pressable>
          <Pressable onPress={onPressTravel} style={({ pressed }) => [styles.navLink, pressed && styles.pressed]}>
            <Text style={styles.navLinkText}>{t('home.tabTravel')}</Text>
          </Pressable>
          <Pressable onPress={onPressAcademy} style={({ pressed }) => [styles.navLink, pressed && styles.pressed]}>
            <Text style={styles.navLinkText}>{t('home.tabAcademy')}</Text>
          </Pressable>
          {onPressBusiness ? (
            <Pressable onPress={onPressBusiness} style={({ pressed }) => [styles.navLink, pressed && styles.pressed]}>
              <Text style={styles.navLinkText}>{t('home.fashionTech.business.title')}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.utilityCluster}>
        {showRolePicker && onPressRole ? (
          <Pressable onPress={onPressRole} style={({ pressed }) => [styles.utilBtn, pressed && styles.pressed]}>
            <Ionicons name="shuffle-outline" size={16} color={vionaTokens.fashionTech.champagne} />
            <Text style={styles.utilLabel} numberOfLines={1}>
              {t('shell.utility.switchRole')}
            </Text>
          </Pressable>
        ) : null}
        <Pressable onPress={onPressLanguage} style={({ pressed }) => [styles.utilBtn, pressed && styles.pressed]}>
          <Ionicons name="globe-outline" size={16} color={vionaTokens.fashionTech.champagne} />
          <Text style={styles.utilLabel} numberOfLines={1}>
            {t('shell.utility.language')}
          </Text>
        </Pressable>
        <Pressable onPress={onPressVio} style={({ pressed }) => [styles.utilBtn, pressed && styles.pressed]}>
          <Ionicons name="wallet-outline" size={16} color={vionaTokens.fashionTech.champagne} />
          <Text style={styles.utilLabel} numberOfLines={1}>
            {t('shell.utility.vioCredits')}
          </Text>
        </Pressable>
        <Pressable
          onPress={onPressSafety}
          style={({ pressed }) => [styles.utilBtn, styles.safetyBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={t('shell.utility.safetyAssist')}
        >
          <Ionicons name="shield-checkmark" size={16} color={vionaTokens.fashionTech.champagne} />
          <Text style={styles.utilLabel} numberOfLines={1}>
            {t('shell.utility.safetyAssist')}
          </Text>
        </Pressable>
        <Pressable onPress={onPressAccount} style={({ pressed }) => [styles.utilBtn, pressed && styles.pressed]}>
          <Ionicons name="person-circle-outline" size={16} color={vionaTokens.fashionTech.champagne} />
          <Text style={styles.utilLabel} numberOfLines={1}>
            {t('shell.utility.accountProfile')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  /** Top shell row — background comes from parent `HomeScreen` fashion shell; no “floating card”. */
  bar: {
    width: '100%',
    alignSelf: 'stretch',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: vionaTokens.spacing[12],
    paddingVertical: vionaTokens.spacing[12],
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
    marginBottom: 0,
  },
  leftCluster: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: vionaTokens.spacing[16],
    flex: 1,
    minWidth: 200,
  },
  logoBtn: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  logoMark: {
    fontFamily: FontFamily.extrabold,
    fontSize: 18,
    letterSpacing: 2.4,
    color: vionaTokens.fashionTech.inkOnDark,
  },
  miniNav: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: vionaTokens.spacing[8],
    alignItems: 'center',
  },
  navLink: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  navLinkText: {
    fontFamily: FontFamily.semibold,
    fontSize: 12,
    color: vionaTokens.fashionTech.mutedOnDark,
    letterSpacing: 0.3,
  },
  utilityCluster: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: vionaTokens.spacing[8],
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
    minWidth: 220,
  },
  utilBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: vionaTokens.radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 98, 0.22)',
    backgroundColor: 'rgba(0,0,0,0.2)',
    maxWidth: 200,
  },
  safetyBtn: {
    borderColor: 'rgba(201, 169, 98, 0.42)',
  },
  utilLabel: {
    fontFamily: FontFamily.semibold,
    fontSize: 11,
    color: vionaTokens.fashionTech.inkOnDark,
    flexShrink: 1,
  },
  pressed: {
    opacity: 0.88,
  },
});
