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
          <Pressable
            key={chip.id}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityHint={interactive ? t('home.rec2.universeOpenHint') : t('home.rec2.sidebar.openingGradually')}
            accessibilityState={{ disabled: !interactive }}
            disabled={!interactive}
            onPress={() => {
              if (universe) invokeVionaRec2UniverseCallback(universe, callbacks);
            }}
            style={({ pressed }) => [styles.chip, !interactive && styles.chipIdle, pressed && interactive && styles.chipPressed]}
          >
            <Text style={[styles.label, !interactive && styles.labelIdle]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderRadius: vionaCinematicTokens.radius.pill,
    borderWidth: 1,
    borderColor: vionaCinematicTokens.color.line,
    backgroundColor: 'rgba(8, 20, 36, 0.72)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipIdle: { opacity: 0.72 },
  chipPressed: { opacity: 0.8 },
  label: {
    color: vionaCinematicTokens.color.ice,
    fontFamily: vionaCinematicTokens.fontFamily.medium,
    fontSize: 12,
  },
  labelIdle: { color: vionaCinematicTokens.color.muted },
});
