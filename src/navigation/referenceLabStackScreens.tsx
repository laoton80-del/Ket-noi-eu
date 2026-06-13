import type { ReactElement } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { VionaNeonCardLabScreen } from '../components/viona/reference/VionaNeonCardLab';
import { VionaReferenceFlagshipCardsLabScreen } from '../components/viona/reference/VionaReferenceFlagshipCardsLab';
import { VionaReferenceLocalPanelLabScreen } from '../components/viona/reference/VionaReferenceLocalPanelLab';
import { VionaReferenceMaterialLabScreen } from '../components/viona/reference/VionaReferenceMaterialLab';
import { VionaReferencePanelCompositionLabScreen } from '../components/viona/reference/VionaReferencePanelCompositionLab';
import { VionaReferenceRequestInboxLabScreen } from '../components/viona/reference/VionaReferenceRequestInboxLab';
import { VionaReferenceRequestOperatorInboxLabScreen } from '../components/viona/reference/VionaReferenceRequestOperatorInboxLab';
import { VionaReferenceSingleCardLabScreen } from '../components/viona/reference/VionaReferenceSingleCardLab';
import type { RootStackParamList } from './routes';

type RootStack = ReturnType<typeof createNativeStackNavigator<RootStackParamList>>;

/**
 * Reference lab stack screens for App.tsx — only call when `isReferenceLabsEnabled()` is true.
 * Returns plain `Stack.Screen` elements (valid direct children of `Stack.Navigator` / `Stack.Group`).
 */
export function getReferenceLabStackScreens(Stack: RootStack): readonly ReactElement[] {
  return [
    <Stack.Screen key="VionaReferenceLocalPanelLab" name="VionaReferenceLocalPanelLab" component={VionaReferenceLocalPanelLabScreen} />,
    <Stack.Screen key="VionaReferenceSingleCardLab" name="VionaReferenceSingleCardLab" component={VionaReferenceSingleCardLabScreen} />,
    <Stack.Screen key="VionaReferenceMaterialLab" name="VionaReferenceMaterialLab" component={VionaReferenceMaterialLabScreen} />,
    <Stack.Screen
      key="VionaReferencePanelCompositionLab"
      name="VionaReferencePanelCompositionLab"
      component={VionaReferencePanelCompositionLabScreen}
    />,
    <Stack.Screen
      key="VionaReferenceFlagshipCardsLab"
      name="VionaReferenceFlagshipCardsLab"
      component={VionaReferenceFlagshipCardsLabScreen}
    />,
    <Stack.Screen key="VionaNeonCardLab" name="VionaNeonCardLab" component={VionaNeonCardLabScreen} />,
    <Stack.Screen
      key="VionaReferenceRequestInboxLab"
      name="VionaReferenceRequestInboxLab"
      component={VionaReferenceRequestInboxLabScreen}
    />,
    <Stack.Screen
      key="VionaReferenceRequestOperatorInboxLab"
      name="VionaReferenceRequestOperatorInboxLab"
      component={VionaReferenceRequestOperatorInboxLabScreen}
    />,
  ];
}
