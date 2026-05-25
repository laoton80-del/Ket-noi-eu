/**
 * Wave 3B — subtle semantic micro-art inside premium tiles (visual only).
 */
import type { ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import type { PremiumTileMicroSceneKind } from '../../design/premiumTileMicroScene';
import {
  premiumTileMicroSceneLayout,
  premiumUniverseAccentSpec,
  type VionaUniverseAccent,
} from '../../design/premiumTileVisualTokens';

export type PremiumTileMicroSceneProps = Readonly<{
  kind: PremiumTileMicroSceneKind;
  accent: VionaUniverseAccent;
}>;

function Dot({ x, y, size, color }: { x: number; y: number; size: number; color: string }): ReactElement {
  return (
    <View
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
      }}
    />
  );
}

function Line({
  x1,
  y1,
  x2,
  y2,
  color,
  thick = 1,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  thick?: number;
}): ReactElement {
  const w = Math.max(Math.abs(x2 - x1), thick);
  const h = Math.max(Math.abs(y2 - y1), thick);
  const left = Math.min(x1, x2);
  const top = Math.min(y1, y2);
  return (
    <View
      style={{
        position: 'absolute',
        left,
        top,
        width: w,
        height: h,
        backgroundColor: color,
        borderRadius: thick,
        opacity: 0.9,
      }}
    />
  );
}

function SceneCanvas({
  accent,
  children,
}: {
  accent: VionaUniverseAccent;
  children: ReactElement;
}): ReactElement {
  const spec = premiumUniverseAccentSpec(accent);
  return (
    <View style={styles.canvas}>
      <View
        style={[
          styles.meshField,
          { borderColor: spec.stroke, backgroundColor: spec.cornerWash },
        ]}
      />
      <View
        style={[
          styles.glowOrb,
          { backgroundColor: spec.glow, opacity: premiumTileMicroSceneLayout.glowOrbOpacity },
        ]}
      />
      {children}
    </View>
  );
}

function MarketplaceGrid({ accent }: { accent: VionaUniverseAccent }): ReactElement {
  const c = premiumUniverseAccentSpec(accent).stroke;
  return (
    <SceneCanvas accent={accent}>
      <>
        {[12, 28, 44].map((x) =>
          [10, 26, 42].map((y) => <Dot key={`${x}-${y}`} x={x} y={y} size={3} color={c} />)
        )}
        <Line x1={12} y1={26} x2={44} y2={26} color={c} />
        <Line x1={28} y1={10} x2={28} y2={42} color={c} />
      </>
    </SceneCanvas>
  );
}

function ChatBeam({ accent }: { accent: VionaUniverseAccent }): ReactElement {
  const c = premiumUniverseAccentSpec(accent).stroke;
  return (
    <SceneCanvas accent={accent}>
      <>
        <View style={[styles.beam, { backgroundColor: c, left: 8, top: 18 }]} />
        <View style={[styles.beamTail, { borderTopColor: c, left: 20, top: 30 }]} />
        <Dot x={48} y={14} size={5} color={c} />
        <Dot x={54} y={22} size={4} color={c} />
      </>
    </SceneCanvas>
  );
}

function SignalDirectional({ accent }: { accent: VionaUniverseAccent }): ReactElement {
  const c = premiumUniverseAccentSpec(accent).stroke;
  return (
    <SceneCanvas accent={accent}>
      <>
        <Line x1={10} y1={28} x2={50} y2={16} color={c} thick={2} />
        <View style={[styles.arrowHead, { borderLeftColor: c, left: 48, top: 12 }]} />
      </>
    </SceneCanvas>
  );
}

function ApprovalRing({ accent }: { accent: VionaUniverseAccent }): ReactElement {
  const c = premiumUniverseAccentSpec(accent).stroke;
  return (
    <SceneCanvas accent={accent}>
      <View
        style={{
          position: 'absolute',
          left: 18,
          top: 10,
          width: 32,
          height: 32,
          borderRadius: 16,
          borderWidth: 2,
          borderColor: c,
          opacity: 0.85,
        }}
      />
    </SceneCanvas>
  );
}

function SignalBroken({ accent }: { accent: VionaUniverseAccent }): ReactElement {
  const c = premiumUniverseAccentSpec(accent).stroke;
  return (
    <SceneCanvas accent={accent}>
      <>
        <Line x1={12} y1={30} x2={32} y2={14} color={c} thick={2} />
        <Line x1={34} y1={32} x2={54} y2={18} color={c} thick={2} />
      </>
    </SceneCanvas>
  );
}

function InfoPulse({ accent }: { accent: VionaUniverseAccent }): ReactElement {
  const c = premiumUniverseAccentSpec(accent).stroke;
  return (
    <SceneCanvas accent={accent}>
      <>
        <View style={[styles.pulseRing, { borderColor: c, left: 20, top: 12 }]} />
        <View style={[styles.pulseRing, { borderColor: c, left: 16, top: 8, width: 40, height: 40, opacity: 0.45 }]} />
        <Dot x={34} y={26} size={4} color={c} />
      </>
    </SceneCanvas>
  );
}

function TimelinePulse({ accent }: { accent: VionaUniverseAccent }): ReactElement {
  const c = premiumUniverseAccentSpec(accent).stroke;
  return (
    <SceneCanvas accent={accent}>
      <>
        <Line x1={10} y1={30} x2={56} y2={30} color={c} />
        <Dot x={14} y={28} size={5} color={c} />
        <Dot x={30} y={28} size={5} color={c} />
        <Dot x={46} y={28} size={6} color={c} />
        <View style={[styles.pulseBar, { backgroundColor: c, left: 44, top: 18, height: 14 }]} />
      </>
    </SceneCanvas>
  );
}

function RouteLines({ accent }: { accent: VionaUniverseAccent }): ReactElement {
  const c = premiumUniverseAccentSpec(accent).stroke;
  return (
    <SceneCanvas accent={accent}>
      <>
        <Line x1={8} y1={36} x2={24} y2={20} color={c} />
        <Line x1={24} y1={20} x2={40} y2={28} color={c} />
        <Line x1={40} y1={28} x2={56} y2={12} color={c} />
        <Dot x={24} y={20} size={4} color={c} />
        <Dot x={40} y={28} size={4} color={c} />
      </>
    </SceneCanvas>
  );
}

function DataDocMatrix({ accent }: { accent: VionaUniverseAccent }): ReactElement {
  const c = premiumUniverseAccentSpec(accent).stroke;
  const c2 = premiumUniverseAccentSpec('gold').stroke;
  return (
    <SceneCanvas accent={accent}>
      <>
        {[14, 26, 38].map((x, i) => (
          <View
            key={x}
            style={{
              position: 'absolute',
              left: x,
              top: 12 + i * 6,
              width: 8,
              height: 22,
              borderRadius: 2,
              borderWidth: 1,
              borderColor: i % 2 ? c2 : c,
              opacity: 0.7,
            }}
          />
        ))}
      </>
    </SceneCanvas>
  );
}

function SocialNodes({ accent }: { accent: VionaUniverseAccent }): ReactElement {
  const c = premiumUniverseAccentSpec(accent).stroke;
  return (
    <SceneCanvas accent={accent}>
      <>
        <Dot x={20} y={16} size={6} color={c} />
        <Dot x={38} y={24} size={5} color={c} />
        <Dot x={48} y={12} size={4} color={c} />
        <Line x1={23} y1={18} x2={36} y2={24} color={c} />
        <Line x1={36} y1={24} x2={48} y2={14} color={c} />
      </>
    </SceneCanvas>
  );
}

function ListingTags({ accent }: { accent: VionaUniverseAccent }): ReactElement {
  const c = premiumUniverseAccentSpec(accent).stroke;
  return (
    <SceneCanvas accent={accent}>
      <>
        <View style={[styles.tag, { borderColor: c, top: 14, left: 12 }]} />
        <View style={[styles.tag, { borderColor: c, top: 24, left: 22, width: 36 }]} />
        <View style={[styles.tag, { borderColor: c, top: 34, left: 16, width: 28 }]} />
      </>
    </SceneCanvas>
  );
}

function EmeraldShimmer({ accent }: { accent: VionaUniverseAccent }): ReactElement {
  const c = premiumUniverseAccentSpec(accent).glow;
  return (
    <SceneCanvas accent={accent}>
      <View style={[styles.shimmerBand, { backgroundColor: c }]} />
    </SceneCanvas>
  );
}

function DiningArc({ accent }: { accent: VionaUniverseAccent }): ReactElement {
  const c = premiumUniverseAccentSpec(accent).stroke;
  return (
    <SceneCanvas accent={accent}>
      <View
        style={{
          position: 'absolute',
          left: 14,
          top: 22,
          width: 44,
          height: 22,
          borderTopWidth: 2,
          borderLeftWidth: 2,
          borderRightWidth: 2,
          borderColor: c,
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          opacity: 0.8,
        }}
      />
    </SceneCanvas>
  );
}

function NodeMesh({ accent }: { accent: VionaUniverseAccent }): ReactElement {
  const c = premiumUniverseAccentSpec(accent).stroke;
  return (
    <SceneCanvas accent={accent}>
      <>
        <Dot x={16} y={20} size={4} color={c} />
        <Dot x={32} y={12} size={5} color={c} />
        <Dot x={48} y={24} size={4} color={c} />
        <Line x1={18} y1={22} x2={32} y2={14} color={c} />
        <Line x1={34} y1={14} x2={48} y2={24} color={c} />
      </>
    </SceneCanvas>
  );
}

function ScanRings({ accent }: { accent: VionaUniverseAccent }): ReactElement {
  const c = premiumUniverseAccentSpec(accent).stroke;
  return (
    <SceneCanvas accent={accent}>
      <>
        <View style={[styles.pulseRing, { borderColor: c, left: 22, top: 14, width: 28, height: 28 }]} />
        <Line x1={28} y1={28} x2={44} y2={14} color={c} />
      </>
    </SceneCanvas>
  );
}

function HousingGrid({ accent }: { accent: VionaUniverseAccent }): ReactElement {
  const c = premiumUniverseAccentSpec(accent).stroke;
  return (
    <SceneCanvas accent={accent}>
      <>
        <View style={[styles.houseBlock, { borderColor: c, left: 14, top: 18 }]} />
        <View style={[styles.houseBlock, { borderColor: c, left: 32, top: 26, width: 14, height: 12 }]} />
      </>
    </SceneCanvas>
  );
}

function UniverseTravel({ accent }: { accent: VionaUniverseAccent }): ReactElement {
  return <RouteLines accent={accent} />;
}

function UniverseBusiness({ accent }: { accent: VionaUniverseAccent }): ReactElement {
  return <DataDocMatrix accent={accent} />;
}

function UniverseAcademy({ accent }: { accent: VionaUniverseAccent }): ReactElement {
  return <SocialNodes accent={accent} />;
}

export function PremiumTileMicroScene({ kind, accent }: PremiumTileMicroSceneProps): ReactElement {
  switch (kind) {
    case 'marketplace-grid':
      return <MarketplaceGrid accent={accent} />;
    case 'chat-request-beam':
      return <ChatBeam accent={accent} />;
    case 'signal-directional':
      return <SignalDirectional accent={accent} />;
    case 'approval-ring':
      return <ApprovalRing accent={accent} />;
    case 'signal-broken':
      return <SignalBroken accent={accent} />;
    case 'info-pulse':
      return <InfoPulse accent={accent} />;
    case 'timeline-pulse':
      return <TimelinePulse accent={accent} />;
    case 'emerald-shimmer':
      return <EmeraldShimmer accent={accent} />;
    case 'dining-arc':
      return <DiningArc accent={accent} />;
    case 'route-lines':
      return <RouteLines accent={accent} />;
    case 'data-doc-matrix':
      return <DataDocMatrix accent={accent} />;
    case 'social-nodes':
      return <SocialNodes accent={accent} />;
    case 'listing-tags':
      return <ListingTags accent={accent} />;
    case 'node-mesh':
      return <NodeMesh accent={accent} />;
    case 'scan-rings':
      return <ScanRings accent={accent} />;
    case 'housing-grid':
      return <HousingGrid accent={accent} />;
    case 'universe-travel':
      return <UniverseTravel accent={accent} />;
    case 'universe-business':
      return <UniverseBusiness accent={accent} />;
    case 'universe-academy':
      return <UniverseAcademy accent={accent} />;
    default:
      return <NodeMesh accent={accent} />;
  }
}

const styles = StyleSheet.create({
  canvas: {
    width: premiumTileMicroSceneLayout.canvasWidth,
    height: premiumTileMicroSceneLayout.canvasHeight,
    position: 'relative',
    overflow: 'hidden',
  },
  meshField: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.42,
    borderWidth: 1,
    borderRadius: 10,
  },
  glowOrb: {
    position: 'absolute',
    right: -14,
    bottom: -18,
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  beam: {
    position: 'absolute',
    width: 28,
    height: 10,
    borderRadius: 6,
    opacity: 0.75,
  },
  beamTail: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 0,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    opacity: 0.6,
  },
  arrowHead: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderTopWidth: 5,
    borderBottomWidth: 5,
    borderLeftWidth: 8,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  pulseRing: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    opacity: 0.75,
  },
  pulseBar: {
    position: 'absolute',
    width: 3,
    borderRadius: 2,
    opacity: 0.85,
  },
  tag: {
    position: 'absolute',
    width: 42,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    opacity: 0.65,
  },
  shimmerBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 16,
    height: 14,
    borderRadius: 8,
    opacity: 0.5,
    transform: [{ skewX: '-12deg' }],
  },
  houseBlock: {
    position: 'absolute',
    width: 16,
    height: 14,
    borderWidth: 1,
    borderRadius: 2,
    opacity: 0.7,
  },
});
