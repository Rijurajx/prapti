'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import {
  employmentProfileSchema,
  EMPLOYMENT_STATUS_VALUES,
  type EmploymentProfileInput,
  type EmploymentProfile,
} from '@/lib/validation/finance-education-documents';
import { saveEmploymentProfile } from '@/app/profile/records-actions';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { StatusNotice } from '@/components/ui/status-notice';

const STATUS_LABELS: Record<(typeof EMPLOYMENT_STATUS_VALUES)[number], string> = {
  employed: 'Employed',
  unemployed: 'Unemployed',
  self_employed: 'Self-employed',
  student: 'Student',
  retired: 'Retired',
  homemaker: 'Homemaker',
  agricultural_worker: 'Agricultural worker',
  daily_wage_worker: 'Daily-wage worker',
  other: 'Other',
};

const INPUT_CLASS =
  'w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';
const INPUT_CLASS_FIXED_HEIGHT =
  'w-full h-10 rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';

export function EmploymentForm({ initial }: { initial: EmploymentProfile }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EmploymentProfileInput>({
    resolver: zodResolver(employmentProfileSchema, undefined, { raw: true }),
    defaultValues: {
      statuses: initial.statuses,
      sector: initial.sector ?? '',
      employmentRegistered:
        initial.employmentRegistered === true
          ? 'yes'
          : initial.employmentRegistered === false
            ? 'no'
            : '',
      unemploymentMonths: initial.unemploymentMonths ?? '',
      skills: initial.skills ?? '',
    },
  });

  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(
    null,
  );

  async function onSubmit(values: EmploymentProfileInput) {
    setMessage(null);
    const result = await saveEmploymentProfile(values);
    if (result.ok) {
      setMessage({ tone: 'success', text: 'Your employment details are saved.' });
    } else {
      setMessage({ tone: 'error', text: result.error });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Employment</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Current circumstances (select all that apply)</legend>
            {EMPLOYMENT_STATUS_VALUES.map((status) => (
              <div key={status} className="flex items-center gap-2">
                <input
                  id={`status-${status}`}
                  type="checkbox"
                  value={status}
                  className="h-4 w-4 accent-primary"
                  {...register('statuses')}
                />
                <label htmlFor={`status-${status}`} className="text-sm">
                  {STATUS_LABELS[status]}
                </label>
              </div>
            ))}
            {errors.statuses && (
              <p role="alert" className="text-sm text-destructive">
                {errors.statuses.message as string}
              </p>
            )}
          </fieldset>

          <div className="space-y-1">
            <label htmlFor="sector" className="text-sm font-medium">
              Sector or type of work
            </label>
            <input id="sector" type="text" className={INPUT_CLASS} {...register('sector')} />
            <p className="text-xs text-muted-foreground">
              For example: construction, teaching, retail. Optional.
            </p>
            {errors.sector && (
              <p role="alert" className="text-sm text-destructive">
                {errors.sector.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="employmentRegistered" className="text-sm font-medium">
              Registered with an employment exchange or worker registry?
            </label>
            <select
              id="employmentRegistered"
              className={INPUT_CLASS_FIXED_HEIGHT}
              {...register('employmentRegistered')}
            >
              <option value="">Not sure</option>
              <option value="yes">Yes, I am registered</option>
              <option value="no">No</option>
            </select>
            <p className="text-xs text-muted-foreground">Only answer if you know.</p>
            {errors.employmentRegistered && (
              <p role="alert" className="text-sm text-destructive">
                {errors.employmentRegistered.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="unemploymentMonths" className="text-sm font-medium">
              How many months have you been without work?
            </label>
            <input
              id="unemploymentMonths"
              type="number"
              min={0}
              max={600}
              className={INPUT_CLASS_FIXED_HEIGHT}
              {...register('unemploymentMonths')}
            />
            <p className="text-xs text-muted-foreground">
              Only if you are currently unemployed.
            </p>
            {errors.unemploymentMonths && (
              <p role="alert" className="text-sm text-destructive">
                {errors.unemploymentMonths.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="skills" className="text-sm font-medium">
              Skills or training
            </label>
            <textarea
              id="skills"
              rows={3}
              className={INPUT_CLASS}
              {...register('skills')}
            />
            <p className="text-xs text-muted-foreground">
              Optional. Do not include certificate numbers.
            </p>
            {errors.skills && (
              <p role="alert" className="text-sm text-destructive">
                {errors.skills.message}
              </p>
            )}
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save employment details'}
          </Button>

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
        </form>
      </CardContent>
    </Card>
  );
}
