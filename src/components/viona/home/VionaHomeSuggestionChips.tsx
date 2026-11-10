import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { vionaCinematicTokens } from '../../../design/vionaCinematicTokens';
import { useTranslation } from '../../../i18n';
import {
  invokeVionaRec2UniverseCallback,
  type VionaRec2UniverseCallbacks,
  type VionaRec2UniverseContract,
  type VionaRec2UniverseId,
} from './vionaRec2HomeContract';

const CHIP_TARGETS: readonly Readonly<{
  id: 'tonight' | 'trip' | 'skill' | 'business' | 'account' | 'sos';
  universeId?: VionaRec2UniverseId;
}>[] = [
  { id: 'tonight' },
  { id: 'trip', universeId: 'travel' },
  { id: 'skill', universeId: 'academy' },
  { id: 'business', universeId: 'business' },
  { id: 'account', universeId: 'account' },
  { id: 'sos', universeId: 'sos' },
];

export function VionaHomeSuggestionChips({
  universes,
  callbacks,
}: Readonly<{
  universes: readonly VionaRec2UniverseContract[];
  callbacks: VionaRec2UniverseCallbacks;
}>) {
  const { t } = useTranslation();
  return (
    <View style={styles.row}>
      {CHIP_TARGETS.map((chip) => {
        const universe = chip.universeId
          ? universes.find((item) => item.id === chip.universeId)
          : undefined;
        const interactive = !!universe && universe.availability === 'available' && typeof callbacks[universe.id] === 'function';
        const label = t(`home.rec2.chips.${chip.id}`);
        return (
          <SuggestionChip
            key={chip.id}
            label={label}
            sos={chip.id === 'sos'}
            interactive={interactive}
            hint={interactive ? t('home.rec2.universeOpenHint') : t('home.rec2.sidebar.openingGradually')}
            onPress={() => {
              if (universe) invokeVionaRec2UniverseCallback(universe, callbacks);
            }}
          />
        );
      })}
    </View>
  );
}

function SuggestionChip({
  label,
  sos,
  interactive,
  hint,
  onPress,
}: Readonly<{
  label: string;
  sos: boolean;
  interactive: boolean;
  hint: string;
  onPress: () => void;
}>) {
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ disabled: !interactive }}
      disabled={!interactive}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        sos ? styles.chipSos : null,
        !interactive && styles.chipIdle,
        hovered && interactive && (sos ? styles.chipSosHover : styles.chipHover),
        pressed && interactive && (sos ? styles.chipSosHover : styles.chipPressed),
      ]}
    >
      <LinearGradient colors={['rgba(18, 42, 74, 0.92)', 'rgba(10, 26, 51, 0.84)']} style={styles.chipFill}>
        <Text style={[styles.label, !interactive && styles.labelIdle]}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, zIndex: 1 },
  chip: {
    borderRadius: vionaCinematicTokens.radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(230, 244, 255, 0.14)',
    overflow: 'hidden',
  },
  chipFill: { paddingHorizontal: 14, paddingVertical: 9 },
  chipSos: { borderColor: 'rgba(255, 92, 106, 0.55)' },
  chipIdle: { opacity: 0.72 },
  chipHover: {
    borderColor: 'rgba(0, 209, 255, 0.7)',
    shadowColor: '#00D1FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 6,
  },
  chipPressed: {
    borderColor: 'rgba(0, 209, 255, 0.85)',
    shadowColor: '#00D1FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 14,
    elevation: 6,
  },
  chipSosHover: {
    borderColor: 'rgba(255, 92, 106, 0.85)',
    shadowColor: '#FF5C6A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  },
  label: {
    color: vionaCinematicTokens.color.ice,
    fontFamily: vionaCinematicTokens.fontFamily.medium,
    fontSize: 12,
  },
  labelIdle: { color: vionaCinematicTokens.color.muted },
});
