import type { PropsWithChildren } from 'react';
import { CopilotProvider, type CopilotProps } from 'react-native-copilot';
import { theme } from '../../theme/theme';
import { CustomTooltip } from './CustomTooltip';

type AnimatedScalarLike = {
  _value?: number;
  __getValue?: () => number;
};

function readAnimatedScalar(value: unknown): number {
  const scalar = value as AnimatedScalarLike;
  if (typeof scalar.__getValue === 'function') return scalar.__getValue();
  if (typeof scalar._value === 'number') return scalar._value;
  return 0;
}

function roundedRectMaskPath({
  size,
  position,
  canvasSize,
}: Parameters<NonNullable<CopilotProps['svgMaskPath']>>[0]): string {
  const x = readAnimatedScalar(position.x);
  const y = readAnimatedScalar(position.y);
  const w = readAnimatedScalar(size.x);
  const h = readAnimatedScalar(size.y);
  const r = 14;

  const roundedHole = [
    `M${x + r},${y}`,
    `H${x + w - r}`,
    `Q${x + w},${y} ${x + w},${y + r}`,
    `V${y + h - r}`,
    `Q${x + w},${y + h} ${x + w - r},${y + h}`,
    `H${x + r}`,
    `Q${x},${y + h} ${x},${y + h - r}`,
    `V${y + r}`,
    `Q${x},${y} ${x + r},${y}`,
    'Z',
  ].join(' ');

  return `M0,0H${canvasSize.x}V${canvasSize.y}H0V0Z ${roundedHole}`;
}

export function TourProvider({ children }: PropsWithChildren) {
  return (
    <CopilotProvider
      overlay="svg"
      animated
      backdropColor={theme.colors.overlay.dim}
      margin={10}
      arrowColor={theme.colors.executive.card}
      labels={{ skip: 'Bỏ qua', next: 'Tiếp tục', finish: 'Hoàn tất' }}
      tooltipComponent={CustomTooltip}
      svgMaskPath={roundedRectMaskPath}
    >
      {children}
    </CopilotProvider>
  );
}
