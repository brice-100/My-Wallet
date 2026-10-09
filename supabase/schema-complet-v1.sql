-- =====================================================================
-- PORTEFEUILLE NUMERIQUE PFM - SCHEMA V1 (Supabase / PostgreSQL)
-- Contexte Africain : Mobile Money, Cash, Banque, Tontines, Dettes
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. FONCTIONS UTILITAIRES
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 2. TABLES
-- ---------------------------------------------------------------------

-- 2.1 Profils (1 ligne par utilisateur, liée à auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  currency text not null default 'XOF'
    check (currency in ('XOF','XAF','GNF','CDF','MAD','DZD','TND','NGN','GHS','KES','EUR','USD')),
  pay_day smallint not null default 1 check (pay_day between 1 and 31),
  plan text not null default 'free' check (plan in ('free','premium')),
  role text not null default 'user' check (role in ('user','admin')),
  status text not null default 'active' check (status in ('active','suspended','deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2.2 Portefeuilles (Cash, Mobile Money, Banque)
create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  type text not null check (type in ('cash','mobile_money','bank')),
  provider text, -- ex: 'Wave', 'Orange Money', 'MTN MoMo', 'Moov Money', 'Ecobank'
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (id, user_id)
);

-- 2.3 Catégories
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  type text not null check (type in ('income','expense')),
  icon text,
  parent_id uuid references public.categories(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (id, user_id)
);

-- 2.4 Transactions
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  wallet_id uuid not null,
  category_id uuid,
  amount bigint not null check (amount > 0),
  type text not null
    check (type in ('income','expense','transfer_in','transfer_out','opening')),
  occurred_at timestamptz not null default now(),
  note text check (char_length(note) <= 500),
  transfer_group_id uuid,
  source text not null default 'manual' check (source in ('manual','sms','import')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  foreign key (wallet_id, user_id) references public.wallets(id, user_id),
  foreign key (category_id, user_id) references public.categories(id, user_id),
  check ((type in ('transfer_in','transfer_out')) = (transfer_group_id is not null))
);

-- 2.5 Budgets
create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  category_id uuid not null,
  amount bigint not null check (amount > 0),
  period text not null default 'monthly' check (period in ('monthly','yearly')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  foreign key (category_id, user_id) references public.categories(id, user_id)
);

-- 2.6 Journal d'Audit Admin
create table if not exists public.admin_audit_log (
  id bigint generated always as identity primary key,
  admin_id uuid not null references auth.users(id),
  action text not null,
  target_user_id uuid,
  details jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 3. INDEX
-- ---------------------------------------------------------------------
create index if not exists transactions_user_date_idx
  on public.transactions (user_id, occurred_at desc) where deleted_at is null;
create index if not exists transactions_wallet_idx
  on public.transactions (wallet_id) where deleted_at is null;
create index if not exists transactions_category_idx
  on public.transactions (category_id) where deleted_at is null;
create index if not exists transactions_transfer_idx
  on public.transactions (transfer_group_id) where transfer_group_id is not null;

create index if not exists wallets_user_idx on public.wallets (user_id) where deleted_at is null;
create index if not exists categories_user_idx on public.categories (user_id) where deleted_at is null;
create index if not exists budgets_user_idx on public.budgets (user_id) where deleted_at is null;

create index if not exists transactions_sync_idx on public.transactions (user_id, updated_at);
create index if not exists wallets_sync_idx on public.wallets (user_id, updated_at);
create index if not exists categories_sync_idx on public.categories (user_id, updated_at);
create index if not exists budgets_sync_idx on public.budgets (user_id, updated_at);

create index if not exists profiles_role_idx on public.profiles (role) where role = 'admin';
create index if not exists profiles_status_idx on public.profiles (status);
create index if not exists admin_audit_log_date_idx on public.admin_audit_log (created_at desc);
create index if not exists admin_audit_log_target_idx on public.admin_audit_log (target_user_id);

-- ---------------------------------------------------------------------
-- 4. TRIGGERS
-- ---------------------------------------------------------------------
drop trigger if exists set_updated_at on public.profiles;
create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.wallets;
create trigger set_updated_at before update on public.wallets
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.categories;
create trigger set_updated_at before update on public.categories
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.transactions;
create trigger set_updated_at before update on public.transactions
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.budgets;
create trigger set_updated_at before update on public.budgets
  for each row execute function public.set_updated_at();

-- Création automatique du profil, portefeuille Cash et catégories par défaut
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');

  insert into public.wallets (user_id, name, type)
  values (new.id, 'Cash', 'cash');

  insert into public.categories (user_id, name, type, icon) values
    (new.id, 'Alimentation', 'expense', 'utensils'),
    (new.id, 'Transport', 'expense', 'bus'),
    (new.id, 'Loyer', 'expense', 'home'),
    (new.id, 'Factures', 'expense', 'receipt'),
    (new.id, 'Tontines', 'expense', 'users'),
    (new.id, 'Santé', 'expense', 'heart-pulse'),
    (new.id, 'Éducation', 'expense', 'graduation-cap'),
    (new.id, 'Communication', 'expense', 'smartphone'),
    (new.id, 'Loisirs', 'expense', 'party-popper'),
    (new.id, 'Famille et dons', 'expense', 'gift'),
    (new.id, 'Autres dépenses', 'expense', 'ellipsis'),
    (new.id, 'Salaire', 'income', 'briefcase'),
    (new.id, 'Activité / Business', 'income', 'store'),
    (new.id, 'Aides reçues', 'income', 'hand-heart'),
    (new.id, 'Autres revenus', 'income', 'plus-circle');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 5. FONCTIONS DE CONTROLE ADMIN & STATUT
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and status = 'active'
  );
$$;

create or replace function public.is_active()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and status = 'active'
  );
$$;

revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.is_active() from public, anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_active() to authenticated;

-- ---------------------------------------------------------------------
-- 6. ROW-LEVEL SECURITY (RLS)
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.wallets enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.admin_audit_log enable row level security;

-- Profiles
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "profiles_select_admin" on public.profiles;
create policy "profiles_select_admin" on public.profiles
  for select to authenticated using ((select public.is_admin()));

-- Wallets
drop policy if exists "wallets_select_own" on public.wallets;
create policy "wallets_select_own" on public.wallets
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "wallets_insert_own" on public.wallets;
create policy "wallets_insert_own" on public.wallets
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "wallets_update_own" on public.wallets;
create policy "wallets_update_own" on public.wallets
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "wallets_active_only" on public.wallets;
create policy "wallets_active_only" on public.wallets
  as restrictive for all to authenticated using ((select public.is_active()));

-- Categories
drop policy if exists "categories_select_own" on public.categories;
create policy "categories_select_own" on public.categories
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "categories_insert_own" on public.categories;
create policy "categories_insert_own" on public.categories
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "categories_update_own" on public.categories;
create policy "categories_update_own" on public.categories
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "categories_active_only" on public.categories;
create policy "categories_active_only" on public.categories
  as restrictive for all to authenticated using ((select public.is_active()));

-- Transactions
drop policy if exists "transactions_select_own" on public.transactions;
create policy "transactions_select_own" on public.transactions
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "transactions_insert_own" on public.transactions;
create policy "transactions_insert_own" on public.transactions
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "transactions_update_own" on public.transactions;
create policy "transactions_update_own" on public.transactions
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "transactions_active_only" on public.transactions;
create policy "transactions_active_only" on public.transactions
  as restrictive for all to authenticated using ((select public.is_active()));

-- Budgets
drop policy if exists "budgets_select_own" on public.budgets;
create policy "budgets_select_own" on public.budgets
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "budgets_insert_own" on public.budgets;
create policy "budgets_insert_own" on public.budgets
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "budgets_update_own" on public.budgets;
create policy "budgets_update_own" on public.budgets
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "budgets_active_only" on public.budgets;
create policy "budgets_active_only" on public.budgets
  as restrictive for all to authenticated using ((select public.is_active()));

-- Admin Audit Log
drop policy if exists "audit_select_admin" on public.admin_audit_log;
create policy "audit_select_admin" on public.admin_audit_log
  for select to authenticated using ((select public.is_admin()));

drop policy if exists "audit_insert_admin" on public.admin_audit_log;
create policy "audit_insert_admin" on public.admin_audit_log
  for insert to authenticated with check ((select public.is_admin()));

-- ---------------------------------------------------------------------
-- 7. VUES POUR LE DASHBOARD (security_invoker = true)
-- ---------------------------------------------------------------------

-- 7.1 Solde par portefeuille
create or replace view public.wallet_balances
with (security_invoker = true) as
select
  w.id as wallet_id,
  w.user_id,
  w.name,
  w.type,
  w.provider,
  w.archived,
  coalesce(sum(
    case when t.type in ('income','opening','transfer_in') then t.amount
         when t.type in ('expense','transfer_out') then -t.amount
    end
  ), 0)::bigint as balance
from public.wallets w
left join public.transactions t
  on t.wallet_id = w.id and t.deleted_at is null
where w.deleted_at is null
group by w.id;

-- 7.2 Solde global consolidé
create or replace view public.global_balance
with (security_invoker = true) as
select user_id, sum(balance)::bigint as balance
from public.wallet_balances
where archived = false
group by user_id;

-- 7.3 Revenus et dépenses par mois (Flux)
create or replace view public.monthly_flows
with (security_invoker = true) as
select
  user_id,
  date_trunc('month', occurred_at)::date as month,
  coalesce(sum(amount) filter (where type = 'income'), 0)::bigint as income,
  coalesce(sum(amount) filter (where type = 'expense'), 0)::bigint as expense
from public.transactions
where deleted_at is null and type in ('income','expense')
group by user_id, date_trunc('month', occurred_at);

-- 7.4 Dépenses par catégorie et par mois (Donut)
create or replace view public.spending_by_category_month
with (security_invoker = true) as
select
  t.user_id,
  date_trunc('month', t.occurred_at)::date as month,
  t.category_id,
  c.name as category_name,
  sum(t.amount)::bigint as total
from public.transactions t
left join public.categories c on c.id = t.category_id
where t.deleted_at is null and t.type = 'expense'
group by t.user_id, date_trunc('month', t.occurred_at), t.category_id, c.name;

-- 7.5 Progression des budgets
create or replace view public.budget_progress
with (security_invoker = true) as
select
  b.id as budget_id,
  b.user_id,
  b.category_id,
  c.name as category_name,
  b.period,
  b.amount as budget_amount,
  coalesce(sum(t.amount), 0)::bigint as spent,
  round(coalesce(sum(t.amount), 0) * 100.0 / b.amount, 1) as percent_used
from public.budgets b
join public.categories c on c.id = b.category_id
left join public.transactions t
  on t.category_id = b.category_id
  and t.user_id = b.user_id
  and t.type = 'expense'
  and t.deleted_at is null
  and t.occurred_at >= case b.period
    when 'monthly' then date_trunc('month', now())
    else date_trunc('year', now())
  end
where b.deleted_at is null
group by b.id, c.name;

grant select on public.wallet_balances to authenticated;
grant select on public.global_balance to authenticated;
grant select on public.monthly_flows to authenticated;
grant select on public.spending_by_category_month to authenticated;
grant select on public.budget_progress to authenticated;
