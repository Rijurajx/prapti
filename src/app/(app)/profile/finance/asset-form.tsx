'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import {
  assetProfileSchema,
  type AssetProfileInput,
  type AssetProfile,
  HOUSE_TYPE_VALUES,
  LAND_TYPE_VALUES,
} from '@/lib/validation/assets';
import { saveAssetProfile } from '@/app/profile/asset-actions';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { StatusNotice } from '@/components/ui/status-notice';
import { Car, Home, Layers, Sparkles, Tractor, CheckCircle2 } from 'lucide-react';

const inputClass =
  'h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary font-mono';
const selectClass =
  'h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary font-mono pr-8';
const checkboxClass = 'h-4 w-4 accent-primary rounded cursor-pointer';

interface AssetFormProps {
  initial: AssetProfile;
}

export function AssetForm({ initial }: AssetFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AssetProfileInput>({
    resolver: zodResolver(assetProfileSchema, undefined, { raw: true }),
    defaultValues: {
      ownsTwoWheeler: initial.ownsTwoWheeler,
      twoWheelerCount: initial.twoWheelerCount ?? (initial.ownsTwoWheeler ? 1 : ''),
      ownsFourWheeler: initial.ownsFourWheeler,
      fourWheelerCount: initial.fourWheelerCount ?? (initial.ownsFourWheeler ? 1 : ''),
      ownsHouse: initial.ownsHouse,
      houseCount: initial.houseCount ?? (initial.ownsHouse ? 1 : ''),
      houseType: initial.houseType ?? '',
      ownsLand: initial.ownsLand,
      landAreaAcres: initial.landAreaAcres ?? '',
      landType: initial.landType ?? '',
      ownsAgriculturalEquipment: initial.ownsAgriculturalEquipment,
      agriculturalEquipmentDetails: initial.agriculturalEquipmentDetails ?? '',
      hasRefrigerator: initial.hasRefrigerator,
      hasAirConditioner: initial.hasAirConditioner,
      ownsCommercialProperty: initial.ownsCommercialProperty,
      hasKisanCreditCard: initial.hasKisanCreditCard,
      kccCreditLimitInr: initial.kccCreditLimitInr ?? '',
    },
  });

  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const ownsTwoWheeler = watch('ownsTwoWheeler');
  const ownsFourWheeler = watch('ownsFourWheeler');
  const ownsHouse = watch('ownsHouse');
  const ownsLand = watch('ownsLand');
  const ownsAgriculturalEquipment = watch('ownsAgriculturalEquipment');
  const hasKisanCreditCard = watch('hasKisanCreditCard');

  async function onSubmit(values: AssetProfileInput) {
    setMessage(null);
    const result = await saveAssetProfile(values);
    if (result.ok) {
      setMessage({ tone: 'success', text: 'Asset and property details saved successfully.' });
    } else {
      setMessage({ tone: 'error', text: result.error });
    }
  }

  return (
    <Card className="border border-border">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              Owned Assets & Property Profile
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Vehicle, housing, landholdings, and SECC welfare criteria. Informs schemes like PMAY, NFSA, and PM-KISAN.
            </p>
          </div>
          <span className="hidden sm:inline-flex text-[10px] font-mono font-bold uppercase tracking-wider bg-muted px-2 py-0.5 rounded border border-border">
            {'//'} SECC_CRITERIA
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-5">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Section 1: Vehicles */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
              <Car className="h-4 w-4" />
              <span>1. Motorized Vehicles</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-lg border border-border/80 p-3.5 bg-card/40">
              {/* 2-Wheeler */}
              <div className="space-y-2">
                <div className="flex items-start gap-2.5">
                  <input
                    id="ownsTwoWheeler"
                    type="checkbox"
                    className={checkboxClass}
                    {...register('ownsTwoWheeler')}
                  />
                  <div>
                    <label htmlFor="ownsTwoWheeler" className="text-sm font-medium cursor-pointer">
                      Motorized 2-Wheeler
                    </label>
                    <p className="text-xs text-muted-foreground">Motorcycle, scooter, or moped</p>
                  </div>
                </div>

                {ownsTwoWheeler && (
                  <div className="pl-6 space-y-1">
                    <label htmlFor="twoWheelerCount" className="block text-xs font-mono text-muted-foreground">
                      Number of 2-wheelers:
                    </label>
                    <input
                      id="twoWheelerCount"
                      type="number"
                      min={1}
                      max={20}
                      className={inputClass}
                      placeholder="e.g. 1"
                      {...register('twoWheelerCount')}
                    />
                  </div>
                )}
              </div>

              {/* 4-Wheeler */}
              <div className="space-y-2">
                <div className="flex items-start gap-2.5">
                  <input
                    id="ownsFourWheeler"
                    type="checkbox"
                    className={checkboxClass}
                    {...register('ownsFourWheeler')}
                  />
                  <div>
                    <label htmlFor="ownsFourWheeler" className="text-sm font-medium cursor-pointer">
                      Motorized 4-Wheeler
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Car, jeep, or van (often an exclusion under BPL/NFSA)
                    </p>
                  </div>
                </div>

                {ownsFourWheeler && (
                  <div className="pl-6 space-y-1">
                    <label htmlFor="fourWheelerCount" className="block text-xs font-mono text-muted-foreground">
                      Number of 4-wheelers:
                    </label>
                    <input
                      id="fourWheelerCount"
                      type="number"
                      min={1}
                      max={20}
                      className={inputClass}
                      placeholder="e.g. 1"
                      {...register('fourWheelerCount')}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Housing & Residential Property */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
              <Home className="h-4 w-4" />
              <span>2. Housing & Residential Property</span>
            </div>

            <div className="rounded-lg border border-border/80 p-3.5 bg-card/40 space-y-3">
              <div className="flex items-start gap-2.5">
                <input
                  id="ownsHouse"
                  type="checkbox"
                  className={checkboxClass}
                  {...register('ownsHouse')}
                />
                <div>
                  <label htmlFor="ownsHouse" className="text-sm font-medium cursor-pointer">
                    Owns a Residential House
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Important for Pradhan Mantri Awas Yojana (PMAY) where pucca house owners are generally excluded
                  </p>
                </div>
              </div>

              {ownsHouse && (
                <div className="pl-6 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-border/60">
                  <div className="space-y-1">
                    <label htmlFor="houseCount" className="block text-xs font-mono text-muted-foreground">
                      Number of houses owned:
                    </label>
                    <input
                      id="houseCount"
                      type="number"
                      min={1}
                      max={20}
                      className={inputClass}
                      placeholder="e.g. 1"
                      {...register('houseCount')}
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="houseType" className="block text-xs font-mono text-muted-foreground">
                      House Construction Type:
                    </label>
                    <select id="houseType" className={selectClass} {...register('houseType')}>
                      <option value="">Not selected</option>
                      <option value="pucca">Pucca (Brick/Concrete roof & walls)</option>
                      <option value="semi_pucca">Semi-Pucca (Brick walls, tin/asbestos roof)</option>
                      <option value="kutcha">Kutcha (Mud/Thatch/Bamboo walls & roof)</option>
                      <option value="homeless">Houseless / Homeless</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Landholdings */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
              <Layers className="h-4 w-4" />
              <span>3. Landholdings (Optional)</span>
            </div>

            <div className="rounded-lg border border-border/80 p-3.5 bg-card/40 space-y-3">
              <div className="flex items-start gap-2.5">
                <input
                  id="ownsLand"
                  type="checkbox"
                  className={checkboxClass}
                  {...register('ownsLand')}
                />
                <div>
                  <label htmlFor="ownsLand" className="text-sm font-medium cursor-pointer">
                    Owns Land Property
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Agricultural, residential, or commercial land title
                  </p>
                </div>
              </div>

              {ownsLand && (
                <div className="pl-6 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-border/60">
                  <div className="space-y-1">
                    <label htmlFor="landAreaAcres" className="block text-xs font-mono text-muted-foreground">
                      Total Land Area (Acres, optional):
                    </label>
                    <input
                      id="landAreaAcres"
                      type="number"
                      step="0.01"
                      min={0}
                      className={inputClass}
                      placeholder="e.g. 1.5"
                      {...register('landAreaAcres')}
                    />
                    <p className="text-[11px] text-muted-foreground">Optional acreage estimation</p>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="landType" className="block text-xs font-mono text-muted-foreground">
                      Primary Land Type:
                    </label>
                    <select id="landType" className={selectClass} {...register('landType')}>
                      <option value="">Not selected</option>
                      <option value="agricultural">Agricultural / Cultivable</option>
                      <option value="residential">Residential Homestead</option>
                      <option value="commercial">Commercial / Industrial</option>
                      <option value="mixed">Mixed use</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Farm Equipment & Enterprises */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
              <Tractor className="h-4 w-4" />
              <span>4. Farm Equipment & Enterprise</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-lg border border-border/80 p-3.5 bg-card/40">
              <div className="space-y-2">
                <div className="flex items-start gap-2.5">
                  <input
                    id="ownsAgriculturalEquipment"
                    type="checkbox"
                    className={checkboxClass}
                    {...register('ownsAgriculturalEquipment')}
                  />
                  <div>
                    <label htmlFor="ownsAgriculturalEquipment" className="text-sm font-medium cursor-pointer">
                      Mechanized Farm Equipment
                    </label>
                    <p className="text-xs text-muted-foreground">Tractor, power tiller, harvester</p>
                  </div>
                </div>

                {ownsAgriculturalEquipment && (
                  <div className="pl-6 space-y-1">
                    <label htmlFor="agriculturalEquipmentDetails" className="block text-xs font-mono text-muted-foreground">
                      Equipment Details:
                    </label>
                    <input
                      id="agriculturalEquipmentDetails"
                      type="text"
                      className={inputClass}
                      placeholder="e.g. 45 HP Tractor"
                      {...register('agriculturalEquipmentDetails')}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-2.5">
                  <input
                    id="ownsCommercialProperty"
                    type="checkbox"
                    className={checkboxClass}
                    {...register('ownsCommercialProperty')}
                  />
                  <div>
                    <label htmlFor="ownsCommercialProperty" className="text-sm font-medium cursor-pointer">
                      Commercial Property / Shop
                    </label>
                    <p className="text-xs text-muted-foreground">Owns registered shop or commercial godown</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: SECC Socio-Economic Indicators */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
              <Sparkles className="h-4 w-4" />
              <span>5. SECC Welfare & Household Indicators</span>
            </div>

            <div className="rounded-lg border border-border/80 p-3.5 bg-card/40 space-y-3">
              <p className="text-xs text-muted-foreground mb-2">
                Standard Socio-Economic and Caste Census (SECC) exclusion criteria used by central and state schemes:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2.5">
                  <input
                    id="hasRefrigerator"
                    type="checkbox"
                    className={checkboxClass}
                    {...register('hasRefrigerator')}
                  />
                  <label htmlFor="hasRefrigerator" className="text-sm cursor-pointer">
                    Owns Refrigerator
                  </label>
                </div>

                <div className="flex items-center gap-2.5">
                  <input
                    id="hasAirConditioner"
                    type="checkbox"
                    className={checkboxClass}
                    {...register('hasAirConditioner')}
                  />
                  <label htmlFor="hasAirConditioner" className="text-sm cursor-pointer">
                    Owns Air Conditioner (AC)
                  </label>
                </div>
              </div>

              <div className="pt-2 border-t border-border/60 space-y-2">
                <div className="flex items-start gap-2.5">
                  <input
                    id="hasKisanCreditCard"
                    type="checkbox"
                    className={checkboxClass}
                    {...register('hasKisanCreditCard')}
                  />
                  <div>
                    <label htmlFor="hasKisanCreditCard" className="text-sm font-medium cursor-pointer">
                      Has Kisan Credit Card (KCC)
                    </label>
                    <p className="text-xs text-muted-foreground">Credit limit above ₹50,000 is an exclusion under certain schemes</p>
                  </div>
                </div>

                {hasKisanCreditCard && (
                  <div className="pl-6 space-y-1 max-w-sm">
                    <label htmlFor="kccCreditLimitInr" className="block text-xs font-mono text-muted-foreground">
                      KCC Credit Limit (₹):
                    </label>
                    <input
                      id="kccCreditLimitInr"
                      type="number"
                      min={0}
                      step="1000"
                      className={inputClass}
                      placeholder="e.g. 50000"
                      {...register('kccCreditLimitInr')}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Feedback messages */}
          {message?.tone === 'error' && (
            <StatusNotice tone="danger" title="Your asset details could not be saved">
              {message.text}
            </StatusNotice>
          )}

          {message?.tone === 'success' && (
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 p-2.5 rounded border border-emerald-300 dark:border-emerald-800">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{message.text}</span>
            </div>
          )}

          {/* Save Button */}
          <div className="pt-2">
            <Button type="submit" disabled={isSubmitting} className="font-mono text-xs font-bold uppercase tracking-wider">
              {isSubmitting ? 'Saving Assets...' : 'Save Asset Profile'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
