import { z } from 'zod';

export const INCOME_RANGE_VALUES = [
  'below_1_lakh',
  '1_to_3_lakh',
  '3_to_5_lakh',
  '5_to_8_lakh',
  'above_8_lakh',
] as const;
export type IncomeRange = (typeof INCOME_RANGE_VALUES)[number];

export const INCOME_SOURCE_VALUES = [
  'salary',
  'self_employment',
  'agriculture',
  'daily_wage',
  'pension',
  'family_support',
  'other',
  'none',
] as const;
export type IncomeSource = (typeof INCOME_SOURCE_VALUES)[number];

export const EMPLOYMENT_STATUS_VALUES = [
  'employed',
  'unemployed',
  'self_employed',
  'student',
  'retired',
  'homemaker',
  'agricultural_worker',
  'daily_wage_worker',
  'other',
] as const;
export type EmploymentStatus = (typeof EMPLOYMENT_STATUS_VALUES)[number];

export const EDUCATION_LEVEL_VALUES = [
  'class_10',
  'class_12',
  'diploma',
  'undergraduate',
  'postgraduate',
  'doctoral',
  'other',
] as const;
export type EducationLevel = (typeof EDUCATION_LEVEL_VALUES)[number];

export const EDUCATION_STREAM_VALUES = [
  'science',
  'commerce',
  'arts_humanities',
  'vocational',
  'other',
] as const;
export type EducationStream = (typeof EDUCATION_STREAM_VALUES)[number];

export const MARKING_SCALE_VALUES = ['percentage', 'cgpa', 'grade', 'marks'] as const;
export type MarkingScale = (typeof MARKING_SCALE_VALUES)[number];

export const DOCUMENT_STATUS_VALUES = [
  'available',
  'not_available',
  'applied_for',
  'expired',
  'unsure',
  'not_applicable',
] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUS_VALUES)[number];

/** Turns a blank (empty or whitespace-only) string into null; otherwise returns it unchanged. */
function blankToNull(v: string): string | null {
  return v.trim() === '' ? null : v;
}

/** Trimmed text, max length; blank becomes null. */
function trimmedText(max: number) {
  return z
    .string()
    .trim()
    .max(max)
    .transform((v) => blankToNull(v));
}

/** Blank string or a value matching the schema; blank becomes null. */
function optionalNumber(schema: z.ZodNumber) {
  return z
    .union([z.literal(''), schema])
    .transform((v) => (v === '' ? null : v));
}

/** Blank string or one of the enum values; blank becomes null. */
function optionalEnum<T extends readonly [string, ...string[]]>(values: T) {
  return z
    .union([z.literal(''), z.enum(values)])
    .transform((v) => (v === '' ? null : v));
}

const FINANCIAL_YEAR_PATTERN = /^\d{4}-\d{2}$/;

function isConsecutiveFinancialYear(v: string): boolean {
  const first = Number(v.slice(0, 4));
  const second = Number(v.slice(5, 7));
  return (first + 1) % 100 === second;
}

// 1. Financial profile

export const financialProfileSchema = z
  .object({
    annualIncomeInr: optionalNumber(
      z.coerce.number().int().min(0).max(100000000),
    ),
    familyAnnualIncomeInr: optionalNumber(
      z.coerce.number().int().min(0).max(100000000),
    ),
    incomeRange: optionalEnum(INCOME_RANGE_VALUES),
    incomeUnknown: z.boolean(),
    financialYear: z
      .string()
      .trim()
      .refine(
        (v) =>
          v === '' ||
          (FINANCIAL_YEAR_PATTERN.test(v) && isConsecutiveFinancialYear(v)),
        { message: 'Use a financial year such as 2024-25' },
      )
      .transform((v) => blankToNull(v)),
    incomeSource: optionalEnum(INCOME_SOURCE_VALUES),
  })
  .refine(
    (v) =>
      !(
        v.incomeUnknown &&
        (v.annualIncomeInr !== null || v.familyAnnualIncomeInr !== null)
      ),
    {
      message:
        'Leave the income amounts empty if you have marked income as unknown',
      path: ['incomeUnknown'],
    },
  );

export type FinancialProfileInput = z.input<typeof financialProfileSchema>;
export type FinancialProfile = z.output<typeof financialProfileSchema>;

// 2. Employment profile

export const employmentProfileSchema = z.object({
  statuses: z.array(z.enum(EMPLOYMENT_STATUS_VALUES)).max(9).default([]),
  sector: trimmedText(100),
  employmentRegistered: z
    .union([z.literal(''), z.literal('yes'), z.literal('no')])
    .transform((v) => (v === 'yes' ? true : v === 'no' ? false : null)),
  unemploymentMonths: optionalNumber(
    z.coerce.number().int().min(0).max(600),
  ),
  skills: trimmedText(500),
});

export type EmploymentProfileInput = z.input<typeof employmentProfileSchema>;
export type EmploymentProfile = z.output<typeof employmentProfileSchema>;

// 3. Education records

export const educationRecordSchema = z
  .object({
    id: z.string().uuid().optional(),
    level: z.enum(EDUCATION_LEVEL_VALUES),
    boardOrUniversity: trimmedText(150),
    institution: trimmedText(200),
    stream: optionalEnum(EDUCATION_STREAM_VALUES),
    programme: trimmedText(150),
    passingYear: optionalNumber(z.coerce.number().int().min(1950).max(2100)),
    isCurrentlyPursuing: z.boolean(),
    currentYearOrSemester: trimmedText(40),
    markingScale: optionalEnum(MARKING_SCALE_VALUES),
    obtainedMarks: optionalNumber(z.coerce.number().min(0)),
    maximumMarks: optionalNumber(z.coerce.number().gt(0)),
    percentage: optionalNumber(z.coerce.number().min(0).max(100)),
    cgpa: optionalNumber(z.coerce.number().min(0).max(10)),
    marksheetAvailable: optionalEnum(DOCUMENT_STATUS_VALUES),
    passCertificateAvailable: optionalEnum(DOCUMENT_STATUS_VALUES),
    semesterResults: z
      .array(
        z.object({
          semesterNumber: z.coerce.number().int().min(1).max(20),
          sgpa: optionalNumber(z.coerce.number().min(0).max(10)),
        }),
      )
      .max(20)
      .default([]),
  })
  .refine(
    (v) =>
      v.obtainedMarks === null ||
      v.maximumMarks === null ||
      v.obtainedMarks <= v.maximumMarks,
    {
      message: 'Obtained marks cannot be more than maximum marks',
      path: ['obtainedMarks'],
    },
  )
  .refine(
    (v) =>
      new Set(v.semesterResults.map((r) => r.semesterNumber)).size ===
      v.semesterResults.length,
    {
      message: 'Each semester can appear only once',
      path: ['semesterResults'],
    },
  );

export type EducationRecordInput = z.input<typeof educationRecordSchema>;
export type EducationRecord = z.output<typeof educationRecordSchema>;

// 4. Document status

export const documentStatusSchema = z.object({
  documentCode: z
    .string()
    .regex(/^[a-z0-9_]+$/)
    .max(60),
  status: z.enum(DOCUMENT_STATUS_VALUES),
  note: trimmedText(200),
});

export type DocumentStatusInput = z.input<typeof documentStatusSchema>;
export type DocumentStatusRecord = z.output<typeof documentStatusSchema>;
