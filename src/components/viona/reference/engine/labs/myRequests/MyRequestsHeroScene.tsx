/**
 * Dedicated My Requests hero scene — lab-only art-backed SVG.
 * Request-status marker only (not payment/booking confirmation).
 */
import type { ReactElement } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Line,
  LinearGradient as SvgGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

const E = 'rgba(72, 210, 165, 1)';
const EB = 'rgba(120, 255, 210, 1)';
const EW = 'rgba(98, 232, 168, 1)';

const PIN_X = 100;
const PIN_BASE = 136;
const PIN_SCALE = 0.64;
const PIN_Y = 124;

/** Contour lines — topographic mesh density */
const CONTOURS: readonly string[] = [
  'M 4 158 Q 40 148 78 152 T 156 148 T 196 154',
  'M 8 150 Q 44 138 82 142 T 160 138 T 196 144',
  'M 12 142 Q 50 130 90 134 T 168 130',
  'M 16 134 Q 54 122 94 126 T 172 122',
  'M 20 126 Q 58 116 98 120 T 176 116',
  'M 24 118 Q 62 108 102 112 T 180 108',
];

type N = readonly [number, number];
const NODES: readonly N[] = [
  [8, 158], [22, 152], [36, 160], [50, 148], [64, 156], [78, 144], [92, 154], [106, 142],
  [120, 152], [134, 140], [148, 150], [162, 144], [176, 158], [190, 150],
  [14, 136], [30, 128], [46, 134], [62, 122], [78, 130], [94, 118], [110, 126],
  [126, 116], [142, 124], [158, 114], [174, 122], [186, 132],
  [84, 162], [108, 160], [132, 164], [100, 150], [116, 136],
];
const FG = new Set([6, 7, 8, 19, 27, 28]);

const EDGES: readonly (readonly [number, number])[] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10],
  [10, 11], [11, 12], [12, 13], [14, 15], [15, 16], [16, 17], [17, 18], [18, 19], [19, 20],
  [20, 21], [21, 22], [22, 23], [23, 24], [25, 26], [0, 14], [2, 15], [4, 16], [6, 17],
  [8, 18], [10, 19], [12, 24], [7, 27], [8, 28], [9, 19], [17, 28], [24, 25], [25, 26],
  [26, 13], [3, 20], [5, 22], [14, 29], [16, 29], [18, 30], [20, 30],
];

export function MyRequestsHeroScene(): ReactElement {
  return (
    <View style={styles.slot} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 200 176" preserveAspectRatio="xMidYMax meet">
        <Defs>
          <RadialGradient id="mrAtmo" cx="50%" cy="90%" rx="70%" ry="45%">
            <Stop offset="0%" stopColor={EB} stopOpacity={0.18} />
            <Stop offset="55%" stopColor={E} stopOpacity={0.08} />
            <Stop offset="100%" stopColor={E} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="mrBloom" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#fff" stopOpacity={0.75} />
            <Stop offset="40%" stopColor={EB} stopOpacity={0.45} />
            <Stop offset="100%" stopColor={E} stopOpacity={0} />
          </RadialGradient>
          <SvgGradient id="mrBeam" x1="0" y1="1" x2="0" y2="0">
            <Stop offset="0%" stopColor={EB} stopOpacity={0.9} />
            <Stop offset="45%" stopColor={E} stopOpacity={0.35} />
            <Stop offset="100%" stopColor={E} stopOpacity={0} />
          </SvgGradient>
          <SvgGradient id="mrPin" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="rgba(210,255,235,0.96)" />
            <Stop offset="50%" stopColor={EW} />
            <Stop offset="100%" stopColor="rgba(20,90,72,0.94)" />
          </SvgGradient>
        </Defs>

        <Rect x={0} y={76} width={200} height={100} fill="url(#mrAtmo)" />

        {CONTOURS.map((d, i) => (
          <Path key={`c-${i}`} d={d} fill="none" stroke={E} strokeWidth={0.42 + (i % 3) * 0.08} strokeOpacity={0.1 + (i % 2) * 0.04} />
        ))}

        {[
          [6, 154, 194, 146],
          [12, 146, 188, 138],
          [18, 128, 182, 120],
          [28, 138, 172, 130],
          [38, 150, 162, 142],
          [48, 122, 152, 114],
          [58, 134, 142, 126],
          [68, 148, 132, 140],
          [78, 118, 122, 110],
          [88, 132, 112, 124],
        ].map(([x1, y1, x2, y2], i) => (
          <Line key={`bg-${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={E} strokeWidth={0.4} strokeOpacity={0.065} />
        ))}

        {EDGES.map(([a, b], i) => {
          const p0 = NODES[a]!;
          const p1 = NODES[b]!;
          const fg = FG.has(a) || FG.has(b);
          return (
            <Line
              key={`e-${i}`}
              x1={p0[0]}
              y1={p0[1]}
              x2={p1[0]}
              y2={p1[1]}
              stroke={fg ? EB : E}
              strokeWidth={fg ? 0.65 : 0.45}
              strokeOpacity={fg ? 0.42 : 0.12}
              strokeLinecap="round"
            />
          );
        })}

        {NODES.map(([cx, cy], i) => {
          const fg = FG.has(i);
          return (
            <G key={`n-${i}`} opacity={fg ? 1 : 0.7}>
              {fg ? <Circle cx={cx} cy={cy} r={3.5} fill={E} opacity={0.25} /> : null}
              <Circle cx={cx} cy={cy} r={fg ? 2 : 1.4} fill={E} opacity={fg ? 0.5 : 0.18} />
              {fg ? <Circle cx={cx} cy={cy} r={0.9} fill={EB} opacity={0.85} /> : null}
            </G>
          );
        })}

        {/* Ground planes */}
        <Ellipse cx={PIN_X} cy={PIN_BASE + 5} rx={82} ry={12} fill={E} opacity={0.16} />
        <Ellipse cx={PIN_X} cy={PIN_BASE + 2} rx={54} ry={7} fill={EB} opacity={0.22} />

        {/* Starburst */}
        <Circle cx={PIN_X} cy={PIN_BASE} r={24} fill="url(#mrBloom)" />
        {Array.from({ length: 10 }, (_, i) => {
          const deg = -90 + i * 36;
          const rad = (deg * Math.PI) / 180;
          const len = i % 2 === 0 ? 20 : 12;
          return (
            <Line
              key={`r-${i}`}
              x1={PIN_X}
              y1={PIN_BASE}
              x2={PIN_X + Math.cos(rad) * len}
              y2={PIN_BASE + Math.sin(rad) * len}
              stroke={EB}
              strokeWidth={i === 0 ? 2 : 0.9}
              strokeOpacity={i === 0 ? 0.7 : 0.22 + (i % 3) * 0.06}
              strokeLinecap="round"
            />
          );
        })}
        <Rect x={PIN_X - 9} y={PIN_BASE - 50} width={18} height={52} fill="url(#mrBeam)" opacity={0.88} />

        <G transform={`translate(${PIN_X}, ${PIN_Y}) scale(${PIN_SCALE}) translate(-100, -94)`}>
          <Circle cx={100} cy={58} r={26} fill={EB} opacity={0.08} />
          <Path
            d="M 100 24 C 112 24 121 34 121 47 C 121 58 100 84 100 84 C 100 84 79 58 79 47 C 79 34 88 24 100 24 Z"
            fill="url(#mrPin)"
            stroke={EW}
            strokeWidth={1.5}
          />
          <Circle cx={100} cy={45} r={14} fill="none" stroke={EB} strokeWidth={0.9} strokeOpacity={0.4} />
          <Circle cx={100} cy={45} r={11} fill="rgba(10,52,42,0.92)" stroke={EW} strokeWidth={1.3} />
          <Circle cx={100} cy={45} r={7.5} fill={EW} opacity={0.88} />
          <Path
            d="M 96.5 45 L 99.5 48.5 L 104.5 41"
            fill="none"
            stroke="rgba(6,26,22,0.92)"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    width: '100%',
    height: '100%',
  },
});
