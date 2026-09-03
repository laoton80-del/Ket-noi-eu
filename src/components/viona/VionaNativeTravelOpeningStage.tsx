import type { ReactNode } from 'react';
import { View } from 'react-native';

export type VionaNativeTravelOpeningStageProps = Readonly<{
  children: ReactNode;
}>;

/**
 * Native Travel opening-stage presentation boundary (P2-A visual parity host).
 *
 * Forwards existing TravelScreen presentation children unchanged.
 * Does not own SOS, Account, Language, tabs, routing, flags, AI, payment, or API.
 * Does not mount Clear Premium Travel composition (P2-B).
 */
export function VionaNativeTravelOpeningStage({ children }: VionaNativeTravelOpeningStageProps) {
  return (
    <View testID="viona-native-travel-opening-stage" collapsable={false} style={{ flex: 1 }}>
      {children}
    </View>
  );
}
