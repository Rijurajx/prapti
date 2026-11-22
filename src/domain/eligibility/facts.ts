import type { FactDictionary } from './types';
import type { PersonalDetails } from '@/lib/validation/profile';
import type { Address } from '@/lib/validation/profile';
import type { EducationLevel, DocumentStatus } from '@/lib/validation/finance-education-documents';

export interface RawCitizenData {
  profile?: {
    id: string;
    full_name?: string | null;
    is_minor?: boolean | null;
  } | null;
  personal?: PersonalDetails | {
    date_of_birth?: string | null;
    gender?: string | null;
    marital_status?: string | null;
  } | null;
  addresses?: Array<Address | {
    kind?: string | null;
    state?: string | null;
    district?: string | null;
    village_or_town?: string | null;
    area_type?: string | null;
    pin_code?: string | null;
    domicile_confirmed?: boolean | null;
  }> | null;
  financial?: {
    annual_income_inr?: number | null;
    family_annual_income_inr?: number | null;
    income_range?: string | null;
    income_source?: string | null;
  } | null;
  employment?: {
    employment_status?: string | null;
    sector?: string | null;
    has_worker_registration?: boolean | null;
  } | null;
  education?: Array<{
    level: string;
    is_pursuing?: boolean | null;
    passing_year?: number | null;
    percentage?: number | null;
    cgpa?: number | null;
    stream?: string | null;
  }> | null;
  agriculture?: {
    occupation_types?: string[] | null;
    landholding_area?: number | null;
    landholding_unit?: string | null;
    irrigation?: string | null;
    cultivation_pattern?: string | null;
  } | null;
  documents?: Array<{
    document_code?: string;
    status: DocumentStatus;
  }> | null;
}

/**
 * Calculates accurate age from a YYYY-MM-DD birthdate string as of referenceDate (defaults to today).
 */
export function calculateAge(dobString: string, referenceDate: Date = new Date()): number | null {
  if (!dobString || !/^\d{4}-\d{2}-\d{2}$/.test(dobString)) {
    return null;
  }
  const [y, m, d] = dobString.split('-').map(Number);
  if (!y || !m || !d) return null;

  const birthDate = new Date(Date.UTC(y, m - 1, d));
  const refYear = referenceDate.getUTCFullYear();
  const refMonth = referenceDate.getUTCMonth();
  const refDay = referenceDate.getUTCDate();

  let age = refYear - birthDate.getUTCFullYear();
  const monthDiff = refMonth - birthDate.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && refDay < birthDate.getUTCDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}

/**
 * Normalizes different Indian agricultural land units into acres for uniform comparison.
 * Standard conversions:
 * 1 hectare = ~2.471 acres
 * In West Bengal: 1 bigha = ~0.3306 acres (3 bighas per acre)
 * 1 katha = ~0.0165 acres (20 kathas per bigha)
 * 1 decimal = ~0.01 acres (100 decimals per acre)
 */
export function normalizeToAcres(area: number, unit?: string | null): number {
  if (!unit || area <= 0) return area;
  switch (unit.toLowerCase()) {
    case 'acre':
      return area;
    case 'hectare':
      return Math.round(area * 2.47105 * 100) / 100;
    case 'bigha':
      return Math.round((area / 3.025) * 100) / 100;
    case 'katha':
      return Math.round((area / 60.5) * 100) / 100;
    case 'decimal':
      return Math.round((area / 100) * 100) / 100;
    default:
      return area;
  }
}

const EDUCATION_LEVEL_ORDER: EducationLevel[] = [
  'class_10',
  'class_12',
  'diploma',
  'undergraduate',
  'postgraduate',
  'doctoral',
  'other',
];

/**
 * Compiles disparate raw citizen tables into a single typed fact dictionary for the rule evaluator.
 */
export function compileCitizenFacts(data: RawCitizenData): FactDictionary {
  const facts: FactDictionary = {};

  // 1. Personal details
  const dob =
    (data.personal as any)?.dateOfBirth ??
    (data.personal as any)?.date_of_birth ??
    null;
  if (dob) {
    facts.date_of_birth = dob;
    facts.age = calculateAge(dob);
    facts.is_minor = facts.age !== null ? facts.age < 18 : null;
  }

  const gender = (data.personal as any)?.gender ?? null;
  if (gender) facts.gender = gender;

  const maritalStatus =
    (data.personal as any)?.maritalStatus ??
    (data.personal as any)?.marital_status ??
    null;
  if (maritalStatus) facts.marital_status = maritalStatus;

  // 2. Address (prefer current address, fallback to permanent)
  const currentAddr =
    data.addresses?.find((a) => a.kind === 'current') ??
    data.addresses?.[0];

  if (currentAddr) {
    facts.state = currentAddr.state ?? null;
    facts.district = currentAddr.district ?? null;
    facts.village_or_town = (currentAddr as any).villageOrTown ?? (currentAddr as any).village_or_town ?? null;
    facts.area_type = ((currentAddr as any).areaType ?? (currentAddr as any).area_type ?? null) as any;
    facts.pin_code = (currentAddr as any).pinCode ?? (currentAddr as any).pin_code ?? null;
    facts.domicile_confirmed = (currentAddr as any).domicileConfirmed ?? (currentAddr as any).domicile_confirmed ?? null;
  }

  // 3. Financial
  if (data.financial) {
    facts.annual_income_inr = data.financial.annual_income_inr ?? null;
    facts.family_annual_income_inr = data.financial.family_annual_income_inr ?? null;
    facts.income_range = (data.financial.income_range as any) ?? null;
    facts.income_source = (data.financial.income_source as any) ?? null;
  }

  // 4. Employment
  if (data.employment) {
    const status = data.employment.employment_status as any;
    facts.employment_status = status ?? null;
    facts.sector = data.employment.sector ?? null;
    facts.is_employed = status === 'employed' || status === 'self_employed';
    facts.is_unemployed = status === 'unemployed';
    facts.is_student = status === 'student';
    facts.has_worker_registration = data.employment.has_worker_registration ?? null;
  }

  // 5. Education
  if (data.education && data.education.length > 0) {
    let highestLevel: EducationLevel | null = null;
    let highestIndex = -1;
    let isEnrolled = false;

    for (const record of data.education) {
      if (record.is_pursuing) {
        isEnrolled = true;
      }
      const idx = EDUCATION_LEVEL_ORDER.indexOf(record.level as EducationLevel);
      if (idx > highestIndex) {
        highestIndex = idx;
        highestLevel = record.level as EducationLevel;
      }

      if (record.level === 'class_10') {
        facts.has_passed_class_10 = !record.is_pursuing;
        facts.class_10_percentage = record.percentage ?? null;
      } else if (record.level === 'class_12') {
        facts.has_passed_class_12 = !record.is_pursuing;
        facts.class_12_percentage = record.percentage ?? null;
        facts.class_12_stream = record.stream ?? null;
      } else if (record.level === 'undergraduate') {
        facts.undergraduate_percentage = record.percentage ?? null;
        facts.undergraduate_cgpa = record.cgpa ?? null;
      }
    }

    facts.highest_education_level = highestLevel;
    facts.is_currently_enrolled = isEnrolled;
    if (isEnrolled && facts.is_student === undefined) {
      facts.is_student = true;
    }
  }

  // 6. Agriculture
  if (data.agriculture) {
    const occupations = data.agriculture.occupation_types as any;
    facts.occupation_types = occupations ?? [];
    facts.operates_land =
      occupations &&
      (occupations.includes('landowner') ||
        occupations.includes('cultivator') ||
        occupations.includes('sharecropper') ||
        occupations.includes('tenant'));

    const area = data.agriculture.landholding_area ?? null;
    const unit = data.agriculture.landholding_unit ?? null;
    facts.landholding_area = area;
    facts.landholding_unit = unit as any;
    if (area !== null && area !== undefined) {
      facts.landholding_area_acres = normalizeToAcres(area, unit);
    }
    facts.irrigation = (data.agriculture.irrigation as any) ?? null;
    facts.cultivation_pattern = (data.agriculture.cultivation_pattern as any) ?? null;
  }

  // 7. Documents inventory map
  if (data.documents && data.documents.length > 0) {
    const docMap: Record<string, DocumentStatus> = {};
    for (const d of data.documents) {
      if (d.document_code) {
        docMap[d.document_code] = d.status;
      }
    }
    facts.document_statuses = docMap;
    // Special derived flags
    if (docMap['bank_passbook'] === 'available') {
      facts.has_bank_account = true;
    }
  }

  return facts;
}

