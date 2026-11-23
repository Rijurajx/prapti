-- 0017: Allow public (anon + authenticated) read access to published schemes, versions, and document types
-- This enables public unauthenticated visitors on /explore and marketing pages to browse and search verified schemes.

-- 1. Schemes
drop policy if exists "published or admin can select schemes" on public.schemes;
drop policy if exists "anyone can select published schemes" on public.schemes;
drop policy if exists "admins can select all schemes" on public.schemes;

create policy "anyone can select published schemes"
  on public.schemes for select to authenticated, anon
  using (status = 'published');

create policy "admins can select all schemes"
  on public.schemes for select to authenticated
  using (is_administrator());

-- 2. Scheme Versions
drop policy if exists "published or admin can select scheme versions" on public.scheme_versions;
drop policy if exists "anyone can select published scheme versions" on public.scheme_versions;
drop policy if exists "admins can select all scheme versions" on public.scheme_versions;

create policy "anyone can select published scheme versions"
  on public.scheme_versions for select to authenticated, anon
  using (status = 'published');

create policy "admins can select all scheme versions"
  on public.scheme_versions for select to authenticated
  using (is_administrator());

-- 3. Scheme Documents
drop policy if exists "anyone can view published scheme documents" on public.scheme_documents;
create policy "anyone can view published scheme documents"
  on public.scheme_documents for select to authenticated, anon
  using (
    exists (
      select 1 from public.scheme_versions sv
      join public.schemes s on s.id = sv.scheme_id
      where sv.id = scheme_documents.scheme_version_id
        and sv.status = 'published'
        and s.status = 'published'
    )
  );

-- 4. Document Types
drop policy if exists "authenticated can read document types" on public.document_types;
drop policy if exists "anyone can read document types" on public.document_types;
create policy "anyone can read document types"
  on public.document_types for select to authenticated, anon
  using (true);
