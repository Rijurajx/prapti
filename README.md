# PRAPTI

PRAPTI is an AI-assisted platform that helps Indian citizens discover government
schemes they may be eligible for, understand the eligibility rules, prepare the
documents needed, and track their applications. It is being built in phases;
the current phase covers the foundation: project scaffold, design tokens,
Supabase authentication configuration, and the first database migration.

## Setup

1. Copy the environment template and fill in your Supabase values:

   ```bash
   cp .env.example .env.local
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Apply the database migrations in `supabase/migrations/` in order, either by
   pasting each file into the Supabase SQL editor or with the Supabase CLI.

4. Start the development server:

   ```bash
   npm run dev
   ```

## Scripts

- `npm run dev` - start the Next.js development server on http://localhost:3000
- `npm run build` - create a production build
- `npm run typecheck` - run the TypeScript compiler without emitting files
- `npm test` - run the unit tests with Vitest

## Authentication requires real Supabase credentials

Sign-in, sign-up, password reset and the `/app` area all depend on a real
Supabase project. Without `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, the app shows a configuration page instead of
pretending a session exists. Never put the service role key or the Gemini key
in a `NEXT_PUBLIC_` variable.

## Project layout

- `src/app` - App Router pages, auth routes and layouts
- `src/lib` - environment access, Supabase clients, validation, i18n
- `supabase/migrations` - ordered SQL migrations with row level security
- `PRAPTI-ARCHITECTURE.md` - architecture, data model and authorization design
