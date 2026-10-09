-- =====================================================================
-- Migration : Système d'Audit et Journalisation des Actions Administrateur
-- =====================================================================

-- 1. Table admin_audit_log si non existante
create table if not exists public.admin_audit_log (
  id bigint generated always as identity primary key,
  admin_id uuid not null references auth.users(id),
  action text not null,
  target_user_id uuid,
  details jsonb,
  created_at timestamptz not null default now()
);

-- 2. Index de performance
create index if not exists admin_audit_log_date_idx on public.admin_audit_log (created_at desc);
create index if not exists admin_audit_log_target_idx on public.admin_audit_log (target_user_id);

-- 3. Activation RLS
alter table public.admin_audit_log enable row level security;

-- 4. Politiques RLS (Lecture et Insertion réservées aux Super-Admins)
drop policy if exists "audit_select_admin" on public.admin_audit_log;
create policy "audit_select_admin" on public.admin_audit_log
  for select to authenticated using ((select public.is_admin()));

drop policy if exists "audit_insert_admin" on public.admin_audit_log;
create policy "audit_insert_admin" on public.admin_audit_log
  for insert to authenticated with check ((select public.is_admin()));
