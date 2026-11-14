import { useCallback, useEffect, useState } from 'react';

import { consumeColdIntro, setColdIntroActive } from './coldIntroSession';
import { VionaIntroScreen } from './VionaIntroScreen';

/** Covers the first settled shell of a cold launch, then stays gone. */
export function VionaColdIntro() {
  const [visible, setVisible] = useState(() => consumeColdIntro());
  const finish = useCallback(() => {
    setColdIntroActive(false);
    setVisible(false);
  }, []);
  useEffect(() => {
    setColdIntroActive(visible);
  }, [visible]);
  if (!visible) return null;
  return <VionaIntroScreen onDone={finish} />;
}
