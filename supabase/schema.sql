-- =============================================================================
-- Quincena — esquema de base de datos (PostgreSQL / Supabase)
-- =============================================================================
-- Filosofía de datos: cada quincena aporta a UNA sola meta activa por mes.
-- Las metas y contribuciones nunca se borran (historial permanente); el
-- estado "actual" siempre se puede reconstruir a partir del historial.
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- profiles: espejo 1:1 de auth.users, creado automáticamente al registrarse.
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- goal_categories: catálogo global (no depende del usuario) de las 4
-- categorías de la ruleta. Legible por cualquier usuario autenticado.
-- -----------------------------------------------------------------------------
create table if not exists public.goal_categories (
  id text primary key,
  name text not null,
  priority text not null check (priority in ('maxima', 'alta', 'media', 'baja')),
  default_target numeric(12, 2) not null check (default_target > 0),
  color text not null,
  icon text not null,
  description text not null,
  weight numeric(5, 2) not null check (weight > 0),
  -- null = categoría global (las 4 de fábrica); no-null = categoría que un
  -- usuario agregó a SU propia ruleta, invisible para los demás.
  user_id uuid references public.profiles (id) on delete cascade,
  -- "Quitar" una categoría no la borra (goals.category_id la referencia y
  -- no tiene ON DELETE CASCADE — perdería el historial); solo se archiva,
  -- así deja de salir en la ruleta pero las metas pasadas la siguen
  -- resolviendo bien (nombre/color/ícono).
  archived_at timestamptz
);

alter table public.goal_categories add column if not exists user_id uuid references public.profiles (id) on delete cascade;
alter table public.goal_categories add column if not exists archived_at timestamptz;

alter table public.goal_categories enable row level security;

drop policy if exists "goal_categories_select_all" on public.goal_categories;
drop policy if exists "goal_categories_select_own_and_global" on public.goal_categories;
create policy "goal_categories_select_own_and_global" on public.goal_categories
  for select using (auth.role() = 'authenticated' and (user_id is null or user_id = auth.uid()));

drop policy if exists "goal_categories_insert_own" on public.goal_categories;
create policy "goal_categories_insert_own" on public.goal_categories
  for insert with check (auth.uid() = user_id);

drop policy if exists "goal_categories_delete_own" on public.goal_categories;
create policy "goal_categories_delete_own" on public.goal_categories
  for delete using (auth.uid() = user_id);

drop policy if exists "goal_categories_update_own" on public.goal_categories;
create policy "goal_categories_update_own" on public.goal_categories
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- income_configs: ingreso quincenal y su desglose (transporte, metas, libre).
-- Un registro por usuario; se actualiza in place pero conserva updated_at.
-- -----------------------------------------------------------------------------
create table if not exists public.income_configs (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  biweekly_income numeric(12, 2) not null check (biweekly_income >= 0),
  fixed_transport numeric(12, 2) not null default 0 check (fixed_transport >= 0),
  goals_allocation numeric(12, 2) not null check (goals_allocation >= 0),
  free_money numeric(12, 2) not null default 0 check (free_money >= 0),
  updated_at timestamptz not null default now()
);

alter table public.income_configs enable row level security;

drop policy if exists "income_configs_all_own" on public.income_configs;
create policy "income_configs_all_own" on public.income_configs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- goals: una meta activa (o histórica) por usuario y por mes. La ruleta crea
-- exactamente una fila aquí cada mes; nunca se borra, solo cambia de status.
-- -----------------------------------------------------------------------------
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  category_id text not null references public.goal_categories (id),
  month text not null check (month ~ '^\d{4}-\d{2}$'),
  target_amount numeric(12, 2) not null check (target_amount > 0),
  accumulated_amount numeric(12, 2) not null default 0 check (accumulated_amount >= 0),
  status text not null default 'active' check (status in ('active', 'completed', 'archived')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (user_id, month)
);

create index if not exists goals_user_id_idx on public.goals (user_id);

alter table public.goals enable row level security;

drop policy if exists "goals_all_own" on public.goals;
create policy "goals_all_own" on public.goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- contributions: cada aporte quincenal a una meta. Fuente de verdad del
-- historial de acumulación; goals.accumulated_amount se deriva de aquí.
-- -----------------------------------------------------------------------------
create table if not exists public.contributions (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  quincena smallint not null check (quincena in (1, 2)),
  month text not null check (month ~ '^\d{4}-\d{2}$'),
  -- El aporte lo confirma el usuario cada quincena (puede ser menos que lo
  -- sugerido si no le alcanzó); estos dos campos son el respaldo de ese
  -- aporte real, no del monto calculado en el onboarding.
  photo_url text,
  storage_location text,
  created_at timestamptz not null default now(),
  unique (goal_id, month, quincena)
);

alter table public.contributions add column if not exists photo_url text;
alter table public.contributions add column if not exists storage_location text;

create index if not exists contributions_goal_id_idx on public.contributions (goal_id);
create index if not exists contributions_user_id_idx on public.contributions (user_id);

alter table public.contributions enable row level security;

drop policy if exists "contributions_all_own" on public.contributions;
create policy "contributions_all_own" on public.contributions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Mantiene goals.accumulated_amount sincronizado con la suma de contribuciones.
create or replace function public.sync_goal_accumulated_amount()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  target_goal_id uuid := coalesce(new.goal_id, old.goal_id);
  new_total numeric(12, 2);
  goal_target numeric(12, 2);
begin
  select coalesce(sum(amount), 0) into new_total
  from public.contributions
  where goal_id = target_goal_id;

  select target_amount into goal_target from public.goals where id = target_goal_id;

  update public.goals
  set
    accumulated_amount = new_total,
    status = case when new_total >= goal_target then 'completed' else status end,
    completed_at = case when new_total >= goal_target and completed_at is null then now() else completed_at end
  where id = target_goal_id;

  return coalesce(new, old);
end;
$$;

drop trigger if exists on_contribution_change on public.contributions;
create trigger on_contribution_change
  after insert or update or delete on public.contributions
  for each row execute function public.sync_goal_accumulated_amount();

-- -----------------------------------------------------------------------------
-- expenses: gastos manuales (y en el futuro automáticos) del usuario.
-- -----------------------------------------------------------------------------
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  category text not null default 'general',
  title text not null default '',
  photo_url text,
  date date not null default current_date,
  source text not null default 'manual' check (source in ('manual', 'auto')),
  created_at timestamptz not null default now()
);

-- Migración idempotente para instalaciones que ya tenían la tabla con el
-- nombre de columna anterior ("description") y sin foto de comprobante.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'expenses' and column_name = 'description'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'expenses' and column_name = 'title'
  ) then
    alter table public.expenses rename column description to title;
  end if;
end $$;

alter table public.expenses add column if not exists photo_url text;

create index if not exists expenses_user_id_date_idx on public.expenses (user_id, date desc);

alter table public.expenses enable row level security;

drop policy if exists "expenses_all_own" on public.expenses;
create policy "expenses_all_own" on public.expenses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- roulette_spins: registro histórico de cada giro. Un giro por usuario y mes.
-- -----------------------------------------------------------------------------
create table if not exists public.roulette_spins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  month text not null check (month ~ '^\d{4}-\d{2}$'),
  result_category_id text not null references public.goal_categories (id),
  spun_at timestamptz not null default now(),
  unique (user_id, month)
);

alter table public.roulette_spins enable row level security;

drop policy if exists "roulette_spins_all_own" on public.roulette_spins;
create policy "roulette_spins_all_own" on public.roulette_spins
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- Storage: bucket para íconos/imágenes de categorías, avatares y fotos de
-- comprobante de gastos (path: {user_id}/expenses/{archivo}).
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('quincena-assets', 'quincena-assets', true)
on conflict (id) do nothing;

drop policy if exists "quincena_assets_public_read" on storage.objects;
create policy "quincena_assets_public_read" on storage.objects
  for select using (bucket_id = 'quincena-assets');

drop policy if exists "quincena_assets_owner_write" on storage.objects;
create policy "quincena_assets_owner_write" on storage.objects
  for insert with check (
    bucket_id = 'quincena-assets' and auth.uid()::text = (storage.foldername(name))[1]
  );

-- -----------------------------------------------------------------------------
-- Seed: catálogo fijo de categorías (ver src/constants/categories.ts).
-- -----------------------------------------------------------------------------
insert into public.goal_categories (id, name, priority, default_target, color, icon, description, weight)
values
  ('casa', 'Casa', 'maxima', 50000, '#D98A5C', 'home', 'Construcción y patrimonio', 40),
  ('viajes', 'Viajes', 'alta', 15000, '#57A8D8', 'airplane', 'Vacaciones o experiencias importantes', 30),
  ('compu', 'Compu', 'media', 20000, '#8F7FE0', 'laptop', 'Computadora, periféricos o tecnología', 20),
  ('ropa', 'Ropa', 'baja', 5000, '#E17FA0', 'shirt', 'Vestimenta y accesorios', 10)
on conflict (id) do update set
  name = excluded.name,
  priority = excluded.priority,
  default_target = excluded.default_target,
  color = excluded.color,
  icon = excluded.icon,
  description = excluded.description,
  weight = excluded.weight;
