/**
 * Transactional email via **Amazon SES** (AWS SDK v3). No SendGrid / Mailgun / Mailchimp / Nodemailer.
 *
 * Env (map to IAM user or task role):
 * - `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` — optional on Lambda/ECS when using instance/task role.
 * - `AWS_REGION` or `SES_REGION` — SES region (e.g. `eu-west-1`).
 * - `SES_FROM_EMAIL`, `MAIL_FROM`, or `AWS_SES_SENDER_EMAIL` — verified SES identity (must match or be allowed domain).
 */

import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

export type SendEmailInput = Readonly<{
  to: string;
  subject: string;
  text: string;
  html?: string;
}>;

let sesSingleton: SESClient | null = null;

function getSesRegion(): string {
  return (process.env.AWS_REGION ?? process.env.SES_REGION ?? 'eu-west-1').trim();
}

function getSesClient(): SESClient {
  if (!sesSingleton) {
    const region = getSesRegion();
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim();
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();
    sesSingleton = new SESClient({
      region,
      ...(accessKeyId && secretAccessKey ? { credentials: { accessKeyId, secretAccessKey } } : {}),
    });
  }
  return sesSingleton;
}

/** @internal tests */
export function resetSesClientSingleton(): void {
  sesSingleton = null;
}

function readFromAddress(): string | null {
  const from =
    process.env.SES_FROM_EMAIL?.trim() ??
    process.env.MAIL_FROM?.trim() ??
    process.env.AWS_SES_SENDER_EMAIL?.trim() ??
    '';
  return from.length > 0 ? from : null;
}

/** True when SES can send (verified From + region + credentials or AWS runtime role). */
export function isEmailConfigured(): boolean {
  if (!readFromAddress()) return false;
  if (!getSesRegion()) return false;
  const hasStaticKeys =
    !!(process.env.AWS_ACCESS_KEY_ID?.trim() && process.env.AWS_SECRET_ACCESS_KEY?.trim());
  const onAwsCompute =
    !!(process.env.AWS_EXECUTION_ENV ?? process.env.AWS_LAMBDA_FUNCTION_NAME ?? process.env.ECS_CONTAINER_METADATA_URI);
  return hasStaticKeys || onAwsCompute;
}

/** @deprecated use {@link isEmailConfigured} — kept for OTP copy that still says `smtp_not_configured`. */
export function isSmtpConfigured(): boolean {
  return isEmailConfigured();
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  const source = readFromAddress();
  if (!source) {
    throw new Error('SES not configured (set SES_FROM_EMAIL, MAIL_FROM, or AWS_SES_SENDER_EMAIL)');
  }
  if (!isEmailConfigured()) {
    throw new Error('SES credentials missing (set AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY or use an AWS role)');
  }

  const client = getSesClient();
  try {
    await client.send(
      new SendEmailCommand({
        Source: source,
        Destination: { ToAddresses: [input.to.trim()] },
        Message: {
          Subject: { Data: input.subject, Charset: 'UTF-8' },
          Body: {
            Text: { Data: input.text, Charset: 'UTF-8' },
            ...(input.html && input.html.length > 0
              ? { Html: { Data: input.html, Charset: 'UTF-8' } }
              : {}),
          },
        },
      })
    );
  } catch (err) {
    console.error('LỖI AWS SES CHI TIẾT:', err);
    throw err;
  }
}
