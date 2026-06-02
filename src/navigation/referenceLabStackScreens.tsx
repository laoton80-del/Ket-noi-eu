import type { ReactElement } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { VionaNeonCardLabScreen } from '../components/viona/reference/VionaNeonCardLab';
import { VionaReferenceFlagshipCardsLabScreen } from '../components/viona/reference/VionaReferenceFlagshipCardsLab';
import { VionaReferenceLocalPanelLabScreen } from '../components/viona/reference/VionaReferenceLocalPanelLab';
import { VionaReferenceMaterialLabScreen } from '../components/viona/reference/VionaReferenceMaterialLab';
import { VionaReferencePanelCompositionLabScreen } from '../components/viona/reference/VionaReferencePanelCompositionLab';
import { VionaReferenceSingleCardLabScreen } from '../components/viona/reference/VionaReferenceSingleCardLab';
import type { RootStackParamList } from './routes';

type RootStack = ReturnType<typeof createNativeStackNavigator<RootStackParamList>>;

type Props = Readonly<{
  Stack: RootStack;
}>;

/** Dev/reference lab stack screens — only loaded when master env gate is enabled. */
export function ReferenceLabStackScreens({ Stack }: Props): ReactElement {
  return (
    <>
      <Stack.Screen name="VionaReferenceLocalPanelLab" component={VionaReferenceLocalPanelLabScreen} />
      <Stack.Screen name="VionaReferenceSingleCardLab" component={VionaReferenceSingleCardLabScreen} />
      <Stack.Screen name="VionaReferenceMaterialLab" component={VionaReferenceMaterialLabScreen} />
      <Stack.Screen
        name="VionaReferencePanelCompositionLab"
        component={VionaReferencePanelCompositionLabScreen}
      />
      <Stack.Screen name="VionaReferenceFlagshipCardsLab" component={VionaReferenceFlagshipCardsLabScreen} />
      <Stack.Screen name="VionaNeonCardLab" component={VionaNeonCardLabScreen} />
    </>
  );
}
