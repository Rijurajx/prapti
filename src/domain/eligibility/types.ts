import type { Gender, MaritalStatus, AreaType } from '@/lib/validation/profile';
import type { EmploymentStatus, IncomeRange, IncomeSource, EducationLevel, DocumentStatus } from '@/lib/validation/finance-education-documents';
import type { OccupationType, LandholdingUnit, Irrigation, CultivationPattern } from '@/lib/validation/agriculture';
import type { RuleNode } from '@/lib/validation/scheme';

export type KleeneValue = 'PASS' | 'FAIL' | 'UNKNOWN';

export type EligibilityOutcome =
  | 'likely_eligible'
  | 'needs_more_info'
  | 'likely_ineligible'
  | 'cannot_assess';

export interface RangeValue {
  min?: number;
  max?: number;
  minInclusive?: boolean;
  maxInclusive?: boolean;
}

/** Standard facts compiled from a citizen profile across all categories */
export interface FactDictionary {
  // Identity & Personal
  age?: number | null;
  date_of_birth?: string | null;
  gender?: Gender | null;
  marital_status?: MaritalStatus | null;
  is_minor?: boolean | null;

  // Address
  state?: string | null;
  district?: string | null;
  village_or_town?: string | null;
  area_type?: AreaType | null;
  pin_code?: string | null;
  domicile_confirmed?: boolean | null;

  // Financial
  annual_income_inr?: number | null;
  family_annual_income_inr?: number | null;
  income_range?: IncomeRange | null;
  income_source?: IncomeSource | null;
  has_bank_account?: boolean | null;

  // Employment
  employment_status?: EmploymentStatus | null;
  sector?: string | null;
  is_employed?: boolean | null;
  is_unemployed?: boolean | null;
  is_student?: boolean | null;
  has_worker_registration?: boolean | null;

  // Education
  highest_education_level?: EducationLevel | null;
  has_passed_class_10?: boolean | null;
  class_10_percentage?: number | null;
  has_passed_class_12?: boolean | null;
  class_12_percentage?: number | null;
  class_12_stream?: string | null;
  is_currently_enrolled?: boolean | null;
  undergraduate_cgpa?: number | null;
  undergraduate_percentage?: number | null;

  // Agriculture
  operates_land?: boolean | null;
  landholding_area?: number | null;
  landholding_unit?: LandholdingUnit | null;
  landholding_area_acres?: number | null;
  occupation_types?: OccupationType[] | null;
  irrigation?: Irrigation | null;
  cultivation_pattern?: CultivationPattern | null;

  // Document possession by document code (e.g., 'aadhaar_card': 'available')
  document_statuses?: Record<string, DocumentStatus>;

  // Flexible additional key-values
  [key: string]: unknown;
}

export interface LeafRuleTrace {
  rulePath: string;
  field: string;
  op: string;
  expectedValue: unknown;
  actualValue: unknown;
  result: KleeneValue;
  missingFields: string[];
  sourceId?: string | null;
  clauseReference?: string | null;
  explanation?: string;
}

export interface SchemeRuleWithSource {
  id: string;
  ruleKind: 'eligibility' | 'exclusion';
  ruleJson: RuleNode;
  clauseReference: string;
  sourceId: string;
  sourceTitle?: string;
}

export interface SchemeAssessmentResult {
  outcome: EligibilityOutcome;
  summary: string;
  passedRuleCount: number;
  failedRuleCount: number;
  unknownRuleCount: number;
  missingFields: string[];
  traces: LeafRuleTrace[];
}

export interface SchemeDocumentRequirement {
  id: string;
  documentTypeId: string;
  documentCode: string;
  documentName: string;
  category: string;
  isMandatory: boolean;
  notesEn?: string | null;
  notesBn?: string | null;
}

export interface CitizenDocumentStatus {
  documentTypeId: string;
  documentCode: string;
  status: DocumentStatus;
}

export interface DocumentReadinessItem {
  requirement: SchemeDocumentRequirement;
  citizenStatus: DocumentStatus;
  isReady: boolean;
  isMissing: boolean;
  isInProgress: boolean;
  isUnsure: boolean;
}

export interface DocumentReadinessResult {
  isFullyReady: boolean;
  mandatoryTotal: number;
  mandatoryReady: number;
  items: DocumentReadinessItem[];
  missingMandatoryDocuments: DocumentReadinessItem[];
  inProgressDocuments: DocumentReadinessItem[];
}

