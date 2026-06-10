/**
 * VIONA Wave 3B — Local hub vector micro-scenes (premium luminous icon-scenes).
 */
import type { ReactElement, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

import {
  premiumUniverseAccentMap,
  premiumUniverseAccentSpec,
  type PremiumUniverseAccentSpec,
  type VionaUniverseAccent,
} from '../../../design/premiumTileVisualTokens';
import { isLocalFlagshipArtScene, LocalFlagshipMicroScene } from './LocalFlagshipMicroScene';
import {
  LOCAL_COMPACT_VECTOR_SCENE_KEYS,
  type LocalVectorMicroSceneKey,
} from './localVectorMicroSceneKeys';

export type { LocalVectorMicroSceneKey } from './localVectorMicroSceneKeys';
export {
  LOCAL_HUB_VECTOR_SCENE_KEYS_BY_TEST_ID,
  resolveLocalHubVectorSceneKey,
} from './localVectorMicroSceneKeys';

/** Transit route accent (cyan + blue per reference). */
const TRANSIT_ROUTE_BLUE: PremiumUniverseAccentSpec = {
  ink: '#8CC4FF',
  inkHover: '#B8DCFF',
  stroke: 'rgba(96, 176, 255, 0.95)',
  strokeHover: 'rgba(160, 210, 255, 1)',
  glow: 'rgba(72, 150, 255, 0.52)',
  glowHover: 'rgba(120, 190, 255, 0.65)',
  glowPressed: 'rgba(72, 150, 255, 0.18)',
  statusFill: 'rgba(72, 150, 255, 0.16)',
  statusFillHover: 'rgba(120, 190, 255, 0.22)',
  iconCapsuleFill: 'rgba(72, 150, 255, 0.12)',
  iconCapsuleFillHover: 'rgba(120, 190, 255, 0.18)',
  cornerWash: 'rgba(72, 150, 255, 0.2)',
  cornerWashHover: 'rgba(120, 190, 255, 0.28)',
};

const SCENE_SEMANTIC_PAIR: Partial<
  Record<LocalVectorMicroSceneKey, readonly [VionaUniverseAccent, VionaUniverseAccent]>
> = {
  'local-browse-services': ['emerald', 'cyan'],
  'local-booking-assist': ['cyan', 'emerald'],
  'local-restaurant-services': ['gold', 'emerald'],
  'local-transit-mobility': ['cyan', 'emerald'],
  'local-legal-wealth': ['gold', 'cyan'],
  'local-my-requests': ['emerald', 'cyan'],
  'local-nails-beauty': ['emerald', 'magenta'],
  'local-community-events': ['violet', 'emerald'],
  'local-housing-home': ['cyan', 'emerald'],
  'local-classifieds-market': ['gold', 'violet'],
  'local-document-scanner': ['cyan', 'gold'],
};

function sceneSemantics(key: LocalVectorMicroSceneKey): {
  a: PremiumUniverseAccentSpec;
  b: PremiumUniverseAccentSpec;
} {
  const pair = SCENE_SEMANTIC_PAIR[key] ?? (['cyan', 'emerald'] as const);
  return {
    a: premiumUniverseAccentSpec(pair[0]),
    b: premiumUniverseAccentSpec(pair[1]),
  };
}

function vividStroke(spec: PremiumUniverseAccentSpec): string {
  return spec.strokeHover;
}

function vividInk(spec: PremiumUniverseAccentSpec): string {
  return spec.inkHover;
}

export type LocalVectorSceneScale = 'hero' | 'primary' | 'secondary' | 'compact';

export type LocalVectorMicroSceneProps = Readonly<{
  sceneKey: LocalVectorMicroSceneKey;
  accent: VionaUniverseAccent;
  prominent?: boolean;
  sceneScale?: LocalVectorSceneScale;
  /** Command-center flagship replica — richer hero staging. */
  replicaFlagship?: boolean;
}>;

type ScenePalette = Readonly<{
  stroke: string;
  ink: string;
  glow: string;
  strokeW: number;
  scale: number;
  compact: boolean;
  replica: boolean;
}>;

const SCENE_VIEWBOX = { w: 220, h: 140 } as const;
const COMPACT_VIEWBOX = { w: 140, h: 80 } as const;

const SCENE_SHELL: Record<LocalVectorSceneScale, Readonly<{ fill: number; strokeMul: number }>> = {
  hero: { fill: 1, strokeMul: 1.34 },
  primary: { fill: 0.98, strokeMul: 1.22 },
  secondary: { fill: 0.96, strokeMul: 1.14 },
  compact: { fill: 0.92, strokeMul: 1.04 },
};

function resolveSceneScale(
  sceneKey: LocalVectorMicroSceneKey,
  prominent: boolean,
  sceneScale?: LocalVectorSceneScale
): LocalVectorSceneScale {
  if (LOCAL_COMPACT_VECTOR_SCENE_KEYS.has(sceneKey)) return 'compact';
  if (sceneScale) return sceneScale;
  return prominent ? 'primary' : 'secondary';
}

function paletteFor(
  accent: VionaUniverseAccent,
  scale: LocalVectorSceneScale,
  replica = false
): ScenePalette {
  const spec = premiumUniverseAccentSpec(accent);
  const mul = SCENE_SHELL[scale].strokeMul * (replica ? 1.24 : 1);
  const baseW = scale === 'compact' ? 2 : scale === 'hero' ? 2.9 : 2.5;
  return {
    stroke: replica ? spec.strokeHover : spec.stroke,
    ink: replica ? spec.inkHover : spec.ink,
    glow: spec.glow,
    strokeW: baseW * mul * (replica ? 1.06 : 1),
    scale: mul,
    compact: scale === 'compact',
    replica,
  };
}

function SceneSvg({
  children,
  compact,
}: {
  children: ReactNode;
  compact: boolean;
}): ReactElement {
  const vb = compact ? COMPACT_VIEWBOX : SCENE_VIEWBOX;
  return (
    <Svg width="100%" height="100%" viewBox={`0 0 ${vb.w} ${vb.h}`} preserveAspectRatio="xMidYMax meet">
      {children}
    </Svg>
  );
}

function SceneStage({
  children,
  compact,
  replica = false,
}: {
  children: ReactNode;
  compact: boolean;
  replica?: boolean;
}): ReactElement {
  const vb = compact ? COMPACT_VIEWBOX : SCENE_VIEWBOX;
  const ox = vb.w / 2;
  const oy = vb.h;
  const scale = compact ? 1.08 : replica ? 1.26 : 1.18;
  const tx = compact ? 0 : replica ? 0 : 2;
  const ty = compact ? 1 : replica ? -2 : -1;
  return (
    <G
      transform={`translate(${tx}, ${ty}) translate(${ox}, ${oy}) scale(${scale}) translate(${-ox}, ${-oy})`}
    >
      {children}
    </G>
  );
}

function LuminousPlatform({
  p,
  cx = 108,
  cy = 122,
  rx = 78,
  glowFill,
}: {
  p: ScenePalette;
  cx?: number;
  cy?: number;
  rx?: number;
  glowFill?: string;
}): ReactElement {
  const fill = glowFill ?? p.glow;
  return (
    <G>
      <Ellipse cx={cx} cy={cy} rx={rx * 1.08} ry={16} fill={fill} opacity={0.58} />
      <Ellipse cx={cx} cy={cy - 1} rx={rx * 0.88} ry={12} fill={fill} opacity={0.38} />
      <Ellipse
        cx={cx}
        cy={cy - 2}
        rx={rx * 0.7}
        ry={5.5}
        fill="none"
        stroke={p.stroke}
        strokeWidth={p.strokeW * 0.9}
        opacity={0.92}
      />
      <Ellipse
        cx={cx}
        cy={cy - 3}
        rx={rx * 0.44}
        ry={2.5}
        fill="none"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth={p.strokeW * 0.38}
        opacity={0.85}
      />
    </G>
  );
}

function IntegratedBackdrop({
  p,
  sem,
  heroCx = 108,
  heroCy = 50,
  heroR = 44,
  platformCx = 108,
}: {
  p: ScenePalette;
  sem: { a: PremiumUniverseAccentSpec; b: PremiumUniverseAccentSpec };
  heroCx?: number;
  heroCy?: number;
  heroR?: number;
  platformCx?: number;
}): ReactElement {
  return (
    <G>
      <GlowOrb cx={heroCx} cy={heroCy} r={heroR} fill={sem.a.glow} opacity={0.76} />
      <LuminousPlatform p={p} cx={platformCx} glowFill={sem.a.glow} />
    </G>
  );
}

function DepthArc({ p, d }: { p: ScenePalette; d: string }): ReactElement {
  return (
    <Path
      d={d}
      fill="none"
      stroke={p.stroke}
      strokeWidth={p.strokeW * 0.65}
      opacity={0.34}
      strokeLinecap="round"
    />
  );
}

function GlowOrb({
  cx,
  cy,
  r,
  fill,
  opacity = 0.62,
}: {
  cx: number;
  cy: number;
  r: number;
  fill: string;
  opacity?: number;
}): ReactElement {
  return (
    <>
      <Circle cx={cx} cy={cy} r={r * 1.35} fill={fill} opacity={opacity * 0.38} />
      <Circle cx={cx} cy={cy} r={r * 1.08} fill={fill} opacity={opacity * 0.52} />
      <Circle cx={cx} cy={cy} r={r * 0.82} fill={fill} opacity={opacity * 0.68} />
    </>
  );
}

function NodeDot({
  cx,
  cy,
  p,
  r = 5,
  accentStroke,
}: {
  cx: number;
  cy: number;
  p: ScenePalette;
  r?: number;
  accentStroke?: string;
}): ReactElement {
  const stroke = accentStroke ?? p.stroke;
  return (
    <G>
      <Circle cx={cx} cy={cy} r={r + 4} fill={p.glow} opacity={0.5} />
      <Circle cx={cx} cy={cy} r={r} fill="none" stroke={stroke} strokeWidth={p.strokeW + 0.15} />
      <Circle cx={cx} cy={cy} r={r * 0.45} fill={p.ink} opacity={0.98} />
    </G>
  );
}

function NeonPath({
  d,
  p,
  color,
  w,
}: {
  d: string;
  p: ScenePalette;
  color?: string;
  w?: number;
}): ReactElement {
  const c = color ?? p.stroke;
  const sw = (w ?? p.strokeW) * p.scale;
  const glowMul = p.replica ? 2.05 : 1.75;
  const glowOp = p.replica ? 0.62 : 0.48;
  return (
    <G>
      <Path
        d={d}
        fill="none"
        stroke={p.glow}
        strokeWidth={sw * glowMul}
        opacity={glowOp}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d={d}
        fill="none"
        stroke={c}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={1}
      />
      <Path
        d={d}
        fill="none"
        stroke="rgba(220, 248, 255, 0.9)"
        strokeWidth={sw * 0.42}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </G>
  );
}

function NeonLine({
  x1,
  y1,
  x2,
  y2,
  p,
  color,
  w,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  p: ScenePalette;
  color?: string;
  w?: number;
}): ReactElement {
  const c = color ?? p.stroke;
  const sw = (w ?? p.strokeW) * p.scale;
  const glowMul = p.replica ? 1.95 : 1.65;
  const glowOp = p.replica ? 0.58 : 0.46;
  return (
    <G>
      <Line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={p.glow}
        strokeWidth={sw * glowMul}
        opacity={glowOp}
        strokeLinecap="round"
      />
      <Line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={c}
        strokeWidth={sw}
        strokeLinecap="round"
        opacity={1}
      />
      <Line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="rgba(220, 248, 255, 0.88)"
        strokeWidth={sw * 0.4}
        strokeLinecap="round"
      />
    </G>
  );
}

function ConnectionArc({
  d,
  p,
  color,
}: {
  d: string;
  p: ScenePalette;
  color?: string;
}): ReactElement {
  return <NeonPath d={d} p={p} color={color} w={p.strokeW * 0.92} />;
}

function BrowseServicesScene({ p }: { p: ScenePalette }): ReactElement {
  const { a: e, b: c } = sceneSemantics('local-browse-services');
  const hub = 106;
  return (
    <SceneSvg compact={p.compact}>
      <SceneStage compact={p.compact}>
        <G>
          <DepthArc p={p} d="M24 100 Q108 76 192 100" />
          <IntegratedBackdrop p={p} sem={{ a: e, b: c }} heroCx={hub} heroCy={48} heroR={p.replica ? 52 : 48} />
          {p.replica ? (
            <>
              <LuminousPlatform p={p} cx={hub} cy={118} rx={p.replica ? 70 : 78} glowFill={e.glow} />
              <Circle cx={68} cy={72} r={9} fill="none" stroke={vividStroke(c)} strokeWidth={p.strokeW + 0.2} />
              <Circle cx={68} cy={72} r={4} fill={vividInk(c)} />
              <Circle cx={148} cy={68} r={9} fill="none" stroke={vividStroke(e)} strokeWidth={p.strokeW + 0.2} />
              <Circle cx={148} cy={68} r={4} fill={vividInk(e)} />
              <ConnectionArc p={p} color={vividStroke(c)} d="M68 72 Q106 58 148 68" />
            </>
          ) : null}
          <NodeDot cx={36} cy={90} p={p} r={5.5} accentStroke={vividStroke(e)} />
          <NodeDot cx={176} cy={88} p={p} r={5.5} accentStroke={vividStroke(c)} />
          <NodeDot cx={174} cy={38} p={p} r={5} accentStroke={vividInk(c)} />
          <ConnectionArc p={p} d="M106 74 Q54 78 36 90" color={vividStroke(e)} />
          <ConnectionArc p={p} d="M106 74 Q148 76 176 88" color={vividStroke(c)} />
          <ConnectionArc p={p} d="M106 46 Q142 36 174 38" color={vividInk(c)} />
          <G>
            <Path
              d="M20 90 L64 90 L42 72 Z"
              fill="none"
              stroke={vividStroke(e)}
              strokeWidth={p.strokeW + 0.15}
              strokeLinejoin="round"
            />
            <Rect
              x={24}
              y={72}
              width={34}
              height={26}
              rx={3}
              fill="none"
              stroke={vividInk(e)}
              strokeWidth={p.strokeW + 0.1}
            />
            <Rect x={32} y={80} width={11} height={13} fill="none" stroke={vividStroke(e)} strokeWidth={p.strokeW} />
          </G>
          <G>
            <NeonPath
              p={p}
              color={vividStroke(c)}
              d="M152 96 L152 70 L170 56 L190 70 L190 96 Z"
              w={p.strokeW + 0.1}
            />
            <Rect x={164} y={76} width={15} height={17} fill="none" stroke={vividInk(c)} strokeWidth={p.strokeW} />
          </G>
          <G>
            <Rect
              x={148}
              y={22}
              width={38}
              height={32}
              rx={4}
              fill="none"
              stroke={vividStroke(c)}
              strokeWidth={p.strokeW + 0.15}
            />
            <NeonLine x1={167} y1={28} x2={167} y2={48} p={p} color={vividInk(c)} w={p.strokeW + 0.1} />
            <NeonLine x1={157} y1={38} x2={177} y2={38} p={p} color={vividInk(c)} w={p.strokeW + 0.1} />
          </G>
          <NeonPath
            p={p}
            color={vividStroke(e)}
            d="M106 28 L106 58 L90 72 L78 62 L106 58 L134 72 L122 62 Z"
            w={p.strokeW + 0.55}
          />
          <Circle cx={106} cy={22} r={12} fill="none" stroke={vividInk(e)} strokeWidth={p.strokeW + 0.3} />
          <Circle cx={106} cy={22} r={5.5} fill={vividInk(e)} opacity={1} />
        </G>
      </SceneStage>
    </SceneSvg>
  );
}

function BookingAssistScene({ p }: { p: ScenePalette }): ReactElement {
  const { a: cy, b: em } = sceneSemantics('local-booking-assist');
  return (
    <SceneSvg compact={p.compact}>
      <SceneStage compact={p.compact}>
        <G>
          <DepthArc p={p} d="M32 104 Q108 86 186 104" />
          <IntegratedBackdrop p={p} sem={{ a: cy, b: em }} heroCx={112} heroCy={46} heroR={42} />
          <Rect
            x={32}
            y={16}
            width={74}
            height={82}
            rx={6}
            fill="none"
            stroke={vividStroke(cy)}
            strokeWidth={p.strokeW + 0.25}
          />
          <NeonLine x1={32} y1={34} x2={106} y2={34} p={p} color={vividInk(cy)} w={p.strokeW + 0.1} />
          <Circle cx={48} cy={28} r={3.5} fill={cy.ink} />
          <Circle cx={62} cy={28} r={3.5} fill={cy.ink} opacity={0.5} />
          {[0, 1, 2].map((row) =>
            [0, 1, 2, 3].map((col) => {
              const active = row === 1 && col === 2;
              return (
                <Rect
                  key={`${row}-${col}`}
                  x={40 + col * 14}
                  y={44 + row * 14}
                  width={11}
                  height={11}
                  rx={2}
                  fill={active ? em.glow : 'none'}
                  fillOpacity={active ? 0.35 : 0}
                  stroke={active ? vividStroke(em) : vividStroke(cy)}
                  strokeWidth={p.strokeW * (active ? 1.05 : 0.85)}
                  opacity={active ? 1 : 0.78}
                />
              );
            })
          )}
          <NeonPath p={p} color={vividStroke(cy)} d="M106 64 L138 46 L168 36" w={p.strokeW + 0.45} />
          <NeonPath p={p} color={vividStroke(em)} d="M138 46 L168 36" w={p.strokeW + 0.25} />
          <NodeDot cx={168} cy={36} p={p} r={6.5} accentStroke={vividInk(em)} />
          <NodeDot cx={184} cy={68} p={p} r={5.5} accentStroke={vividStroke(em)} />
          <NodeDot cx={150} cy={90} p={p} r={5} accentStroke={vividStroke(cy)} />
          <ConnectionArc p={p} color={vividStroke(em)} d="M168 36 Q178 52 184 68" />
          <ConnectionArc p={p} color={vividStroke(cy)} d="M138 46 Q144 70 150 90" />
        </G>
      </SceneStage>
    </SceneSvg>
  );
}

function RestaurantScene({ p }: { p: ScenePalette }): ReactElement {
  const { a: g, b: em } = sceneSemantics('local-restaurant-services');
  return (
    <SceneSvg compact={p.compact}>
      <SceneStage compact={p.compact}>
        <G>
          <IntegratedBackdrop p={p} sem={{ a: g, b: em }} heroCx={88} heroCy={54} heroR={40} platformCx={100} />
          <NeonPath p={p} color={vividStroke(em)} d="M42 98 L42 54 L68 36 L94 54 L94 98 Z" w={p.strokeW + 0.15} />
          <NeonPath p={p} color={vividStroke(g)} d="M56 98 L56 108 M84 98 L84 108" w={p.strokeW} />
          <NeonPath p={p} color={vividStroke(g)} d="M36 54 L102 54 L68 26 Z" w={p.strokeW + 0.2} />
          <Ellipse cx={68} cy={78} rx={22} ry={9} fill="none" stroke={vividStroke(em)} strokeWidth={p.strokeW + 0.1} />
          <Ellipse cx={68} cy={78} rx={13} ry={5} fill={g.glow} opacity={0.48} />
          <Circle cx={148} cy={50} r={15} fill="none" stroke={vividStroke(g)} strokeWidth={p.strokeW + 0.2} />
          <Circle cx={148} cy={50} r={6.5} fill={vividInk(g)} opacity={1} />
          <ConnectionArc p={p} color={vividStroke(g)} d="M94 66 Q124 52 136 50" />
          <NodeDot cx={164} cy={74} p={p} r={5} accentStroke={vividStroke(em)} />
        </G>
      </SceneStage>
    </SceneSvg>
  );
}

function TransitScene({ p }: { p: ScenePalette }): ReactElement {
  const { a: cy, b: em } = sceneSemantics('local-transit-mobility');
  return (
    <SceneSvg compact={p.compact}>
      <SceneStage compact={p.compact}>
        <G>
          <IntegratedBackdrop p={p} sem={{ a: cy, b: em }} heroCx={100} heroCy={52} heroR={42} />
          <NeonPath
            p={p}
            color={TRANSIT_ROUTE_BLUE.strokeHover}
            d="M18 94 L58 68 L108 74 L196 42"
            w={p.strokeW + 0.45}
          />
          <NodeDot cx={20} cy={94} p={p} r={5} accentStroke={TRANSIT_ROUTE_BLUE.ink} />
          <NodeDot cx={112} cy={76} p={p} r={5} accentStroke={cy.stroke} />
          <NodeDot cx={200} cy={44} p={p} r={5.5} accentStroke={em.ink} />
          <NeonLine x1={200} y1={44} x2={200} y2={28} p={p} color={em.stroke} w={p.strokeW + 0.1} />
          <G>
            <Rect
              x={54}
              y={58}
              width={58}
              height={26}
              rx={7}
              fill="none"
              stroke={cy.ink}
              strokeWidth={p.strokeW + 0.2}
            />
            <Rect
              x={60}
              y={66}
              width={16}
              height={12}
              rx={2}
              fill={cy.glow}
              fillOpacity={0.2}
              stroke={cy.stroke}
              strokeWidth={p.strokeW}
            />
            <Rect
              x={88}
              y={66}
              width={16}
              height={12}
              rx={2}
              fill={cy.glow}
              fillOpacity={0.2}
              stroke={cy.stroke}
              strokeWidth={p.strokeW}
            />
            <Circle cx={62} cy={86} r={6} fill="none" stroke={em.stroke} strokeWidth={p.strokeW} />
            <Circle cx={100} cy={86} r={6} fill="none" stroke={em.stroke} strokeWidth={p.strokeW} />
          </G>
        </G>
      </SceneStage>
    </SceneSvg>
  );
}

function LegalWealthScene({ p }: { p: ScenePalette }): ReactElement {
  const { a: g, b: cy } = sceneSemantics('local-legal-wealth');
  return (
    <SceneSvg compact={p.compact}>
      <SceneStage compact={p.compact}>
        <G>
          <IntegratedBackdrop p={p} sem={{ a: g, b: cy }} heroCx={110} heroCy={44} heroR={40} />
          <LuminousPlatform p={p} cx={110} cy={118} rx={78} glowFill={g.glow} />
          <NeonLine x1={110} y1={18} x2={110} y2={52} p={p} color={vividStroke(g)} w={p.strokeW + 0.35} />
          <NeonLine x1={84} y1={34} x2={136} y2={34} p={p} color={vividInk(g)} w={p.strokeW + 0.3} />
          <NeonLine x1={86} y1={36} x2={80} y2={50} p={p} color={g.stroke} w={p.strokeW} />
          <NeonLine x1={138} y1={36} x2={144} y2={50} p={p} color={g.stroke} w={p.strokeW} />
          <Rect x={30} y={48} width={40} height={50} rx={3} fill="none" stroke={vividStroke(cy)} strokeWidth={p.strokeW + 0.15} />
          <NeonLine x1={36} y1={60} x2={64} y2={60} p={p} color={vividInk(cy)} w={p.strokeW} />
          <NeonLine x1={36} y1={74} x2={56} y2={74} p={p} color={vividInk(cy)} w={p.strokeW} />
          <NeonPath p={p} color={vividStroke(cy)} d="M146 28 L174 28 L182 94 L138 94 Z" w={p.strokeW + 0.15} />
          <NeonPath p={p} color={vividInk(g)} d="M156 46 L162 40 L168 46 L162 52 Z" w={p.strokeW + 0.1} />
        </G>
      </SceneStage>
    </SceneSvg>
  );
}

function MyRequestsScene({ p }: { p: ScenePalette }): ReactElement {
  const { a: em, b: cy } = sceneSemantics('local-my-requests');
  return (
    <SceneSvg compact={p.compact}>
      <SceneStage compact={p.compact}>
        <G>
          <IntegratedBackdrop p={p} sem={{ a: em, b: cy }} heroCx={118} heroCy={44} heroR={38} platformCx={110} />
          <LuminousPlatform p={p} cx={110} cy={118} rx={78} glowFill={em.glow} />
          <NeonLine x1={22} y1={108} x2={194} y2={108} p={p} color={vividStroke(cy)} w={p.strokeW + 0.1} />
          <NodeDot cx={38} cy={108} p={p} r={5.5} accentStroke={vividStroke(cy)} />
          <NodeDot cx={96} cy={108} p={p} r={5.5} accentStroke={vividStroke(em)} />
          <NodeDot cx={170} cy={108} p={p} r={6.5} accentStroke={vividInk(em)} />
          <NeonPath p={p} color={vividStroke(em)} d="M38 108 L96 108 L170 72" w={p.strokeW + 0.25} />
          <NeonPath p={p} color={vividInk(em)} d="M150 30 L172 52 L158 66 L136 44 Z" w={p.strokeW + 0.2} />
          <NeonLine x1={156} y1={46} x2={168} y2={58} p={p} color="rgba(255,255,255,0.85)" w={p.strokeW * 0.75} />
        </G>
      </SceneStage>
    </SceneSvg>
  );
}

function NailsBeautyScene({ p }: { p: ScenePalette }): ReactElement {
  const { a: em, b: m } = sceneSemantics('local-nails-beauty');
  return (
    <SceneSvg compact={p.compact}>
      <SceneStage compact={p.compact}>
        <G>
          <IntegratedBackdrop p={p} sem={{ a: em, b: m }} heroCx={108} heroCy={46} heroR={40} />
          <NeonPath
            p={p}
            color={vividStroke(m)}
            d="M66 100 Q84 46 108 40 Q132 46 154 100"
            w={p.strokeW + 0.25}
          />
          <Circle cx={108} cy={34} r={13} fill="none" stroke={vividInk(m)} strokeWidth={p.strokeW + 0.2} />
          <NeonLine x1={42} y1={60} x2={58} y2={44} p={p} color={vividStroke(em)} />
          <NeonLine x1={176} y1={62} x2={160} y2={46} p={p} color={vividStroke(em)} />
          <NeonLine x1={92} y1={70} x2={96} y2={54} p={p} color={m.ink} w={p.strokeW} />
          <NeonLine x1={128} y1={70} x2={124} y2={54} p={p} color={m.ink} w={p.strokeW} />
          <NodeDot cx={48} cy={76} p={p} r={4} accentStroke={em.stroke} />
          <NodeDot cx={172} cy={78} p={p} r={4} accentStroke={em.ink} />
        </G>
      </SceneStage>
    </SceneSvg>
  );
}

function CommunityEventsScene({ p }: { p: ScenePalette }): ReactElement {
  const { a: v, b: em } = sceneSemantics('local-community-events');
  return (
    <SceneSvg compact={p.compact}>
      <SceneStage compact={p.compact}>
        <G>
          <IntegratedBackdrop p={p} sem={{ a: v, b: em }} heroCx={108} heroCy={48} heroR={42} />
          <LuminousPlatform p={p} cx={108} cy={118} rx={78} glowFill={v.glow} />
          <NeonPath p={p} color={vividStroke(v)} d="M52 98 L164 98 L148 46 L68 46 Z" w={p.strokeW + 0.22} />
          <NeonLine x1={106} y1={98} x2={106} y2={112} p={p} color={vividInk(v)} w={p.strokeW + 0.1} />
          <NodeDot cx={38} cy={68} p={p} r={5} accentStroke={vividStroke(em)} />
          <NodeDot cx={64} cy={58} p={p} r={5} accentStroke={vividInk(v)} />
          <NodeDot cx={92} cy={64} p={p} r={5} accentStroke={vividStroke(em)} />
          <ConnectionArc p={p} color={vividStroke(em)} d="M38 68 Q50 62 64 58" />
          <ConnectionArc p={p} color={vividStroke(v)} d="M64 58 Q78 62 92 64" />
        </G>
      </SceneStage>
    </SceneSvg>
  );
}

function HousingScene({ p }: { p: ScenePalette }): ReactElement {
  const { a: cy, b: em } = sceneSemantics('local-housing-home');
  return (
    <SceneSvg compact={p.compact}>
      <SceneStage compact={p.compact}>
        <G>
          <IntegratedBackdrop p={p} sem={{ a: cy, b: em }} heroCx={96} heroCy={52} heroR={38} />
          <NeonPath p={p} color={vividStroke(em)} d="M46 98 L46 56 L72 36 L98 56 L98 98 Z" w={p.strokeW + 0.15} />
          <NeonPath p={p} color={vividStroke(cy)} d="M62 98 L62 110 M88 98 L88 110" w={p.strokeW + 0.1} />
          <Rect x={104} y={52} width={32} height={42} rx={3} fill="none" stroke={vividStroke(cy)} strokeWidth={p.strokeW + 0.15} />
          <NeonPath p={p} color={vividInk(cy)} d="M118 52 L118 36 L130 46 L130 62" w={p.strokeW + 0.1} />
          <Circle cx={130} cy={30} r={10} fill="none" stroke={vividInk(cy)} strokeWidth={p.strokeW + 0.2} />
          <Circle cx={130} cy={30} r={4.5} fill={vividInk(cy)} opacity={1} />
          <NodeDot cx={156} cy={78} p={p} r={5} accentStroke={vividStroke(em)} />
        </G>
      </SceneStage>
    </SceneSvg>
  );
}

function ClassifiedsScene({ p }: { p: ScenePalette }): ReactElement {
  const { a: g, b: v } = sceneSemantics('local-classifieds-market');
  return (
    <SceneSvg compact={p.compact}>
      <SceneStage compact={p.compact}>
        <G>
          <IntegratedBackdrop p={p} sem={{ a: g, b: v }} heroCx={100} heroCy={50} heroR={38} />
          <Rect x={36} y={26} width={78} height={58} rx={5} fill="none" stroke={vividStroke(g)} strokeWidth={p.strokeW + 0.2} />
          <NeonLine x1={36} y1={42} x2={114} y2={42} p={p} color={vividInk(g)} w={p.strokeW + 0.1} />
          <Rect
            x={46}
            y={50}
            width={34}
            height={12}
            rx={2}
            fill={g.glow}
            fillOpacity={0.32}
            stroke={vividStroke(g)}
            strokeWidth={p.strokeW + 0.1}
          />
          <NeonPath p={p} color={vividStroke(v)} d="M46 66 L60 52 L74 66" w={p.strokeW + 0.1} />
          <NodeDot cx={148} cy={46} p={p} r={5.5} accentStroke={vividInk(v)} />
          <NodeDot cx={170} cy={68} p={p} r={5} accentStroke={vividStroke(g)} />
          <ConnectionArc p={p} color={vividStroke(v)} d="M114 54 Q132 46 148 46" />
          <ConnectionArc p={p} color={vividStroke(g)} d="M114 68 Q142 68 170 68" />
        </G>
      </SceneStage>
    </SceneSvg>
  );
}

function DocumentScannerScene({ p }: { p: ScenePalette }): ReactElement {
  const { a: cy, b: g } = sceneSemantics('local-document-scanner');
  return (
    <SceneSvg compact={p.compact}>
      <SceneStage compact={p.compact}>
        <G>
          <IntegratedBackdrop p={p} sem={{ a: cy, b: g }} heroCx={100} heroCy={48} heroR={38} />
          <Rect x={54} y={30} width={54} height={68} rx={4} fill="none" stroke={vividStroke(cy)} strokeWidth={p.strokeW + 0.15} />
          <NeonLine x1={62} y1={46} x2={100} y2={46} p={p} color={vividInk(cy)} w={p.strokeW} />
          <NeonLine x1={62} y1={60} x2={92} y2={60} p={p} color={vividInk(cy)} w={p.strokeW} />
          <Rect
            x={46}
            y={24}
            width={70}
            height={80}
            rx={5}
            fill="none"
            stroke={vividStroke(g)}
            strokeWidth={p.strokeW + 0.2}
          />
          <Circle cx={150} cy={54} r={22} fill="none" stroke={vividInk(g)} strokeWidth={p.strokeW + 0.15} />
          <Circle cx={150} cy={54} r={15} fill="none" stroke={vividStroke(cy)} strokeWidth={p.strokeW} />
          <NeonLine x1={150} y1={40} x2={150} y2={68} p={p} color={vividInk(g)} w={p.strokeW + 0.15} />
          <NeonLine x1={136} y1={54} x2={164} y2={54} p={p} color={vividStroke(cy)} w={p.strokeW + 0.15} />
        </G>
      </SceneStage>
    </SceneSvg>
  );
}

function RequestSentScene({ p }: { p: ScenePalette }): ReactElement {
  return (
    <SceneSvg compact>
      <G opacity={0.94}>
        <GlowOrb cx={70} cy={40} r={24} fill={p.glow} opacity={0.45} />
        <LuminousPlatform p={p} cx={70} cy={62} rx={48} />
        <NeonPath p={p} d="M28 40 L52 40 L60 30 L68 40 L112 40" />
        <NodeDot cx={112} cy={40} p={p} r={5} />
      </G>
    </SceneSvg>
  );
}

function MerchantReviewScene({ p }: { p: ScenePalette }): ReactElement {
  const g = premiumUniverseAccentMap.gold;
  return (
    <SceneSvg compact>
      <G opacity={0.94}>
        <GlowOrb cx={70} cy={38} r={22} fill={g.glow} opacity={0.48} />
        <Circle cx={70} cy={38} r={18} fill="none" stroke={g.stroke} strokeWidth={p.strokeW + 0.1} />
        <NeonPath p={p} color={g.ink} d="M62 38 L66 44 L80 30" w={p.strokeW} />
      </G>
    </SceneSvg>
  );
}

function MerchantDeclinedScene({ p }: { p: ScenePalette }): ReactElement {
  const m = premiumUniverseAccentMap.magenta;
  return (
    <SceneSvg compact>
      <G opacity={0.92}>
        <GlowOrb cx={70} cy={38} r={22} fill={m.glow} opacity={0.45} />
        <Circle cx={70} cy={38} r={18} fill="none" stroke={m.stroke} strokeWidth={p.strokeW + 0.1} />
        <NeonLine x1={60} y1={28} x2={80} y2={48} p={p} color={m.ink} w={p.strokeW + 0.1} />
        <NeonLine x1={80} y1={28} x2={60} y2={48} p={p} color={m.ink} w={p.strokeW + 0.1} />
      </G>
    </SceneSvg>
  );
}

function ConfirmedNotPaidScene({ p }: { p: ScenePalette }): ReactElement {
  const c = premiumUniverseAccentMap.cyan;
  return (
    <SceneSvg compact>
      <G opacity={0.94}>
        <GlowOrb cx={70} cy={38} r={22} fill={c.glow} opacity={0.48} />
        <Circle cx={70} cy={38} r={18} fill="none" stroke={c.stroke} strokeWidth={p.strokeW + 0.1} />
        <NeonPath p={p} color={c.ink} d="M62 38 L66 44 L80 30" w={p.strokeW} />
        <NeonLine x1={48} y1={58} x2={92} y2={58} p={p} w={p.strokeW * 0.85} />
      </G>
    </SceneSvg>
  );
}

function renderScene(key: LocalVectorMicroSceneKey, p: ScenePalette): ReactElement {
  switch (key) {
    case 'local-browse-services':
      return <BrowseServicesScene p={p} />;
    case 'local-booking-assist':
      return <BookingAssistScene p={p} />;
    case 'local-restaurant-services':
      return <RestaurantScene p={p} />;
    case 'local-transit-mobility':
      return <TransitScene p={p} />;
    case 'local-legal-wealth':
      return <LegalWealthScene p={p} />;
    case 'local-my-requests':
      return <MyRequestsScene p={p} />;
    case 'local-nails-beauty':
      return <NailsBeautyScene p={p} />;
    case 'local-community-events':
      return <CommunityEventsScene p={p} />;
    case 'local-housing-home':
      return <HousingScene p={p} />;
    case 'local-classifieds-market':
      return <ClassifiedsScene p={p} />;
    case 'local-document-scanner':
      return <DocumentScannerScene p={p} />;
    case 'local-request-sent':
      return <RequestSentScene p={p} />;
    case 'local-merchant-review':
      return <MerchantReviewScene p={p} />;
    case 'local-merchant-declined':
      return <MerchantDeclinedScene p={p} />;
    case 'local-confirmed-not-paid':
      return <ConfirmedNotPaidScene p={p} />;
    default:
      return <BrowseServicesScene p={p} />;
  }
}

export function LocalVectorMicroScene({
  sceneKey,
  accent,
  prominent = false,
  sceneScale,
  replicaFlagship = false,
}: LocalVectorMicroSceneProps): ReactElement {
  const scale = resolveSceneScale(sceneKey, prominent, sceneScale);
  const p = paletteFor(accent, scale, replicaFlagship);
  const fill = SCENE_SHELL[scale].fill * (replicaFlagship ? 1.08 : 1);

  return (
    <View
      pointerEvents="none"
      style={[
        styles.shell,
        {
          width: `${Math.round(fill * 100)}%`,
          height: `${Math.round(fill * 100)}%`,
        },
        replicaFlagship ? styles.shellFlagship : null,
      ]}
    >
      {replicaFlagship && isLocalFlagshipArtScene(sceneKey) ? (
        <LocalFlagshipMicroScene sceneKey={sceneKey} />
      ) : (
        renderScene(sceneKey, { ...p, compact: scale === 'compact' })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    maxWidth: '100%',
    minWidth: 0,
    width: '96%',
  },
  shellFlagship: {
    width: '100%',
  },
});
