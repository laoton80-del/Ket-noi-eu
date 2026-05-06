'use strict';

require('dotenv').config();

const { sendOTPEmail } = require('./emailService.js');

/** Sandbox SES: chỉ gửi tới địa chỉ đã verify — dùng cùng địa chỉ người gửi để test. */
const SANDBOX_TEST_EMAIL = 'laoton80@gmail.com';

async function main() {
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  console.log('Sending OTP test to', SANDBOX_TEST_EMAIL, '...');
  await sendOTPEmail(SANDBOX_TEST_EMAIL, otp);
  console.log('OK — kiểm tra hộp thư (và thư mục Spam).');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
