# PRAPTI (প্রাপ্তি / प्राप्ति)
### Deterministic Entitlement Discovery & Application Intelligence for Indian Citizens

[![Next.js 15](https://img.shields.io/badge/Next.js-15.1.0-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.0.0-blue?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-API-8E75C2?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Vitest](https://img.shields.io/badge/Vitest-93_Passing-729B1B?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?style=for-the-badge&logo=vercel&logoColor=white)](https://prapti-drab.vercel.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

> **Live Deployment:** [https://prapti-drab.vercel.app](https://prapti-drab.vercel.app)  
> **1-Click Judge Demo Login:** [https://prapti-drab.vercel.app/demo](https://prapti-drab.vercel.app/demo)  
> **GitHub Repository:** [https://github.com/Rijurajx/prapti](https://github.com/Rijurajx/prapti)

---

## ⚡ Quick Navigation for Hackathon Evaluators
- [🏆 Judge & Evaluator Quickstart (First Priority)](#-judge--evaluator-quickstart-first-priority)
  - [Option A: Instant 1-Click Evaluation (Cloud / Zero Setup)](#option-a-instant-1-click-evaluation-cloud--zero-setup)
  - [Option B: Clone & Run Locally on Your Device](#option-b-clone--run-locally-on-your-device)
- [💡 The Core Problem & Prapti's Innovation](#-the-core-problem--praptis-innovation)
- [🏛️ Technical Architecture & Deep-Dive](#-technical-architecture--deep-dive)
  - [1. Deterministic 3-Valued Kleene Logic Engine](#1-deterministic-3-valued-kleene-logic-rule-engine)
  - [2. Privacy by Design: Zero Identity & Document Storage](#2-privacy-by-design-zero-identity--document-storage)
  - [3. Multi-Member Household & Fine-Grained Consent](#3-multi-member-household--fine-grained-consent-model)
  - [4. Document Readiness & 4-Tier Entitlement Categorization](#4-document-readiness--entitlement-categorization)
  - [5. Contextual Prapti AI Companion (Google Gemini RAG)](#5-contextual-prapti-ai-companion-google-gemini-rag)
  - [6. Database Architecture & Row-Level Security (RLS)](#6-database-architecture--row-level-security-rls)
  - [7. Multilingual Infrastructure (i18n)](#7-multilingual-infrastructure-i18n)
- [📂 Project Directory Layout](#-project-directory-layout)
- [🧪 Testing & Quality Assurance](#-testing--quality-assurance)
- [🗺️ Future Expansion Roadmap](#-future-expansion-roadmap)
- [👥 Contact & Submission Details](#-contact--submission-details)

---

## 🏆 Judge & Evaluator Quickstart (First Priority)

We have provided two evaluation pathways for judges: **Option A (Instant Cloud Demo)** requires zero installation, while **Option B (Local Dev)** allows running, inspecting, and testing the entire codebase on your local machine.

---

### Option A: Instant 1-Click Evaluation (Cloud / Zero Setup)

You can evaluate the complete live production platform immediately without cloning or installing dependencies:

1. Click here for instant 1-click authentication: **[https://prapti-drab.vercel.app/demo](https://prapti-drab.vercel.app/demo)**
2. Alternatively, navigate to [https://prapti-drab.vercel.app/auth/sign-in](https://prapti-drab.vercel.app/auth/sign-in) and sign in manually:
   - **Email:** `demo@prapti.app`
   - **Password:** `DemoUser2025!`
3. **What You Will See in the Pre-Seeded Judge Account:**
   The demo account is pre-populated with a realistic, diverse 3-member Indian household designed to test all edge cases of eligibility matching:
   - 👩 **Demo Daughter (Main / Self, 24 years old):** Unemployed graduate with educational qualifications, no property assets. Automatically flagged as eligible for youth entrepreneurship seed funds, higher education coaching stipends, and skill programs.
   - 👵 **Demo Mother (54 years old):** Homemaker enrolled in West Bengal's newly updated direct cash assistance scheme: **Annapurna Bhandar** (receiving ₹3,000/month DBT).
   - 👴 **Demo Father (61 years old):** Retired pensioner with registered agricultural land holding (1.5 acres). Active beneficiary of **PM-KISAN** (₹6,000/yr) and **Krishak Bandhu** (₹10,000/yr), demonstrating asset-based agricultural matching.
4. **Key Features to Test Immediately:**
   - **Household Switching:** Click the top-bar beneficiary selector to switch between Daughter, Mother, and Father—notice instantaneous eligibility re-computation with zero page reload.
   - **"Ask Prapti AI" Contextual Prompting:** On any scheme card or within "My Opportunities", click the **Ask Prapti AI** button to see automatic context injection into the AI chat interface.
   - **Document Readiness Tracker:** Check which schemes are "Ready to Apply" vs. "Document Action Required".
   - **Scheme Status Toggling:** Use the action buttons to mark schemes as *Already Enrolled* or save them to your active tracker.
   - **Theme & Language Switching:** Toggle Dark/Light mode and switch between English, Bengali (বাংলা), Hindi (हिन्दी), and Marathi (मराठी).

---

### Option B: Clone & Run Locally on Your Device

Follow these instructions to run Prapti in your local environment.

#### 1. Prerequisites
- **Node.js:** v18.18.0 or later (v20.x or v24.x recommended)
- **Package Manager:** `npm` (included with Node.js)
- **Git**

#### 2. Clone the Repository
```bash
git clone https://github.com/Rijurajx/prapti.git
cd prapti
```

#### 3. Install Dependencies
```bash
npm install
```

#### 4. Configure Environment Variables
Copy the provided environment template to `.env.local`:
```bash
cp .env.example .env.local
```

Open `.env.local` in your editor and configure the environment variables:
```ini
# Supabase Configuration (URL and Anon key are public client keys)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase Server-Only Secret (Required for administrative actions & demo seeder)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google Gemini API Key (Required for conversational companion & structured fact extraction)
GEMINI_API_KEY=AIzaSy...

# AI Model Execution Mode: "judging" (default: recommended) | "testing" (lite fallback)
GEMINI_MODEL_MODE=judging

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> **Note on Supabase Credentials for Judges:**  
> If you are a hackathon judge who requires pre-provisioned demo Supabase keys to evaluate locally without creating a Supabase project, you can test directly via the cloud deployment at [prapti-drab.vercel.app/demo](https://prapti-drab.vercel.app/demo) or reach out to `rijurajdatta8@gmail.com`.

#### 5. Apply Database Migrations (If Using Your Own Supabase Instance)
If connecting to a clean Supabase project, execute the 19 versioned SQL migrations in `supabase/migrations/` sequentially via the Supabase SQL editor or via the Supabase CLI:
```bash
supabase db push
```
Or paste the migration scripts from `supabase/migrations/0001_foundation.sql` through `supabase/migrations/0019_replace_lakshmir_bhandar_with_annapurna_bhandar.sql`.

#### 6. Seed the Demo Household Account (Optional)
To programmatically generate the 3-member Judge Demo Account in your local database:
```bash
node scripts/seed-demo-account.js
```
*(Creates `demo@prapti.app` with password `DemoUser2025!`, complete with household records, asset profiles, and enrolled schemes).*

#### 7. Start the Development Server
```bash
npm run dev
```
Open your browser and navigate to: **[http://localhost:3000](http://localhost:3000)**  
To directly log in as the Judge Demo user locally: **[http://localhost:3000/demo](http://localhost:3000/demo)**

#### 8. Run Verification & Test Commands
Prapti includes a comprehensive automated test suite with **93 unit and integration tests**:
```bash
# Run unit & integration tests
npm test

# Run TypeScript strict type verification
npm run typecheck

# Test production build compilation
npm run build
```

---

## 💡 The Core Problem & Prapti's Innovation

### The Reality of Welfare in India
- **₹1.5 Lakh Crore ($18B+ USD)** in welfare benefits allocated by Union and State governments goes unclaimed every year.
- **Why?** Eligibility criteria are buried inside dense PDF gazettes across 50+ government portals. Citizens do not know what they are entitled to, whether they qualify, what specific documents are mandatory, or how household member eligibility interacts.
- **The LLM Hallucination Trap:** Generic LLM-based welfare bots are dangerous. If an LLM falsely tells an impoverished citizen they are eligible for a subsidy, they waste days traveling to government offices only to be rejected. If an LLM invents or confuses document requirements, families spend critical savings on unnecessary affidavits.

### Prapti's Hybrid Solution
```
┌────────────────────────────────────────────────────────────────────────┐
│                        PRAPTI HYBRID ARCHITECTURE                      │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   CITIZEN INPUT (Multi-Lingual Onboarding / Profile Questions)         │
│                                │                                       │
│                                ▼                                       │
│   ┌──────────────────────────────────────────────────────────────┐     │
│   │  GEMINI AI ASSISTANT (Strictly Bounded UX Companion)        │     │
│   │  - Structured fact extraction from natural text              │     │
│   │  - Plain-language explanation of eligibility traces          │     │
│   │  - NEVER decides, overrides, or alters eligibility           │     │
│   └────────────────────────────┬─────────────────────────────────┘     │
│                                │ Confirmed facts                       │
│                                ▼                                       │
│   ┌──────────────────────────────────────────────────────────────┐     │
│   │  DETERMINISTIC 3-VALUED KLEENE LOGIC RULE ENGINE             │     │
│   │  - Evaluates PASS / FAIL / UNKNOWN                           │     │
│   │  - Direct gazette clause citation per rule                  │     │
│   │  - Zero false positives: missing info = UNKNOWN             │     │
│   └────────────────────────────┬─────────────────────────────────┘     │
│                                │ Verified outcomes                     │
│                                ▼                                       │
│   ┌──────────────────────────────────────────────────────────────┐     │
│   │  ACTIONABLE CITIZEN DASHBOARD                                │     │
│   │  - Ready to Apply vs. Document Attention Required            │     │
│   │  - Multi-Member Household switching without reload          │     │
│   │  - Zero Identity Storage (No Aadhaar / PAN / Bank Accts)     │     │
│   └──────────────────────────────────────────────────────────────┘     │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

1. **Zero LLM Hallucination in Eligibility:** Eligibility logic is 100% deterministic, auditable, and rule-based (`src/domain/eligibility/evaluator.ts`).
2. **Kleene 3-Valued Logic:** Conditions evaluate to `PASS`, `FAIL`, or `UNKNOWN`. Missing data never silently passes.
3. **Privacy by Design:** Absolutely zero storage of identity document numbers (no Aadhaar, PAN, voter ID, or bank account numbers).
4. **Contextual AI Assistance:** Google Gemini is leveraged for human-centric tasks—conversational onboarding, simplifying official jargon, and providing tailored application guidance.

---

## 🏛️ Technical Architecture & Deep-Dive

Prapti is engineered as a **Modular Monolith** using the Next.js 15 App Router, React 19 Server Components, and Supabase PostgreSQL with strict Row Level Security (RLS).

```
src/
├── app/                    # Next.js 15 App Router: pages, layouts, server actions
│   ├── (app)/              # Authenticated citizen workspace
│   │   ├── dashboard/      # Executive summary & quick actions
│   │   ├── opportunities/  # Ranked schemes & "Ask Prapti AI" triggers
│   │   ├── schemes/        # Verified scheme catalog with last verified dates
│   │   ├── assistant/      # Contextual Gemini RAG assistant chat
│   │   ├── household/      # Multi-member management & consent grants
│   │   ├── profile/        # Personal, financial, education, agricultural, assets
│   │   └── claims/         # Application progress & enrolled scheme tracking
│   ├── demo/               # 1-click Judge demonstration route
│   ├── future-expansion/   # 10+ regional languages roadmap & expansion
│   └── how-it-works/       # Interactive discovery walkthrough
├── domain/                 # Pure TypeScript business logic (zero Next/React dependencies)
│   ├── eligibility/        # 3-valued Kleene evaluator & rule parsers
│   ├── schemes/            # Scheme models, version immutability, sources
│   ├── households/         # Consent records, access grants, relationship enums
│   └── profiles/           # Completeness calculation & asset profiles
├── services/               # Adapters & external APIs
│   ├── ai-client.ts        # Resilient Gemini SDK client with fallback modes
│   ├── rag.ts              # Scheme knowledge base retrieval-augmented generation
│   └── supabase/           # Server, browser, and SSR database clients
└── lib/                    # Shared validation (Zod), i18n dictionaries, env checks
```

---

### 1. Deterministic 3-Valued Kleene Logic Rule Engine

The core evaluation logic (`src/domain/eligibility/evaluator.ts`) does not rely on opaque AI models. Instead, it implements a pure functional **Kleene 3-valued logic system**:

#### Truth Table:
| Operator | Condition | Result |
| :--- | :--- | :--- |
| `all` (AND) | Any child is `FAIL` | **FAIL** |
| `all` (AND) | No `FAIL`, but at least one child is `UNKNOWN` | **UNKNOWN** |
| `all` (AND) | All children are `PASS` | **PASS** |
| `any` (OR) | Any child is `PASS` | **PASS** |
| `any` (OR) | No `PASS`, but at least one child is `UNKNOWN` | **UNKNOWN** |
| `any` (OR) | All children are `FAIL` | **FAIL** |
| `not` (NOT) | Inverts `PASS` ↔ `FAIL`; `UNKNOWN` remains | **UNKNOWN** |

#### Why this matters:
If a government scheme mandates an annual family income under ₹2,50,000 and the user hasn't specified their income, the engine evaluates to `UNKNOWN` (`needs_more_info`), never `PASS`. The system pinpoints the exact missing field and prompts the user to supply it.

Every rule node links to an official `clauseReference` (e.g., *"Section 4(2) of Gazette Notification No. 104-F(P2)"*), allowing citizens and evaluators to inspect the exact legal basis for their qualification.

---

### 2. Privacy by Design: Zero Identity & Document Storage

Most welfare apps indiscriminately collect and store citizens' Aadhaar numbers, PAN cards, and bank account numbers, creating massive cybersecurity and privacy liabilities.

**Prapti's Privacy Guarantee:**
- **Zero Identity Number Storage:** The database schema has **no columns** for Aadhaar numbers, PAN numbers, voter IDs, or bank account numbers.
- **Zero Document Uploads:** Prapti does not ask for or store PDF scans of ID cards.
- **Document Availability Inventory:** Prapti only records binary availability flags (`have`, `do_not_have`, `unsure`) in `citizen_document_inventory`.
- **Anonymized AI Interactions:** Gemini receives only anonymized demographic facts (e.g., "Age: 24, State: WB, Occupation: Student") and never receives PII, phone numbers, or email addresses.

---

### 3. Multi-Member Household & Fine-Grained Consent Model

In rural and semi-urban Indian families, a single smartphone user often applies for schemes on behalf of their parents, siblings, or children. Prapti handles this through a mathematically sound consent system (`src/domain/households/`):

1. **Independent Citizen Profiles:** Each family member has an isolated `citizen_profiles` record.
2. **Fine-Grained Access Grants:** Access between adults requires explicit `consent_records` and `profile_access_grants` rows with defined scopes (`profile_read`, `profile_edit`, `sensitive_read`).
3. **Guardianship Model:** Minor records (`is_minor = true`) are legally linked to a `guardian_user_id`. When the minor turns 18, guardian permissions gracefully transition to require independent consent.
4. **Instantaneous Client-Side Context Switching:** Switching between household beneficiaries switches the active context in memory, immediately recalculating opportunities across the entire catalog with zero layout jitter.

---

### 4. Document Readiness & Entitlement Categorization

Rather than providing a generic list of schemes, Prapti divides discoveries into four actionable buckets:

1. **Enrolled Schemes (Already Receiving):** Schemes the citizen is currently benefiting from (e.g., Mother receiving Annapurna Bhandar ₹3,000/mo, Father receiving PM-KISAN ₹6,000/yr).
2. **Likely Eligible — Ready to Apply:** The citizen meets 100% of the eligibility criteria AND has 100% of the required documents in their inventory.
3. **Likely Eligible — Document Action Required:** The citizen meets the eligibility criteria, but lacks one or more mandatory documents (e.g., needs an updated Domicile Certificate or Income Certificate). Clicking "Ask Prapti AI" immediately provides a step-by-step checklist to obtain the missing paperwork.
4. **Needs More Information:** Key profile attributes (e.g., land acreage, specific caste category) are missing to complete evaluation.

---

### 5. Contextual Prapti AI Companion (Google Gemini RAG)

Prapti integrates Google Gemini through a resilient dual-mode architecture (`src/services/ai-client.ts` and `src/services/rag.ts`):

- **Context-Injected Prompts:** Throughout the dashboard and scheme cards, clicking the **Ask Prapti AI** button generates targeted inquiries (e.g., *"What are my next steps to apply for Annapurna Bhandar?"* or *"What documents am I missing for Swami Vivekananda Merit-cum-Means Scholarship?"*).
- **Zero Duplicate Dispatch:** State-managed with ref guards to guarantee clean single-execution even under React 19 concurrent transitions.
- **Strict Hallucination Containment:** Gemini is grounded in the verified scheme registry and official government gazette sources stored in Supabase. It is strictly prohibited from altering deterministic evaluation outcomes.

---

### 6. Database Architecture & Row-Level Security (RLS)

The Supabase PostgreSQL database contains **19 versioned migrations** with strict Row-Level Security enabled on every table.

Key Relational Entities:
- `user_profiles` & `citizen_profiles`: 1:1 user identity and citizen profile separation.
- `citizen_asset_profiles`: Vehicle, home, and agricultural property ownership facts.
- `schemes`, `scheme_versions`, `scheme_rules`, `scheme_sources`: Fully immutable scheme versioning system. Once published, scheme rules cannot be modified in-place; a new version must be published with an audit trail.
- `household_members`, `consent_records`, `profile_access_grants`: Cryptographically secure household relationship graph.
- `citizen_enrolled_schemes`: Tracking of active Direct Benefit Transfer (DBT) entitlements.

---

### 7. Multilingual Infrastructure (i18n)

To serve India's diverse demographic landscape, Prapti includes built-in multilingual dictionaries (`src/lib/i18n/`):
- **English** (Default)
- **Bengali (বাংলা)** — Fully integrated with Noto Sans Bengali font stacks.
- **Hindi (हिन्दी)**
- **Marathi (मराठी)**

The language selector is engineered with solid high-contrast backgrounds across both light and dark modes, ensuring readability for all citizens.

---

## 📂 Project Directory Layout

```
.
├── .env.example                       # Environment template for local setup
├── README.md                          # Project documentation & evaluation guide
├── PRAPTI-ARCHITECTURE.md             # In-depth architectural design specification
├── package.json                       # Next.js 15, React 19, TypeScript dependencies
├── vitest.config.ts                   # Vitest unit & integration test configuration
├── scripts/
│   └── seed-demo-account.js           # Programmatic 3-member Judge Demo account generator
├── supabase/
│   └── migrations/                    # 19 ordered SQL migrations with RLS policies
│       ├── 0001_foundation.sql
│       ├── 0002_profile_sections.sql
│       ├── ...
│       ├── 0018_enrolled_schemes.sql
│       └── 0019_replace_lakshmir_bhandar_with_annapurna_bhandar.sql
└── src/
    ├── app/                           # App Router routes and layouts
    │   ├── (app)/                     # Protected citizen workspace
    │   ├── api/                       # API route handlers (Gemini AI, Auth callbacks)
    │   ├── auth/                      # Sign-in, Sign-up, Forgot password
    │   ├── demo/                      # Instant 1-click Judge login handler
    │   ├── future-expansion/          # Multi-lingual roadmap & gazette crawler vision
    │   ├── how-it-works/              # Platform explanation
    │   └── schemes/                   # Public scheme explore catalogue
    ├── domain/                        # Pure domain logic (Decoupled & 100% testable)
    │   ├── eligibility/               # 3-valued Kleene logic evaluator
    │   ├── households/                # Consent & permissions model
    │   ├── profiles/                  # Citizen profile types & completeness logic
    │   └── schemes/                   # Scheme domain model & versioning
    ├── services/                      # External services (Supabase, Gemini RAG, Audit)
    └── lib/                           # Framework utilities, Zod schemas, i18n
```

---

## 🧪 Testing & Quality Assurance

Prapti maintains rigorous test discipline. All business logic in `src/domain/` and critical services are tested with **Vitest**:

```bash
npm test
```

### Test Suite Summary:
```
 Test Files  10 passed (10)
      Tests  93 passed (93)
   Duration  323ms

 ✓ src/domain/eligibility/evaluator.test.ts (20 tests)
   - Evaluates PASS, FAIL, UNKNOWN across eq, neq, gt, lt, gte, lte, range, in, contains
   - Correctly propagates Kleene logic across complex nested ALL / ANY / NOT trees
   - Confirms missing required profile data evaluates to UNKNOWN, never PASS
 ✓ src/lib/schemes/versioning.test.ts (14 tests)
   - Verifies version immutability and scheme publication state machines
 ✓ src/lib/household/access.test.ts (13 tests)
   - Verifies access boundaries and strict consent grant rules
 ✓ src/lib/validation/scheme.test.ts (13 tests)
   - Zod schema validation for complex rule trees and clause citations
 ✓ src/lib/household/tokens.test.ts (10 tests)
   - Secure hash token verification for household invites
 ✓ src/services/rag.test.ts (7 tests)
   - Verified context retrieval and RAG prompt assembly
 ✓ src/lib/i18n/i18n.test.ts (6 tests)
   - Multilingual string dictionary fallbacks
 ✓ src/lib/validation/auth.test.ts (5 tests)
   - User authentication input validation
 ✓ src/lib/validation/assets.test.ts (3 tests)
   - Citizen vehicle, property, and agricultural asset validation
 ✓ src/lib/env.test.ts (2 tests)
   - Environment configuration guards
```

---

## 🗺️ Future Expansion Roadmap

Visit our live interactive roadmap at: **[https://prapti-drab.vercel.app/future-expansion](https://prapti-drab.vercel.app/future-expansion)**

1. **Expanding to 10+ Regional & Tribal Languages:**
   - Active development on Tamil (தமிழ்), Telugu (తెలుగు), Kannada (ಕನ್ನಡ), Gujarati (ગુજરાતી), Malayalam (മലയാളം), Odia (ଓଡ଼ିଆ), Punjabi (ਪੰਜਾਬੀ), Assamese (অসমীয়া), and indigenous languages such as Santali (Ol Chiki).
2. **Automated Gazette Crawlers & Verification:**
   - Building automated crawlers for the Gazette of India (`egazette.gov.in`) and State e-Gazettes with automated AST diffing to detect rule revisions and notify affected citizens in real-time.
3. **Voice-First Interactive IVR & WhatsApp Discovery:**
   - Expanding Prapti AI with speech-to-text models to support low-literacy rural citizens via WhatsApp Voice Notes and IVR toll-free helplines.
4. **DigiLocker Zero-Knowledge Integration:**
   - Enabling citizens to verify document availability via DigiLocker OAuth without transferring document files to Prapti servers.

---

## 👥 Contact & Submission Details

- **Hackathon Project:** PRAPTI (প্রাপ্তি / प्राप्ति)
- **Lead Developer:** Rijuraj Datta
- **Email Contact:** [rijurajdatta8@gmail.com](mailto:rijurajdatta8@gmail.com)
- **GitHub Repository:** [https://github.com/Rijurajx/prapti](https://github.com/Rijurajx/prapti)
- **Live Deployment:** [https://prapti-drab.vercel.app](https://prapti-drab.vercel.app)
- **1-Click Judge Demo:** [https://prapti-drab.vercel.app/demo](https://prapti-drab.vercel.app/demo)

---

*Built with precision, empathy, and mathematical rigor to ensure no eligible Indian citizen is left behind.*
