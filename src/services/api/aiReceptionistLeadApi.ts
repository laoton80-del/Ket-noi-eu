import { restApiFetchJson, type ApiRequestResult } from '../apiClient';

export type AiReceptionistLeadIndustry =
  | 'Nail salon'
  | 'Spa'
  | 'Restaurant'
  | 'Barber'
  | 'Other';

export type AiReceptionistLeadDesiredAutomation =
  | 'Intake only'
  | 'Booking request'
  | 'Auto booking later'
  | 'Multi-language support';

export type SubmitAiReceptionistPilotLeadPayload = Readonly<{
  businessName: string;
  industry: AiReceptionistLeadIndustry;
  city: string;
  country: string;
  contactName: string;
  contactPhone?: string;
  contactEmail?: string;
  languagesNeeded: string;
  estimatedMissedCallsPerDay: string | number;
  desiredAutomation: readonly AiReceptionistLeadDesiredAutomation[];
  preferredPilotDate?: string;
  notes?: string;
  consentAccepted: true;
}>;

export type SubmitAiReceptionistPilotLeadResponse = Readonly<{
  status: 'submitted_for_manual_review';
  message: string;
}>;

export async function submitAiReceptionistPilotLead(
  payload: SubmitAiReceptionistPilotLeadPayload
): Promise<ApiRequestResult<SubmitAiReceptionistPilotLeadResponse>> {
  return restApiFetchJson<SubmitAiReceptionistPilotLeadResponse>(
    '/api/ai-receptionist/pilot-leads/email',
    {
      method: 'POST',
      body: payload,
    }
  );
}

