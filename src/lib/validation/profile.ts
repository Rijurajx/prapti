import { z } from 'zod';

export const GENDER_VALUES = ['female', 'male', 'other', 'prefer_not_to_say'] as const;
export type Gender = (typeof GENDER_VALUES)[number];

export const MARITAL_STATUS_VALUES = [
  'never_married',
  'married',
  'widowed',
  'divorced',
  'separated',
  'prefer_not_to_say',
] as const;
export type MaritalStatus = (typeof MARITAL_STATUS_VALUES)[number];

export const ADDRESS_KIND_VALUES = ['current', 'permanent'] as const;
export type AddressKind = (typeof ADDRESS_KIND_VALUES)[number];

export const AREA_TYPE_VALUES = ['urban', 'rural'] as const;
export type AreaType = (typeof AREA_TYPE_VALUES)[number];

/** True when the YYYY-MM-DD string is a real calendar date (no rollover such as 2023-02-30). */
function isRealDate(v: string): boolean {
  const [year, month, day] = v.split('-').map(Number);
  if (year === undefined || month === undefined || day === undefined) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/** True when the YYYY-MM-DD string is between 1900-01-01 and today (inclusive). */
function isPlausibleDob(v: string): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return v >= '1900-01-01' && v <= today;
}

export const personalDetailsSchema = z.object({
  dateOfBirth: z
    .union([z.literal(''), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the format YYYY-MM-DD')])
    .transform((v) => (v === '' ? null : v))
    .refine((v) => v === null || isRealDate(v), 'Enter a valid date')
    .refine(
      (v) => v === null || isPlausibleDob(v),
      'Date of birth must be between 1900 and today',
    ),
  gender: z.union([z.literal(''), z.enum(GENDER_VALUES)]).transform((v) => (v === '' ? null : v)),
  maritalStatus: z
    .union([z.literal(''), z.enum(MARITAL_STATUS_VALUES)])
    .transform((v) => (v === '' ? null : v)),
});
export type PersonalDetailsInput = z.input<typeof personalDetailsSchema>;
export type PersonalDetails = z.output<typeof personalDetailsSchema>;

export const addressSchema = z.object({
  kind: z.enum(ADDRESS_KIND_VALUES),
  state: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((v) => (v ? v : null)),
  district: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((v) => (v ? v : null)),
  villageOrTown: z
    .string()
    .trim()
    .max(150)
    .optional()
    .transform((v) => (v ? v : null)),
  areaType: z
    .union([z.literal(''), z.enum(AREA_TYPE_VALUES)])
    .optional()
    .transform((v) => (v ? v : null)),
  pinCode: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || /^[1-9][0-9]{5}$/.test(v), 'PIN code must be six digits and cannot start with 0'),
  // Comes from a checkbox. null means not answered.
  domicileConfirmed: z.boolean().nullable(),
});
export type AddressInput = z.input<typeof addressSchema>;
export type Address = z.output<typeof addressSchema>;
