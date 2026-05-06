import type { FeatureFlagKey } from '../feature-flags/featureFlags';

export type AiReceptionistSurfaceType = 'demo' | 'pilot' | 'production';

export type AiReceptionistFeatureConfig = Readonly<{
  id: string;
  surface: AiReceptionistSurfaceType;
  title: string;
  description: string;
  requiredFlags: readonly FeatureFlagKey[];
  /** Entry surfaces where this feature can appear. */
  entryRoutes: readonly string[];
}>;

export const AI_RECEPTIONIST_FEATURE_CONFIGS: readonly AiReceptionistFeatureConfig[] = [
  {
    id: 'receptionist-demo-inbound-queue',
    surface: 'demo',
    title: 'Inbound Queue (Demo)',
    description: 'Non-production queue preview for merchant receptionist workflows.',
    requiredFlags: ['b2bAiReceptionistDemoEnabled'],
    entryRoutes: ['InboundQueue'],
  },
  {
    id: 'receptionist-pilot-smart-calendar',
    surface: 'pilot',
    title: 'Smart Calendar (Pilot)',
    description: 'Pilot smart scheduling surface with guarded AI actions.',
    requiredFlags: ['b2bAiReceptionistPilotEnabled'],
    entryRoutes: ['SmartCalendar'],
  },
  {
    id: 'receptionist-production-core',
    surface: 'production',
    title: 'AI Receptionist Production Core',
    description: 'Production call automation shell requiring explicit cutover gate.',
    requiredFlags: ['b2bAiReceptionistProductionEnabled'],
    entryRoutes: ['SmartCalendar', 'InboundQueue'],
  },
  {
    id: 'receptionist-production-auto-booking',
    surface: 'production',
    title: 'Auto Booking',
    description: 'Automated booking confirmation and finalization actions.',
    requiredFlags: ['b2bAiReceptionistProductionEnabled', 'b2bAutoBookingEnabled'],
    entryRoutes: ['SmartCalendar'],
  },
  {
    id: 'receptionist-production-auto-inventory',
    surface: 'production',
    title: 'Auto Inventory',
    description: 'Automated inventory reserve/release actions.',
    requiredFlags: ['b2bAiReceptionistProductionEnabled', 'b2bAutoInventoryEnabled'],
    entryRoutes: ['SmartCalendar', 'InboundQueue'],
  },
  {
    id: 'receptionist-production-auto-bill-print',
    surface: 'production',
    title: 'Auto Bill Print',
    description: 'Automated bill print dispatch in supported merchant flows.',
    requiredFlags: ['b2bAiReceptionistProductionEnabled', 'b2bAutoBillPrintEnabled'],
    entryRoutes: ['InboundQueue'],
  },
  {
    id: 'receptionist-production-auto-payment',
    surface: 'production',
    title: 'Auto Payment',
    description: 'Automated payment capture and settlement handoff.',
    requiredFlags: ['b2bAiReceptionistProductionEnabled', 'b2bAutoPaymentEnabled'],
    entryRoutes: ['InboundQueue'],
  },
];
