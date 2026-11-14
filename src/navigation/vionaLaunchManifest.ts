import {
  VIONA_REC2_UNIVERSE_ORDER,
  type VionaRec2UniverseId,
} from '../components/viona/home/vionaRec2HomeContract';

/**
 * Stage-1 projection of the unsigned draft
 * `manifest.md` (launch-manifest 0.2-DRAFT, status ĐỀ XUẤT).
 * Names and ids are copied from that draft. GATED rows have no name there.
 */
export type VionaLaunchReadiness = 'build' | 'gated';
export type VionaLaunchCommitment = 'C' | 'E';
export type VionaLaunchMark = 'signature' | 'd-select';

export type VionaLaunchModule = Readonly<{
  id: string;
  universe: VionaRec2UniverseId;
  readiness: VionaLaunchReadiness;
  name?: string;
  commitment?: VionaLaunchCommitment;
  mark?: VionaLaunchMark;
}>;

const BUILD: readonly VionaLaunchModule[] = [
  { id: 'BU-02', universe: 'business', readiness: 'build', name: 'Salon & Beauty Engine', commitment: 'C' },
  { id: 'BU-05', universe: 'business', readiness: 'build', name: 'Local Reputation & SEO', commitment: 'C' },
  { id: 'BU-08', universe: 'business', readiness: 'build', name: 'Autonomous Voice Receptionist', commitment: 'C' },
  { id: 'BU-01', universe: 'business', readiness: 'build', name: 'Core POS & Smart Kitchen', commitment: 'E' },
  { id: 'BU-03', universe: 'business', readiness: 'build', name: 'Asia Grocery & Potraviny', commitment: 'E' },
  { id: 'BU-04', universe: 'business', readiness: 'build', name: 'Staff Shift Optimizer', commitment: 'E' },
  { id: 'BU-13', universe: 'business', readiness: 'build', name: 'GDPR Compliance Auto-Pilot', commitment: 'E' },
  {
    id: 'BU-09',
    universe: 'business',
    readiness: 'build',
    name: 'Predictive Strategy Engine',
    commitment: 'C',
    mark: 'signature',
  },
  { id: 'LO-01', universe: 'local', readiness: 'build', name: 'Bureaucracy Navigator', commitment: 'C' },
  { id: 'LO-02', universe: 'local', readiness: 'build', name: 'Community Real Estate', commitment: 'E' },
  { id: 'LO-03', universe: 'local', readiness: 'build', name: 'On-demand Handyman', commitment: 'E' },
  {
    id: 'LO-05',
    universe: 'local',
    readiness: 'build',
    name: 'Viona Mobility & Partner Economy (1 ô)',
    commitment: 'E',
  },
  {
    id: 'LO-06',
    universe: 'local',
    readiness: 'build',
    name: 'Predictive Lifestyle Orchestrator',
    commitment: 'C',
    mark: 'signature',
  },
  {
    id: 'LO-04',
    universe: 'local',
    readiness: 'build',
    name: 'Telehealth Medical Bridge (handoff hành chính)',
    commitment: 'C',
    mark: 'd-select',
  },
  { id: 'AC-01', universe: 'academy', readiness: 'build', name: 'Vocational Exam Simulator', commitment: 'C' },
  { id: 'AC-02', universe: 'academy', readiness: 'build', name: 'Vietnamese Heritage Language', commitment: 'C' },
  { id: 'AC-03', universe: 'academy', readiness: 'build', name: 'Expert Knowledge Marketplace', commitment: 'E' },
  { id: 'AC-04', universe: 'academy', readiness: 'build', name: 'Credential Translator', commitment: 'E' },
  { id: 'AC-06', universe: 'academy', readiness: 'build', name: 'Lesson Plan Architect', commitment: 'E' },
  { id: 'AC-09', universe: 'academy', readiness: 'build', name: 'Skill-to-Job Matching Engine', commitment: 'E' },
  { id: 'TR-03', universe: 'travel', readiness: 'build', name: 'Live Voice Interpreter', commitment: 'C' },
  { id: 'TR-04', universe: 'travel', readiness: 'build', name: 'Intermodal Commute Hub', commitment: 'E' },
  { id: 'TR-05', universe: 'travel', readiness: 'build', name: 'Cross-border Pet Travel', commitment: 'E' },
  {
    id: 'TR-06',
    universe: 'travel',
    readiness: 'build',
    name: 'Travel Booking & Distribution (bản lite)',
    commitment: 'E',
  },
  {
    id: 'TR-07',
    universe: 'travel',
    readiness: 'build',
    name: 'Dynamic Swarm Routing',
    commitment: 'C',
    mark: 'signature',
  },
  { id: 'SO-01', universe: 'sos', readiness: 'build', name: 'Lost Passport Emergency Flow', commitment: 'C' },
  { id: 'SO-05', universe: 'sos', readiness: 'build', name: 'Zero-Connection Safe Map', commitment: 'C' },
  { id: 'SO-09', universe: 'sos', readiness: 'build', name: 'Deepfake & Voice Clone Detector', commitment: 'C' },
  { id: 'SO-03', universe: 'sos', readiness: 'build', name: 'Community Beacon Alert', commitment: 'E' },
  {
    id: 'SO-02',
    universe: 'sos',
    readiness: 'build',
    name: 'Emergency Legal Guard (guidance, không giả luật sư)',
    commitment: 'C',
    mark: 'd-select',
  },
  { id: 'AT-07', universe: 'account', readiness: 'build', name: 'Scam Shield AI', commitment: 'C' },
  {
    id: 'AT-02',
    universe: 'account',
    readiness: 'build',
    name: 'Cross-border Tax Compliance (checklist, không filing)',
    commitment: 'C',
    mark: 'd-select',
  },
  {
    id: 'AT-01',
    universe: 'account',
    readiness: 'build',
    name: 'Smart Remittance Router (so sánh/handoff, không custody)',
    commitment: 'C',
    mark: 'd-select',
  },
];

const GATED_IDS: readonly Readonly<{ id: string; universe: VionaRec2UniverseId }>[] = [
  { id: 'BU-06', universe: 'business' },
  { id: 'BU-07', universe: 'business' },
  { id: 'BU-10', universe: 'business' },
  { id: 'BU-11', universe: 'business' },
  { id: 'BU-12', universe: 'business' },
  { id: 'BU-14', universe: 'business' },
  { id: 'TR-01', universe: 'travel' },
  { id: 'TR-02', universe: 'travel' },
  { id: 'TR-08', universe: 'travel' },
  { id: 'TR-09', universe: 'travel' },
  { id: 'TR-10', universe: 'travel' },
  { id: 'AC-05', universe: 'academy' },
  { id: 'AC-07', universe: 'academy' },
  { id: 'AC-08', universe: 'academy' },
  { id: 'LO-07', universe: 'local' },
  { id: 'LO-08', universe: 'local' },
  { id: 'LO-09', universe: 'local' },
  { id: 'LO-10', universe: 'local' },
  { id: 'AT-03', universe: 'account' },
  { id: 'AT-04', universe: 'account' },
  { id: 'AT-05', universe: 'account' },
  { id: 'AT-06', universe: 'account' },
  { id: 'AT-08', universe: 'account' },
  { id: 'AT-09', universe: 'account' },
  { id: 'AT-10', universe: 'account' },
  { id: 'SO-04', universe: 'sos' },
  { id: 'SO-06', universe: 'sos' },
  { id: 'SO-07', universe: 'sos' },
  { id: 'SO-08', universe: 'sos' },
  { id: 'SO-10', universe: 'sos' },
];

export const VIONA_LAUNCH_CATALOG: readonly VionaLaunchModule[] = [
  ...BUILD,
  ...GATED_IDS.map((row) => ({ id: row.id, universe: row.universe, readiness: 'gated' as const })),
];

const buildCount = VIONA_LAUNCH_CATALOG.filter((row) => row.readiness === 'build').length;
const gatedCount = VIONA_LAUNCH_CATALOG.filter((row) => row.readiness === 'gated').length;
if (buildCount !== 33 || gatedCount !== 30 || VIONA_LAUNCH_CATALOG.length !== 63) {
  throw new Error(`VIONA launch catalog must be 33 BUILD + 30 GATED, got ${buildCount}+${gatedCount}`);
}

const byId = new Map(VIONA_LAUNCH_CATALOG.map((row) => [row.id, row]));
if (byId.size !== VIONA_LAUNCH_CATALOG.length) {
  throw new Error('VIONA launch catalog has a duplicate module id');
}

export function vionaLaunchModules(universe: VionaRec2UniverseId): readonly VionaLaunchModule[] {
  return VIONA_LAUNCH_CATALOG.filter((row) => row.universe === universe);
}

export function vionaLaunchModule(id: string): VionaLaunchModule | undefined {
  return byId.get(id);
}

export function vionaLaunchUniverseOrder(): readonly VionaRec2UniverseId[] {
  return VIONA_REC2_UNIVERSE_ORDER;
}
