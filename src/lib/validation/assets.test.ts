import { describe, it, expect } from 'vitest';
import { assetProfileSchema, DEFAULT_ASSET_PROFILE } from './assets';
import { compileCitizenFacts } from '@/domain/eligibility/facts';

describe('Asset Profile Schema & Fact Compilation', () => {
  it('parses default asset profile correctly', () => {
    const parsed = assetProfileSchema.parse(DEFAULT_ASSET_PROFILE);
    expect(parsed.ownsTwoWheeler).toBe(false);
    expect(parsed.ownsFourWheeler).toBe(false);
    expect(parsed.ownsHouse).toBe(false);
    expect(parsed.ownsLand).toBe(false);
    expect(parsed.hasRefrigerator).toBe(false);
    expect(parsed.hasAirConditioner).toBe(false);
  });

  it('validates and coerces vehicle, house, and land ownership inputs', () => {
    const input = {
      ownsTwoWheeler: true,
      twoWheelerCount: '2',
      ownsFourWheeler: true,
      fourWheelerCount: '1',
      ownsHouse: true,
      houseCount: '1',
      houseType: 'pucca',
      ownsLand: true,
      landAreaAcres: '2.5',
      landType: 'agricultural',
      ownsAgriculturalEquipment: true,
      agriculturalEquipmentDetails: '45 HP Tractor',
      hasRefrigerator: true,
      hasAirConditioner: false,
      ownsCommercialProperty: true,
      hasKisanCreditCard: true,
      kccCreditLimitInr: '75000',
    };

    const parsed = assetProfileSchema.parse(input);
    expect(parsed.ownsTwoWheeler).toBe(true);
    expect(parsed.twoWheelerCount).toBe(2);
    expect(parsed.ownsFourWheeler).toBe(true);
    expect(parsed.fourWheelerCount).toBe(1);
    expect(parsed.ownsHouse).toBe(true);
    expect(parsed.houseCount).toBe(1);
    expect(parsed.houseType).toBe('pucca');
    expect(parsed.ownsLand).toBe(true);
    expect(parsed.landAreaAcres).toBe(2.5);
    expect(parsed.landType).toBe('agricultural');
    expect(parsed.ownsAgriculturalEquipment).toBe(true);
    expect(parsed.agriculturalEquipmentDetails).toBe('45 HP Tractor');
    expect(parsed.hasRefrigerator).toBe(true);
    expect(parsed.hasAirConditioner).toBe(false);
    expect(parsed.ownsCommercialProperty).toBe(true);
    expect(parsed.hasKisanCreditCard).toBe(true);
    expect(parsed.kccCreditLimitInr).toBe(75000);
  });

  it('compiles asset facts correctly into FactDictionary', () => {
    const facts = compileCitizenFacts({
      assets: {
        owns_two_wheeler: true,
        two_wheeler_count: 2,
        owns_four_wheeler: false,
        owns_house: true,
        house_count: 1,
        house_type: 'pucca',
        owns_land: true,
        land_area_acres: 1.5,
        land_type: 'agricultural',
        owns_agricultural_equipment: true,
        agricultural_equipment_details: 'Power Tiller',
        has_refrigerator: true,
        has_air_conditioner: false,
        owns_commercial_property: false,
        has_kisan_credit_card: true,
        kcc_credit_limit_inr: 50000,
      },
    });

    expect(facts.owns_two_wheeler).toBe(true);
    expect(facts.two_wheeler_count).toBe(2);
    expect(facts.owns_four_wheeler).toBe(false);
    expect(facts.owns_house).toBe(true);
    expect(facts.house_count).toBe(1);
    expect(facts.house_type).toBe('pucca');
    expect(facts.has_pucca_house).toBe(true);
    expect(facts.is_homeless).toBe(false);
    expect(facts.owns_land).toBe(true);
    expect(facts.asset_land_area_acres).toBe(1.5);
    expect(facts.has_refrigerator).toBe(true);
    expect(facts.has_air_conditioner).toBe(false);
    expect(facts.has_kisan_credit_card).toBe(true);
    expect(facts.kcc_credit_limit_inr).toBe(50000);
  });
});
