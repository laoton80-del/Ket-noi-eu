import type { ReactNode } from 'react';
import { View } from 'react-native';

export type VionaNativeAccountOpeningStageProps = Readonly<{
  children: ReactNode;
}>;

/**
 * Native Account / PersonalHub opening-stage presentation boundary (P4-B1 visual parity host).
 *
 * Forwards existing CaNhanScreen presentation children unchanged.
 * CHILDREN_PASS_THROUGH_OR_EXACT_EQUIVALENT_CURRENT_PRESENTATION
 * P4B1_PRESENTATION_PARITY_REQUIRED
 *
 * Does not own SOS, chrome Account, Language, tabs, routing, flags, AI, payment, GDPR, or wallet writes.
 * Does not mount Clear Premium Account composition (P4-B2).
 * Must not be an empty placeholder or callbacks-only host.
 */
export function VionaNativeAccountOpeningStage({ children }: VionaNativeAccountOpeningStageProps) {
  return (
    <View testID="viona-native-account-opening-stage" collapsable={false} style={{ flex: 1 }}>
      {children}
    </View>
  );
}
