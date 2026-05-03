'use strict';

/**
 * Gọi tuần tự 4 lần POST /api/auth/email/otp/request để kiểm tra giới hạn theo email (3 / 10 phút → lần 4: 429).
 *
 * Chạy khi API đã bật: npm run api:dev
 *
 * Tuỳ chọn: OTP_RATE_TEST_BASE=http://127.0.0.1:8787 node testOtpRateLimit.js
 */

const BASE = (process.env.OTP_RATE_TEST_BASE || 'http://localhost:8787').replace(/\/+$/, '');
const URL = `${BASE}/api/auth/email/otp/request`;
const EMAIL = 'laoton80@gmail.com';

async function oneRequest(index) {
  const res = await fetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email: EMAIL }),
  });
  const text = await res.text();
  let bodyPreview = text;
  try {
    const j = JSON.parse(text);
    bodyPreview = JSON.stringify(j, null, 2);
  } catch {
    /* giữ raw */
  }
  console.log(`--- Lần ${index} ---`);
  console.log('Status:', res.status, res.statusText);
  console.log('Body:', bodyPreview);
  console.log('');
  return res.status;
}

async function main() {
  console.log('POST', URL);
  console.log('Body mẫu:', JSON.stringify({ email: EMAIL }));
  console.log('');

  for (let i = 1; i <= 4; i += 1) {
    try {
      await oneRequest(i);
    } catch (e) {
      console.log(`--- Lần ${i} (lỗi mạng) ---`);
      console.error(e);
      console.log('');
    }
  }

  console.log('Kỳ vọng: 200 (3 lần đầu, nếu SES + JWT + DB OK) → 429 lần 4 (rate limit theo email).');
  console.log('Nếu 503: chưa cấu hình SES / email trên server.');
}

void main();
