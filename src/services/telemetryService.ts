import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type PropsWithChildren,
} from 'react';
import type { NavigationContainerRefWithCurrent, ParamListBase } from '@react-navigation/native';

type TelemetryContextValue = {
  track: (eventName: string, screen: string, metadata?: Record<string, unknown>) => void;
};

const TelemetryContext = createContext<TelemetryContextValue | null>(null);

export function trackInteraction(
  eventName: string,
  screen: string,
  metadata?: Record<string, unknown>
): void {
  const eventPayload = {
    eventName,
    screen,
    metadata: metadata ?? {},
    timestamp: new Date().toISOString(),
  };

  if (__DEV__) {
    // Mock sink for launch phase; swap with Datadog/Segment adapter later.
    console.log('[telemetry]', JSON.stringify(eventPayload));
  }
}

export function TelemetryProvider({ children }: PropsWithChildren) {
  const value = useMemo<TelemetryContextValue>(
    () => ({
      track: trackInteraction,
    }),
    []
  );

  return createElement(TelemetryContext.Provider, { value }, children);
}

export function useTelemetry(): TelemetryContextValue {
  const context = useContext(TelemetryContext);
  if (!context) {
    throw new Error('useTelemetry must be used within TelemetryProvider.');
  }
  return context;
}

export function useNavigationTelemetry<T extends ParamListBase>(
  navigationRef: NavigationContainerRefWithCurrent<T>
) {
  const { track } = useTelemetry();
  const previousRouteName = useRef<string | undefined>(undefined);

  const logCurrentRoute = useCallback(() => {
    const current = navigationRef.getCurrentRoute();
    if (!current?.name) return;
    if (previousRouteName.current === current.name) return;
    previousRouteName.current = current.name;
    track('screen_view', current.name, { routeKey: current.key });
  }, [navigationRef, track]);

  return {
    onNavigationReady: logCurrentRoute,
    onNavigationStateChange: logCurrentRoute,
  };
}
