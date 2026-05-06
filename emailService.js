'use strict';

const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

/**
 * @param {string} toEmail
 * @param {string} otpCode
 * @returns {Promise<void>}
 */
async function sendOTPEmail(toEmail, otpCode) {
  const region = (process.env.AWS_REGION || 'eu-north-1').trim();
  const source =
    (process.env.AWS_SES_SENDER_EMAIL || process.env.SES_FROM_EMAIL || process.env.MAIL_FROM || '').trim();
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();

  if (!toEmail || typeof toEmail !== 'string') {
    throw new TypeError('toEmail is required');
  }
  if (!otpCode || typeof otpCode !== 'string') {
    throw new TypeError('otpCode is required');
  }
  if (!source) {
    throw new Error('Missing sender: set AWS_SES_SENDER_EMAIL (or SES_FROM_EMAIL / MAIL_FROM)');
  }
  if (!accessKeyId || !secretAccessKey) {
    throw new Error('Missing AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY');
  }

  const client = new SESClient({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });

  const safeOtp = String(otpCode).replace(/[<>&]/g, '');
  const subject = 'ViGlobal — Mã xác thực (OTP) của bạn';

  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f8;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f6f8;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:480px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.08);">
          <tr>
            <td style="padding:28px 32px 8px 32px;">
              <p style="margin:0;font-size:13px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#0f766e;">ViGlobal</p>
              <h1 style="margin:12px 0 0 0;font-size:22px;font-weight:600;color:#0f172a;line-height:1.3;">Mã xác thực đăng nhập</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 24px 32px;">
              <p style="margin:0;font-size:15px;color:#334155;line-height:1.6;">Dùng mã dưới đây để hoàn tất bước xác thực. Mã có hiệu lực trong thời gian ngắn theo cài đặt ứng dụng của bạn.</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 32px 28px 32px;">
              <div style="display:inline-block;padding:16px 28px;border-radius:10px;background:linear-gradient(135deg,#0d9488 0%,#0f766e 100%);">
                <span style="font-size:28px;font-weight:700;letter-spacing:0.35em;color:#ffffff;font-family:ui-monospace,'Cascadia Code',Consolas,monospace;">${safeOtp}</span>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 28px 32px;">
              <p style="margin:0;font-size:13px;color:#64748b;line-height:1.5;">Nếu bạn không yêu cầu mã này, hãy bỏ qua email hoặc liên hệ hỗ trợ ViGlobal.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px;border-top:1px solid #e2e8f0;background:#f8fafc;">
              <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">© ViGlobal — Kết nối hành trình của bạn.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    'ViGlobal — Mã xác thực',
    '',
    `Mã OTP của bạn: ${safeOtp}`,
    '',
    'Nếu bạn không yêu cầu mã này, hãy bỏ qua email này.',
  ].join('\n');

  await client.send(
    new SendEmailCommand({
      Source: source,
      Destination: { ToAddresses: [toEmail.trim()] },
      Message: {
        Subject: { Data: subject, Charset: 'UTF-8' },
        Body: {
          Html: { Data: html, Charset: 'UTF-8' },
          Text: { Data: text, Charset: 'UTF-8' },
        },
      },
    })
  );
}

module.exports = { sendOTPEmail };
