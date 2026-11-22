'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  educationRecordSchema,
  EDUCATION_LEVEL_VALUES,
  EDUCATION_STREAM_VALUES,
  MARKING_SCALE_VALUES,
  DOCUMENT_STATUS_VALUES,
  type EducationRecordInput,
} from '@/lib/validation/finance-education-documents';
import {
  saveEducationRecord,
  deleteEducationRecord,
  type EducationRecordView,
} from '@/app/app/profile/records-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusNotice } from '@/components/ui/status-notice';

const LEVEL_LABELS: Record<(typeof EDUCATION_LEVEL_VALUES)[number], string> = {
  class_10: 'Class 10',
  class_12: 'Class 12',
  diploma: 'Diploma',
  undergraduate: 'Undergraduate degree',
  postgraduate: 'Postgraduate',
  doctoral: 'Doctoral',
  other: 'Other',
};

const STREAM_LABELS: Record<(typeof EDUCATION_STREAM_VALUES)[number], string> = {
  science: 'Science',
  commerce: 'Commerce',
  arts_humanities: 'Arts or humanities',
  vocational: 'Vocational',
  other: 'Other',
};

const MARKING_SCALE_LABELS: Record<(typeof MARKING_SCALE_VALUES)[number], string> = {
  percentage: 'Percentage',
  cgpa: 'CGPA',
  grade: 'Grade',
  marks: 'Marks',
};

const DOCUMENT_STATUS_LABELS: Record<(typeof DOCUMENT_STATUS_VALUES)[number], string> = {
  available: 'Available',
  not_available: 'Not available',
  applied_for: 'Applied for or in progress',
  expired: 'Expired',
  unsure: 'Not sure',
  not_applicable: 'Not applicable',
};

const SEMESTER_LEVELS: readonly string[] = ['undergraduate', 'postgraduate', 'doctoral'];
const MAX_SEMESTERS = 20;

const INPUT_CLASS =
  'h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';
const CHECKBOX_CLASS = 'h-4 w-4 accent-primary';

type Message = { tone: 'success' | 'error'; text: string } | null;

/** Shows the marks exactly as entered, with their scale. CGPA is never converted. */
function formatMarks(record: EducationRecordView): string | null {
  switch (record.markingScale) {
    case 'percentage':
      return record.percentage === null ? null : `Percentage: ${record.percentage}%`;
    case 'cgpa':
      return record.cgpa === null ? null : `CGPA: ${record.cgpa} out of 10`;
    case 'marks':
      if (record.obtainedMarks === null) {
        return null;
      }
      return record.maximumMarks === null
        ? `Marks obtained: ${record.obtainedMarks}`
        : `Marks: ${record.obtainedMarks} out of ${record.maximumMarks}`;
    default:
      return null;
  }
}

export function EducationManager({ records }: { records: EducationRecordView[] }) {
  const [items, setItems] = useState<EducationRecordView[]>(records);
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [message, setMessage] = useState<Message>(null);

  useEffect(() => {
    setItems(records);
  }, [records]);

  const editingRecord =
    editingId !== null && editingId !== 'new' ? items.find((r) => r.id === editingId) : undefined;
  const showForm = editingId === 'new' || editingRecord !== undefined;

  function startNew() {
    setMessage(null);
    setEditingId('new');
  }

  function startEdit(id: string) {
    setMessage(null);
    setEditingId(id);
  }

  async function handleRemove(id: string) {
    setMessage(null);
    const result = await deleteEducationRecord(id);
    if (!result.ok) {
      setMessage({
        tone: 'error',
        text: result.error ?? 'We could not delete this record. Please try again.',
      });
      return;
    }
    setItems((prev) => prev.filter((r) => r.id !== id));
    setEditingId((current) => (current === id ? null : current));
  }

  return (
    <div className="space-y-6">
      {message && (
        <StatusNotice
          tone={message.tone === 'error' ? 'danger' : 'info'}
          title={message.tone === 'error' ? 'This record was not removed' : 'Done'}
        >
          {message.text}
        </StatusNotice>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No education records yet. Add your highest completed class first.
        </p>
      ) : (
        <div className="space-y-4">
          {items.map((record) => {
            const marks = formatMarks(record);
            return (
              <Card key={record.id}>
                <CardHeader>
                  <CardTitle>{LEVEL_LABELS[record.level]}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>{record.boardOrUniversity ?? 'Board or university not entered'}</p>
                  <p className="text-muted-foreground">
                    {record.isCurrentlyPursuing
                      ? 'Currently pursuing'
                      : record.passingYear !== null
                        ? `Year passed: ${record.passingYear}`
                        : 'Year passed not entered'}
                  </p>
                  {marks && <p>{marks}</p>}
                  <div className="flex flex-wrap gap-3 pt-2">
                    <Button variant="secondary" size="sm" onClick={() => startEdit(record.id)}>
                      Edit
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => handleRemove(record.id)}>
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div>
        <Button variant="secondary" onClick={startNew}>
          Add education record
        </Button>
      </div>

      {showForm && (
        <EducationRecordForm
          key={editingId ?? 'none'}
          record={editingRecord}
          onDone={() => setEditingId(null)}
        />
      )}
    </div>
  );
}

function Field({
  id,
  label,
  helper,
  error,
  children,
}: {
  id: string;
  label: string;
  helper?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {helper && <p className="text-sm text-muted-foreground">{helper}</p>}
      {children}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function EducationRecordForm({
  record,
  onDone,
}: {
  record?: EducationRecordView;
  onDone: () => void;
}) {
  const [saveError, setSaveError] = useState<string | null>(null);
  const idPrefix = record ? `edu-${record.id}` : 'edu-new';

  const defaultValues: EducationRecordInput = {
    level: record?.level ?? 'class_10',
    boardOrUniversity: record?.boardOrUniversity ?? '',
    institution: record?.institution ?? '',
    stream: record?.stream ?? '',
    programme: record?.programme ?? '',
    passingYear: record?.passingYear ?? '',
    isCurrentlyPursuing: record?.isCurrentlyPursuing ?? false,
    currentYearOrSemester: record?.currentYearOrSemester ?? '',
    markingScale: record?.markingScale ?? '',
    obtainedMarks: record?.obtainedMarks ?? '',
    maximumMarks: record?.maximumMarks ?? '',
    percentage: record?.percentage ?? '',
    cgpa: record?.cgpa ?? '',
    marksheetAvailable: record?.marksheetAvailable ?? '',
    passCertificateAvailable: record?.passCertificateAvailable ?? '',
    semesterResults:
      record?.semesterResults.map((r) => ({
        semesterNumber: r.semesterNumber,
        sgpa: r.sgpa ?? '',
      })) ?? [],
  };

  const {
    register,
    control,
    watch,
    getValues,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EducationRecordInput>({
    resolver: zodResolver(educationRecordSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'semesterResults' });

  const level = watch('level');
  const showSemesters = SEMESTER_LEVELS.includes(level);

  function addSemester() {
    if (fields.length >= MAX_SEMESTERS) {
      return;
    }
    const existing = getValues('semesterResults') ?? [];
    const highest = existing.reduce(
      (max, row) => Math.max(max, Number(row.semesterNumber) || 0),
      0,
    );
    append({ semesterNumber: highest + 1, sgpa: '' });
  }

  const onSubmit = handleSubmit(async (values) => {
    setSaveError(null);
    const result = await saveEducationRecord(values, record?.id);
    if (result.ok) {
      onDone();
      return;
    }
    setSaveError(result.error ?? 'We could not save this record. Please try again.');
  });

  const semesterListError = (errors.semesterResults as unknown as { message?: string } | undefined)
    ?.message;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{record ? 'Edit education record' : 'Add education record'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} noValidate className="space-y-5">
          <Field id={`${idPrefix}-level`} label="Level" error={errors.level?.message}>
            <select id={`${idPrefix}-level`} className={INPUT_CLASS} {...register('level')}>
              {EDUCATION_LEVEL_VALUES.map((value) => (
                <option key={value} value={value}>
                  {LEVEL_LABELS[value]}
                </option>
              ))}
            </select>
          </Field>

          <Field
            id={`${idPrefix}-board`}
            label="Board or university"
            error={errors.boardOrUniversity?.message}
          >
            <input
              id={`${idPrefix}-board`}
              type="text"
              className={INPUT_CLASS}
              {...register('boardOrUniversity')}
            />
          </Field>

          <Field
            id={`${idPrefix}-institution`}
            label="School or college (optional)"
            error={errors.institution?.message}
          >
            <input
              id={`${idPrefix}-institution`}
              type="text"
              className={INPUT_CLASS}
              {...register('institution')}
            />
          </Field>

          <Field id={`${idPrefix}-stream`} label="Stream" error={errors.stream?.message}>
            <select id={`${idPrefix}-stream`} className={INPUT_CLASS} {...register('stream')}>
              <option value="">Not applicable</option>
              {EDUCATION_STREAM_VALUES.map((value) => (
                <option key={value} value={value}>
                  {STREAM_LABELS[value]}
                </option>
              ))}
            </select>
          </Field>

          <Field
            id={`${idPrefix}-programme`}
            label="Course or programme (optional)"
            error={errors.programme?.message}
          >
            <input
              id={`${idPrefix}-programme`}
              type="text"
              className={INPUT_CLASS}
              {...register('programme')}
            />
          </Field>

          <Field
            id={`${idPrefix}-passing-year`}
            label="Year passed"
            helper="Leave blank if you are still studying."
            error={errors.passingYear?.message}
          >
            <input
              id={`${idPrefix}-passing-year`}
              type="number"
              min={1950}
              max={2100}
              className={INPUT_CLASS}
              {...register('passingYear')}
            />
          </Field>

          <div className="flex items-center gap-3">
            <input
              id={`${idPrefix}-pursuing`}
              type="checkbox"
              className={CHECKBOX_CLASS}
              {...register('isCurrentlyPursuing')}
            />
            <label htmlFor={`${idPrefix}-pursuing`} className="text-sm font-medium text-foreground">
              I am currently studying this
            </label>
          </div>

          <Field
            id={`${idPrefix}-current-year`}
            label="Current year or semester (optional)"
            error={errors.currentYearOrSemester?.message}
          >
            <input
              id={`${idPrefix}-current-year`}
              type="text"
              className={INPUT_CLASS}
              {...register('currentYearOrSemester')}
            />
          </Field>

          <Field
            id={`${idPrefix}-marking-scale`}
            label="Marking scale"
            error={errors.markingScale?.message}
          >
            <select
              id={`${idPrefix}-marking-scale`}
              className={INPUT_CLASS}
              {...register('markingScale')}
            >
              <option value="">Not selected</option>
              {MARKING_SCALE_VALUES.map((value) => (
                <option key={value} value={value}>
                  {MARKING_SCALE_LABELS[value]}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field
              id={`${idPrefix}-obtained`}
              label="Marks obtained"
              error={errors.obtainedMarks?.message}
            >
              <input
                id={`${idPrefix}-obtained`}
                type="number"
                min={0}
                step="any"
                className={INPUT_CLASS}
                {...register('obtainedMarks')}
              />
            </Field>

            <Field
              id={`${idPrefix}-maximum`}
              label="Maximum marks"
              error={errors.maximumMarks?.message}
            >
              <input
                id={`${idPrefix}-maximum`}
                type="number"
                min={0}
                step="any"
                className={INPUT_CLASS}
                {...register('maximumMarks')}
              />
            </Field>

            <Field
              id={`${idPrefix}-percentage`}
              label="Percentage"
              error={errors.percentage?.message}
            >
              <input
                id={`${idPrefix}-percentage`}
                type="number"
                min={0}
                max={100}
                step="any"
                className={INPUT_CLASS}
                {...register('percentage')}
              />
            </Field>

            <Field
              id={`${idPrefix}-cgpa`}
              label="CGPA (out of 10)"
              helper="Enter only what your marksheet shows. PRAPTI does not convert CGPA to a percentage."
              error={errors.cgpa?.message}
            >
              <input
                id={`${idPrefix}-cgpa`}
                type="number"
                min={0}
                max={10}
                step="any"
                className={INPUT_CLASS}
                {...register('cgpa')}
              />
            </Field>
          </div>

          <Field
            id={`${idPrefix}-marksheet`}
            label="Do you have the marksheet?"
            error={errors.marksheetAvailable?.message}
          >
            <select
              id={`${idPrefix}-marksheet`}
              className={INPUT_CLASS}
              {...register('marksheetAvailable')}
            >
              <option value="">Not answered</option>
              {DOCUMENT_STATUS_VALUES.map((value) => (
                <option key={value} value={value}>
                  {DOCUMENT_STATUS_LABELS[value]}
                </option>
              ))}
            </select>
          </Field>

          <Field
            id={`${idPrefix}-pass-certificate`}
            label="Do you have the pass certificate?"
            error={errors.passCertificateAvailable?.message}
          >
            <select
              id={`${idPrefix}-pass-certificate`}
              className={INPUT_CLASS}
              {...register('passCertificateAvailable')}
            >
              <option value="">Not answered</option>
              {DOCUMENT_STATUS_VALUES.map((value) => (
                <option key={value} value={value}>
                  {DOCUMENT_STATUS_LABELS[value]}
                </option>
              ))}
            </select>
          </Field>

          {showSemesters && (
            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-foreground">Semester results</legend>
              <p className="text-sm text-muted-foreground">
                Add one row for each semester you have a result for.
              </p>
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field
                    id={`${idPrefix}-sem-${index}-number`}
                    label="Semester number"
                    error={errors.semesterResults?.[index]?.semesterNumber?.message}
                  >
                    <input
                      id={`${idPrefix}-sem-${index}-number`}
                      type="number"
                      min={1}
                      max={20}
                      className={INPUT_CLASS}
                      {...register(`semesterResults.${index}.semesterNumber`)}
                    />
                  </Field>
                  <Field
                    id={`${idPrefix}-sem-${index}-sgpa`}
                    label="SGPA"
                    error={errors.semesterResults?.[index]?.sgpa?.message}
                  >
                    <input
                      id={`${idPrefix}-sem-${index}-sgpa`}
                      type="number"
                      min={0}
                      max={10}
                      step="any"
                      className={INPUT_CLASS}
                      {...register(`semesterResults.${index}.sgpa`)}
                    />
                  </Field>
                  <div className="sm:col-span-2">
                    <Button variant="secondary" size="sm" onClick={() => remove(index)}>
                      Remove semester
                    </Button>
                  </div>
                </div>
              ))}
              {semesterListError && (
                <p role="alert" className="text-sm text-destructive">
                  {semesterListError}
                </p>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={addSemester}
                disabled={fields.length >= MAX_SEMESTERS}
              >
                Add semester
              </Button>
            </fieldset>
          )}

          {saveError && (
            <StatusNotice tone="danger" title="This record was not saved">
              {saveError}
            </StatusNotice>
          )}

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save record'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => onDone()}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
