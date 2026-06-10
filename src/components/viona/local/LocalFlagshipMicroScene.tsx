/**
 * VIONA Wave 3B — Local command-center flagship micro-scene art system.
 * Premium filled SVG icon artwork (reference visual engine). Command-center only.
 */
import type { ReactElement, ReactNode } from 'react';
import Svg, { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

import {
  premiumUniverseAccentSpec,
  type PremiumUniverseAccentSpec,
  type VionaUniverseAccent,
} from '../../../design/premiumTileVisualTokens';
import type { LocalVectorMicroSceneKey } from './localVectorMicroSceneKeys';

const VB = { w: 220, h: 140 } as const;
const ART_SCALE = 1.42;

const FLAGSHIP_ART_KEYS = new Set<LocalVectorMicroSceneKey>([
  'local-my-requests',
  'local-booking-assist',
  'local-legal-wealth',
  'local-community-events',
  'local-browse-services',
]);

export function isLocalFlagshipArtScene(key: LocalVectorMicroSceneKey): boolean {
  return FLAGSHIP_ART_KEYS.has(key);
}

export type LocalFlagshipMicroSceneProps = Readonly<{
  sceneKey: LocalVectorMicroSceneKey;
}>;

type SemPair = Readonly<{ a: PremiumUniverseAccentSpec; b: PremiumUniverseAccentSpec }>;

const SEMANTIC: Partial<Record<LocalVectorMicroSceneKey, readonly [VionaUniverseAccent, VionaUniverseAccent]>> =
  {
    'local-my-requests': ['emerald', 'cyan'],
    'local-booking-assist': ['cyan', 'emerald'],
    'local-legal-wealth': ['gold', 'cyan'],
    'local-community-events': ['violet', 'emerald'],
    'local-browse-services': ['violet', 'emerald'],
  };

function sem(key: LocalVectorMicroSceneKey): SemPair {
  const pair = SEMANTIC[key] ?? (['cyan', 'emerald'] as const);
  return { a: premiumUniverseAccentSpec(pair[0]), b: premiumUniverseAccentSpec(pair[1]) };
}

function vivid(spec: PremiumUniverseAccentSpec): string {
  return spec.strokeHover;
}

function ink(spec: PremiumUniverseAccentSpec): string {
  return spec.inkHover;
}

function FlagshipArtSvg({ children }: { children: ReactNode }): ReactElement {
  return (
    <Svg width="100%" height="100%" viewBox={`0 0 ${VB.w} ${VB.h}`} preserveAspectRatio="xMidYMax meet">
      <G
        transform={`translate(0,-2) translate(110,140) scale(${ART_SCALE}) translate(-110,-140)`}
      >
        {children}
      </G>
    </Svg>
  );
}

function PlatformGlow({ cx, fill }: { cx: number; fill: string }): ReactElement {
  return (
    <G>
      <Ellipse cx={cx} cy={120} rx={82} ry={16} fill={fill} opacity={0.62} />
      <Ellipse cx={cx} cy={117} rx={60} ry={10} fill={fill} opacity={0.48} />
      <Ellipse
        cx={cx}
        cy={115}
        rx={42}
        ry={5}
        fill="none"
        stroke="rgba(235, 252, 255, 0.5)"
        strokeWidth={1.4}
      />
    </G>
  );
}

function HeroGlow({ cx, cy, r, fill }: { cx: number; cy: number; r: number; fill: string }): ReactElement {
  return (
    <G>
      <Circle cx={cx} cy={cy} r={r * 1.55} fill={fill} opacity={0.4} />
      <Circle cx={cx} cy={cy} r={r * 1.2} fill={fill} opacity={0.58} />
      <Circle cx={cx} cy={cy} r={r * 0.9} fill={fill} opacity={0.74} />
    </G>
  );
}

function RimHighlight({ d, w = 1 }: { d: string; w?: number }): ReactElement {
  return (
    <Path
      d={d}
      fill="none"
      stroke="rgba(245, 252, 255, 0.62)"
      strokeWidth={w}
      strokeLinecap="round"
    />
  );
}

/** Request tracker — status beacon + request path (not payment success). */
function MyRequestsFlagshipArt({ em, cy }: { em: PremiumUniverseAccentSpec; cy: PremiumUniverseAccentSpec }): ReactElement {
  const hubX = 110;
  const beaconX = 168;
  const beaconY = 74;
  return (
    <FlagshipArtSvg>
      <G>
        <PlatformGlow cx={hubX} fill={em.glow} />
        <HeroGlow cx={beaconX} cy={beaconY} r={32} fill={em.glow} />
        <Path
          d="M 28 110 Q 70 98 108 102 T 162 86"
          fill="none"
          stroke={cy.glow}
          strokeWidth={16}
          strokeLinecap="round"
          opacity={0.42}
        />
        <Path
          d="M 28 110 Q 70 98 108 102 T 162 86"
          fill="none"
          stroke={vivid(cy)}
          strokeWidth={6.4}
          strokeLinecap="round"
        />
        <Circle cx={38} cy={110} r={13} fill={cy.glow} opacity={0.68} />
        <Circle cx={38} cy={110} r={8.5} fill={ink(cy)} />
        <Circle cx={100} cy={104} r={15} fill={em.glow} opacity={0.82} />
        <Circle cx={100} cy={104} r={10.5} fill={ink(em)} />
        <Path
          d={`M ${beaconX} ${beaconY - 24} L ${beaconX + 22} ${beaconY} L ${beaconX} ${beaconY + 24} L ${beaconX - 22} ${beaconY} Z`}
          fill={em.glow}
          fillOpacity={0.92}
          stroke={vivid(em)}
          strokeWidth={2.8}
        />
        <Circle cx={beaconX} cy={beaconY} r={6.2} fill={ink(em)} />
        <Line
          x1={beaconX - 8}
          y1={beaconY}
          x2={beaconX + 8}
          y2={beaconY}
          stroke="rgba(245, 252, 255, 0.95)"
          strokeWidth={2.8}
          strokeLinecap="round"
        />
        <Line
          x1={beaconX}
          y1={beaconY - 8}
          x2={beaconX}
          y2={beaconY + 8}
          stroke="rgba(245, 252, 255, 0.95)"
          strokeWidth={2.8}
          strokeLinecap="round"
        />
        <RimHighlight d={`M ${beaconX - 12} ${beaconY - 16} L ${beaconX + 6} ${beaconY - 16}`} />
      </G>
    </FlagshipArtSvg>
  );
}

/** Calendar module — draft slot highlight only (no confirmation cue). */
function BookingFlagshipArt({ cy, em }: { cy: PremiumUniverseAccentSpec; em: PremiumUniverseAccentSpec }): ReactElement {
  const hubX = 110;
  const calX = hubX - 56;
  const calY = 22;
  const calW = 112;
  const calH = 90;
  const cells = [
    { x: calX + 10, y: calY + 34, active: false },
    { x: calX + 46, y: calY + 34, active: false },
    { x: calX + 10, y: calY + 64, active: false },
    { x: calX + 46, y: calY + 64, active: true },
  ] as const;
  const cellW = 38;
  const cellH = 28;
  return (
    <FlagshipArtSvg>
      <G>
        <PlatformGlow cx={hubX} fill={cy.glow} />
        <HeroGlow cx={hubX} cy={66} r={54} fill={cy.glow} />
        <Rect
          x={calX}
          y={calY}
          width={calW}
          height={calH}
          rx={14}
          fill={cy.glow}
          fillOpacity={0.78}
          stroke={vivid(cy)}
          strokeWidth={2.8}
        />
        <Rect
          x={calX + 4}
          y={calY + 4}
          width={calW - 8}
          height={26}
          rx={10}
          fill={cy.glow}
          fillOpacity={0.42}
        />
        <Line
          x1={calX + 12}
          y1={calY + 24}
          x2={calX + calW - 12}
          y2={calY + 24}
          stroke={ink(cy)}
          strokeWidth={2}
          strokeLinecap="round"
        />
        <Circle cx={calX + 22} cy={calY + 14} r={6} fill={ink(cy)} />
        <Circle cx={calX + 38} cy={calY + 14} r={6} fill={ink(cy)} opacity={0.6} />
        {cells.map((cell, i) => {
          const active = cell.active;
          return (
            <G key={i}>
              <Rect
                x={cell.x}
                y={cell.y}
                width={cellW}
                height={cellH}
                rx={6}
                fill={active ? em.glow : cy.glow}
                fillOpacity={active ? 0.82 : 0.24}
                stroke={active ? vivid(em) : vivid(cy)}
                strokeWidth={active ? 2.4 : 1.5}
              />
              {active ? (
                <Line
                  x1={cell.x + 10}
                  y1={cell.y + cellH / 2}
                  x2={cell.x + cellW - 10}
                  y2={cell.y + cellH / 2 - 4}
                  stroke={ink(em)}
                  strokeWidth={2.2}
                  strokeLinecap="round"
                />
              ) : null}
            </G>
          );
        })}
        <RimHighlight d={`M ${calX + 10} ${calY + 10} L ${calX + 44} ${calY + 10}`} />
      </G>
    </FlagshipArtSvg>
  );
}

/** Scales + document + shield — legal premium, no payment cues. */
function LegalFlagshipArt({ g, cy }: { g: PremiumUniverseAccentSpec; cy: PremiumUniverseAccentSpec }): ReactElement {
  const sx = 110;
  return (
    <FlagshipArtSvg>
      <G>
        <PlatformGlow cx={sx} fill={g.glow} />
        <HeroGlow cx={sx} cy={52} r={50} fill={g.glow} />
        <Rect
          x={sx - 4}
          y={28}
          width={8}
          height={40}
          rx={3}
          fill={g.glow}
          fillOpacity={0.96}
          stroke={vivid(g)}
          strokeWidth={1.8}
        />
        <Rect x={sx - 38} y={36} width={76} height={6} rx={3} fill={ink(g)} />
        <Ellipse cx={sx - 24} cy={50} rx={17} ry={6.5} fill={g.glow} fillOpacity={0.82} stroke={vivid(g)} strokeWidth={2} />
        <Ellipse cx={sx + 24} cy={50} rx={17} ry={6.5} fill={g.glow} fillOpacity={0.82} stroke={vivid(g)} strokeWidth={2} />
        <Path
          d={`M ${sx} 20 L ${sx + 12} 32 L ${sx} 44 L ${sx - 12} 32 Z`}
          fill={g.glow}
          fillOpacity={0.82}
          stroke={vivid(g)}
          strokeWidth={2}
        />
        <Rect
          x={28}
          y={48}
          width={50}
          height={60}
          rx={6}
          fill={cy.glow}
          fillOpacity={0.62}
          stroke={vivid(cy)}
          strokeWidth={2.2}
        />
        <Line x1={38} y1={64} x2={68} y2={64} stroke={ink(cy)} strokeWidth={2.2} strokeLinecap="round" />
        <Line x1={38} y1={78} x2={62} y2={78} stroke={ink(cy)} strokeWidth={2} strokeLinecap="round" opacity={0.88} />
        <Line x1={38} y1={92} x2={54} y2={92} stroke={ink(cy)} strokeWidth={1.8} strokeLinecap="round" opacity={0.75} />
        <Path
          d="M 148 36 L 180 36 L 188 96 L 140 96 Z"
          fill={cy.glow}
          fillOpacity={0.48}
          stroke={vivid(cy)}
          strokeWidth={2.2}
        />
        <Path d="M 164 50 L 164 42 L 174 47 L 164 52 L 154 47 Z" fill={ink(g)} />
        <RimHighlight d="M 32 52 L 54 52" />
      </G>
    </FlagshipArtSvg>
  );
}

/** Vietnamese local service hub / storefront discover. */
function DiscoverFlagshipArt({ v, em }: { v: PremiumUniverseAccentSpec; em: PremiumUniverseAccentSpec }): ReactElement {
  const hubX = 110;
  const hubY = 64;
  return (
    <FlagshipArtSvg>
      <G>
        <PlatformGlow cx={hubX} fill={v.glow} />
        <HeroGlow cx={hubX} cy={hubY} r={36} fill={v.glow} />
        <Path
          d="M 54 102 L 166 102 L 152 46 L 68 46 Z"
          fill={v.glow}
          fillOpacity={0.55}
          stroke={vivid(v)}
          strokeWidth={2.4}
        />
        <Rect x={80} y={70} width={12} height={32} rx={2} fill={em.glow} fillOpacity={0.7} stroke={vivid(em)} strokeWidth={1.4} />
        <Rect x={98} y={66} width={12} height={36} rx={2} fill={em.glow} fillOpacity={0.8} stroke={vivid(em)} strokeWidth={1.4} />
        <Rect x={116} y={70} width={12} height={32} rx={2} fill={em.glow} fillOpacity={0.7} stroke={vivid(em)} strokeWidth={1.4} />
        <Circle cx={hubX} cy={hubY} r={31} fill={v.glow} fillOpacity={0.86} stroke={vivid(v)} strokeWidth={2.8} />
        <Rect
          x={hubX - 14}
          y={hubY - 6}
          width={28}
          height={20}
          rx={5}
          fill={em.glow}
          fillOpacity={0.78}
          stroke={vivid(em)}
          strokeWidth={1.8}
        />
        <Circle cx={hubX} cy={hubY - 12} r={6} fill={ink(v)} />
        <Circle cx={48} cy={80} r={10} fill={em.glow} fillOpacity={0.68} stroke={vivid(em)} strokeWidth={1.8} />
        <Circle cx={48} cy={80} r={5} fill={ink(em)} />
        <Circle cx={172} cy={80} r={10} fill={em.glow} fillOpacity={0.68} stroke={vivid(em)} strokeWidth={1.8} />
        <Circle cx={172} cy={80} r={5} fill={ink(em)} />
        <Path
          d="M 48 80 Q 76 68 98 62"
          fill="none"
          stroke={vivid(em)}
          strokeWidth={2.2}
          strokeLinecap="round"
          opacity={0.88}
        />
        <Path
          d="M 172 80 Q 144 68 122 62"
          fill="none"
          stroke={vivid(em)}
          strokeWidth={2.2}
          strokeLinecap="round"
          opacity={0.88}
        />
        <Line x1={hubX} y1={102} x2={hubX} y2={114} stroke={ink(v)} strokeWidth={2.4} strokeLinecap="round" />
        <RimHighlight d="M 72 50 L 98 50" />
      </G>
    </FlagshipArtSvg>
  );
}

function renderFlagshipArt(key: LocalVectorMicroSceneKey): ReactElement {
  switch (key) {
    case 'local-my-requests': {
      const { a: em, b: cy } = sem(key);
      return <MyRequestsFlagshipArt em={em} cy={cy} />;
    }
    case 'local-booking-assist': {
      const { a: cy, b: em } = sem(key);
      return <BookingFlagshipArt cy={cy} em={em} />;
    }
    case 'local-legal-wealth': {
      const { a: g, b: cy } = sem(key);
      return <LegalFlagshipArt g={g} cy={cy} />;
    }
    case 'local-community-events':
    case 'local-browse-services': {
      const { a: v, b: em } = sem(key);
      return <DiscoverFlagshipArt v={v} em={em} />;
    }
    default: {
      const { a: v, b: em } = sem('local-community-events');
      return <DiscoverFlagshipArt v={v} em={em} />;
    }
  }
}

export function LocalFlagshipMicroScene({ sceneKey }: LocalFlagshipMicroSceneProps): ReactElement {
  return renderFlagshipArt(sceneKey);
}
