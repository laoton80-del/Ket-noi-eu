import type { ReactNode } from 'react';
import { View } from 'react-native';

export type VionaNativeLocalOpeningStageProps = Readonly<{
  children: ReactNode;
}>;

/**
 * Native Local opening-stage presentation boundary (P3-A visual parity host).
 *
 * Forwards existing Local opening-stage presentation children unchanged.
 * CHILDREN_PASS_THROUGH_OR_EXACT_EQUIVALENT_CURRENT_PRESENTATION
 * P3A_PRESENTATION_PARITY_REQUIRED
 *
 * Does not own SOS, Account, Language, tabs, routing, flags, AI, payment, classifieds, or API.
 * Does not mount Clear Premium Local composition (P3-B).
 * Must not be an empty placeholder or callbacks-only host.
 */
export function VionaNativeLocalOpeningStage({ children }: VionaNativeLocalOpeningStageProps) {
  return (
    <View testID="viona-native-local-opening-stage" collapsable={false} style={{ flex: 1 }}>
      {children}
    </View>
  );
}
