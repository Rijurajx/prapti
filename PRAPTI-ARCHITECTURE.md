# PRAPTI — Technical Architecture

PRAPTI is a web platform that helps Indian citizens discover government benefit schemes they may be eligible for, understand the eligibility conditions, prepare the documents and steps needed, and track their own applications. It is a discovery and application-assistance tool. It does not submit applications to government systems and it does not make binding eligibility determinations.

This document is the design reference for implementation. Where a decision is still open, it is marked as such.

---

## 1. Stack and decisions

| Concern | Choice | Notes |
|---|---|---|
| Framework | Next.js (App Router) + React + TypeScript (`strict: true`) | Server Components by default; Client Components only where interactivity requires them. Server Actions and Route Handlers for mutations. |
| Styling | Tailwind CSS | Design tokens defined once (see section 6). |
| UI primitives | shadcn/ui | Components are copied into the repo and owned by the project; no opaque UI runtime. |
| Icons | Lucide icons | Only icon set in use. |
| Forms | React Hook Form | Field-level validation delegated to Zod schemas. |
| Validation | Zod | One schema per domain input; the same schema validates forms (client) and mutations (server). Server validation is authoritative. |
| Database / Auth | Supabase (PostgreSQL, Supabase Auth, Row Level Security, SQL migrations) | Migrations are versioned SQL files in the repo. Schema changes are never made by hand in the dashboard. |
| AI | Google Gemini, server-side only | Used for structured extraction and assistant responses. Output must validate against a Zod schema. Gemini never decides eligibility (see section 5). |
| Hosting | Vercel-compatible | No long-running in-process state. Background work (reminders) is scheduled through a platform cron or Supabase scheduled job, not in-process timers. |
| Language of UI | English and Bengali | Locale-aware routing or message catalogues; see section 6 for fonts. |

### Architecture style: modular monolith

PRAPTI is a single deployable Next.js application organised as a modular monolith. There are no microservices. Business logic lives in domain folders that do not depend on React or Next.js, so it can be unit-tested directly.

```
src/
  app/                  Next.js App Router: routes, layouts, Server Actions, Route Handlers
  domain/
    eligibility/        Rule types, rule evaluator (pure functions), outcome computation
    profiles/           Citizen profile types, validation, completeness rules
    schemes/            Scheme model, versioning, rule-set compilation, review state
    households/         Household membership, invitations, consent, grant logic
    applications/       Claim model, status transitions, task checklists, reminders
  services/             Adapters and orchestration: Supabase clients, Gemini client, email, audit logger
  components/           Shared UI (shadcn-based primitives and PRAPTI components)
  lib/                  Small framework-agnostic utilities
supabase/
  migrations/           Ordered SQL migrations, including RLS policies
```

Rules of dependency direction:

- `domain/*` imports nothing from `app/`, `services/`, or `components/`.
- `app/*` calls `services/*` and `domain/*`; it does not query tables directly from page components.
- `services/*` is the only layer that talks to Supabase, Gemini, or email.
- Cross-domain calls go through explicit exported functions, not by reaching into another domain's internal files.

### Relational versus JSONB

- Relational tables are used for: identity, memberships, permissions and grants, consent, schemes and their versions, rules, sources, eligibility results, applications, status history, reminders, and audit logs. These need constraints, foreign keys, and queryable history.
- JSONB is used only where flexibility materially helps: the structured body of a rule tree (`scheme_rules.rule_json`), and extracted AI payloads kept for review (`ai_extraction_payloads`, not yet scheduled). Any JSONB column that is queried for filtering gets a note in its migration explaining why it is not normalised.
- Money, dates, and enumerations that drive logic are typed columns, not JSONB keys.

---

## 2. Route structure

### Public (no session required)

| Route | Purpose |
|---|---|
| `/` | Landing page |
| `/how-it-works` | Explains the discovery and assistance process and its limits |
| `/explore` | Browse published schemes without a profile (no personalised results) |
| `/about` | Project description |
| `/privacy` | Privacy notice |
| `/terms` | Terms of use |
| `/auth/sign-in` | Sign in (email and password; Google OAuth optional) |
| `/auth/sign-up` | Create account |
| `/auth/forgot-password` | Request password reset |
| `/auth/callback` | Supabase auth code exchange and redirect handler |

### Authenticated (`/app/*`, requires session; middleware redirects unauthenticated users to sign-in)

| Route | Purpose |
|---|---|
| `/app/dashboard` | Summary: profile completeness, new opportunities, open applications, reminders |
| `/app/opportunities` | Schemes ranked by eligibility outcome for the active profile |
| `/app/schemes` | Full scheme browser with detail pages |
| `/app/saved` | Schemes the user has bookmarked |
| `/app/applications` | Claims, status and checklists |
| `/app/reminders` | Reminders for deadlines and pending tasks |
| `/app/profile/personal` | Personal details |
| `/app/profile/address` | Address records |
| `/app/profile/finance` | Financial profile (income band, bank-account presence; no account numbers) |
| `/app/profile/employment` | Employment profile |
| `/app/profile/education` | Education records and institutions |
| `/app/profile/agriculture` | Agricultural profile (land holding, crops) |
| `/app/profile/documents` | Document availability inventory (status only) |
| `/app/household` | Household creation, members, invitations, consent, profile switching |
| `/app/assistant` | AI-assisted onboarding and question answering (structured output only) |
| `/app/guides` | Plain-language guides on application steps |
| `/app/help` | Help and support contact |
| `/app/settings` | Account settings, language, notification preferences |
| `/app/privacy` | Personal data controls: export, profile editing, account deletion |

The active citizen profile is held in session context. Switching profile (own or a household member's, where granted) is a server-checked action, not a client-only state change.

### Admin

| Route | Purpose |
|---|---|
| `/admin/schemes` | Scheme catalogue: create and edit drafts, rule versioning, source attachment, review and publish |

Admin routes require an `administrator` role row in the database. The role check is performed in a server layout and again in every admin Server Action. Admin access does not grant access to citizen profile data.

---

## 3. Database entities

All tables live in the `public` schema with RLS enabled. Primary keys are UUIDs. Every table has `created_at` and `updated_at` (`timestamptz`) unless noted. Foreign keys reference `auth.users(id)` only from `user_profiles`; everything else references PRAPTI's own tables.

Notation: `PK` primary key, `FK` foreign key, `UQ` unique.

### 3.1 Identity

| Table | Key columns | Relationships |
|---|---|---|
| `user_profiles` | `id` PK (= `auth.users.id`), `display_name`, `preferred_language` (`en`/`bn`), `deleted_at` | 1:1 with `auth.users`; 1:1 with `citizen_profiles` |
| `citizen_profiles` | `id` PK, `owner_user_id` FK→`user_profiles` (nullable for dependants without an account), `full_name`, `date_of_birth`, `gender`, `is_minor` (generated from DOB), `guardian_user_id` FK→`user_profiles` (nullable) | Owned by one account; may be a dependant managed by a guardian |

`citizen_profiles` holds the person whose data is being recorded. A person has exactly one citizen profile. The account holder's own profile has `owner_user_id` set to their account.

### 3.2 Households

| Table | Key columns | Relationships |
|---|---|---|
| `households` | `id` PK, `name`, `created_by_user_id` FK→`user_profiles` | Creation records the creator but grants the creator no access to other adults' data |
| `household_members` | `id` PK, `household_id` FK, `citizen_profile_id` FK, `relationship` (enum), `status` (`active`/`removed`), UQ(`household_id`,`citizen_profile_id`) | Links a citizen profile into a household |
| `household_invitations` | `id` PK, `household_id` FK, `invitee_email`, `token_hash`, `expires_at`, `status` (`pending`/`accepted`/`declined`/`expired`), `invited_by_user_id` FK | Token stored hashed; accepting creates a `household_members` row and a `consent_records` row |
| `household_facts` | `id` PK, `household_id` FK, `fact_key` (enum), `fact_value` (typed), UQ(`household_id`,`fact_key`) | Household-level facts such as dwelling type; not personal data of a member |
| `consent_records` | `id` PK, `citizen_profile_id` FK, `grantee_user_id` FK (nullable), `scope` (enum), `granted_at`, `revoked_at`, `consent_text_version` | Append-only in practice: revocation sets `revoked_at`; a new grant is a new row |
| `profile_access_grants` | `id` PK, `citizen_profile_id` FK, `grantee_user_id` FK, `access_level` (`read`/`edit`), `sensitivity_tier` (`standard`/`sensitive`), `source_consent_id` FK→`consent_records`, `expires_at` nullable, `revoked_at` | The operational permission table consulted by RLS and services |

### 3.3 Citizen information

All citizen-information tables reference `citizen_profile_id` FK→`citizen_profiles`.

| Table | Key columns | Notes |
|---|---|---|
| `citizen_addresses` | `id`, `citizen_profile_id`, `address_type`, `state_code`, `district_code`, `pincode`, `is_current` | Location codes reference reference tables, not free text, where possible |
| `citizen_financial_profiles` | `id`, `citizen_profile_id` UQ, `income_band` (enum), `has_bank_account` (bool), `is_sensitive_grant_required` | No bank account numbers, PAN, or Aadhaar. Income stored as band, not exact amount, unless a later decision changes this |
| `citizen_employment_profiles` | `id`, `citizen_profile_id`, `employment_status` (enum), `sector` (enum), `is_current` | One current row per profile enforced by partial unique index |
| `citizen_agricultural_profiles` | `id`, `citizen_profile_id` UQ, `operates_land` (bool), `land_area_band` (enum), `crop_categories` (text[]) | Area bands rather than exact holdings in the first release |
| `citizen_attributes` | `id`, `citizen_profile_id`, `attribute_key` (enum), `attribute_value` (typed), `sensitivity_tier`, UQ(`citizen_profile_id`,`attribute_key`) | Generic typed attribute store for eligibility facts (e.g. disability status, social category). Sensitive tiers require sensitive grants (section 4) |

### 3.4 Education

| Table | Key columns | Relationships |
|---|---|---|
| `education_institutions` | `id`, `name`, `institution_type` (enum), `state_code`, `verified` (bool) | Reference data; not per-citizen |
| `education_records` | `id`, `citizen_profile_id` FK, `institution_id` FK, `level` (enum), `course_name`, `start_date`, `end_date`, `is_current` | One citizen can have many records |
| `education_semester_results` | `id`, `education_record_id` FK, `term_label`, `percentage` (numeric 0–100 check), `passed` (bool) | Stored only if the citizen provides them and a scheme's rules need them |

### 3.5 Documents

| Table | Key columns | Relationships |
|---|---|---|
| `document_types` | `id`, `code` UQ, `label_en`, `label_bn`, `category` | Reference catalogue of document kinds (e.g. "residence proof") |
| `citizen_document_inventory` | `id`, `citizen_profile_id` FK, `document_type_id` FK, `availability` (`have`/`do_not_have`/`unsure`), `updated_at`; UQ(`citizen_profile_id`,`document_type_id`) | Records availability only. It never stores document numbers, images, or files |

### 3.6 Schemes

| Table | Key columns | Relationships |
|---|---|---|
| `schemes` | `id`, `slug` UQ, `name_en`, `name_bn`, `ministry_label`, `status` (`draft`/`in_review`/`published`/`retired`), `current_version_id` FK→`scheme_versions` (nullable) | One scheme has many versions |
| `scheme_versions` | `id`, `scheme_id` FK, `version_number`, `effective_from`, `effective_to`, `status`, `summary_en`, `summary_bn`, UQ(`scheme_id`,`version_number`) | Immutable once published; edits create a new version |
| `scheme_rules` | `id`, `scheme_version_id` FK, `rule_kind` (`eligibility`/`exclusion`), `rule_json` (JSONB, validated by Zod before insert), `source_id` FK→`scheme_sources`, `clause_reference` | Rule tree per version (format in section 5) |
| `scheme_documents` | `id`, `scheme_version_id` FK, `document_type_id` FK, `is_mandatory`, `notes_en`, `notes_bn` | Documents required for a scheme version |
| `scheme_application_steps` | `id`, `scheme_version_id` FK, `step_order` UQ per version, `title_en`, `title_bn`, `body_en`, `body_bn`, `source_id` FK | Ordered steps shown to the user |
| `scheme_sources` | `id`, `scheme_version_id` FK, `source_type` (`official_document`/`official_website`/`gazette`/`other`), `title`, `publisher`, `url` (nullable), `retrieved_on`, `verified_by_user_id` FK, `verified_at` | Every rule and step must reference a source. A source is verified by a human reviewer before publication |

### 3.7 Matching

| Table | Key columns | Relationships |
|---|---|---|
| `eligibility_assessments` | `id`, `citizen_profile_id` FK, `scheme_version_id` FK, `outcome` (`likely_eligible`/`needs_more_info`/`likely_ineligible`/`cannot_assess`), `profile_snapshot_hash`, `evaluated_at`, `rules_engine_version` | One row per evaluation; stale when the profile or scheme version changes |
| `eligibility_rule_results` | `id`, `assessment_id` FK, `rule_path` (text, e.g. `all[2].any[0]`), `result` (`PASS`/`FAIL`/`UNKNOWN`), `missing_fields` (text[]), `source_id` FK | Per-leaf trace that explains the outcome to the user |

### 3.8 Applications

| Table | Key columns | Relationships |
|---|---|---|
| `claims` | `id`, `citizen_profile_id` FK, `scheme_version_id` FK, `status` (enum), `reference_note` (user-entered, optional), `submitted_on_user_report` (date, optional) | Records the user's own tracking of an application made elsewhere. PRAPTI does not submit to government systems |
| `claim_tasks` | `id`, `claim_id` FK, `scheme_application_step_id` FK (nullable), `title`, `is_done`, `due_on` (nullable) | Checklist per claim |
| `claim_status_events` | `id`, `claim_id` FK, `from_status`, `to_status`, `actor_user_id` FK, `note`, `occurred_at` | Append-only status history |
| `reminders` | `id`, `citizen_profile_id` FK, `claim_id` FK (nullable), `kind` (enum), `due_at`, `channel` (`in_app`/`email`), `delivered_at` (nullable) | Delivery is a service concern; reminder rows are the source of truth |

### 3.9 Governance

| Table | Key columns | Relationships |
|---|---|---|
| `admin_audit_logs` | `id`, `actor_user_id` FK, `action` (enum), `target_table`, `target_id`, `at`, `request_id` | Written for every admin mutation and every citizen-data access by a non-owner |
| `scheme_review_events` | `id`, `scheme_version_id` FK, `reviewer_user_id` FK, `decision` (`approved`/`changes_requested`/`rejected`), `comment`, `at` | Human review trail before publication |

Audit rows store identifiers and action names, not personal data values.

---

## 4. Authorization and consent boundaries

### 4.1 Roles

| Role | Scope | How it is granted |
|---|---|---|
| **Owner** | Full read and edit of their own `citizen_profiles` and dependent rows | Automatic for the account whose `user_profiles.id` equals `citizen_profiles.owner_user_id` |
| **Household member with explicit grant** | Read, and optionally edit, another adult's data within the scope of a `profile_access_grants` row | Only after the adult creates a `consent_records` entry and a `profile_access_grants` row. Revocable at any time |
| **Guardian** | Manage a minor's profile | `citizen_profiles.guardian_user_id` set, verified through guardian consent recorded in `consent_records`. Access to a minor's profile ends or narrows when the minor reaches adulthood (`is_minor` becomes false), and the relationship must be re-consented by the individual |
| **Administrator** | Scheme catalogue only (`/admin/schemes`, scheme tables, review tables) | `administrator` role row, assigned out of band. Has no read path to `citizen_*` tables, `household_*` tables, or `claims` |

### 4.2 Consent rules

- Adult family members must explicitly consent before any of their data is visible to another account. Consent is a `consent_records` row with a scope and a consent text version.
- The household creator receives no automatic access to another adult's profile. Creating a household grants the creator access only to their own profile and to household-level facts.
- Consent is scoped. Scopes are enumerated (for example: `profile_read`, `profile_edit`, `financial_read`, `sensitive_read`). A grant for one scope does not imply another.
- Revocation sets `revoked_at` on the consent and on every `profile_access_grants` row it created. Revocation takes effect on the next request; cached eligibility results are not shown after revocation.
- Consent text versions are recorded so that the exact wording agreed to can be reproduced.

### 4.3 Sensitive attributes

Attributes such as disability status and social category are classified `sensitive` in `citizen_attributes.sensitivity_tier` and in `profile_access_grants.sensitivity_tier`.

- Sensitive data requires a separate grant with `sensitivity_tier = 'sensitive'`. A standard profile-read grant never exposes it.
- Sensitive values are excluded from household views, from AI prompts, and from logs.
- Matching may use a sensitive attribute only for the owner's own assessment or an explicitly sensitive-granted assessment. Otherwise the rule evaluates to UNKNOWN (section 5), which surfaces as "needs more information" to the viewer, not as a hidden failure.

### 4.4 Enforcement layers

Every server mutation performs an explicit authorization check before touching data:

1. The Server Action or Route Handler resolves the session user server-side (never from a client-supplied user id).
2. The service layer calls an access check function such as `canActOnProfile(actorUserId, citizenProfileId, action, sensitivityTier)`. The check reads `citizen_profiles`, `household_members`, and `profile_access_grants`.
3. Denied requests return a generic forbidden error and write an audit entry for non-owner attempts.
4. Postgres RLS policies on every table repeat the same rule using `auth.uid()`. RLS is the second line of defence: it protects against a missed check in application code, and against direct client queries with the anon key. It is not the only line.

RLS policies are written in migrations and covered by tests that attempt cross-profile reads and writes as each role.

---

## 5. Eligibility rule data format

### 5.1 Rule types

Rules are a typed discriminated union, serialised as JSON in `scheme_rules.rule_json` and validated with Zod on write and on read.

```ts
type Rule = LeafRule | AllRule | AnyRule | NotRule;

type SourceRef = {
  sourceId: string;        // scheme_sources.id
  clauseReference: string; // human-readable clause pointer, e.g. "Section 3(b)"
};

type Conditional = {
  conditional?: boolean;   // true when the clause applies only under a stated circumstance
};

type LeafRule = Conditional & {
  op: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin'
    | 'contains' | 'date_before' | 'date_after' | 'range' | 'exists';
  field: string;           // dotted path into the evaluation fact set, e.g. "address.stateCode"
  value?: LeafValue;       // shape depends on op; absent for 'exists'
  sourceRef: SourceRef;
};

type AllRule = Conditional & { all: Rule[]; sourceRef: SourceRef };
type AnyRule = Conditional & { any: Rule[]; sourceRef: SourceRef };
type NotRule = Conditional & { not: Rule; sourceRef: SourceRef };
```

Value shapes by operator:

| op | value |
|---|---|
| `eq`, `neq`, `gt`, `gte`, `lt`, `lte` | scalar (string, number, boolean) |
| `in`, `nin` | non-empty array of scalars |
| `contains` | scalar; field must be an array |
| `date_before`, `date_after` | ISO-8601 date string |
| `range` | `{ min?: number; max?: number; minInclusive?: boolean; maxInclusive?: boolean }`, at least one bound present |
| `exists` | none; passes when the field is present and non-null |

Constraints enforced by Zod: `field` must be a registered fact path (an allow-list generated from the profile schema), so a rule cannot reference an undefined fact. Operators must be compatible with the field's declared type.

### 5.2 Three-valued evaluation

Each leaf evaluates to `PASS`, `FAIL`, or `UNKNOWN`. Composites combine results with Kleene logic:

- `all`: FAIL if any child FAIL; UNKNOWN if no FAIL and any child UNKNOWN; PASS otherwise.
- `any`: PASS if any child PASS; UNKNOWN if no PASS and any child UNKNOWN; FAIL otherwise.
- `not`: swaps PASS and FAIL; UNKNOWN stays UNKNOWN.
- A leaf whose field is missing or not visible to the viewer evaluates to UNKNOWN, never to PASS.
- A `conditional` rule whose circumstance cannot be established evaluates to UNKNOWN.

The invariant is that **an unknown mandatory condition is never silently treated as passing**. Missing data cannot turn into a positive result.

Each evaluated leaf writes an `eligibility_rule_results` row with its `rule_path`, result, the fields it was missing, and its `source_id`.

### 5.3 Outcomes

| Outcome | Condition (top-level eligibility tree) |
|---|---|
| `likely_ineligible` | Top-level result is FAIL, or any exclusion rule is PASS |
| `needs_more_info` | Top-level result is UNKNOWN; the result lists the fields that would resolve it |
| `likely_eligible` | Top-level result is PASS and no exclusion rule is PASS |
| `cannot_assess` | The scheme version has no machine-evaluable rules, or the required profile is absent for the rule set |

Outcome wording is always "likely", never a determination. Each outcome links to the assessment trace and to the scheme sources. The engine is deterministic: the same profile snapshot and scheme version always produce the same outcome, and the `rules_engine_version` is stored with each assessment.

### 5.4 Role of Gemini

Gemini is used for:

- Extracting structured fields from a user's free-text answers during onboarding, returned as JSON and validated by Zod. Extracted values are shown to the user for confirmation before they are saved.
- Explaining a trace in plain language, using the stored outcome and sources as input.
- Answering questions about schemes from the verified scheme text.

Gemini never produces, changes, or overrides an eligibility outcome, a rule, or a scheme source. Gemini calls run only on the server, receive no sensitive attributes, and their raw responses are not persisted outside reviewed payloads.

---

## 6. Design system

- **Background:** warm off-white.
- **Text:** deep charcoal, with a secondary grey for helper text that meets contrast requirements.
- **Primary accent:** one muted teal or forest green, used for primary actions, active navigation, and focus rings. No second brand colour.
- **Semantic status colours:** subtle success, warning, danger, and informational tones. Outcomes are conveyed by icon and label as well as colour, so colour is never the only signal.
- **Typography:** Geist or Inter for English; Noto Sans Bengali for Bengali. Bengali text is set with its own font stack and line height, not by falling back to the English font.
- **Spacing:** one scale (for example 4, 8, 12, 16, 24, 32, 48 px) used everywhere; no ad-hoc pixel values.
- **Cards:** understated — low-contrast border, minimal shadow, generous internal padding.
- **Icons:** Lucide icons only.
- **Motion:** short transitions only; `prefers-reduced-motion` disables non-essential animation.
- **Navigation:** on mobile, a bottom navigation bar with the primary destinations and a "More" sheet for the rest. On desktop, a persistent left sidebar. The two are separate components, not one responsive collapse of the same markup.
- **Accessibility:** keyboard-operable navigation, visible focus, labelled form fields with error text linked to inputs, touch targets of at least 44 px.

---

## 7. Privacy

- **No identity-document numbers.** PRAPTI never collects Aadhaar numbers or any other identity-document number (PAN, voter ID, passport, driving licence, and similar). Schema, forms, validation, and AI prompts exclude these fields. The document inventory records availability only.
- **No document uploads in the initial scope.** No file storage bucket is provisioned for citizen documents in the first release.
- **Minors.** Data for a person under 18 is entered and managed by a guardian who has recorded consent. The minor's own consent is requested when they reach adulthood.
- **Deletion and editing.** Users can edit every field of their own profile and delete their account from `/app/privacy`. Deletion removes personal rows (profile, addresses, financial, employment, agricultural, education, inventory, assessments, claims, reminders, consents, grants). Audit logs retain only identifiers and action names, as required for security; the retention period is an open decision.
- **Data export.** Users can download their own profile data in a machine-readable form from `/app/privacy`.
- **Privacy-first logging.** Application logs record request identifiers, route, status code, and error class. They never record names, dates of birth, financial or agricultural values, sensitive attributes, free text entered by users, AI prompts, or AI responses. Error tracking, if added, must be configured with the same redaction rules.
- **Third parties.** Gemini receives only the minimum fields needed for the specific request, never identifiers beyond what is necessary, and never sensitive attributes.

---

## 8. Phased implementation checklist

Each phase must be tested before the next phase begins. "Tested" means the phase's automated tests pass, its RLS and authorization tests pass where relevant, and its acceptance criteria are reviewed.

- [ ] **Phase 1 — Foundation.** Next.js TypeScript (strict) scaffold; Tailwind and shadcn/ui; design tokens; Supabase client configuration for browser, server, and middleware; environment validation with Zod; first SQL migrations including RLS enabled on all tables; migration and RLS test harness.
- [ ] **Phase 2 — Core interface.** Landing, explore, how-it-works, about, privacy, and terms pages; auth pages and callback; onboarding shell; dashboard shell; responsive navigation (mobile bottom bar, desktop sidebar); empty and error states.
- [ ] **Phase 3 — Citizen intelligence.** Personal, address, finance, employment, agriculture, education, and document-inventory profile pages; typed Zod schemas; profile completeness logic; owner-only authorization tests.
- [ ] **Phase 4 — Household management.** Household creation; invitations with hashed tokens and expiry; consent recording and revocation; grant-based profile switching; authorization tests for every cross-profile path, including "creator cannot read adult member" cases.
- [ ] **Phase 5 — Scheme intelligence.** Scheme registry; admin editor for `/admin/schemes`; version immutability after publication; source attachment; human review events; rule JSON validation; admin-only authorization tests.
- [ ] **Phase 6 — Matching.** Deterministic rule evaluator with unit tests for every operator and for Kleene combinations; UNKNOWN propagation tests; outcome computation tests; discovery pages; document-readiness view derived from inventory.
- [ ] **Phase 7 — AI.** Gemini server client; Zod-validated structured extraction for onboarding with user confirmation; onboarding assistant; Bengali UI strings and font verification; tests that AI output cannot alter eligibility outcomes.
- [ ] **Phase 8 — Application workflow.** Claims; status transitions with a state machine and append-only status events; checklists from scheme steps; reminders with in-app delivery; optional email delivery once a provider is configured.
- [ ] **Phase 9 — Production hardening.** Security review of RLS and Server Actions; error boundaries and not-found pages; accessibility audit; end-to-end tests for core journeys; logging redaction tests; README; deployment documentation for Vercel and Supabase.

---

## 9. External credentials and inputs not yet configured

| Item | Needed for | Where it lives | Status |
|---|---|---|---|
| Supabase project URL | All data and auth access | Public environment variable | Not configured |
| Supabase anon key | Browser and server clients under RLS | Public environment variable | Not configured |
| Supabase service-role key | Trusted server-only operations (never exposed to the browser) | Server-only secret | Not configured |
| Google OAuth client ID and secret | Optional sign-in with Google | Supabase Auth provider settings | Optional; not configured |
| Gemini API key | Structured extraction and assistant (Phase 7) | Server-only secret | Not configured |
| Email provider credentials | Optional email reminders (Phase 8) | Server-only secret | Optional; not configured |
| Official scheme source data | Scheme catalogue content | Entered through `/admin/schemes` after human verification | Not provided. Must be sourced from official publications and verified by a human reviewer. PRAPTI does not generate scheme content, thresholds, deadlines, or URLs |

Until official source data is supplied and verified, the catalogue contains no published schemes, and matching reports `cannot_assess` rather than inventing results.

---

## 10. Open decisions

- Retention period for audit logs after account deletion.
- Whether income is stored as bands only or as exact values in a later release.
- Mechanism for assigning the `administrator` role (out-of-band procedure to be documented).
- Supported Indian states and languages beyond English and Bengali.
- Choice of error-tracking service, if any, and its redaction configuration.
