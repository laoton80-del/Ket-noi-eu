import { useCallback, useState } from 'react';

import { consumeColdIntro } from './coldIntroSession';
import { VionaIntroScreen } from './VionaIntroScreen';

/** Covers the first settled shell of a cold launch, then stays gone. */
export function VionaColdIntro() {
  const [visible, setVisible] = useState(() => consumeColdIntro());
  const finish = useCallback(() => setVisible(false), []);
  if (!visible) return null;
  return <VionaIntroScreen onDone={finish} />;
}
