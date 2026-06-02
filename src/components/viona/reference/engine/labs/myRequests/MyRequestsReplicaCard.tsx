/**
 * My Requests replica card — engine shell + dedicated hero scene.
 */
import type { ReactElement } from 'react';

import { vionaCrystalLabCard } from '../../../../../../design/vionaCrystalLabTokens';
import { VionaCrystalCardLab } from '../../VionaCrystalCardLab';
import { VionaTextGlowLab } from '../../VionaTextGlowLab';
import { MyRequestsHeroScene } from './MyRequestsHeroScene';

const SUBTITLE = ['Track and manage your', 'local requests in', 'real time.'] as const;

export type MyRequestsReplicaCardProps = {
  width?: number;
  height?: number;
  testID?: string;
};

export function MyRequestsReplicaCard({
  width = vionaCrystalLabCard.width,
  height = vionaCrystalLabCard.height,
  testID = 'viona-reference-my-requests-replica-card',
}: MyRequestsReplicaCardProps): ReactElement {
  return (
    <VionaCrystalCardLab width={width} height={height} testID={testID} scene={<MyRequestsHeroScene />}>
      <VionaTextGlowLab title="My Requests" subtitleLines={SUBTITLE} />
    </VionaCrystalCardLab>
  );
}
