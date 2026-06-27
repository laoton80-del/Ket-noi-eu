import { StyleSheet } from 'react-native';

import { VIONA_COMPACT_SITUATION_SECTION_BORDER_RADIUS_PX } from '../../design/vionaCompactSituationTileLayout';
import { FontFamily } from '../../theme/typography';

/** Section kicker aligned with Travel `utilityPrompt` / scenarios kicker. */
export const vionaCompactSituationSectionStyles = StyleSheet.create({
  kicker: {
    fontFamily: FontFamily.semibold,
    fontSize: 9.5,
    letterSpacing: 0.95,
    textTransform: 'uppercase',
    color: 'rgba(168, 228, 255, 0.82)',
    lineHeight: 12,
  },
  kickerWarm: {
    color: 'rgba(255, 232, 188, 0.9)',
  },
  kickerEmerald: {
    color: 'rgba(140, 236, 200, 0.82)',
  },
  kickerViolet: {
    color: 'rgba(200, 180, 255, 0.82)',
  },
  kickerGold: {
    color: 'rgba(228, 192, 110, 0.86)',
  },
  panel: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: VIONA_COMPACT_SITUATION_SECTION_BORDER_RADIUS_PX,
    borderWidth: 1,
    borderColor: 'rgba(92, 205, 255, 0.16)',
    backgroundColor: 'rgba(6, 12, 24, 0.28)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  panelWarm: {
    borderColor: 'rgba(242, 212, 136, 0.24)',
    backgroundColor: 'rgba(8, 12, 20, 0.28)',
  },
  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridCell: {
    minWidth: 0,
    flexGrow: 1,
    flexShrink: 1,
  },
  cell2: { flexBasis: '46%' },
  cell3: { flexBasis: '30%' },
  cell4: { flexBasis: '22%' },
  cell8: { flexBasis: '11%' },
});
