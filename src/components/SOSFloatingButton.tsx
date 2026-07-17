import { type ReactElement } from 'react';

import { VionaGlobalSosShellAction } from './viona/VionaGlobalSosShellAction';

export type SOSFloatingButtonProps = Readonly<{
  /**
   * @deprecated Phase 1 shell consolidation — tab-bar host owns lift; retained for call-site compat.
   */
  tabBarLift?: number;
  /** After hold completes — parent opens the canonical SOS modal (no auto-dial). */
  onHoldComplete: () => void;
}>;

/**
 * Production SOS shell entry (Phase 1).
 * No longer an absolute floating overlay — renders the tab-bar integrated shell action.
 * Hold-to-trigger duration matches {@link SOSShieldComponent} / V7 Global Lifeline.
 */
export function SOSFloatingButton({ onHoldComplete }: SOSFloatingButtonProps): ReactElement {
  return <VionaGlobalSosShellAction onHoldComplete={onHoldComplete} />;
}
