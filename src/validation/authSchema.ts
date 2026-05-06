import { z } from 'zod';

/** Email chuẩn hoá (trim + lowercase) — dùng cho OTP và đăng ký. */
export const emailFieldSchema = z
  .string()
  .trim()
  .min(3, 'Email quá ngắn')
  .max(254, 'Email quá dài')
  .email('Email không hợp lệ')
  .transform((s) => s.toLowerCase());

/** Mã OTP số 6 chữ (khớp EmailOtpService / verify). */
export const otpCodeFieldSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'Mã OTP phải gồm đúng 6 chữ số');

/**
 * Mật khẩu / secret dạng chuỗi (đăng ký, đổi mật khẩu — dùng lại khi có route).
 * Không chứa khoảng trắng đầu/cuối; độ dài tối thiểu 8.
 */
/** Không `.trim()` — tránh đổi nội dung mật khẩu so với ý người dùng. */
export const passwordFieldSchema = z
  .string()
  .min(8, 'Mật khẩu tối thiểu 8 ký tự')
  .max(256, 'Mật khẩu quá dài');

/** POST /api/auth/login — khớp AuthController + AuthService (PIN tối thiểu 6). */
export const postLoginBodySchema = z.object({
  phoneNumber: z.string().trim().min(8, 'Số điện thoại không hợp lệ').max(32, 'Số điện thoại quá dài'),
  pinCode: z.string().min(6, 'Mã PIN tối thiểu 6 ký tự').max(32, 'Mã PIN quá dài'),
});

/** POST /api/auth/email/otp/request */
export const postEmailOtpRequestBodySchema = z.object({
  email: emailFieldSchema,
});

/** POST /api/auth/email/otp/verify */
export const postEmailOtpVerifyBodySchema = z.object({
  email: emailFieldSchema,
  code: otpCodeFieldSchema,
});

export type PostLoginBody = z.infer<typeof postLoginBodySchema>;
export type PostEmailOtpRequestBody = z.infer<typeof postEmailOtpRequestBodySchema>;
export type PostEmailOtpVerifyBody = z.infer<typeof postEmailOtpVerifyBodySchema>;
