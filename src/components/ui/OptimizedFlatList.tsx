/**
 * Default list virtualization tuned for 60fps on mid-tier devices (Iron Dome UI guardrail).
 * Callers may override any prop; unspecified props use safe defaults.
 */

import { type ReactElement } from 'react';
import { FlatList, type FlatListProps } from 'react-native';

const PERF_DEFAULTS = {
  initialNumToRender: 10,
  windowSize: 5,
  maxToRenderPerBatch: 10,
  updateCellsBatchingPeriod: 50,
  removeClippedSubviews: true,
} as const;

export function OptimizedFlatList<T>(props: FlatListProps<T>): ReactElement {
  return (
    <FlatList
      {...PERF_DEFAULTS}
      {...props}
      initialNumToRender={props.initialNumToRender ?? PERF_DEFAULTS.initialNumToRender}
      windowSize={props.windowSize ?? PERF_DEFAULTS.windowSize}
      maxToRenderPerBatch={props.maxToRenderPerBatch ?? PERF_DEFAULTS.maxToRenderPerBatch}
      updateCellsBatchingPeriod={props.updateCellsBatchingPeriod ?? PERF_DEFAULTS.updateCellsBatchingPeriod}
      removeClippedSubviews={props.removeClippedSubviews ?? PERF_DEFAULTS.removeClippedSubviews}
    />
  );
}
