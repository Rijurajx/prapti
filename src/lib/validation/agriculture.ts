import { z } from 'zod';

export const OCCUPATION_TYPE_VALUES = [
  'landowner',
  'tenant',
  'sharecropper',
  'cultivator',
  'agricultural_labourer',
  'other',
] as const;
export type OccupationType = (typeof OCCUPATION_TYPE_VALUES)[number];

export const LANDHOLDING_UNIT_VALUES = ['acre', 'bigha', 'katha', 'decimal', 'hectare'] as const;
export type LandholdingUnit = (typeof LANDHOLDING_UNIT_VALUES)[number];

export const IRRIGATION_VALUES = ['available', 'not_available', 'partial', 'unsure'] as const;
export type Irrigation = (typeof IRRIGATION_VALUES)[number];

export const CULTIVATION_PATTERN_VALUES = ['seasonal', 'year_round', 'not_cultivating'] as const;
export type CultivationPattern = (typeof CULTIVATION_PATTERN_VALUES)[number];

function blankToNull(value: string): string | null {
  const t = value.trim();
  return t === '' ? null : t;
}

export const agriculturalProfileSchema = z
  .object({
    occupationTypes: z.array(z.enum(OCCUPATION_TYPE_VALUES)).max(6).default([]),
    landholdingArea: z
      .union([z.literal(''), z.coerce.number().min(0).max(1000000)])
      .transform((v) => (v === '' ? null : v)),
    landholdingUnit: z
      .union([z.literal(''), z.enum(LANDHOLDING_UNIT_VALUES)])
      .transform((v) => (v === '' ? null : v)),
    landState: z.string().max(100).transform(blankToNull),
    landDistrict: z.string().max(100).transform(blankToNull),
    crops: z.string().max(300).transform(blankToNull),
    irrigation: z
      .union([z.literal(''), z.enum(IRRIGATION_VALUES)])
      .transform((v) => (v === '' ? null : v)),
    cultivationPattern: z
      .union([z.literal(''), z.enum(CULTIVATION_PATTERN_VALUES)])
      .transform((v) => (v === '' ? null : v)),
  })
  .refine((v) => v.landholdingArea === null || v.landholdingUnit !== null, {
    message: 'Choose a unit for the landholding area',
    path: ['landholdingUnit'],
  });

export type AgriculturalProfileInput = z.input<typeof agriculturalProfileSchema>;
export type AgriculturalProfile = z.output<typeof agriculturalProfileSchema>;
