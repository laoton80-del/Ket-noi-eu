import { z } from 'zod';

const INDUSTRY_ENUM = z.enum(['Nail salon', 'Spa', 'Restaurant', 'Barber', 'Other']);
const DESIRED_AUTOMATION_ENUM = z.enum([
  'Intake only',
  'Booking request',
  'Auto booking later',
  'Multi-language support',
]);

const optionalTrimmedString = z
  .string()
  .trim()
  .max(300, 'Field is too long')
  .optional()
  .transform((value) => {
    if (!value) return undefined;
    return value;
  });

const contactPhoneSchema = z
  .string()
  .trim()
  .min(6, 'contactPhone is too short')
  .max(32, 'contactPhone is too long')
  .optional()
  .transform((value) => {
    if (!value) return undefined;
    return value;
  });

const contactEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('contactEmail is invalid')
  .max(254, 'contactEmail is too long')
  .optional()
  .transform((value) => {
    if (!value) return undefined;
    return value;
  });

const missedCallsSchema = z.union([
  z
    .number()
    .int('estimatedMissedCallsPerDay must be an integer')
    .min(0, 'estimatedMissedCallsPerDay must be >= 0')
    .max(2000, 'estimatedMissedCallsPerDay is too large'),
  z
    .string()
    .trim()
    .regex(/^\d{1,4}$/, 'estimatedMissedCallsPerDay must be a safe numeric string')
    .transform((value) => Number(value))
    .refine((value) => value >= 0 && value <= 2000, {
      message: 'estimatedMissedCallsPerDay must be between 0 and 2000',
    }),
]);

export const postAiReceptionistLeadEmailBodySchema = z
  .object({
    businessName: z.string().trim().min(1, 'businessName is required').max(160, 'businessName is too long'),
    industry: INDUSTRY_ENUM,
    city: z.string().trim().max(120, 'city is too long').default(''),
    country: z.string().trim().max(120, 'country is too long').default(''),
    contactName: z.string().trim().max(160, 'contactName is too long').default(''),
    contactPhone: contactPhoneSchema,
    contactEmail: contactEmailSchema,
    languagesNeeded: z.string().trim().max(300, 'languagesNeeded is too long').default(''),
    estimatedMissedCallsPerDay: missedCallsSchema,
    desiredAutomation: z.array(DESIRED_AUTOMATION_ENUM).max(4, 'desiredAutomation has too many items').default([]),
    preferredPilotDate: optionalTrimmedString,
    notes: z
      .string()
      .trim()
      .max(1500, 'notes is too long')
      .optional()
      .transform((value) => {
        if (!value) return undefined;
        return value;
      }),
    consentAccepted: z.literal(true, { message: 'consentAccepted must be true' }),
  })
  .strict()
  .superRefine((body, ctx) => {
    if (!body.contactPhone && !body.contactEmail) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['contactPhone'],
        message: 'At least one of contactPhone or contactEmail is required',
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['contactEmail'],
        message: 'At least one of contactPhone or contactEmail is required',
      });
    }
  });

export type PostAiReceptionistLeadEmailBody = z.infer<typeof postAiReceptionistLeadEmailBodySchema>;

