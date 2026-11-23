import { z } from 'zod';

export const HOUSE_TYPE_VALUES = ['pucca', 'semi_pucca', 'kutcha', 'homeless'] as const;
export type HouseType = (typeof HOUSE_TYPE_VALUES)[number];

export const LAND_TYPE_VALUES = ['agricultural', 'residential', 'commercial', 'mixed'] as const;
export type LandType = (typeof LAND_TYPE_VALUES)[number];

export const assetProfileSchema = z.object({
  ownsTwoWheeler: z.boolean().default(false),
  twoWheelerCount: z
    .union([z.coerce.number().int().min(0).max(20), z.literal(''), z.null()])
    .transform((val) => (val === '' || val === null || val === undefined ? null : Number(val)))
    .nullable()
    .optional(),
  ownsFourWheeler: z.boolean().default(false),
  fourWheelerCount: z
    .union([z.coerce.number().int().min(0).max(20), z.literal(''), z.null()])
    .transform((val) => (val === '' || val === null || val === undefined ? null : Number(val)))
    .nullable()
    .optional(),
  ownsHouse: z.boolean().default(false),
  houseCount: z
    .union([z.coerce.number().int().min(0).max(20), z.literal(''), z.null()])
    .transform((val) => (val === '' || val === null || val === undefined ? null : Number(val)))
    .nullable()
    .optional(),
  houseType: z
    .union([z.enum(HOUSE_TYPE_VALUES), z.literal(''), z.null()])
    .transform((val) => (val === '' || val === null || val === undefined ? null : val))
    .nullable()
    .optional(),
  ownsLand: z.boolean().default(false),
  landAreaAcres: z
    .union([z.coerce.number().min(0).max(10000), z.literal(''), z.null()])
    .transform((val) => (val === '' || val === null || val === undefined ? null : Number(val)))
    .nullable()
    .optional(),
  landType: z
    .union([z.enum(LAND_TYPE_VALUES), z.literal(''), z.null()])
    .transform((val) => (val === '' || val === null || val === undefined ? null : val))
    .nullable()
    .optional(),
  ownsAgriculturalEquipment: z.boolean().default(false),
  agriculturalEquipmentDetails: z
    .string()
    .max(250, 'Details cannot exceed 250 characters')
    .nullable()
    .optional()
    .transform((val) => (val?.trim() ? val.trim() : null)),
  hasRefrigerator: z.boolean().default(false),
  hasAirConditioner: z.boolean().default(false),
  ownsCommercialProperty: z.boolean().default(false),
  hasKisanCreditCard: z.boolean().default(false),
  kccCreditLimitInr: z
    .union([z.coerce.number().int().min(0).max(10000000), z.literal(''), z.null()])
    .transform((val) => (val === '' || val === null || val === undefined ? null : Number(val)))
    .nullable()
    .optional(),
});

export type AssetProfileInput = z.input<typeof assetProfileSchema>;
export type AssetProfile = z.output<typeof assetProfileSchema>;

export const DEFAULT_ASSET_PROFILE: AssetProfile = {
  ownsTwoWheeler: false,
  twoWheelerCount: null,
  ownsFourWheeler: false,
  fourWheelerCount: null,
  ownsHouse: false,
  houseCount: null,
  houseType: null,
  ownsLand: false,
  landAreaAcres: null,
  landType: null,
  ownsAgriculturalEquipment: false,
  agriculturalEquipmentDetails: null,
  hasRefrigerator: false,
  hasAirConditioner: false,
  ownsCommercialProperty: false,
  hasKisanCreditCard: false,
  kccCreditLimitInr: null,
};
