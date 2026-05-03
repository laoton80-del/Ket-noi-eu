/**
 * Faint SVG watermarks for Hub identity (Multiverse “Aura” backdrop layer).
 */
import type { ReactElement } from 'react';
import Svg, { Circle, G, Path } from 'react-native-svg';

export type AuraSvgProps = Readonly<{
  width: number;
  height: number;
  stroke: string;
  opacity?: number;
}>;

export function ServiceAuraSvg({ width, height, stroke, opacity = 0.09 }: AuraSvgProps): ReactElement {
  return (
    <Svg width={width} height={height} viewBox="0 0 120 120">
      <G opacity={opacity}>
        <Path
          d="M20 88 L44 32 L68 72 L92 24 L100 88 Z"
          fill="none"
          stroke={stroke}
          strokeWidth={1.8}
          strokeLinejoin="miter"
        />
        <Circle cx="38" cy="44" r="16" fill="none" stroke={stroke} strokeWidth={1.4} />
        <Path d="M52 96 L76 56 L100 96" fill="none" stroke={stroke} strokeWidth={1.4} />
      </G>
    </Svg>
  );
}

export function TourismAuraSvg({ width, height, stroke, opacity = 0.09 }: AuraSvgProps): ReactElement {
  return (
    <Svg width={width} height={height} viewBox="0 0 120 120">
      <G opacity={opacity}>
        <Circle cx="60" cy="58" r="44" fill="none" stroke={stroke} strokeWidth={1.5} />
        <Path
          d="M18 42 Q60 22 102 38 M22 62 Q60 48 98 58 M16 78 Q58 68 104 82"
          fill="none"
          stroke={stroke}
          strokeWidth={1.2}
        />
        <Path
          d="M44 30 Q52 18 60 30 Q68 18 76 30"
          fill="none"
          stroke={stroke}
          strokeWidth={1.2}
        />
      </G>
    </Svg>
  );
}

export function CharityAuraSvg({ width, height, stroke, opacity = 0.09 }: AuraSvgProps): ReactElement {
  return (
    <Svg width={width} height={height} viewBox="0 0 120 120">
      <G opacity={opacity}>
        <Path
          d="M60 96 C32 72 18 52 18 38 C18 26 28 18 40 18 C50 18 56 24 60 30 C64 24 70 18 80 18 C92 18 102 26 102 38 C102 52 88 72 60 96 Z"
          fill="none"
          stroke={stroke}
          strokeWidth={1.8}
          strokeLinejoin="round"
        />
      </G>
    </Svg>
  );
}

export function AcademyAuraSvg({ width, height, stroke, opacity = 0.09 }: AuraSvgProps): ReactElement {
  return (
    <Svg width={width} height={height} viewBox="0 0 120 120">
      <G opacity={opacity}>
        <Path
          d="M60 22 L22 40 L60 56 L98 40 Z"
          fill="none"
          stroke={stroke}
          strokeWidth={1.6}
          strokeLinejoin="miter"
        />
        <Path d="M22 40 L22 78 L60 94 L98 78 L98 40" fill="none" stroke={stroke} strokeWidth={1.4} />
        <Path d="M60 56 L60 94" fill="none" stroke={stroke} strokeWidth={1.2} />
      </G>
    </Svg>
  );
}
