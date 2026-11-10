create table if not exists public.marketday_state (
  id text primary key,
  snapshot jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.marketday_state enable row level security;

revoke all on public.marketday_state from anon, authenticated;
grant all on public.marketday_state to service_role;
