'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { savePersonalDetails } from '@/app/app/profile/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusNotice } from '@/components/ui/status-notice';
import {
  personalDetailsSchema,
  type PersonalDetails,
  type PersonalDetailsInput,
} from '@/lib/validation/profile';

const INPUT_CLASS =
  'h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';

const GENDER_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: '', label: 'Prefer to choose' },
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

const MARITAL_STATUS_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: '', label: 'Prefer to choose' },
  { value: 'never_married', label: 'Never married' },
  { value: 'married', label: 'Married' },
  { value: 'widowed', label: 'Widowed' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'separated', label: 'Separated' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

export function PersonalDetailsForm({ initial }: { initial: PersonalDetails }) {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PersonalDetailsInput>({
    resolver: zodResolver(personalDetailsSchema),
    defaultValues: {
      dateOfBirth: initial.dateOfBirth ?? '',
      gender: initial.gender ?? '',
      maritalStatus: initial.maritalStatus ?? '',
    },
  });

  const onSubmit = async (values: PersonalDetailsInput) => {
    setSuccessMessage(null);
    setSaveError(null);

    // The resolver hands back transformed output where empty answers are null,
    // but the server action expects the input shape, so empty answers go back as ''.
    const result = await savePersonalDetails({
      dateOfBirth: values.dateOfBirth ?? '',
      gender: values.gender ?? '',
      maritalStatus: values.maritalStatus ?? '',
    });

    if (result.ok) {
      setSuccessMessage('Your details are saved.');
    } else {
      setSaveError(result.error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>About you</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="dateOfBirth" className="block text-sm font-medium text-foreground">
              Date of birth
            </label>
            <input
              id="dateOfBirth"
              type="date"
              className={INPUT_CLASS}
              aria-describedby="dateOfBirth-help"
              aria-invalid={errors.dateOfBirth ? true : undefined}
              {...register('dateOfBirth')}
            />
            <p id="dateOfBirth-help" className="text-sm text-muted-foreground">
              Used to calculate your age against each scheme&apos;s cutoff date.
            </p>
            {errors.dateOfBirth?.message ? (
              <p role="alert" className="text-destructive text-sm">
                {errors.dateOfBirth.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="gender" className="block text-sm font-medium text-foreground">
              Gender
            </label>
            <select
              id="gender"
              className={INPUT_CLASS}
              aria-describedby="gender-help"
              aria-invalid={errors.gender ? true : undefined}
              {...register('gender')}
            >
              {GENDER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p id="gender-help" className="text-sm text-muted-foreground">
              Optional. Used only where a scheme&apos;s rules refer to gender.
            </p>
            {errors.gender?.message ? (
              <p role="alert" className="text-destructive text-sm">
                {errors.gender.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="maritalStatus" className="block text-sm font-medium text-foreground">
              Marital status
            </label>
            <select
              id="maritalStatus"
              className={INPUT_CLASS}
              aria-invalid={errors.maritalStatus ? true : undefined}
              {...register('maritalStatus')}
            >
              {MARITAL_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.maritalStatus?.message ? (
              <p role="alert" className="text-destructive text-sm">
                {errors.maritalStatus.message}
              </p>
            ) : null}
          </div>

          {saveError ? (
            <StatusNotice tone="danger" title="Your details were not saved">
              <p>{saveError}</p>
            </StatusNotice>
          ) : null}

          {successMessage ? (
            <p role="status" className="text-sm text-foreground">
              {successMessage}
            </p>
          ) : null}

          <div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save details'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
