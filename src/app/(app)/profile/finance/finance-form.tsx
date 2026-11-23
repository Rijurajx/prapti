'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import {
  financialProfileSchema,
  type FinancialProfileInput,
  type FinancialProfile,
} from '@/lib/validation/finance-education-documents';
import { saveFinancialProfile } from '@/app/profile/records-actions';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { StatusNotice } from '@/components/ui/status-notice';

const inputClass =
  'h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';
const checkboxClass = 'h-4 w-4 accent-primary';

const incomeRangeOptions: { value: string; label: string }[] = [
  { value: '', label: 'Not sure or not selected' },
  { value: 'below_1_lakh', label: 'Below ₹1 lakh' },
  { value: '1_to_3_lakh', label: '₹1 to 3 lakh' },
  { value: '3_to_5_lakh', label: '₹3 to 5 lakh' },
  { value: '5_to_8_lakh', label: '₹5 to 8 lakh' },
  { value: 'above_8_lakh', label: 'Above ₹8 lakh' },
];

const incomeSourceOptions: { value: string; label: string }[] = [
  { value: '', label: 'Not selected' },
  { value: 'salary', label: 'Salary' },
  { value: 'self_employment', label: 'Self-employment' },
  { value: 'agriculture', label: 'Agriculture' },
  { value: 'daily_wage', label: 'Daily wages' },
  { value: 'pension', label: 'Pension' },
  { value: 'family_support', label: 'Family support' },
  { value: 'other', label: 'Other' },
  { value: 'none', label: 'No income' },
];

export function FinanceForm({ initial }: { initial: FinancialProfile }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FinancialProfileInput>({
    resolver: zodResolver(financialProfileSchema, undefined, { raw: true }),
    defaultValues: {
      annualIncomeInr: initial.annualIncomeInr ?? '',
      familyAnnualIncomeInr: initial.familyAnnualIncomeInr ?? '',
      incomeRange: initial.incomeRange ?? '',
      incomeUnknown: initial.incomeUnknown,
      financialYear: initial.financialYear ?? '',
      incomeSource: initial.incomeSource ?? '',
    },
  });

  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  async function onSubmit(values: FinancialProfileInput) {
    setMessage(null);
    const result = await saveFinancialProfile(values);
    if (result.ok) {
      setMessage({ tone: 'success', text: 'Your income details are saved.' });
    } else {
      setMessage({ tone: 'error', text: result.error });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Income</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-1">
            <label htmlFor="annualIncomeInr" className="block text-sm font-medium">
              Your annual income (rupees)
            </label>
            <input
              id="annualIncomeInr"
              type="number"
              inputMode="numeric"
              min={0}
              className={inputClass}
              {...register('annualIncomeInr')}
            />
            <p className="text-sm text-muted-foreground">
              Your own income for the year. Leave blank if unknown.
            </p>
            {errors.annualIncomeInr && (
              <p role="alert" className="text-sm text-destructive">
                {errors.annualIncomeInr.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="familyAnnualIncomeInr" className="block text-sm font-medium">
              Family annual income (rupees)
            </label>
            <input
              id="familyAnnualIncomeInr"
              type="number"
              inputMode="numeric"
              min={0}
              className={inputClass}
              {...register('familyAnnualIncomeInr')}
            />
            <p className="text-sm text-muted-foreground">
              Total for everyone in your household. Some schemes use this figure.
            </p>
            {errors.familyAnnualIncomeInr && (
              <p role="alert" className="text-sm text-destructive">
                {errors.familyAnnualIncomeInr.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="incomeRange" className="block text-sm font-medium">
              Income range
            </label>
            <select id="incomeRange" className={inputClass} {...register('incomeRange')}>
              {incomeRangeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-sm text-muted-foreground">
              Use this only if you do not know the exact amount.
            </p>
            {errors.incomeRange && (
              <p role="alert" className="text-sm text-destructive">
                {errors.incomeRange.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="financialYear" className="block text-sm font-medium">
              Financial year
            </label>
            <input
              id="financialYear"
              type="text"
              placeholder="2024-25"
              className={inputClass}
              {...register('financialYear')}
            />
            <p className="text-sm text-muted-foreground">
              The year the income figure refers to.
            </p>
            {errors.financialYear && (
              <p role="alert" className="text-sm text-destructive">
                {errors.financialYear.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="incomeSource" className="block text-sm font-medium">
              Main income source
            </label>
            <select id="incomeSource" className={inputClass} {...register('incomeSource')}>
              {incomeSourceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.incomeSource && (
              <p role="alert" className="text-sm text-destructive">
                {errors.incomeSource.message}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input id="incomeUnknown" type="checkbox" className={checkboxClass} {...register('incomeUnknown')} />
            <label htmlFor="incomeUnknown" className="text-sm font-medium">
              I do not know my income
            </label>
            {errors.incomeUnknown && (
              <p role="alert" className="text-sm text-destructive">
                {errors.incomeUnknown.message}
              </p>
            )}
          </div>

          {message?.tone === 'error' && (
            <StatusNotice tone="danger" title="Your details were not saved">
              {message.text}
            </StatusNotice>
          )}
          {message?.tone === 'success' && (
            <p role="status" className="text-sm text-muted-foreground">
              {message.text}
            </p>
          )}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save income details'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
