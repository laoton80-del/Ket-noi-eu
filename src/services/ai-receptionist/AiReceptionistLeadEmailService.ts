import { isEmailConfigured, sendEmail } from '../EmailService';
import type { PostAiReceptionistLeadEmailBody } from '../../validation/aiReceptionistLeadSchema';

type RelayInput = Readonly<{
  authUserId: string;
  lead: PostAiReceptionistLeadEmailBody;
}>;

export type AiReceptionistLeadEmailRelayResult =
  | Readonly<{ ok: true }>
  | Readonly<{ ok: false; reason: 'not_configured' | 'send_failed' }>;

function getRecipientEmail(): string | null {
  const recipient = process.env.VIONA_AI_RECEPTIONIST_LEAD_RECIPIENT_EMAIL?.trim();
  if (!recipient) return null;
  return recipient;
}

function formatDesiredAutomation(values: readonly string[]): string {
  if (values.length === 0) return 'None selected';
  return values.join(', ');
}

function optionalText(value: string | undefined): string {
  return value && value.length > 0 ? value : 'N/A';
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function buildEmailText(input: RelayInput, timestampIso: string): string {
  const { authUserId, lead } = input;
  return [
    'AI Receptionist pilot request',
    '',
    `Timestamp (UTC): ${timestampIso}`,
    `Authenticated user id: ${authUserId}`,
    '',
    'Business info',
    `- Business name: ${lead.businessName}`,
    `- Industry: ${lead.industry}`,
    `- City: ${lead.city || 'N/A'}`,
    `- Country: ${lead.country || 'N/A'}`,
    '',
    'Contact info',
    `- Contact name: ${lead.contactName || 'N/A'}`,
    `- Contact phone: ${optionalText(lead.contactPhone)}`,
    `- Contact email: ${optionalText(lead.contactEmail)}`,
    '',
    'Pilot request details',
    `- Languages needed: ${lead.languagesNeeded || 'N/A'}`,
    `- Estimated missed calls/day: ${lead.estimatedMissedCallsPerDay}`,
    `- Desired automation: ${formatDesiredAutomation(lead.desiredAutomation)}`,
    `- Preferred pilot date: ${optionalText(lead.preferredPilotDate)}`,
    `- Notes: ${optionalText(lead.notes)}`,
    '',
    `Consent accepted: ${lead.consentAccepted ? 'yes' : 'no'}`,
  ].join('\n');
}

function buildEmailHtml(input: RelayInput, timestampIso: string): string {
  const { authUserId, lead } = input;
  const desiredAutomation = formatDesiredAutomation(lead.desiredAutomation);
  const safeUserId = escapeHtml(authUserId);
  const safeBusinessName = escapeHtml(lead.businessName);
  const safeIndustry = escapeHtml(lead.industry);
  const safeCity = escapeHtml(lead.city || 'N/A');
  const safeCountry = escapeHtml(lead.country || 'N/A');
  const safeContactName = escapeHtml(lead.contactName || 'N/A');
  const safeContactPhone = escapeHtml(optionalText(lead.contactPhone));
  const safeContactEmail = escapeHtml(optionalText(lead.contactEmail));
  const safeLanguagesNeeded = escapeHtml(lead.languagesNeeded || 'N/A');
  const safeMissedCalls = escapeHtml(String(lead.estimatedMissedCallsPerDay));
  const safeDesiredAutomation = escapeHtml(desiredAutomation);
  const safePreferredPilotDate = escapeHtml(optionalText(lead.preferredPilotDate));
  const safeNotes = escapeHtml(optionalText(lead.notes));
  const safeConsent = lead.consentAccepted ? 'yes' : 'no';
  return `
    <h2>AI Receptionist pilot request</h2>
    <p><strong>Timestamp (UTC):</strong> ${escapeHtml(timestampIso)}</p>
    <p><strong>Authenticated user id:</strong> ${safeUserId}</p>
    <h3>Business info</h3>
    <ul>
      <li><strong>Business name:</strong> ${safeBusinessName}</li>
      <li><strong>Industry:</strong> ${safeIndustry}</li>
      <li><strong>City:</strong> ${safeCity}</li>
      <li><strong>Country:</strong> ${safeCountry}</li>
    </ul>
    <h3>Contact info</h3>
    <ul>
      <li><strong>Contact name:</strong> ${safeContactName}</li>
      <li><strong>Contact phone:</strong> ${safeContactPhone}</li>
      <li><strong>Contact email:</strong> ${safeContactEmail}</li>
    </ul>
    <h3>Pilot request details</h3>
    <ul>
      <li><strong>Languages needed:</strong> ${safeLanguagesNeeded}</li>
      <li><strong>Estimated missed calls/day:</strong> ${safeMissedCalls}</li>
      <li><strong>Desired automation:</strong> ${safeDesiredAutomation}</li>
      <li><strong>Preferred pilot date:</strong> ${safePreferredPilotDate}</li>
      <li><strong>Notes:</strong> ${safeNotes}</li>
      <li><strong>Consent accepted:</strong> ${safeConsent}</li>
    </ul>
  `;
}

export async function relayAiReceptionistPilotLeadEmail(
  input: RelayInput
): Promise<AiReceptionistLeadEmailRelayResult> {
  const recipient = getRecipientEmail();
  if (!recipient || !isEmailConfigured()) {
    return { ok: false, reason: 'not_configured' };
  }
  const timestampIso = new Date().toISOString();
  const subject = `VIONA AI Receptionist pilot request - ${input.lead.businessName}`;
  try {
    await sendEmail({
      to: recipient,
      subject,
      text: buildEmailText(input, timestampIso),
      html: buildEmailHtml(input, timestampIso),
    });
    return { ok: true };
  } catch {
    return { ok: false, reason: 'send_failed' };
  }
}

