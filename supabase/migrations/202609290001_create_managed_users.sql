create table if not exists public.managed_users (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 100),
  email text not null check (
    char_length(email) <= 254
    and email = lower(email)
    and position('@' in email) > 1
  ),
  role text not null default '' check (char_length(role) <= 80),
  created_at timestamptz not null default now()
);

create index if not exists managed_users_owner_created_idx
  on public.managed_users (owner_id, created_at desc);

alter table public.managed_users enable row level security;
alter table public.managed_users force row level security;

revoke all on public.managed_users from anon;
grant select, insert, update, delete on public.managed_users to authenticated;

create policy "Users can view their own managed users"
  on public.managed_users for select to authenticated
  using ((select auth.uid()) = owner_id);

create policy "Users can add their own managed users"
  on public.managed_users for insert to authenticated
  with check ((select auth.uid()) = owner_id);

create policy "Users can update their own managed users"
  on public.managed_users for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy "Users can delete their own managed users"
  on public.managed_users for delete to authenticated
  using ((select auth.uid()) = owner_id);