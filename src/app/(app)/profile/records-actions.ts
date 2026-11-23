'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { resolveActiveCitizenId } from './active-citizen';
import {
  documentStatusSchema,
  educationRecordSchema,
  employmentProfileSchema,
  financialProfileSchema,
  type DocumentStatus,
  type DocumentStatusInput,
  type EducationLevel,
  type EducationRecord,
  type EducationRecordInput,
  type EducationStream,
  type EmploymentProfile,
  type EmploymentProfileInput,
  type EmploymentStatus,
  type FinancialProfile,
  type FinancialProfileInput,
  type IncomeRange,
  type IncomeSource,
  type MarkingScale,
} from '@/lib/validation/finance-education-documents';
import type { ActionResult } from './actions';

export type EducationRecordView = EducationRecord & {
  id: string;
  semesterResults: { semesterNumber: number; sgpa: number | null }[];
};

export type DocumentTypeView = {
  code: string;
  name: string;
  category: string;
  isSensitive: boolean;
  description: string | null;
};

type ServerClient = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;

type SessionContext =
  | { ok: true; supabase: ServerClient; citizenId: string }
  | { ok: false; error: string };

type FinancialRow = {
  annual_income_inr: number | null;
  family_annual_income_inr: number | null;
  income_range: IncomeRange | null;
  income_unknown: boolean;
  financial_year: string | null;
  income_source: IncomeSource | null;
};

type EmploymentRow = {
  statuses: EmploymentStatus[] | null;
  sector: string | null;
  employment_registered: boolean | null;
  unemployment_months: number | null;
  skills: string | null;
};

type SemesterRow = {
  semester_number: number;
  sgpa: number | null;
};

type EducationRow = {
  id: string;
  level: EducationLevel;
  board_or_university: string | null;
  institution: string | null;
  stream: EducationStream | null;
  programme: string | null;
  passing_year: number | null;
  is_currently_pursuing: boolean;
  current_year_or_semester: string | null;
  marking_scale: MarkingScale | null;
  obtained_marks: number | null;
  maximum_marks: number | null;
  percentage: number | null;
  cgpa: number | null;
  marksheet_available: DocumentStatus | null;
  pass_certificate_available: DocumentStatus | null;
  education_semester_results: SemesterRow[] | null;
};

type DocumentTypeRow = {
  code: string;
  name: string;
  category: string;
  is_sensitive: boolean;
  description: string | null;
};

type DocumentInventoryRow = {
  document_code: string;
  status: DocumentStatus;
  note: string | null;
};

type DocumentStatusEntry = { status: DocumentStatus; note: string | null };

const SAVE_ERROR_MESSAGE = 'We could not save your details. Please try again.';
const RECORD_SAVE_ERROR_MESSAGE = 'We could not save this record. Please try again.';
const RECORD_DELETE_ERROR_MESSAGE = 'We could not delete this record. Please try again.';
const RECORD_NOT_FOUND_MESSAGE = 'That record could not be found.';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

/** Resolves the active citizen id from the signed-in user or active cookie. Never trusts the client. */
async function findCitizenId(supabase: ServerClient, userId: string): Promise<string | null> {
  return resolveActiveCitizenId(supabase, userId);
}

async function resolveSession(): Promise<SessionContext> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, error: 'Supabase is not configured' };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: 'Please sign in again' };
  }

  const citizenId = await findCitizenId(supabase, user.id);
  if (!citizenId) {
    return {
      ok: false,
      error: 'Your profile could not be found. Try signing out and in again.',
    };
  }

  return { ok: true, supabase, citizenId };
}

// 1. Financial profile

export async function getFinancialProfile(): Promise<FinancialProfile | null> {
  const session = await resolveSession();
  if (!session.ok) {
    return null;
  }

  const { data, error } = await session.supabase
    .from('citizen_financial_profiles')
    .select(
      'annual_income_inr, family_annual_income_inr, income_range, income_unknown, financial_year, income_source',
    )
    .eq('citizen_id', session.citizenId)
    .maybeSingle();

  if (error) {
    console.error('getFinancialProfile failed', error.code);
    return null;
  }

  const row = data as FinancialRow | null;
  if (!row) {
    return {
      annualIncomeInr: null,
      familyAnnualIncomeInr: null,
      incomeRange: null,
      incomeUnknown: false,
      financialYear: null,
      incomeSource: null,
    };
  }

  return {
    annualIncomeInr: row.annual_income_inr,
    familyAnnualIncomeInr: row.family_annual_income_inr,
    incomeRange: row.income_range,
    incomeUnknown: row.income_unknown,
    financialYear: row.financial_year,
    incomeSource: row.income_source,
  };
}

export async function saveFinancialProfile(input: FinancialProfileInput): Promise<ActionResult> {
  const parsed = financialProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the details and try again' };
  }

  const session = await resolveSession();
  if (!session.ok) {
    return session;
  }

  const { error } = await session.supabase.from('citizen_financial_profiles').upsert(
    {
      citizen_id: session.citizenId,
      annual_income_inr: parsed.data.annualIncomeInr,
      family_annual_income_inr: parsed.data.familyAnnualIncomeInr,
      income_range: parsed.data.incomeRange,
      income_unknown: parsed.data.incomeUnknown,
      financial_year: parsed.data.financialYear,
      income_source: parsed.data.incomeSource,
    },
    { onConflict: 'citizen_id' },
  );

  if (error) {
    console.error('saveFinancialProfile failed', error.code);
    return { ok: false, error: SAVE_ERROR_MESSAGE };
  }

  revalidatePath('/profile/finance');
  return { ok: true };
}

// 2. Employment profile

export async function getEmploymentProfile(): Promise<EmploymentProfile | null> {
  const session = await resolveSession();
  if (!session.ok) {
    return null;
  }

  const { data, error } = await session.supabase
    .from('citizen_employment_profiles')
    .select('statuses, sector, employment_registered, unemployment_months, skills')
    .eq('citizen_id', session.citizenId)
    .maybeSingle();

  if (error) {
    console.error('getEmploymentProfile failed', error.code);
    return null;
  }

  const row = data as EmploymentRow | null;
  if (!row) {
    return {
      statuses: [],
      sector: null,
      employmentRegistered: null,
      unemploymentMonths: null,
      skills: null,
    };
  }

  return {
    statuses: row.statuses ?? [],
    sector: row.sector,
    employmentRegistered: row.employment_registered,
    unemploymentMonths: row.unemployment_months,
    skills: row.skills,
  };
}

export async function saveEmploymentProfile(input: EmploymentProfileInput): Promise<ActionResult> {
  const parsed = employmentProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the details and try again' };
  }

  const session = await resolveSession();
  if (!session.ok) {
    return session;
  }

  const { error } = await session.supabase.from('citizen_employment_profiles').upsert(
    {
      citizen_id: session.citizenId,
      statuses: parsed.data.statuses,
      sector: parsed.data.sector,
      employment_registered: parsed.data.employmentRegistered,
      unemployment_months: parsed.data.unemploymentMonths,
      skills: parsed.data.skills,
    },
    { onConflict: 'citizen_id' },
  );

  if (error) {
    console.error('saveEmploymentProfile failed', error.code);
    return { ok: false, error: SAVE_ERROR_MESSAGE };
  }

  revalidatePath('/profile/employment');
  return { ok: true };
}

// 3. Education records

export async function listEducationRecords(): Promise<EducationRecordView[]> {
  const session = await resolveSession();
  if (!session.ok) {
    return [];
  }

  const { data, error } = await session.supabase
    .from('education_records')
    .select(
      '*, education_semester_results(semester_number, sgpa)',
    )
    .eq('citizen_id', session.citizenId)
    .order('level', { ascending: true })
    .order('passing_year', { ascending: true });

  if (error) {
    console.error('listEducationRecords failed', error.code);
    return [];
  }

  return ((data ?? []) as EducationRow[]).map((row): EducationRecordView => ({
    id: row.id,
    level: row.level,
    boardOrUniversity: row.board_or_university,
    institution: row.institution,
    stream: row.stream,
    programme: row.programme,
    passingYear: row.passing_year,
    isCurrentlyPursuing: row.is_currently_pursuing,
    currentYearOrSemester: row.current_year_or_semester,
    markingScale: row.marking_scale,
    obtainedMarks: row.obtained_marks,
    maximumMarks: row.maximum_marks,
    percentage: row.percentage,
    cgpa: row.cgpa,
    marksheetAvailable: row.marksheet_available,
    passCertificateAvailable: row.pass_certificate_available,
    semesterResults: (row.education_semester_results ?? [])
      .map((r) => ({ semesterNumber: r.semester_number, sgpa: r.sgpa }))
      .sort((a, b) => a.semesterNumber - b.semesterNumber),
  }));
}

export async function saveEducationRecord(
  input: EducationRecordInput,
  id?: string,
): Promise<ActionResult> {
  const parsed = educationRecordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the record and try again' };
  }

  if (id !== undefined && !isUuid(id)) {
    return { ok: false, error: RECORD_NOT_FOUND_MESSAGE };
  }

  const session = await resolveSession();
  if (!session.ok) {
    return session;
  }

  const { supabase, citizenId } = session;

  if (id !== undefined) {
    const { data: existing, error: lookupError } = await supabase
      .from('education_records')
      .select('id')
      .eq('id', id)
      .eq('citizen_id', citizenId)
      .maybeSingle();

    if (lookupError) {
      console.error('saveEducationRecord lookup failed', lookupError.code);
      return { ok: false, error: RECORD_SAVE_ERROR_MESSAGE };
    }
    if (!existing) {
      return { ok: false, error: RECORD_NOT_FOUND_MESSAGE };
    }
  }

  const payload = {
    level: parsed.data.level,
    board_or_university: parsed.data.boardOrUniversity,
    institution: parsed.data.institution,
    stream: parsed.data.stream,
    programme: parsed.data.programme,
    passing_year: parsed.data.passingYear,
    is_currently_pursuing: parsed.data.isCurrentlyPursuing,
    current_year_or_semester: parsed.data.currentYearOrSemester,
    marking_scale: parsed.data.markingScale,
    obtained_marks: parsed.data.obtainedMarks,
    maximum_marks: parsed.data.maximumMarks,
    percentage: parsed.data.percentage,
    cgpa: parsed.data.cgpa,
    marksheet_available: parsed.data.marksheetAvailable,
    pass_certificate_available: parsed.data.passCertificateAvailable,
  };

  let recordId: string;

  if (id !== undefined) {
    const { error: updateError } = await supabase
      .from('education_records')
      .update(payload)
      .eq('id', id)
      .eq('citizen_id', citizenId);

    if (updateError) {
      console.error('saveEducationRecord update failed', updateError.code);
      return { ok: false, error: RECORD_SAVE_ERROR_MESSAGE };
    }
    recordId = id;
  } else {
    const { data: inserted, error: insertError } = await supabase
      .from('education_records')
      .insert({ ...payload, citizen_id: citizenId })
      .select('id')
      .single();

    const insertedId = (inserted as { id: string } | null)?.id;
    if (insertError || !insertedId) {
      console.error('saveEducationRecord insert failed', insertError?.code);
      return { ok: false, error: RECORD_SAVE_ERROR_MESSAGE };
    }
    recordId = insertedId;
  }

  const { error: deleteSemestersError } = await supabase
    .from('education_semester_results')
    .delete()
    .eq('education_record_id', recordId);

  if (deleteSemestersError) {
    console.error('saveEducationRecord semester delete failed', deleteSemestersError.code);
    return { ok: false, error: RECORD_SAVE_ERROR_MESSAGE };
  }

  if (parsed.data.semesterResults.length > 0) {
    const { error: insertSemestersError } = await supabase
      .from('education_semester_results')
      .insert(
        parsed.data.semesterResults.map((r) => ({
          education_record_id: recordId,
          semester_number: r.semesterNumber,
          sgpa: r.sgpa,
        })),
      );

    if (insertSemestersError) {
      console.error('saveEducationRecord semester insert failed', insertSemestersError.code);
      return { ok: false, error: RECORD_SAVE_ERROR_MESSAGE };
    }
  }

  revalidatePath('/profile/education');
  return { ok: true };
}

export async function deleteEducationRecord(id: string): Promise<ActionResult> {
  if (typeof id !== 'string' || !isUuid(id)) {
    return { ok: false, error: RECORD_NOT_FOUND_MESSAGE };
  }

  const session = await resolveSession();
  if (!session.ok) {
    return session;
  }

  const { data, error } = await session.supabase
    .from('education_records')
    .delete()
    .eq('id', id)
    .eq('citizen_id', session.citizenId)
    .select('id');

  if (error) {
    console.error('deleteEducationRecord failed', error.code);
    return { ok: false, error: RECORD_DELETE_ERROR_MESSAGE };
  }
  if (!data || data.length === 0) {
    return { ok: false, error: RECORD_NOT_FOUND_MESSAGE };
  }

  revalidatePath('/profile/education');
  return { ok: true };
}

// 4. Document types and status

export async function getDocumentTypes(): Promise<DocumentTypeView[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('document_types')
    .select('code, name, category, is_sensitive, description')
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    console.error('getDocumentTypes failed', error.code);
    return [];
  }

  return ((data ?? []) as DocumentTypeRow[]).map((row) => ({
    code: row.code,
    name: row.name,
    category: row.category,
    isSensitive: row.is_sensitive,
    description: row.description,
  }));
}

export async function getDocumentStatuses(): Promise<Record<string, DocumentStatusEntry>> {
  const session = await resolveSession();
  if (!session.ok) {
    return {};
  }

  const { data, error } = await session.supabase
    .from('citizen_document_inventory')
    .select('document_code, status, note')
    .eq('citizen_id', session.citizenId);

  if (error) {
    console.error('getDocumentStatuses failed', error.code);
    return {};
  }

  const result: Record<string, DocumentStatusEntry> = {};
  for (const row of (data ?? []) as DocumentInventoryRow[]) {
    result[row.document_code] = { status: row.status, note: row.note };
  }
  return result;
}

export async function saveDocumentStatus(input: DocumentStatusInput): Promise<ActionResult> {
  const parsed = documentStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the document status and try again' };
  }

  const session = await resolveSession();
  if (!session.ok) {
    return session;
  }

  const { error } = await session.supabase.from('citizen_document_inventory').upsert(
    {
      citizen_id: session.citizenId,
      document_code: parsed.data.documentCode,
      status: parsed.data.status,
      note: parsed.data.note,
    },
    { onConflict: 'citizen_id,document_code' },
  );

  if (error) {
    console.error('saveDocumentStatus failed', error.code);
    return { ok: false, error: SAVE_ERROR_MESSAGE };
  }

  revalidatePath('/profile/documents');
  return { ok: true };
}
