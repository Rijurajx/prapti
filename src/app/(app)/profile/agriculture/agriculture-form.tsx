'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { saveAgriculturalProfile } from '@/app/profile/agriculture-actions';
import {
  agriculturalProfileSchema,
  type AgriculturalProfile,
  type AgriculturalProfileInput,
} from '@/lib/validation/agriculture';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusNotice } from '@/components/ui/status-notice';

const INPUT_CLASS =
  'h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';

const HELPER_CLASS = 'text-sm text-muted-foreground';
const ERROR_CLASS = 'text-sm text-destructive';

const OCCUPATION_OPTIONS = [
  { value: 'landowner', label: 'Landowner' },
  { value: 'tenant', label: 'Tenant' },
  { value: 'sharecropper', label: 'Sharecropper' },
  { value: 'cultivator', label: 'Cultivator' },
  { value: 'agricultural_labourer', label: 'Agricultural labourer' },
  { value: 'other', label: 'Other' },
] as const;

const UNIT_OPTIONS = [
  { value: 'acre', label: 'Acre' },
  { value: 'bigha', label: 'Bigha' },
  { value: 'katha', label: 'Katha' },
  { value: 'decimal', label: 'Decimal' },
  { value: 'hectare', label: 'Hectare' },
] as const;

const IRRIGATION_OPTIONS = [
  { value: 'available', label: 'Available' },
  { value: 'not_available', label: 'Not available' },
  { value: 'partial', label: 'Partly available' },
  { value: 'unsure', label: 'Not sure' },
] as const;

const CULTIVATION_OPTIONS = [
  { value: 'seasonal', label: 'Seasonal' },
  { value: 'year_round', label: 'Year-round' },
  { value: 'not_cultivating', label: 'Not cultivating at present' },
] as const;

type FormMessage = { tone: 'success' | 'error'; text: string } | null;

export function AgricultureForm({ initial }: { initial: AgriculturalProfile }) {
  const [message, setMessage] = useState<FormMessage>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AgriculturalProfileInput>({
    resolver: zodResolver(agriculturalProfileSchema, undefined, { raw: true }),
    defaultValues: {
      occupationTypes: initial.occupationTypes,
      landholdingArea: initial.landholdingArea ?? '',
      landholdingUnit: initial.landholdingUnit ?? '',
      landState: initial.landState ?? '',
      landDistrict: initial.landDistrict ?? '',
      crops: initial.crops ?? '',
      irrigation: initial.irrigation ?? '',
      cultivationPattern: initial.cultivationPattern ?? '',
    },
  });

  async function onSubmit(values: AgriculturalProfileInput) {
    setMessage(null);
    const result = await saveAgriculturalProfile(values);
    if (result.ok) {
      setMessage({ tone: 'success', text: 'Your agricultural details are saved.' });
    } else {
      setMessage({ tone: 'error', text: result.error });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agricultural details</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Your role on the land (select all that apply)</legend>
            {OCCUPATION_OPTIONS.map((option) => (
              <div key={option.value} className="flex items-center gap-2">
                <input
                  id={`occupation-${option.value}`}
                  type="checkbox"
                  value={option.value}
                  className="h-4 w-4 accent-primary"
                  {...register('occupationTypes')}
                />
                <label htmlFor={`occupation-${option.value}`} className="text-sm">
                  {option.label}
                </label>
              </div>
            ))}
            {errors.occupationTypes ? (
              <p role="alert" className={ERROR_CLASS}>
                {errors.occupationTypes.message}
              </p>
            ) : null}
          </fieldset>

          <div className="space-y-1.5">
            <label htmlFor="landholdingArea" className="text-sm font-medium">
              Landholding area
            </label>
            <input
              id="landholdingArea"
              type="number"
              min={0}
              step="any"
              className={INPUT_CLASS}
              aria-describedby="landholdingArea-help"
              {...register('landholdingArea')}
            />
            <p id="landholdingArea-help" className={HELPER_CLASS}>
              Enter the area you hold. Some schemes use their own legal definition of landholding.
            </p>
            {errors.landholdingArea ? (
              <p role="alert" className={ERROR_CLASS}>
                {errors.landholdingArea.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="landholdingUnit" className="text-sm font-medium">
              Unit
            </label>
            <select id="landholdingUnit" className={INPUT_CLASS} {...register('landholdingUnit')}>
              <option value="">Choose a unit</option>
              {UNIT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.landholdingUnit ? (
              <p role="alert" className={ERROR_CLASS}>
                {errors.landholdingUnit.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="landState" className="text-sm font-medium">
              State where the land is
            </label>
            <input
              id="landState"
              type="text"
              className={INPUT_CLASS}
              aria-describedby="landState-help"
              {...register('landState')}
            />
            <p id="landState-help" className={HELPER_CLASS}>
              Type it as it appears on your land records.
            </p>
            {errors.landState ? (
              <p role="alert" className={ERROR_CLASS}>
                {errors.landState.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="landDistrict" className="text-sm font-medium">
              District where the land is
            </label>
            <input id="landDistrict" type="text" className={INPUT_CLASS} {...register('landDistrict')} />
            {errors.landDistrict ? (
              <p role="alert" className={ERROR_CLASS}>
                {errors.landDistrict.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="crops" className="text-sm font-medium">
              Main crops
            </label>
            <input
              id="crops"
              type="text"
              className={INPUT_CLASS}
              aria-describedby="crops-help"
              {...register('crops')}
            />
            <p id="crops-help" className={HELPER_CLASS}>
              For example: rice, jute, vegetables. Optional.
            </p>
            {errors.crops ? (
              <p role="alert" className={ERROR_CLASS}>
                {errors.crops.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="irrigation" className="text-sm font-medium">
              Irrigation
            </label>
            <select id="irrigation" className={INPUT_CLASS} {...register('irrigation')}>
              <option value="">Not selected</option>
              {IRRIGATION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.irrigation ? (
              <p role="alert" className={ERROR_CLASS}>
                {errors.irrigation.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="cultivationPattern" className="text-sm font-medium">
              Cultivation pattern
            </label>
            <select
              id="cultivationPattern"
              className={INPUT_CLASS}
              {...register('cultivationPattern')}
            >
              <option value="">Not selected</option>
              {CULTIVATION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.cultivationPattern ? (
              <p role="alert" className={ERROR_CLASS}>
                {errors.cultivationPattern.message}
              </p>
            ) : null}
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save agricultural details'}
          </Button>

          {message ? (
            message.tone === 'error' ? (
              <StatusNotice tone="danger" title="Your details were not saved">
                {message.text}
              </StatusNotice>
            ) : (
              <p role="status" className="text-sm text-muted-foreground">
                {message.text}
              </p>
            )
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
