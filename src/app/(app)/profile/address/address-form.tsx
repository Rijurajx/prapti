'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { StatusNotice } from '@/components/ui/status-notice';
import { addressSchema, type Address } from '@/lib/validation/profile';
import { deleteAddress, saveAddress } from '../actions';

// The domicile answer is a three-way choice in the form ('' = not answered),
// so the schema is extended to accept that string. It is mapped to boolean | null before saving.
const addressFormSchema = addressSchema.extend({
  domicileConfirmed: z.enum(['', 'yes', 'no']),
});

type AddressFormValues = z.input<typeof addressFormSchema>;
type DomicileChoice = AddressFormValues['domicileConfirmed'];

type Notice = {
  tone: 'info' | 'danger';
  title: string;
  body: string;
};

const inputClass =
  'h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';
const labelClass = 'text-sm font-medium text-foreground';
const helperClass = 'text-sm text-muted-foreground';
const errorClass = 'text-destructive text-sm';

function domicileToChoice(value: boolean | null): DomicileChoice {
  if (value === true) return 'yes';
  if (value === false) return 'no';
  return '';
}

function choiceToDomicile(value: DomicileChoice): boolean | null {
  if (value === 'yes') return true;
  if (value === 'no') return false;
  return null;
}

function toFormValues(kind: 'current' | 'permanent', address: Address | null): AddressFormValues {
  return {
    kind,
    state: address?.state ?? '',
    district: address?.district ?? '',
    villageOrTown: address?.villageOrTown ?? '',
    areaType: address?.areaType ?? '',
    pinCode: address?.pinCode ?? '',
    domicileConfirmed: domicileToChoice(address?.domicileConfirmed ?? null),
  };
}

export function AddressForm({
  kind,
  initial,
}: {
  kind: 'current' | 'permanent';
  initial: Address | null;
}) {
  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: toFormValues(kind, initial),
  });

  const [notice, setNotice] = useState<Notice | null>(null);
  const [isRemoving, startRemoving] = useTransition();
  const { errors, isSubmitting } = form.formState;
  const busy = isSubmitting || isRemoving;

  const id = (name: string) => `${kind}-${name}`;

  const onSubmit = form.handleSubmit(async (values) => {
    setNotice(null);

    const result = await saveAddress({
      kind: values.kind,
      state: values.state ?? '',
      district: values.district ?? '',
      villageOrTown: values.villageOrTown ?? '',
      areaType: values.areaType ?? '',
      pinCode: values.pinCode ?? '',
      domicileConfirmed: choiceToDomicile(values.domicileConfirmed),
    });

    if (result.ok) {
      setNotice({
        tone: 'info',
        title: 'Address saved.',
        body: `Your ${kind} address is stored.`,
      });
    } else {
      setNotice({
        tone: 'danger',
        title: 'Your address was not saved',
        body: result.error,
      });
    }
  });

  function handleRemove() {
    setNotice(null);
    startRemoving(async () => {
      const result = await deleteAddress(kind);
      if (result.ok) {
        form.reset(toFormValues(kind, null));
        setNotice({
          tone: 'info',
          title: 'Address removed.',
          body: `Your ${kind} address has been removed.`,
        });
      } else {
        setNotice({
          tone: 'danger',
          title: 'Your address was not removed',
          body: result.error,
        });
      }
    });
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={id('state')} className={labelClass}>
          State
        </label>
        <input
          id={id('state')}
          type="text"
          maxLength={100}
          className={inputClass}
          aria-invalid={errors.state ? true : undefined}
          aria-describedby={errors.state ? `${id('state')}-help ${id('state')}-error` : `${id('state')}-help`}
          {...form.register('state')}
        />
        <p id={`${id('state')}-help`} className={helperClass}>
          Type your state as it appears on your official documents. Location lists are not yet available in PRAPTI.
        </p>
        {errors.state ? (
          <p id={`${id('state')}-error`} role="alert" className={errorClass}>
            {errors.state.message}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={id('district')} className={labelClass}>
          District
        </label>
        <input
          id={id('district')}
          type="text"
          maxLength={100}
          className={inputClass}
          aria-invalid={errors.district ? true : undefined}
          aria-describedby={errors.district ? `${id('district')}-error` : undefined}
          {...form.register('district')}
        />
        {errors.district ? (
          <p id={`${id('district')}-error`} role="alert" className={errorClass}>
            {errors.district.message}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={id('villageOrTown')} className={labelClass}>
          Village, town or city
        </label>
        <input
          id={id('villageOrTown')}
          type="text"
          maxLength={150}
          className={inputClass}
          aria-invalid={errors.villageOrTown ? true : undefined}
          aria-describedby={errors.villageOrTown ? `${id('villageOrTown')}-error` : undefined}
          {...form.register('villageOrTown')}
        />
        {errors.villageOrTown ? (
          <p id={`${id('villageOrTown')}-error`} role="alert" className={errorClass}>
            {errors.villageOrTown.message}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={id('areaType')} className={labelClass}>
          Area type
        </label>
        <select
          id={id('areaType')}
          className={inputClass}
          aria-invalid={errors.areaType ? true : undefined}
          aria-describedby={errors.areaType ? `${id('areaType')}-error` : undefined}
          {...form.register('areaType')}
        >
          <option value="">Not answered</option>
          <option value="urban">Urban</option>
          <option value="rural">Rural</option>
        </select>
        {errors.areaType ? (
          <p id={`${id('areaType')}-error`} role="alert" className={errorClass}>
            {errors.areaType.message}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={id('pinCode')} className={labelClass}>
          PIN code
        </label>
        <input
          id={id('pinCode')}
          type="text"
          inputMode="numeric"
          maxLength={6}
          className={inputClass}
          aria-invalid={errors.pinCode ? true : undefined}
          aria-describedby={errors.pinCode ? `${id('pinCode')}-help ${id('pinCode')}-error` : `${id('pinCode')}-help`}
          {...form.register('pinCode')}
        />
        <p id={`${id('pinCode')}-help`} className={helperClass}>
          Six digits. A valid format does not confirm the location.
        </p>
        {errors.pinCode ? (
          <p id={`${id('pinCode')}-error`} role="alert" className={errorClass}>
            {errors.pinCode.message}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={id('domicileConfirmed')} className={labelClass}>
          Domicile
        </label>
        <select
          id={id('domicileConfirmed')}
          className={inputClass}
          aria-invalid={errors.domicileConfirmed ? true : undefined}
          aria-describedby={
            errors.domicileConfirmed
              ? `${id('domicileConfirmed')}-help ${id('domicileConfirmed')}-error`
              : `${id('domicileConfirmed')}-help`
          }
          {...form.register('domicileConfirmed')}
        >
          <option value="">Not answered</option>
          <option value="yes">Yes, I am a domicile</option>
          <option value="no">No</option>
        </select>
        <p id={`${id('domicileConfirmed')}-help`} className={helperClass}>
          Domicile means you live in this state by the rules of the scheme. Answer only if you know it.
        </p>
        {errors.domicileConfirmed ? (
          <p id={`${id('domicileConfirmed')}-error`} role="alert" className={errorClass}>
            {errors.domicileConfirmed.message}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={busy}>
          {kind === 'current' ? 'Save current address' : 'Save permanent address'}
        </Button>
        {initial !== null ? (
          <Button variant="secondary" onClick={handleRemove} disabled={busy}>
            Remove this address
          </Button>
        ) : null}
      </div>

      {notice ? (
        <StatusNotice tone={notice.tone} title={notice.title}>
          {notice.body}
        </StatusNotice>
      ) : null}
    </form>
  );
}
